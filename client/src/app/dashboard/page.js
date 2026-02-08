"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveJoinRequest,
  createRoom,
  getBackgrounds,
  getMe,
  getNotifications,
  getPrivateRooms,
  getPublicRooms,
  getRoom,
  getRoomMessages,
  getToken,
  inviteToRoom,
  joinRoom,
  rejectJoinRequest,
  updateMe,
} from "@/lib/api";

const backgroundClassMap = {
  sunrise: "bg-sunrise",
  ocean: "bg-ocean",
  forest: "bg-forest",
  midnight: "bg-midnight",
  sand: "bg-sand",
  cloud: "bg-cloud",
};

function getRoomBg(backgroundId) {
  return backgroundClassMap[backgroundId] || "bg-cloud";
}

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [publicRooms, setPublicRooms] = useState([]);
  const [privateRooms, setPrivateRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeRoomMessages, setActiveRoomMessages] = useState([]);
  const [activeRoomMembership, setActiveRoomMembership] = useState(null);
  const [activeRoomLoading, setActiveRoomLoading] = useState(false);
  const [backgrounds, setBackgrounds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [roomType, setRoomType] = useState("public");
  const [backgroundId, setBackgroundId] = useState("");
  const [profile, setProfile] = useState({
    fullName: "",
    username: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [inviteRoomId, setInviteRoomId] = useState("");
  const [inviteIdentifier, setInviteIdentifier] = useState("");
  const [inviteStatus, setInviteStatus] = useState("");

  const joinRequests = useMemo(
    () => notifications.filter((item) => item.type === "join_request"),
    [notifications]
  );

  const ownedPrivateRooms = useMemo(
    () => privateRooms.filter((room) => room.role === "owner"),
    [privateRooms]
  );

  const activeRoomId = useMemo(() => {
    if (!activeRoom) return null;
    return activeRoom._id || activeRoom.id;
  }, [activeRoom]);

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      router.push("/auth");
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [meData, bgData, pubData, privData, notifData] =
          await Promise.all([
            getMe(token),
            getBackgrounds(token),
            getPublicRooms(token),
            getPrivateRooms(token),
            getNotifications(token),
          ]);

        setUser(meData.user);
        setProfile({
          fullName: meData.user?.fullName || "",
          username: meData.user?.username || "",
          email: meData.user?.email || "",
        });
        setBackgrounds(bgData.backgrounds || []);
        setPublicRooms(pubData.rooms || []);
        setPrivateRooms(privData.rooms || []);
        setNotifications(notifData.notifications || []);

        if (!backgroundId && bgData.backgrounds?.length) {
          setBackgroundId(bgData.backgrounds[0].id);
        }
      } catch (err) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [token]);

  useEffect(() => {
    if (privateRooms.length > 0) {
      setActiveRoom(privateRooms[0]);
      return;
    }
    if (publicRooms.length > 0) {
      setActiveRoom(publicRooms[0]);
      return;
    }
    setActiveRoom(null);
  }, [privateRooms, publicRooms]);

  useEffect(() => {
    if (!token || !activeRoomId) {
      setActiveRoomMessages([]);
      setActiveRoomMembership(null);
      return;
    }

    async function loadActiveRoomMessages() {
      setActiveRoomLoading(true);
      try {
        const roomData = await getRoom(token, activeRoomId);
        setActiveRoomMembership(roomData.membership);

        if (roomData.membership?.status === "member") {
          const history = await getRoomMessages(token, activeRoomId, 3);
          setActiveRoomMessages(history.messages || []);
        } else {
          setActiveRoomMessages([]);
        }
      } catch {
        setActiveRoomMessages([]);
      } finally {
        setActiveRoomLoading(false);
      }
    }

    loadActiveRoomMessages();
  }, [activeRoomId, token]);

  async function handleCreateRoom() {
    if (!roomName.trim()) {
      setError("Room name is required.");
      return;
    }
    if (!backgroundId) {
      setError("Please select a background.");
      return;
    }

    setCreating(true);
    setError("");
    try {
      await createRoom(token, {
        name: roomName.trim(),
        type: roomType,
        backgroundId,
      });

      const [pubData, privData] = await Promise.all([
        getPublicRooms(token),
        getPrivateRooms(token),
      ]);

      setPublicRooms(pubData.rooms || []);
      setPrivateRooms(privData.rooms || []);
      setRoomName("");
    } catch (err) {
      setError(err.message || "Failed to create room");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinRoom(roomId) {
    setError("");
    try {
      if (!roomId) {
        setError("Invalid room id.");
        return;
      }
      const id = String(roomId);
      await joinRoom(token, id);
      router.push(`/rooms/${id}`);
    } catch (err) {
      setError(err.message || "Failed to join room");
    }
  }

  async function handleApprove(roomId, membershipId) {
    try {
      await approveJoinRequest(token, roomId, membershipId);
      setNotifications((prev) =>
        prev.filter((item) => item.data?.membershipId !== membershipId)
      );
    } catch (err) {
      setError(err.message || "Failed to approve request");
    }
  }

  async function handleReject(roomId, membershipId) {
    try {
      await rejectJoinRequest(token, roomId, membershipId);
      setNotifications((prev) =>
        prev.filter((item) => item.data?.membershipId !== membershipId)
      );
    } catch (err) {
      setError(err.message || "Failed to reject request");
    }
  }

  async function handleInvite() {
    if (!inviteRoomId || !inviteIdentifier.trim()) {
      setInviteStatus("Please select a room and enter a username or email.");
      return;
    }
    setInviteStatus("");
    try {
      await inviteToRoom(token, inviteRoomId, inviteIdentifier.trim());
      setInviteStatus("Invite sent.");
      setInviteIdentifier("");
    } catch (err) {
      setInviteStatus(err.message || "Failed to send invite");
    }
  }

  function handleProfileChange(event) {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSaveProfile() {
    setError("");
    try {
      const result = await updateMe(token, profile);
      setUser(result.user);
    } catch (err) {
      setError(err.message || "Failed to update profile");
    }
  }

  return (
    <div className="app-bg min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
            CA
          </div>
          <div>
            <p className="text-sm font-semibold">ChatApp</p>
            <p className="text-xs text-[color:var(--color-muted)]">Dashboard</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input className="input w-60" placeholder="Search rooms or people" />
          <details className="relative">
            <summary className="btn btn-ghost list-none cursor-pointer">
              Notifications
              <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-xs text-white">
                {notifications.length}
              </span>
            </summary>
            <div className="absolute right-0 mt-3 w-72 rounded-3xl border border-[color:var(--color-border)] bg-white p-4 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Join requests
              </p>
              <div className="mt-3 space-y-3">
                {joinRequests.length === 0 && (
                  <div className="rounded-2xl border border-[color:var(--color-border)] bg-white/70 p-3 text-xs text-[color:var(--color-muted)]">
                    No new requests.
                  </div>
                )}
                {joinRequests.map((item) => (
                  <div key={item._id} className="soft-card rounded-2xl p-3">
                    <p className="text-sm font-semibold">
                      New join request
                    </p>
                    <p className="text-xs text-[color:var(--color-muted)]">
                      {item.data?.roomName || "Room"} requested by{" "}
                      {item.data?.requesterId || "user"}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        className="btn btn-primary px-3 py-1 text-xs"
                        type="button"
                        onClick={() =>
                          handleApprove(item.data?.roomId, item.data?.membershipId)
                        }
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-ghost px-3 py-1 text-xs"
                        type="button"
                        onClick={() =>
                          handleReject(item.data?.roomId, item.data?.membershipId)
                        }
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>
          {publicRooms[0]?._id && (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => handleJoinRoom(publicRooms[0]._id)}
            >
              Open room
            </button>
          )}
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-[220px_1fr]">
        <aside className="soft-card rounded-3xl p-5">
          <p className="label">Navigation</p>
          <div className="mt-5 space-y-2 text-sm font-semibold">
            <a className="block rounded-2xl bg-black px-4 py-3 text-white" href="#">
              Overview
            </a>
            <a className="block rounded-2xl px-4 py-3 text-[color:var(--color-muted)]" href="#">
              Public rooms
            </a>
            <a className="block rounded-2xl px-4 py-3 text-[color:var(--color-muted)]" href="#">
              Private rooms
            </a>
            <a className="block rounded-2xl px-4 py-3 text-[color:var(--color-muted)]" href="#">
              Notifications
            </a>
            <a className="block rounded-2xl px-4 py-3 text-[color:var(--color-muted)]" href="#">
              Settings
            </a>
          </div>
          <div className="divider my-6" />
          <div className="text-xs text-[color:var(--color-muted)]">
            Signed in as
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#1d6ff2] text-center text-xs font-semibold text-white leading-10">
              {user?.fullName
                ? user.fullName
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")
                : "U"}
            </div>
            <div>
              <p className="text-sm font-semibold">
                {user?.fullName || "Loading..."}
              </p>
              <p className="text-xs text-[color:var(--color-muted)]">
                @{user?.username || "user"}
              </p>
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {loading && (
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-white/70 px-4 py-3 text-sm text-[color:var(--color-muted)]">
              Loading dashboard...
            </div>
          )}
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="glass rounded-[32px] p-6">
              <p className="label">Create room</p>
              <h2 className="font-display mt-3 text-2xl">
                Launch a new space in seconds.
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="label">Room name</label>
                  <input
                    className="input mt-2"
                    placeholder="Room name"
                    value={roomName}
                    onChange={(event) => setRoomName(event.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Room type</label>
                  <div className="mt-2 flex gap-2">
                    <button
                      className={`btn flex-1 ${
                        roomType === "public" ? "btn-primary" : "btn-ghost"
                      }`}
                      type="button"
                      onClick={() => setRoomType("public")}
                    >
                      Public
                    </button>
                    <button
                      className={`btn flex-1 ${
                        roomType === "private" ? "btn-primary" : "btn-ghost"
                      }`}
                      type="button"
                      onClick={() => setRoomType("private")}
                    >
                      Private
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <label className="label">Choose a background</label>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {backgrounds.map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      className={`h-16 rounded-2xl ${getRoomBg(
                        bg.id
                      )} text-xs font-semibold text-white ${
                        backgroundId === bg.id ? "ring-2 ring-black" : ""
                      }`}
                      onClick={() => setBackgroundId(bg.id)}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="btn btn-primary mt-6 w-full"
                type="button"
                onClick={handleCreateRoom}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create room"}
              </button>
            </div>

            <div className="soft-card rounded-[32px] p-6">
              <p className="label">Active room</p>
              <h3 className="mt-3 text-xl font-semibold">
                {activeRoom?.name || "No active room yet"}
              </h3>
              <p className="text-sm text-[color:var(--color-muted)]">
                {activeRoom
                  ? "Preview the latest messages."
                  : "Create or join a room to start chatting."}
              </p>
              <div className="mt-4 space-y-3">
                {activeRoomLoading && (
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm text-[color:var(--color-muted)]">
                    Loading latest chats...
                  </div>
                )}
                {!activeRoomLoading &&
                  activeRoomMembership?.status === "member" &&
                  activeRoomMessages.length === 0 && (
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm text-[color:var(--color-muted)]">
                      No messages yet. Start the conversation.
                    </div>
                  )}
                {!activeRoomLoading &&
                  activeRoomMembership?.status === "member" &&
                  activeRoomMessages.map((message) => (
                    <div
                      key={message._id}
                      className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm"
                    >
                      <span className="font-semibold">
                        {message.senderId?.fullName ||
                          message.senderId?.username ||
                          "Member"}
                        :
                      </span>{" "}
                      {message.text}
                    </div>
                  ))}
                {!activeRoomLoading &&
                  activeRoom &&
                  activeRoomMembership?.status !== "member" && (
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm shadow-sm text-[color:var(--color-muted)]">
                      Join the room to view recent messages.
                    </div>
                  )}
              </div>
              {activeRoomId && (
                <button
                  className="btn btn-primary mt-6 w-full"
                  type="button"
                  onClick={() => handleJoinRoom(activeRoomId)}
                >
                  {activeRoom?.type === "private"
                    ? "Send chat request"
                    : "Join room"}
                </button>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="soft-card rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label">Public rooms</p>
                  <h3 className="mt-3 text-xl font-semibold">
                    Explore live spaces
                  </h3>
                </div>
                <span className="chip rounded-full px-3 py-1 text-xs font-semibold">
                  {publicRooms.length} rooms
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {publicRooms.map((room) => (
                  <div
                    key={room._id}
                    className="flex items-center justify-between rounded-2xl border border-[color:var(--color-border)] bg-white/70 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-12 w-12 rounded-2xl ${getRoomBg(
                          room.backgroundId
                        )}`}
                      />
                      <div>
                        <p className="text-sm font-semibold">{room.name}</p>
                        <p className="text-xs text-[color:var(--color-muted)]">
                          {room.type || "public"}
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => handleJoinRoom(room._id)}
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-card rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label">Private rooms</p>
                  <h3 className="mt-3 text-xl font-semibold">
                    Rooms shared with you
                  </h3>
                </div>
                <span className="chip rounded-full px-3 py-1 text-xs font-semibold">
                  {privateRooms.length} rooms
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {privateRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between rounded-2xl border border-[color:var(--color-border)] bg-white/70 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-12 w-12 rounded-2xl ${getRoomBg(
                          room.backgroundId
                        )}`}
                      />
                      <div>
                        <p className="text-sm font-semibold">{room.name}</p>
                        <p className="text-xs text-[color:var(--color-muted)]">
                          {room.role === "owner"
                            ? "Owner"
                            : room.status || room.role}
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => router.push(`/rooms/${room.id}`)}
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
              <div className="divider my-6" />
              <p className="label">Invite to private room</p>
              <div className="mt-3 space-y-3">
                <select
                  className="input"
                  value={inviteRoomId}
                  onChange={(event) => setInviteRoomId(event.target.value)}
                >
                  <option value="">Select owned room</option>
                  {ownedPrivateRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Username or email"
                  value={inviteIdentifier}
                  onChange={(event) => setInviteIdentifier(event.target.value)}
                />
                {inviteStatus && (
                  <p className="text-xs text-[color:var(--color-muted)]">
                    {inviteStatus}
                  </p>
                )}
                <button className="btn btn-primary w-full" type="button" onClick={handleInvite}>
                  Send invite
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="soft-card rounded-[32px] p-6">
              <p className="label">Join requests</p>
              <h3 className="mt-3 text-xl font-semibold">
                Pending approvals
              </h3>
              <div className="mt-4 space-y-4">
                {joinRequests.length === 0 && (
                  <div className="rounded-2xl border border-[color:var(--color-border)] bg-white/70 p-4 text-sm text-[color:var(--color-muted)]">
                    No pending join requests.
                  </div>
                )}
                {joinRequests.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-[color:var(--color-border)] bg-white/70 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">
                          New join request
                        </p>
                        <p className="text-xs text-[color:var(--color-muted)]">
                          {item.data?.roomName || "Room"} request from{" "}
                          {item.data?.requesterId || "user"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-primary px-3 py-1 text-xs"
                          type="button"
                          onClick={() =>
                            handleApprove(
                              item.data?.roomId,
                              item.data?.membershipId
                            )
                          }
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-ghost px-3 py-1 text-xs"
                          type="button"
                          onClick={() =>
                            handleReject(
                              item.data?.roomId,
                              item.data?.membershipId
                            )
                          }
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-card rounded-[32px] p-6">
              <p className="label">Settings</p>
              <h3 className="mt-3 text-xl font-semibold">
                Update your profile
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="label">Full name</label>
                  <input
                    className="input mt-2"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleProfileChange}
                  />
                </div>
                <div>
                  <label className="label">Username</label>
                  <input
                    className="input mt-2"
                    name="username"
                    value={profile.username}
                    onChange={handleProfileChange}
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    className="input mt-2"
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                  />
                </div>
                <button
                  className="btn btn-primary w-full"
                  type="button"
                  onClick={handleSaveProfile}
                >
                  Save changes
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
