const pool = require("../config/database");

const generateTrackId = async () => {
  const now = new Date();
  const datePart =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");

  let trackId;
  let attempts = 0;

  while (true) {
    attempts++;
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    trackId = `GC-${datePart}-${rand}`;

    const { rows } = await pool.query(
      "SELECT 1 FROM complaints WHERE track_id = $1",
      [trackId]
    );

    if (rows.length === 0) break;
    if (attempts > 10) throw new Error("Could not generate unique Track ID");
  }

  return trackId; // e.g.  GC-20240520-AB3K9
};

module.exports = { generateTrackId };
