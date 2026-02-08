const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { asyncHandler } = require("../utils/asyncHandler");
const { signToken } = require("../utils/token");
const { auth } = require("../middleware/auth");

const router = express.Router();

function toPublicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    avatarPath: user.avatarPath,
  };
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { fullName, username, email, password } = req.body || {};

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password too short" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim().toLowerCase();

    const existing = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: String(fullName).trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
    });

    const token = signToken(user._id);
    return res.status(201).json({ token, user: toPublicUser(user) });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body || {};

    if (!identifier || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const normalized = String(identifier).trim().toLowerCase();
    const user = await User.findOne({
      $or: [{ email: normalized }, { username: normalized }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user._id);
    return res.json({ token, user: toPublicUser(user) });
  })
);

router.get("/me", auth, (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

module.exports = router;
