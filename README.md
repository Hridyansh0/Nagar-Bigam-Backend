# 🏛️ Government Complaint Management System — Backend

Node.js + PostgreSQL REST API with OTP-based auth, image uploads, and complaint tracking.

---

## ⚡ Setup (3 steps)

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Configure environment
Open `.env` and fill in your values:

| Variable | What to put |
|---|---|
| `DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD` | Your PostgreSQL credentials |
| `JWT_SECRET` | Any long random string (min 32 chars) |
| `TWILIO_ACCOUNT_SID / AUTH_TOKEN / PHONE_NUMBER` | From https://twilio.com console |
| `CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET` | From https://cloudinary.com dashboard |

> **Dev shortcut:** If you skip Twilio/Cloudinary, OTPs print to the terminal and images save locally. Everything still works.

### Step 3 — Create database & migrate
```bash
# Create the database in PostgreSQL first
createdb complaint_db

# Then run migration (creates all tables automatically)
npm run migrate

# Start the server
npm run dev
```

---

## 📡 API Endpoints

### Base URL: `http://localhost:3000/api`

---

### 🔐 Auth

#### 1. Send OTP
```
POST /auth/send-otp
Content-Type: application/json

{
  "name": "Ramesh Kumar",
  "mobile": "9876543210"
}
```
Response:
```json
{
  "success": true,
  "message": "OTP sent to 9876543210. Valid for 10 minutes.",
  "data": { "mobile": "9876543210", "isNewUser": true }
}
```

#### 2. Verify OTP → Get Token
```
POST /auth/verify-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "482910"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": 1, "name": "Ramesh Kumar", "mobile": "9876543210" }
  }
}
```

#### 3. Get Profile
```
GET /auth/profile
Authorization: Bearer <token>
```

---

### 📝 Complaints

#### File a Complaint
```
POST /complaints
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | ✅ | 5–200 chars |
| `description` | string | ✅ | 10–2000 chars |
| `city` | string | ✅ | e.g. Kanpur |
| `area` | string | ✅ | e.g. Kakadeo |
| `ward` | string | ❌ | e.g. Ward 42 |
| `pincode` | string | ❌ | 6 digits |
| `state` | string | ❌ | default: Uttar Pradesh |
| `landmark` | string | ❌ | nearby landmark |
| `category_id` | number | ❌ | from /categories |
| `latitude` | number | ❌ | GPS |
| `longitude` | number | ❌ | GPS |
| `images` | file[] | ❌ | max 5, 5MB each, JPEG/PNG/WebP |

Response:
```json
{
  "success": true,
  "message": "Complaint filed successfully!",
  "data": {
    "trackId": "GC-20240520-AB3K9",
    "status": "pending",
    "city": "Kanpur",
    "area": "Kakadeo",
    "ward": "Ward 42",
    "images": ["https://res.cloudinary.com/..."],
    "filedAt": "2024-05-20T10:30:00Z"
  }
}
```

#### Track Complaint (Public — no login)
```
GET /complaints/track/GC-20240520-AB3K9
```
Returns full complaint details + status timeline.

#### My Complaints
```
GET /complaints/my?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### Complaint Detail (Owner only)
```
GET /complaints/GC-20240520-AB3K9
Authorization: Bearer <token>
```

#### Categories
```
GET /complaints/categories
```

---

## 🗄️ Database Schema

```
users
  id, name, mobile, is_verified, is_active, created_at, updated_at

otps
  id, mobile, otp, purpose, is_used, expires_at, created_at

categories
  id, name, description, is_active, created_at

complaints
  id, track_id, user_id, category_id
  title, description
  state, city, area, ward, pincode, landmark, latitude, longitude
  status, priority, assigned_to, department, remarks
  resolved_at, created_at, updated_at

complaint_images
  id, complaint_id, image_url, public_id, uploaded_at

complaint_status_history
  id, complaint_id, old_status, new_status, changed_by, remarks, changed_at
```

---

## 🔄 Status Flow

```
pending → acknowledged → in_progress → resolved
                     ↘ rejected
```

---

## 🔑 Track ID Format

`GC-YYYYMMDD-XXXXX`  →  e.g. `GC-20240520-AB3K9`

---

## 🔒 Security

- OTP expires in 10 minutes, one-time use only
- JWT token (7-day expiry)
- Rate limiting: 5 OTP/15min, 100 global/15min
- Input validation on every endpoint
- Parameterized SQL queries (no SQL injection)
