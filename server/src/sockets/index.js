const jwt = require("jsonwebtoken");
const { config } = require("../config/env");
const Membership = require("../models/Membership");
const Message = require("../models/Message");
const User = require("../models/User");
const { MEMBERSHIP_STATUS } = require("../config/constants");

function registerSocketHandlers(io) {
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    if (!config.jwtSecret) {
      return next(new Error("JWT secret not configured"));
    }

    try {
      const payload = jwt.verify(token, config.jwtSecret);
      socket.userId = payload.sub;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) {
      socket.join(String(socket.userId));
    }

    socket.on("room:join", async ({ roomId }, cb) => {
      try {
        if (!roomId) {
          cb?.({ ok: false, message: "roomId required" });
          return;
        }

        const membership = await Membership.findOne({
          roomId,
          userId: socket.userId,
          status: MEMBERSHIP_STATUS.MEMBER,
        });

        if (!membership) {
          cb?.({ ok: false, message: "Not allowed" });
          return;
        }

        socket.join(String(roomId));
        cb?.({ ok: true });
      } catch (error) {
        cb?.({ ok: false, message: "Server error" });
      }
    });

    socket.on("room:leave", ({ roomId }) => {
      if (roomId) {
        socket.leave(String(roomId));
      }
    });

    socket.on("typing:start", async ({ roomId }, cb) => {
      try {
        if (!roomId) {
          cb?.({ ok: false, message: "roomId required" });
          return;
        }

        const membership = await Membership.findOne({
          roomId,
          userId: socket.userId,
          status: MEMBERSHIP_STATUS.MEMBER,
        });

        if (!membership) {
          cb?.({ ok: false, message: "Not allowed" });
          return;
        }

        socket.to(String(roomId)).emit("typing:start", {
          roomId,
          userId: socket.userId,
        });
        cb?.({ ok: true });
      } catch (error) {
        cb?.({ ok: false, message: "Server error" });
      }
    });

    socket.on("typing:stop", async ({ roomId }, cb) => {
      try {
        if (!roomId) {
          cb?.({ ok: false, message: "roomId required" });
          return;
        }

        const membership = await Membership.findOne({
          roomId,
          userId: socket.userId,
          status: MEMBERSHIP_STATUS.MEMBER,
        });

        if (!membership) {
          cb?.({ ok: false, message: "Not allowed" });
          return;
        }

        socket.to(String(roomId)).emit("typing:stop", {
          roomId,
          userId: socket.userId,
        });
        cb?.({ ok: true });
      } catch (error) {
        cb?.({ ok: false, message: "Server error" });
      }
    });

    socket.on("message:send", async ({ roomId, text }, cb) => {
      try {
        if (!roomId || !text || !String(text).trim()) {
          cb?.({ ok: false, message: "roomId and text required" });
          return;
        }

        const membership = await Membership.findOne({
          roomId,
          userId: socket.userId,
          status: MEMBERSHIP_STATUS.MEMBER,
        });

        if (!membership) {
          cb?.({ ok: false, message: "Not allowed" });
          return;
        }

        const message = await Message.create({
          roomId,
          senderId: socket.userId,
          text: String(text).trim(),
        });

        const sender = await User.findById(socket.userId)
          .select("fullName username avatarPath")
          .lean();

        const senderName = sender
          ? sender.fullName || sender.username || "Member"
          : "Member";

        io.to(String(roomId)).emit("message:new", {
          id: message._id,
          roomId,
          senderId: sender
            ? {
                _id: sender._id,
                fullName: sender.fullName,
                username: sender.username,
                avatarPath: sender.avatarPath,
              }
            : socket.userId,
          senderName,
          text: message.text,
          createdAt: message.createdAt,
        });

        cb?.({ ok: true, message });
      } catch (error) {
        cb?.({ ok: false, message: "Server error" });
      }
    });
  });
}

module.exports = { registerSocketHandlers };
