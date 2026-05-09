require("dotenv").config();
const pool = require("../config/database");
const nodemailer = require("nodemailer");

// ── Twilio client (real SMS) ─────────────────────────────────────────────────
// let twilioClient = null;
// try {
//   const twilio = require("twilio");
//   if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID.startsWith("AC")) {
//     twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
//   }
// } catch (_) {}

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

// const sendOTP = async (phone, otp) => {
//   const text =
//     `Your OTP for Complaint Portal is: ${otp}. ` +
//     `Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. Do NOT share.`;

//     console.log(`Attempting to send OTP to +91${phone}...`); // debug for working

//   if (twilioClient) {
//     await twilioClient.messages.create({
//       body: text,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: `+91${phone}`,
//     });
//     console.log(`📱  SMS sent to +91${phone}`);
//   } else {
//     // Development fallback — print to terminal
//     console.log(`\n${"─".repeat(40)}`);
//     console.log(`📲  [DEV] OTP for ${phone} : ${otp}`);
//     console.log(`${"─".repeat(40)}\n`);
//   }
// };

// ── Store OTP in DB (invalidates previous unused OTPs for same phone) ───────




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
