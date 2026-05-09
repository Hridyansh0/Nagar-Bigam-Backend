require("dotenv").config();
const { Pool } = require("pg");

// const pool = new Pool({
//   host: process.env.DB_HOST || "localhost",
//   port: parseInt(process.env.DB_PORT) || 5432,
//   database: process.env.DB_NAME || "kanpur_complaint",
//   user: process.env.DB_USER || "postgres",
//   password: "abc123",
//   max: 20,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 2000,
// });

const pool = new Pool({
  connectionString: "postgresql://nagar_nigam_db_user:gvNZWc8Oz5qGBGfDjU2peJmMLycTHGB0@dpg-d7uu0cnlk1mc73apincg-a/nagar_nigam_db",
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



