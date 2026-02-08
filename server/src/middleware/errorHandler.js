const multer = require("multer");

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File too large"
        : "File upload error";
    return res.status(400).json({ message });
  }

  if (err.message === "Unsupported file type") {
    return res.status(400).json({ message: err.message });
  }

  const status = err.statusCode || err.status || 500;
  const message = err.message || "Something went wrong";
  return res.status(status).json({ message });
}

module.exports = { errorHandler };
