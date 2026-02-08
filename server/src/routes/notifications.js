const express = require("express");
const Notification = require("../models/Notification");
const { auth } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

function normalizeLimit(value, fallback = 20, max = 100) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const limit = normalizeLimit(req.query.limit, 20, 100);
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ notifications });
  })
);

router.patch(
  "/mark-read",
  auth,
  asyncHandler(async (req, res) => {
    const { ids, all } = req.body || {};

    if (all) {
      await Notification.updateMany(
        { userId: req.userId, read: false },
        { $set: { read: true } }
      );
      return res.json({ ok: true });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No ids provided" });
    }

    await Notification.updateMany(
      { userId: req.userId, _id: { $in: ids } },
      { $set: { read: true } }
    );

    return res.json({ ok: true });
  })
);

module.exports = router;
