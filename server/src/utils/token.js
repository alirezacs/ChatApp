const jwt = require("jsonwebtoken");
const { config } = require("../config/env");

function signToken(userId) {
  if (!config.jwtSecret) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign({ sub: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

module.exports = { signToken };
