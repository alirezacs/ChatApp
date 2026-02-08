const express = require("express");
const Room = require("../models/Room");
const Membership = require("../models/Membership");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { isValidObjectId } = require("../utils/ids");
const { backgrounds } = require("../config/backgrounds");
const {
  ROOM_TYPES,
  MEMBERSHIP_STATUS,
  MEMBERSHIP_ROLE,
  NOTIFICATION_TYPES,
} = require("../config/constants");

const router = express.Router();

function normalizeLimit(value, fallback = 20, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

async function requireMember(roomId, userId) {
  return Membership.findOne({
    roomId,
    userId,
    status: MEMBERSHIP_STATUS.MEMBER,
  });
}

async function requireOwner(roomId, userId) {
  const room = await Room.findById(roomId);
  if (!room) return null;
  if (String(room.ownerId) !== String(userId)) return null;
  return room;
}

router.get("/backgrounds", auth, (req, res) => {
  res.json({ backgrounds });
});

router.get(
  "/public",
  auth,
  asyncHandler(async (req, res) => {
    const limit = normalizeLimit(req.query.limit, 20, 100);
    const skip = Number.parseInt(req.query.skip || "0", 10);
    const rooms = await Room.find({ type: ROOM_TYPES.PUBLIC })
      .sort({ createdAt: -1 })
      .skip(Number.isNaN(skip) ? 0 : skip)
      .limit(limit)
      .lean();

    res.json({ rooms });
  })
);

router.get(
  "/private",
  auth,
  asyncHandler(async (req, res) => {
    const memberships = await Membership.find({
      userId: req.userId,
      status: {
        $in: [
          MEMBERSHIP_STATUS.MEMBER,
          MEMBERSHIP_STATUS.INVITED,
          MEMBERSHIP_STATUS.PENDING,
        ],
      },
    }).populate("roomId");

    const rooms = memberships
      .map((membership) => {
        const room = membership.roomId;
        if (!room || room.type !== ROOM_TYPES.PRIVATE) return null;
        return {
          id: room._id,
          name: room.name,
          type: room.type,
          ownerId: room.ownerId,
          backgroundId: room.backgroundId,
          role: membership.role,
          status: membership.status,
        };
      })
      .filter(Boolean);

    res.json({ rooms });
  })
);

router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const { name, type, backgroundId } = req.body || {};

    if (!name || !type || !backgroundId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Object.values(ROOM_TYPES).includes(type)) {
      return res.status(400).json({ message: "Invalid room type" });
    }

    const background = backgrounds.find((item) => item.id === backgroundId);
    if (!background) {
      return res.status(400).json({ message: "Invalid background" });
    }

    const room = await Room.create({
      name: String(name).trim(),
      type,
      ownerId: req.userId,
      backgroundId,
    });

    await Membership.create({
      roomId: room._id,
      userId: req.userId,
      status: MEMBERSHIP_STATUS.MEMBER,
      role: MEMBERSHIP_ROLE.OWNER,
    });

    res.status(201).json({ room });
  })
);

router.get(
  "/:roomId",
  auth,
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const membership = await Membership.findOne({
      roomId,
      userId: req.userId,
    }).lean();

    return res.json({
      room,
      membership: membership
        ? { status: membership.status, role: membership.role }
        : null,
    });
  })
);

router.get(
  "/:roomId/members",
  auth,
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const membership = await requireMember(roomId, req.userId);
    if (!membership) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const members = await Membership.find({
      roomId,
      status: MEMBERSHIP_STATUS.MEMBER,
    })
      .populate("userId", "fullName username avatarPath")
      .lean();

    const list = members
      .map((member) => {
        if (!member.userId) return null;
        return {
          id: member.userId._id,
          fullName: member.userId.fullName,
          username: member.userId.username,
          avatarPath: member.userId.avatarPath,
          role: member.role,
        };
      })
      .filter(Boolean);

    res.json({ members: list });
  })
);

router.post(
  "/:roomId/join",
  auth,
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const existing = await Membership.findOne({
      roomId,
      userId: req.userId,
    });

    if (existing) {
      if (existing.status === MEMBERSHIP_STATUS.INVITED) {
        existing.status = MEMBERSHIP_STATUS.MEMBER;
        await existing.save();
      }
      return res.json({ membership: existing });
    }

    if (room.type === ROOM_TYPES.PUBLIC) {
      const membership = await Membership.create({
        roomId,
        userId: req.userId,
        status: MEMBERSHIP_STATUS.MEMBER,
        role: MEMBERSHIP_ROLE.MEMBER,
      });
      return res.json({ membership });
    }

    const membership = await Membership.create({
      roomId,
      userId: req.userId,
      status: MEMBERSHIP_STATUS.PENDING,
      role: MEMBERSHIP_ROLE.MEMBER,
    });

    await Notification.create({
      userId: room.ownerId,
      type: NOTIFICATION_TYPES.JOIN_REQUEST,
      data: {
        roomId: room._id,
        roomName: room.name,
        requesterId: req.userId,
        membershipId: membership._id,
      },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(String(room.ownerId)).emit("notification:new", {
        type: NOTIFICATION_TYPES.JOIN_REQUEST,
        roomId: room._id,
        roomName: room.name,
        requesterId: req.userId,
        membershipId: membership._id,
      });
    }

    return res.json({ membership });
  })
);

