const router = require("express").Router();
const { authenticate } = require("../middlewares/auth");
const { upload } = require("../config/upload");
const {
  complaintRules,
  trackIdParam,
  paginationRules,
  validate,
} = require("../middlewares/validators");
const {
  fileComplaint,
  trackComplaint,
  getMyComplaints,
  getComplaintDetail,
  getCategories,
  getAllComplaints,
} = require("../controllers/complaintController");

// GET  /api/complaints/categories           — public
router.get("/categories", getCategories);

// GET  /api/complaints/track/:trackId       — public
router.get("/track/:trackId", trackIdParam, validate, trackComplaint);

router.post(
  "/",
  // authenticate,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "video", maxCount: 1 },
    { name: "pdf", maxCount: 1 },
  ]),  // field name: images, max 5 files
  // complaintRules,
  // validate,
  fileComplaint
);

router.get("/admin", getAllComplaints);
// GET  /api/complaints/:trackId             — private (owner only)
// router.get("/:trackId", authenticate, trackIdParam, validate, getComplaintDetail);

module.exports = router;
