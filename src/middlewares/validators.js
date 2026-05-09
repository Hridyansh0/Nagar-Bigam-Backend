const { body, param, query, validationResult } = require("express-validator");

// ── Reusable error formatter ────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Auth ────────────────────────────────────────────────────────────────────
const sendOtpRules = [
  body("mobile")
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be 2–100 characters")
    .matches(/^[a-zA-Z\s.'-]+$/)
    .withMessage("Name contains invalid characters"),
];

const verifyOtpRules = [
  body("mobile")
    .trim()
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Enter a valid 10-digit Indian mobile number"),
  body("otp")
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be exactly 6 digits"),
];

// ── Complaint ────────────────────────────────────────────────────────────────
const complaintRules = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be 5–200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be 10–2000 characters"),
  body("city")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("City is required (2–100 chars)"),
  body("area")
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Area is required (2–150 chars)"),
  body("state")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("State must be 2–100 characters"),
  body("ward")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .withMessage("Ward must be under 100 characters"),
  body("pincode")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("Pincode must be exactly 6 digits"),
  body("landmark")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 300 })
    .withMessage("Landmark too long"),
  body("category_id")
    .optional({ checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage("Invalid category"),
  body("latitude")
    .optional({ checkFalsy: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),
  body("longitude")
    .optional({ checkFalsy: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),
];

// ── Track ID param ──────────────────────────────────────────────────────────
const trackIdParam = [
  param("trackId")
    .trim()
    .matches(/^GC-\d{8}-[A-Z0-9]{5}$/)
    .withMessage("Invalid Track ID format. Expected: GC-YYYYMMDD-XXXXX"),
];

// ── Pagination query ─────────────────────────────────────────────────────────
const paginationRules = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
  query("limit").optional().isInt({ min: 1, max: 50 }).withMessage("Limit must be 1–50"),
  query("status")
    .optional()
    .isIn(["pending", "acknowledged", "in_progress", "resolved", "rejected", "closed"])
    .withMessage("Invalid status value"),
];

module.exports = {
  validate,
  sendOtpRules,
  verifyOtpRules,
  complaintRules,
  trackIdParam,
  paginationRules,
};
