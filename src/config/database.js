require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://nagar_nigam_db_user:gvNZWc8Oz5qGBGfDjU2peJmMLycTHGB0@dpg-d7uu0cnlk1mc73apincg-a/nagar_nigam_db",
  ssl: {
    rejectUnauthorized: false, // For development only; in production, use proper SSL certs
  },
});

pool.on("connect", () => {
  if (process.env.NODE_ENV !== "test") {
    console.log("✅  PostgreSQL connected");
  }
});

pool.on("error", (err) => {
  console.error("❌  PostgreSQL pool error:", err.message);
  process.exit(-1);
});

module.exports = pool;



