const pool = require("../config/database");
const { generateTrackId } = require("../services/trackIdService");
const { uploadToCloudinary } = require("../config/upload");

// ── POST /api/complaints ─────────────────────────────────────────────────────

// const fileComplaint = async (req, res) => {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     const {
//   fullName,
//   city,
//   area,
//   street,
//   landmark,
//   category,
//   description,
//   department,
//   id,
//   zone,
// } = req.body;

//     console.log("fileComplaint request body:", req.body);

//     const payload = {// or complaintId if you're storing it separately
//   user_id: id, // replace with actual logged-in user ID
//   full_name: fullName,
//   city: city,
//   area: area,
//   street_address: street,
//   landmark: landmark,
//   // category_id: category,
//   description: description,
//   department_id: department,
// };

//     const trackId = await generateTrackId();

//     // Insert complaint
//     const { rows: [complaints_new] } = await client.query(
//       `
//       INSERT INTO complaints_new (
//         full_name,
//         city,
//         area,
//         street_address,
//         landmark,
//         description,
//         category,
//         department,
//       )
//       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
//       RETURNING *
//       `,
//       [
//         payload.user_id,
//         payload.full_name.trim(),
//         payload.city.trim(),
//         payload.area.trim(),
//         payload.street_address.trim(),
//         payload.landmark?.trim() || null,
//         payload.category_id,
//         payload.description.trim(),
//         payload.department_id || null
//       ]
//     );

//     // Upload files
//     const uploadedFiles = [];

//     if (req.files) {
//       for (const file of req.files) {
//         const { url, public_id } = await uploadToCloudinary(file.path);

//         let fileType = "image";

//         if (file.mimetype.includes("video")) {
//           fileType = "video";
//         }

//         if (file.mimetype.includes("pdf")) {
//           fileType = "pdf";
//         }

//         await client.query(
//           `
//           INSERT INTO complaint_files (
//             complaint_id,
//             file_url,
//             public_id,
//             file_type
//           )
//           VALUES ($1,$2,$3,$4)
//           `,
//           [complaints_new.id, url, public_id, fileType]
//         );

//         uploadedFiles.push({
//           type: fileType,
//           url,
//         });
//       }
//     }

//     // History
//     await client.query(
//       `
//       INSERT INTO complaint_status_history (
//         complaint_id,
//         new_status,
//         changed_by,
//         remarks
//       )
//       VALUES ($1,'pending','system','Complaint registered successfully')
//       `,
//       [complaints_new.id]
//     );

//     await client.query("COMMIT");

//     res.status(201).json({
//       success: true,
//       message: "Complaint filed successfully",
//       data: {
//         track_id: complaints_new.track_id,
//         status: complaints_new.status,
//         files: uploadedFiles,
//       },
//     });

//   } catch (err) {
//     await client.query("ROLLBACK");
//     console.log(err);
//     res.status(500).json({
//       success: false,
//       message: "Complaint filing failed",
//     });
//   } finally {
//     client.release();
//   }
// };

