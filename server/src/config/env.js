require("dotenv").config();

const config = {
  port: process.env.PORT || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  avatarMaxMb: Number.parseInt(process.env.AVATAR_MAX_MB || "2", 10),
};

module.exports = { config };
