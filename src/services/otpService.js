require("dotenv").config();
const pool = require("../config/database");
const nodemailer = require("nodemailer");

// ── Generate 6-digit numeric OTP ────────────────────────────────────────────
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ── Send OTP via Twilio SMS (falls back to console log in dev) ───────────────

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mohsin06388@gmail.com",
    pass: "iter eppo nnti cvya", // NOT your real password
  },
});


const sendOTP = async (user_email, otp) => {
  const text =
    `Your OTP for Complaint Portal is: ${otp}. ` +
    `Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. Do NOT share.`;

    console.log(`mail send hone wala function chal rha hai ${user_email}...`); // debug for working

    const mailOptions = {
    from: `"Your App" <mohsin06388@gmail.com>`,
    to: user_email,
    subject: "Your OTP Code",
    html: `
      <h2>OTP Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 5 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);

};



const storeOTP = async (email, otp, purpose = "login") => {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10;

  console.log("store otp function running....")

  // Expire any existing unused OTPs
  await pool.query(
    `UPDATE otps SET is_used = TRUE
     WHERE email = $1 AND is_used = FALSE`,
    [email]
  );

  const result = await pool.query(
    `INSERT INTO otps (email, otp, purpose, expires_at)
     VALUES ($1, $2, $3, NOW() + INTERVAL '${expiryMinutes} minutes')
     RETURNING id, expires_at`,
    [email, otp, purpose]
  );

  return result.rows[0];
};

// ── Verify OTP: returns { valid, message } ───────────────────────────────────
const verifyOTP = async (email, otp, purpose = "login") => {
  const result = await pool.query(
    `SELECT id FROM otps
     WHERE email    = $1
       AND otp       = $2
       AND purpose   = $3
       AND is_used   = FALSE
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, otp, purpose]
  );

  if (result.rows.length === 0) {
    return { valid: false, message: "Invalid or expired OTP. Please try again." };
  }

  // Mark as used — one-time use
  await pool.query(`UPDATE otps SET is_used = TRUE WHERE id = $1`, [result.rows[0].id]);

  return { valid: true };
};

module.exports = { generateOTP, sendOTP, storeOTP, verifyOTP };