const fileComplaint = async (req, res) => {
       try {
    const {
      id,
      fullName,
      description,
      category,
      department,
      city,
      area,
      zone,
      street,
      landmark,
      latitude,
      longitude,
    } = req.body;

    console.log("fileComplaint request body:", req.body);

    const query = `
      INSERT INTO kanpur_complaints (
        complaint_id, full_name, description,
        category, department,
        city, area, zone,
        street, landmark, latitude, longitude
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *;
    `;

    const values = [
      id,
      fullName,
      description,
      category,
      department,
      city,
      area,
      zone,
      street,
      landmark,
      latitude,
      longitude
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      message: "Complaint saved successfully",
      data: result.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// const fileComplaint = async (req, res) => {
//   const client = await pool.connect();
//   try {
//     await client.query("BEGIN");

//     const {
//       title, description, category_id,
//       state, city, area, ward, pincode, landmark,
//       latitude, longitude,
//     } = req.body;

//     const trackId = await generateTrackId();

//     // Insert complaint row
//     const { rows: [complaint] } = await client.query(
//       `INSERT INTO complaints
//          (track_id, user_id, category_id, title, description,
//           state, city, area, ward, pincode, landmark, latitude, longitude)
//        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
//        RETURNING *`,
//       [
//         trackId,
//         req.user.id,
//         category_id || null,
//         title.trim(),
//         description.trim(),
//         (state || "Uttar Pradesh").trim(),
//         city.trim(),
//         area.trim(),
//         ward?.trim() || null,
//         pincode?.trim() || null,
//         landmark?.trim() || null,
//         latitude  || null,
//         longitude || null,
//       ]
//     );

//     // Upload images to Cloudinary and store URLs
//     const imageUrls = [];
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const { url, public_id } = await uploadToCloudinary(file.path);
//         await client.query(
//           `INSERT INTO complaint_images (complaint_id, image_url, public_id)
//            VALUES ($1, $2, $3)`,
//           [complaint.id, url, public_id]
//         );
//         imageUrls.push(url);
//       }
//     }

//     // Write first status-history entry
//     await client.query(
//       `INSERT INTO complaint_status_history
//          (complaint_id, new_status, changed_by, remarks)
//        VALUES ($1, 'pending', 'system', 'Complaint registered successfully')`,
//       [complaint.id]
//     );

//     await client.query("COMMIT");

//     return res.status(201).json({
//       success: true,
//       message: "Complaint filed successfully! Save your Track ID to monitor status.",
//       data: {
//         trackId:     complaint.track_id,
//         title:       complaint.title,
//         status:      complaint.status,
//         state:       complaint.state,
//         city:        complaint.city,
//         area:        complaint.area,
//         ward:        complaint.ward,
//         pincode:     complaint.pincode,
//         images:      imageUrls,
//         filedAt:     complaint.created_at,
//       },
//     });
//   } catch (err) {
//     await client.query("ROLLBACK");
//     console.error("fileComplaint:", err.message);
//     return res.status(500).json({ success: false, message: "Failed to file complaint." });
//   } finally {
//     client.release();
//   }
// };

// ── GET /api/complaints/track/:trackId  (public — no auth) ──────────────────
const trackComplaint = async (req, res) => {
  const { trackId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT
         c.track_id, c.title, c.description,
         c.status, c.priority,
         c.state, c.city, c.area, c.ward, c.pincode, c.landmark,
         c.department, c.assigned_to, c.remarks,
         c.created_at, c.updated_at, c.resolved_at,
         cat.name                                              AS category,
         u.name                                               AS complainant_name,
         COALESCE(
           JSON_AGG(ci.image_url) FILTER (WHERE ci.image_url IS NOT NULL),
           '[]'
         )                                                    AS images
       FROM complaints c
       LEFT JOIN categories            cat ON cat.id = c.category_id
       LEFT JOIN users                 u   ON u.id   = c.user_id
       LEFT JOIN complaint_images      ci  ON ci.complaint_id = c.id
       WHERE c.track_id = $1
       GROUP BY c.id, cat.name, u.name`,
      [trackId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: "No complaint found with this Track ID.",
      });
    }

    // Status timeline
    const { rows: history } = await pool.query(
      `SELECT old_status, new_status, remarks, changed_by, changed_at
       FROM complaint_status_history
       WHERE complaint_id = (SELECT id FROM complaints WHERE track_id = $1)
       ORDER BY changed_at ASC`,
      [trackId]
    );

    return res.status(200).json({
      success: true,
      data: { ...rows[0], statusTimeline: history },
    });
  } catch (err) {
    console.error("trackComplaint:", err.message);
    return res.status(500).json({ success: false, message: "Could not fetch complaint." });
  }
};


// ── GET /api/complaints/categories ──────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description
       FROM categories
       WHERE is_active = TRUE
       ORDER BY name`
    );
    return res.status(200).json({ success: true, data: rows });
  } catch (err) {
    console.error("getCategories:", err.message);
    return res.status(500).json({ success: false, message: "Could not fetch categories." });
  }
};


//admin api to get all complaints
const getAllComplaints = async (req, res) => {
  console.log("getAllComplaints called");
  try {
    const query = `
      SELECT *
      FROM kanpur_complaints
      ORDER BY complaint_id DESC;
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });

  } catch (err) {
    console.error("getAllComplaints error:", err);
    res.status(500).json({
      success: false,
      message: "Server error while fetching complaints",
    });
  }
};

module.exports = {
  fileComplaint,
  trackComplaint,
  getCategories,
  getAllComplaints,
};
