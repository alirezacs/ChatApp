"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import {
  API_BASE,
  getMe,
  getRoom,
  getRoomMembers,
  getRoomMessages,
  getToken,
  joinRoom,
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

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [token, setToken] = useState(null);
  const [room, setRoom] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [membership, setMembership] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isMember = membership?.status === "member";
  const memberNameMap = useMemo(() => {
    const map = new Map();
    members.forEach((member) => {
      const name = member.fullName || member.username || "Member";
      map.set(String(member.id), name);
    });
    return map;
  }, [members]);

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      router.push("/auth");
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token || !roomId) return;

    async function loadRoom() {
      setLoading(true);
      setError("");
      try {
        if (!/^[0-9a-fA-F]{24}$/.test(roomId)) {
          setError("Invalid room id.");
          setLoading(false);
          return;
        }

        const [meData, roomData] = await Promise.all([
          getMe(token),
          getRoom(token, roomId),
        ]);
        setCurrentUserId(meData.user?.id);
        setCurrentUserName(meData.user?.fullName || meData.user?.username || "");
        const data = roomData;
        setRoom(data.room);
        setMembership(data.membership);

        if (data.membership?.status === "member") {
          const [history, memberData] = await Promise.all([
            getRoomMessages(token, roomId),
            getRoomMembers(token, roomId),
          ]);
          setMessages(history.messages || []);
          setMembers(memberData.members || []);
        } else {
          setMessages([]);
          setMembers([]);
        }
      } catch (err) {
        setError(err.message || "Failed to load room");
      } finally {
        setLoading(false);
      }
    }

    loadRoom();
  }, [roomId, token]);

  useEffect(() => {
    if (!token || !isMember || !roomId) return;

    const socket = io(API_BASE, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.emit("room:join", { roomId });

    socket.on("message:new", (message) => {
      if (String(message.roomId) !== String(roomId)) return;
      setMessages((prev) => {
        if (prev.find((item) => String(item._id || item.id) === String(message.id))) {
          return prev;
        }
        return [...prev, message];
      });
    });

    socket.on("typing:start", ({ userId }) => {
      setTypingUsers((prev) => new Set(prev).add(userId));
    });

    socket.on("typing:stop", ({ userId }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [isMember, roomId, token]);

  const typingLabel = useMemo(() => {
    if (!typingUsers.size) return "";
    return "Someone is typing...";
  }, [typingUsers]);

  async function handleJoin() {
    setError("");
    try {
      if (!roomId) {
        setError("Invalid room id.");
        return;
      }
      const data = await joinRoom(token, roomId);
      setMembership(data.membership);
      if (data.membership?.status === "member") {
        const [history, memberData] = await Promise.all([
          getRoomMessages(token, roomId),
          getRoomMembers(token, roomId),
        ]);
        setMessages(history.messages || []);
        setMembers(memberData.members || []);
      }
    } catch (err) {
      setError(err.message || "Failed to join room");
    }
  }

  function emitTyping(isStarting) {
    const socket = socketRef.current;
    if (!socket) return;
    const event = isStarting ? "typing:start" : "typing:stop";
    socket.emit(event, { roomId });
  }

  function handleInputChange(event) {
    setInput(event.target.value);
    emitTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, 1200);
  }

  async function handleSend() {
    if (!input.trim()) return;
    if (!socketRef.current) return;
    socketRef.current.emit(
      "message:send",
      { roomId, text: input.trim() },
      (response) => {
        if (response?.ok) {
          setInput("");
          emitTyping(false);
        } else if (response?.message) {
          setError(response.message);
        }
      }
    );
  }

  const roomName = room?.name || "Pulse Room";
  const roomBg = getRoomBg(room?.backgroundId);

  return (
    <div className="app-bg min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <a className="flex items-center gap-3" href="/dashboard">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-white">
            PC
          </div>
          <div>
            <p className="text-sm font-semibold">{roomName}</p>
            <p className="text-xs text-[color:var(--color-muted)]">
              Live conversation
            </p>
          </div>
        </a>
        <div className="flex items-center gap-3">
          <span className="chip rounded-full px-4 py-2 text-xs font-semibold">
            {isMember ? "Active" : "Locked"}
          </span>
          <a className="btn btn-ghost" href="/dashboard">
            Back to dashboard
          </a>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 pb-10 lg:grid-cols-[240px_1fr]">
        <aside className="soft-card rounded-3xl p-5">
          <p className="label">Rooms</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[color:var(--color-border)] bg-white/70 px-3 py-2 text-sm text-[color:var(--color-muted)]">
              Browse rooms from the dashboard.
            </div>
          </div>
          <div className="divider my-6" />
          <p className="text-xs text-[color:var(--color-muted)]">Members</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {members.length === 0 && (
              <span className="chip rounded-full px-3 py-1 text-xs font-semibold">
                No members yet
              </span>
            )}
            {members.map((member) => (
              <span
                key={member.id}
                className="chip rounded-full px-3 py-1 text-xs font-semibold"
              >
                {member.fullName || member.username}
              </span>
            ))}
          </div>
        </aside>

        <main className="glass rounded-[32px] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-2xl ${roomBg}`} />
              <div>
                <h1 className="text-xl font-semibold">{roomName}</h1>
                <p className="text-xs text-[color:var(--color-muted)]">
                  Room history saved in MongoDB
                </p>
              </div>
            </div>
            <button className="btn btn-ghost" type="button">
              Room settings
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-white/70 px-4 py-3 text-sm text-[color:var(--color-muted)]">
              Loading room...
            </div>
          )}

          {!loading && !isMember && (
            <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-white/70 px-4 py-3 text-sm text-[color:var(--color-muted)]">
              {membership?.status === "pending"
                ? "Join request sent. Waiting for approval."
                : "You are not a member of this room yet."}
              <div className="mt-3">
                <button className="btn btn-primary" onClick={handleJoin}>
                  {room?.type === "public"
                    ? "Join chat"
                    : "Send chat request"}
                </button>
              </div>
            </div>
          )}

          {isMember && (
            <>
              <div className="mt-6 space-y-4">
                {messages.map((message) => {
                  const senderId = message.senderId?._id || message.senderId;
                  const isMine =
                    senderId && currentUserId
                      ? String(senderId) === String(currentUserId)
                      : false;
                  const senderLabel =
                    message.senderName ||
                    message.senderId?.fullName ||
                    message.senderId?.username ||
                    memberNameMap.get(String(senderId)) ||
                    (isMine ? currentUserName || "You" : "Member");

                  return (
                    <div
                      key={message._id || message.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                          isMine
                            ? "bg-black text-white"
                            : "bg-white text-[color:var(--color-ink)]"
                        }`}
                      >
                        <div
                          className={`text-xs uppercase tracking-[0.2em] ${
                            isMine
                              ? "text-white/60"
                              : "text-[color:var(--color-muted)]"
                          }`}
                        >
                          {senderLabel}
                        </div>
                        <p className="mt-1">{message.text}</p>
                        <div
                          className={`mt-2 text-xs ${
                            isMine
                              ? "text-white/60"
                              : "text-[color:var(--color-muted)]"
                          }`}
                        >
                          {message.createdAt
                            ? new Date(message.createdAt).toLocaleTimeString()
                            : ""}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {typingLabel && (
                <div className="mt-6 rounded-2xl border border-[color:var(--color-border)] bg-white/70 px-4 py-3 text-sm text-[color:var(--color-muted)]">
                  {typingLabel}
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <input
                  className="input flex-1"
                  placeholder="Write a message"
                  value={input}
                  onChange={handleInputChange}
                />
                <button className="btn btn-primary" type="button" onClick={handleSend}>
                  Send
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
