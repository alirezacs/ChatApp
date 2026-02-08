const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { config } = require("../config/env");

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [, token] = header.split(" ");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!config.jwtSecret) {
    return res.status(500).json({ message: "JWT secret not configured" });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.sub).select(
      "fullName username email avatarPath"
    );

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    req.userId = user._id;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { auth };
