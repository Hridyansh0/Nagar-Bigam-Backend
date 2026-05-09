require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const morgan     = require("morgan");
const path       = require("path");
const rateLimit  = require("express-rate-limit");
const fs         = require("fs");

const authRoutes      = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");

const app  = express();
const PORT = parseInt(process.env.PORT) || 3000;

// ── Ensure uploads/ folder exists ───────────────────────────────────────────
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({ origin: "*", methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"] }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve local uploads in dev (in prod, files go to Cloudinary)
app.use("/uploads", express.static(uploadsDir));

// Global rate limit — 100 req / 15 min per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Slow down and try again later." },
  })
);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",       authRoutes);
app.use("/api/complaints", complaintRoutes);

// Root — API overview
app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "Government Complaint Management System API",
    version: "1.0.0",
    routes: {
      "POST   /api/auth/send-otp":            "Send OTP (public)",
      "POST   /api/auth/verify-otp":          "Verify OTP → JWT token (public)",
      "GET    /api/auth/profile":             "Logged-in user profile [auth]",
      "GET    /api/complaints/categories":    "List all categories (public)",
      "GET    /api/complaints/track/:id":     "Track complaint by Track ID (public)",
      "POST   /api/complaints":               "File new complaint + images [auth]",
      "GET    /api/complaints/my":            "My complaints [auth]",
      "GET    /api/complaints/:trackId":      "Complaint detail — owner only [auth]",
    },
  });
});

// Health check — verifies DB connection
app.get("/health", async (_req, res) => {
  try {
    const pool = require("./config/database");
    await pool.query("SELECT 1");
    res.json({ success: true, status: "healthy", db: "connected", time: new Date() });
  } catch {
    res.status(503).json({ success: false, status: "unhealthy", db: "disconnected" });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err.message);

  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ success: false, message: "File too large. Max 5 MB per image." });
  if (err.code === "LIMIT_FILE_COUNT")
    return res.status(400).json({ success: false, message: "Too many files. Max 5 images allowed." });
  if (err.message?.includes("Only JPEG"))
    return res.status(400).json({ success: false, message: err.message });

  res.status(500).json({ success: false, message: "Internal server error." });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║  Government Complaint System — Backend   ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`\n🚀  Server   : http://localhost:${PORT}`);
  console.log(`📋  API docs : http://localhost:${PORT}/`);
  console.log(`❤️   Health   : http://localhost:${PORT}/health\n`);
});

module.exports = app;
