const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { sendOtp, verifyOtp, getProfile } = require("../controllers/authController");
const { authenticate } = require("../middlewares/auth");
const { sendOtpRules, verifyOtpRules, validate } = require("../middlewares/validators");

// Strict limiter for OTP — max 5 requests per 15 min per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many OTP requests. Please wait 15 minutes and try again.",
  },
});

// POST /api/auth/send-otp
// router.post("/send-otp", otpLimiter, sendOtpRules, validate, sendOtp);
router.post("/send-otp",sendOtp);

// POST /api/auth/verify-otp
// router.post("/verify-otp", verifyOtpRules, validate, verifyOtp);
router.post("/verify-otp", verifyOtp);

// GET /api/auth/profile  [requires JWT]
router.get("/profile", authenticate, getProfile);

module.exports = router;
