require("dotenv").config();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

// ── Cloudinary setup ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Local disk storage (files land in /uploads, then sent to Cloudinary) ───
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `complaint-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5 MB, max 5 files
  fileFilter,
});

// ── Upload helper: sends local file → Cloudinary → deletes local copy ───────
const uploadToCloudinary = async (localFilePath) => {
  const result = await cloudinary.uploader.upload(localFilePath, {
    folder: "government-complaints",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });

  // Remove temp file
  fs.unlink(localFilePath, (err) => {
    if (err) console.error("Temp file cleanup failed:", err.message);
  });

  return { url: result.secure_url, public_id: result.public_id };
};

// ── Delete from Cloudinary (used when complaint is deleted) ─────────────────
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
