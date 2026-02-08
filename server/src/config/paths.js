const path = require("path");

const rootDir = path.join(__dirname, "..", "..");
const uploadsDir = path.join(rootDir, "uploads");
const avatarsDir = path.join(uploadsDir, "avatars");

module.exports = { rootDir, uploadsDir, avatarsDir };
