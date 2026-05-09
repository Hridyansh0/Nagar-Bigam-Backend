require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const pool = require("../config/database");

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ── 1. users ────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100)  NOT NULL,
        email         VARCHAR(50)   NOT NULL UNIQUE,
        is_verified   BOOLEAN       NOT NULL DEFAULT FALSE,
        is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
        created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `);

    // ── 2. otps ─────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id          SERIAL PRIMARY KEY,
        email       VARCHAR(15)  NOT NULL,
        otp         VARCHAR(6)   NOT NULL,
        purpose     VARCHAR(20)  NOT NULL DEFAULT 'login',
        is_used     BOOLEAN      NOT NULL DEFAULT FALSE,
        expires_at  TIMESTAMPTZ  NOT NULL,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_otps_lookup
        ON otps (email, expires_at) WHERE is_used = FALSE;
    `);

    // ── 3. categories ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `);

    // Seed default categories (safe to re-run)
    await client.query(`
      INSERT INTO categories (name, description) VALUES
        ('Roads & Infrastructure', 'Potholes, broken roads, damaged footpaths, street lights'),
        ('Water Supply',           'Water leakage, supply shortage, contamination'),
        ('Electricity',            'Power cuts, faulty lines, meter issues, transformer'),
        ('Sanitation',             'Garbage collection, open drains, sewage overflow'),
        ('Public Property',        'Vandalism, encroachment on parks or public land'),
        ('Noise Pollution',        'Industrial, vehicle, or construction noise'),
        ('Health & Hygiene',       'Open defecation, mosquito breeding, stray animals'),
        ('Education',              'School infrastructure, mid-day meal, teacher absence'),
        ('Other',                  'Any other public grievance')
      ON CONFLICT (name) DO NOTHING;
    `);

    // ── 4. complaints ───────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id           SERIAL PRIMARY KEY,
        track_id     VARCHAR(25)    NOT NULL UNIQUE,
        user_id      INTEGER        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id  INTEGER        REFERENCES categories(id) ON DELETE SET NULL,

        title        VARCHAR(200)   NOT NULL,
        description  TEXT           NOT NULL,

        -- Location fields
        state        VARCHAR(100)   NOT NULL DEFAULT 'Uttar Pradesh',
        city         VARCHAR(100)   NOT NULL,
        area         VARCHAR(150)   NOT NULL,
        ward         VARCHAR(100),
        pincode      VARCHAR(10),
        landmark     TEXT,
        latitude     NUMERIC(10,7),
        longitude    NUMERIC(10,7),

        -- Status & workflow
        status       VARCHAR(30)    NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','acknowledged','in_progress','resolved','rejected','closed')),
        priority     VARCHAR(20)    NOT NULL DEFAULT 'normal'
                       CHECK (priority IN ('low','normal','high','urgent')),

        -- Admin fields
        assigned_to  VARCHAR(100),
        department   VARCHAR(100),
        remarks      TEXT,

        resolved_at  TIMESTAMPTZ,
        created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_complaints_track_id ON complaints(track_id);
      CREATE INDEX IF NOT EXISTS idx_complaints_user_id  ON complaints(user_id);
      CREATE INDEX IF NOT EXISTS idx_complaints_status   ON complaints(status);
      CREATE INDEX IF NOT EXISTS idx_complaints_city     ON complaints(city);
    `);

    // ── 5. complaint_images ─────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaint_images (
        id            SERIAL PRIMARY KEY,
        complaint_id  INTEGER   NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
        image_url     TEXT      NOT NULL,
        public_id     VARCHAR(300),
        uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_images_complaint
        ON complaint_images(complaint_id);
    `);

    // ── 6. complaint_status_history ─────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS complaint_status_history (
        id            SERIAL PRIMARY KEY,
        complaint_id  INTEGER     NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
        old_status    VARCHAR(30),
        new_status    VARCHAR(30) NOT NULL,
        changed_by    VARCHAR(100) NOT NULL DEFAULT 'system',
        remarks       TEXT,
        changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_history_complaint
        ON complaint_status_history(complaint_id);
    `);

    // ── 7. updated_at trigger ────────────────────────────────────────────────
    await client.query(`
      CREATE OR REPLACE FUNCTION fn_set_updated_at()
      RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$;

      DROP TRIGGER IF EXISTS trg_users_updated_at      ON users;
      DROP TRIGGER IF EXISTS trg_complaints_updated_at ON complaints;

      CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

      CREATE TRIGGER trg_complaints_updated_at
        BEFORE UPDATE ON complaints
        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
    `);

    await client.query("COMMIT");

    console.log("✅  Migration complete. Tables created:");
    console.log("    users, otps, categories, complaints,");
    console.log("    complaint_images, complaint_status_history");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌  Migration failed:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch(() => process.exit(1));
