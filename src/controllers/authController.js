const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const { generateOTP, sendOTP, storeOTP, verifyOTP } = require("../services/otpService");

// ── POST /api/auth/send-otp ─────────────────────────────────────────────────

const sendOtp = async (req, res) => {
  let { name, email } = req.body;

  // console.log(`sendOtp request for email: ${email}, name: ${name}`);
  console.log({name, email})

  try {
    // Upsert user: create if new, update name if existing
    const { rows } = await pool.query(
      `INSERT INTO users (name, email)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, email, is_verified`,
      [name.trim(), email.trim()]
    );

    const user = rows[0];
    const isNewUser = !user.is_verified;

    // Generate + store + send OTP
    const otp = generateOTP();
    await storeOTP(email, otp, "login");
    await sendOTP(email, otp);

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
      data: { email, isNewUser },
    });
  } catch (err) {
    console.error("sendOtp:", err.message);
    return res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
  }
};



// const sendOtp = async (req, res) => {
//   let { name, phone } = req.body;

//      phone = String(phone)

//   // console.log(`sendOtp request for phone: ${phone}, name: ${name}`);
//   console.log({name, phone})

//   try {
//     // Upsert user: create if new, update name if existing
//     const { rows } = await pool.query(
//       `INSERT INTO users (name, phone)
//        VALUES ($1, $2)
//        ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
//        RETURNING id, name, phone, is_verified`,
//       [name.trim(), String(phone).trim()]
//     );

//     const user = rows[0];
//     const isNewUser = !user.is_verified;

//     // Generate + store + send OTP
//     const otp = generateOTP();
//     await storeOTP(phone, otp, "login");
//     await sendOTP(phone, otp);

//     return res.status(200).json({
//       success: true,
//       message: `OTP sent to ${phone}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
//       data: { phone, isNewUser },
//     });
//   } catch (err) {
//     console.error("sendOtp:", err.message);
//     return res.status(500).json({ success: false, message: "Failed to send OTP. Please try again." });
//   }
// };






// ── POST /api/auth/verify-otp ───────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  const { email, token } = req.body;
    const otp = String(token).trim();

  console.log("==================================================")
   console.log("==================================================");
    console.log("==================================================");
  console.log(`verifyOtp request for email: ${email}, otp: ${otp}`);

  try {
    const result = await verifyOTP(email, otp, "login");
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.message });
    }

    // Mark user as verified
    const { rows } = await pool.query(
      `UPDATE users SET is_verified = TRUE
       WHERE email = $1
       RETURNING id, name, email, is_verified, created_at`,
      [email]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const user = rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful!",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.is_verified,
          memberSince: user.created_at,
        },
      },
    });
  } catch (err) {
    console.error("verifyOtp:", err.message);
    return res.status(500).json({ success: false, message: "Verification failed. Please try again." });
  }
};

// ── GET /api/auth/profile ───────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         u.id, u.name, u.phone, u.is_verified, u.created_at,
         COUNT(c.id)                                                 AS total_complaints,
         COUNT(c.id) FILTER (WHERE c.status = 'pending')            AS pending,
         COUNT(c.id) FILTER (WHERE c.status = 'in_progress')        AS in_progress,
         COUNT(c.id) FILTER (WHERE c.status = 'resolved')           AS resolved
       FROM users u
       LEFT JOIN complaints c ON c.user_id = u.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.id]
    );

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("getProfile:", err.message);
    return res.status(500).json({ success: false, message: "Could not fetch profile." });
  }
};

module.exports = { sendOtp, verifyOtp, getProfile };
