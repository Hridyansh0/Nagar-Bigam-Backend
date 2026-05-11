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
  connectionString: "postgresql://hridyansh_shukla_user:Dg04AZ1JwWRct03E36iItEtTYVFccmev@dpg-d7vdmahj2pic73ed5drg-a/hridyansh_shukla",
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



