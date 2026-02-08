export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function buildUrl(path) {
  const base = API_BASE.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/api") && normalizedPath.startsWith("/api")) {
    return `${base}${normalizedPath.replace("/api", "")}`;
  }
  return `${base}${normalizedPath}`;
}

async function request(path, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = hasBody && options.body instanceof FormData;

  if (!isFormData && !headers["Content-Type"] && hasBody) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    credentials: "include",
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      data?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export async function getMe(token = getToken()) {
  return request("/api/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateMe(token, payload) {
  return request("/api/users/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function registerUser(payload) {
  return request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatar(token, file) {
  const formData = new FormData();
  formData.append("avatar", file);

  return request("/api/users/me/avatar", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}

export async function getBackgrounds(token = getToken()) {
  return request("/api/rooms/backgrounds", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getPublicRooms(token = getToken()) {
  return request("/api/rooms/public", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getPrivateRooms(token = getToken()) {
  return request("/api/rooms/private", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createRoom(token, payload) {
  return request("/api/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function joinRoom(token, roomId) {
  return request(`/api/rooms/${roomId}/join`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getRoom(token, roomId) {
  return request(`/api/rooms/${roomId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getRoomMessages(token, roomId, limit) {
  const query = limit ? `?limit=${encodeURIComponent(limit)}` : "";
  return request(`/api/rooms/${roomId}/messages${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function inviteToRoom(token, roomId, identifier) {
  return request(`/api/rooms/${roomId}/invite`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ identifier }),
  });
}

export async function getRoomMembers(token, roomId) {
  return request(`/api/rooms/${roomId}/members`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function sendMessage(token, roomId, text) {
  return request(`/api/rooms/${roomId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
}

export async function getNotifications(token = getToken()) {
  return request("/api/notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function markNotificationsRead(token, payload) {
  return request("/api/notifications/mark-read", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function approveJoinRequest(token, roomId, membershipId) {
  return request(`/api/rooms/${roomId}/requests/${membershipId}/approve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function rejectJoinRequest(token, roomId, membershipId) {
  return request(`/api/rooms/${roomId}/requests/${membershipId}/reject`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