router.post(
  "/:roomId/invite",
  auth,
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { identifier } = req.body || {};

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }
    if (!identifier) {
      return res.status(400).json({ message: "Missing identifier" });
    }

    const room = await requireOwner(roomId, req.userId);
    if (!room) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const normalized = String(identifier).trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalized }, { username: normalized }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let membership = await Membership.findOne({ roomId, userId: user._id });
    if (!membership) {
      membership = await Membership.create({
        roomId,
        userId: user._id,
        status: MEMBERSHIP_STATUS.INVITED,
        role: MEMBERSHIP_ROLE.MEMBER,
      });
    }

    await Notification.create({
      userId: user._id,
      type: NOTIFICATION_TYPES.ROOM_INVITE,
      data: {
        roomId: room._id,
        roomName: room.name,
      },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(String(user._id)).emit("notification:new", {
        type: NOTIFICATION_TYPES.ROOM_INVITE,
        roomId: room._id,
        roomName: room.name,
      });
    }

    res.json({ membership });
  })
);

router.get(
  "/:roomId/requests",
  auth,
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const room = await requireOwner(roomId, req.userId);
    if (!room) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const requests = await Membership.find({
      roomId,
      status: MEMBERSHIP_STATUS.PENDING,
    })
      .populate("userId", "fullName username email avatarPath")
      .lean();

    res.json({ requests });
  })
);

router.post(
  "/:roomId/requests/:membershipId/approve",
  auth,
  asyncHandler(async (req, res) => {
    const { roomId, membershipId } = req.params;
    if (!isValidObjectId(roomId) || !isValidObjectId(membershipId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const room = await requireOwner(roomId, req.userId);
    if (!room) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const membership = await Membership.findOne({
      _id: membershipId,
      roomId,
    });

    if (!membership || membership.status !== MEMBERSHIP_STATUS.PENDING) {
      return res.status(404).json({ message: "Request not found" });
    }

    membership.status = MEMBERSHIP_STATUS.MEMBER;
    await membership.save();

    await Notification.create({
      userId: membership.userId,
      type: NOTIFICATION_TYPES.JOIN_APPROVED,
      data: { roomId: room._id, roomName: room.name },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(String(membership.userId)).emit("notification:new", {
        type: NOTIFICATION_TYPES.JOIN_APPROVED,
        roomId: room._id,
        roomName: room.name,
      });
    }

    res.json({ membership });
  })
);

router.post(
  "/:roomId/requests/:membershipId/reject",
  auth,
  asyncHandler(async (req, res) => {
    const { roomId, membershipId } = req.params;
    if (!isValidObjectId(roomId) || !isValidObjectId(membershipId)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const room = await requireOwner(roomId, req.userId);
    if (!room) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const membership = await Membership.findOne({
      _id: membershipId,
      roomId,
    });

    if (!membership || membership.status !== MEMBERSHIP_STATUS.PENDING) {
      return res.status(404).json({ message: "Request not found" });
    }

    await membership.deleteOne();

    await Notification.create({
      userId: membership.userId,
      type: NOTIFICATION_TYPES.JOIN_REJECTED,
      data: { roomId: room._id, roomName: room.name },
    });

    const io = req.app.get("io");
    if (io) {
      io.to(String(membership.userId)).emit("notification:new", {
        type: NOTIFICATION_TYPES.JOIN_REJECTED,
        roomId: room._id,
        roomName: room.name,
      });
    }

    res.json({ ok: true });
  })
);

router.get(
  "/:roomId/messages",
  auth,
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    const membership = await requireMember(roomId, req.userId);
    if (!membership) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const limit = normalizeLimit(req.query.limit, 30, 100);
    const parsedBefore = req.query.before ? new Date(req.query.before) : new Date();
    const before = Number.isNaN(parsedBefore.getTime())
      ? new Date()
      : parsedBefore;
    const query = {
      roomId,
      createdAt: { $lt: before },
    };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("senderId", "fullName username avatarPath")
      .lean();

    const normalized = messages
      .reverse()
      .map((message) => {
        const sender = message.senderId;
        const senderName = sender
          ? sender.fullName || sender.username || "Member"
          : "Member";
        return {
          ...message,
          senderName,
        };
      });

    res.json({ messages: normalized });
  })
);

router.post(
  "/:roomId/messages",
  auth,
  asyncHandler(async (req, res) => {
    const { roomId } = req.params;
    const { text } = req.body || {};

    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ message: "Invalid room id" });
    }

    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const membership = await requireMember(roomId, req.userId);
    if (!membership) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const message = await Message.create({
      roomId,
      senderId: req.userId,
      text: String(text).trim(),
    });

    const io = req.app.get("io");
    if (io) {
      io.to(String(roomId)).emit("message:new", {
        id: message._id,
        roomId,
        senderId: req.userId,
        text: message.text,
        createdAt: message.createdAt,
      });
    }

    res.status(201).json({ message });
  })
);

module.exports = router;
