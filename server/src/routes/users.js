const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const User = require("../models/User");
const { auth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { avatarsDir } = require("../config/paths");
const { config } = require("../config/env");

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext && ext.length <= 5 ? ext : ".png";
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.avatarMaxMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    return cb(null, true);
  },
});

function removeOldAvatar(avatarPath) {
  if (!avatarPath) return;
  if (!avatarPath.startsWith("/uploads/avatars/")) return;

  const filePath = path.join(avatarsDir, path.basename(avatarPath));
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

router.get("/me", auth, (req, res) => {
  res.json({ user: toPublicUser(req.user) });
});

router.patch(
  "/me",
  auth,
  asyncHandler(async (req, res) => {
    const { fullName, username, email } = req.body || {};
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (fullName) {
      user.fullName = String(fullName).trim();
    }
    if (username) {
      user.username = String(username).trim().toLowerCase();
    }
    if (email) {
      user.email = String(email).trim().toLowerCase();
    }

    try {
      await user.save();
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: "Username or email taken" });
      }
      throw error;
    }

    return res.json({ user: toPublicUser(user) });
  })
);

router.post(
  "/me/avatar",
  auth,
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Avatar is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    removeOldAvatar(user.avatarPath);
    user.avatarPath = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    return res.json({ user: toPublicUser(user) });
  })
);

module.exports = router;
