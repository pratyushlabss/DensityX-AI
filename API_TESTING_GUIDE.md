# DensityX-AI API Testing Guide

## Overview
This guide explains how to properly test all DensityX-AI API endpoints with correct HTTP methods and request formats.

---

## Common Issue: "Method Not Allowed" Error

### What It Means
```json
{"detail":"Method Not Allowed"}
```

This error occurs when:
- ❌ You send a **GET** request to a POST-only endpoint
- ❌ You send a **PUT** request to a GET-only endpoint
- ❌ You use the wrong HTTP method for the route

### Solution
Ensure you're using the **correct HTTP method** for each endpoint:
- `GET` - Retrieve data (read-only)
- `POST` - Create/modify data (requires JSON body)
- `PUT` - Update data
- `DELETE` - Remove data

---

## Base URL
```
https://densityx-ai.onrender.com
```

---

## API Endpoints Reference

### 1️⃣ Health Check
**Purpose**: Verify backend is running

**Endpoint**: `GET /health`

**Request**:
```bash
curl https://densityx-ai.onrender.com/health
```

**Response** (200 OK):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-03-04T17:42:37.557103"
}
```

✅ **Correct Method**: GET

---

### 2️⃣ Crowd Locations & Clusters
**Purpose**: Get all user points and density clusters

**Endpoint**: `GET /crowd/locations`

**Request**:
```bash
curl https://densityx-ai.onrender.com/crowd/locations
```

**Response** (200 OK):
```json
{
  "count": 200,
  "points": [
    {"lat": 13.0850, "lon": 80.2101},
    {"lat": 13.0851, "lon": 80.2102}
  ],
  "clusters": [
    {
      "cluster_id": 1,
      "cluster_size": 45,
      "centroid": {"lat": 13.0851, "lon": 80.2101},
      "risk_flag": true
    }
  ]
}
```

✅ **Correct Method**: GET

---

### 3️⃣ User Registration ⚠️
**Purpose**: Register a new user with ticket validation

**Endpoint**: `POST /user/register`

**Required**: JSON body with user data

**Correct Request**:
```bash
curl -X POST https://densityx-ai.onrender.com/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "DX-005491",
    "name": "John Doe",
    "phone": "9876543210"
  }'
```

**Response** (201 Created):
```json
{
  "status": "registered",
  "ticket_id": "DX-005491",
  "message": "User John Doe registered. Please enable GPS."
}
```

**Errors**:
- ❌ `GET` (visiting in browser address bar):
  ```json
  {"detail":"Method Not Allowed"}
  ```
- ❌ Invalid ticket:
  ```json
  {"detail":"Invalid ticket ID: DX-INVALID"}
  ```
- ❌ Missing JSON body:
  ```json
  {"detail":"validation error..."}
  ```

✅ **Correct Method**: POST with JSON body
✅ **Valid Ticket Example**: DX-005491 (from backend/tickets.csv)

---

### 4️⃣ Update User Location
**Purpose**: Send user's current GPS coordinates

**Endpoint**: `POST /user/location`

**Required**: JSON body with location data

**Request**:
```bash
curl -X POST https://densityx-ai.onrender.com/user/location \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "DX-005491",
    "latitude": 13.0851,
    "longitude": 80.2101,
    "gps_enabled": true
  }'
```

**Response** (200 OK):
```json
{
  "status": "updated",
  "ticket_id": "DX-005491",
  "message": "Location updated: 13.0851, 80.2101",
  "gps_enabled": true
}
```

✅ **Correct Method**: POST with JSON body

---

### 5️⃣ Get User Profile
**Purpose**: Retrieve user information

**Endpoint**: `GET /user/me`

**Request**:
```bash
curl "https://densityx-ai.onrender.com/user/me?ticket_id=DX-005491"
```

**Response** (200 OK):
```json
{
  "ticket_id": "DX-005491",
  "name": "John Doe",
  "phone": "9876543210",
  "latitude": 13.0851,
  "longitude": 80.2101,
  "gps_enabled": true,
  "last_updated": "2026-03-04T17:42:37"
}
```

✅ **Correct Method**: GET (with query parameter)

---

### 6️⃣ Density Analysis
**Purpose**: Get clustering results and metrics

**Endpoint**: `GET /density`

**Request**:
```bash
curl https://densityx-ai.onrender.com/density
```

**Response** (200 OK):
```json
{
  "cluster_count": 5,
  "cluster_sizes": [45, 23, 67, 12, 8],
  "risk_flags": [true, false, true, false, false],
  "clusters": [
    {
      "id": 1,
      "size": 45,
      "centroid_lat": 13.0851,
      "centroid_lon": 80.2101,
      "risk_flag": true
    }
  ]
}
```

✅ **Correct Method**: GET

---

### 7️⃣ System Status
**Purpose**: Get comprehensive system status with ticket info

**Endpoint**: `GET /status`

**Request**:
```bash
curl https://densityx-ai.onrender.com/status
```

**Response** (200 OK):
```json
{
  "status": "operational",
  "mode": "SIMULATION",
  "timestamp": "2026-03-04T17:42:37",
  "tickets": {
    "total_valid": 102,
    "sample": ["DX-005491", "DX-010437", "DX-019018"]
  },
  "crowd": {
    "total_points": 200,
    "active_clusters": 5,
    "high_risk_clusters": 2
  }
}
```

✅ **Correct Method**: GET

---

## Frontend Integration ✅

The frontend `apiClient.js` correctly implements all these endpoints:

```javascript
// Example: User Registration
await apiClient.registerUser("DX-005491", "John Doe", "9876543210");
// Internally calls: POST /user/register with JSON body

// Example: Get Crowd Data
const data = await apiClient.getCrowdData();
// Internally calls: GET /crowd/locations

// Example: Update Location
await apiClient.updateLocation("DX-005491", 13.0851, 80.2101, true);
// Internally calls: POST /user/location with JSON body
```

---

## Testing Checklist

- [ ] **Health Check**
  ```bash
  curl https://densityx-ai.onrender.com/health
  ```
  Expected: 200 OK with healthy status

- [ ] **Get Crowd Data**
  ```bash
  curl https://densityx-ai.onrender.com/crowd/locations
  ```
  Expected: 200 OK with points and clusters

- [ ] **Register User (POST)**
  ```bash
  curl -X POST https://densityx-ai.onrender.com/user/register \
    -H "Content-Type: application/json" \
    -d '{"ticket_id":"DX-005491","name":"Test","phone":"1234567890"}'
  ```
  Expected: 201 Created with registration confirmation

- [ ] **Register User (GET) - Should FAIL**
  ```bash
  curl https://densityx-ai.onrender.com/user/register
  ```
  Expected: 405 Method Not Allowed

- [ ] **Update Location (POST)**
  ```bash
  curl -X POST https://densityx-ai.onrender.com/user/location \
    -H "Content-Type: application/json" \
    -d '{"ticket_id":"DX-005491","latitude":13.0851,"longitude":80.2101,"gps_enabled":true}'
  ```
  Expected: 200 OK with location confirmation

- [ ] **Get Density**
  ```bash
  curl https://densityx-ai.onrender.com/density
  ```
  Expected: 200 OK with clustering results

---

## Common Errors & Solutions

### Error: `{"detail":"Method Not Allowed"}`

**Cause**: Using GET instead of POST (or wrong method)

**Example Mistake**:
```bash
# ❌ WRONG - trying to visit in browser
https://densityx-ai.onrender.com/user/register
```

**Solution**:
```bash
# ✅ CORRECT - using POST with curl
curl -X POST https://densityx-ai.onrender.com/user/register \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"DX-005491","name":"John","phone":"1234567890"}'
```

---

### Error: `{"detail":"Invalid ticket ID: ..."}` (400)

**Cause**: Ticket doesn't exist in CSV

**Solution**: Use a valid ticket from `backend/tickets.csv`
```bash
# Check valid tickets
head -10 backend/tickets.csv

# Use one of the valid tickets in your request
curl -X POST https://densityx-ai.onrender.com/user/register \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"DX-005491","name":"John","phone":"1234567890"}'
```

---

### Error: `{"detail":"...validation error..."}` (422)

**Cause**: Missing required fields in JSON body

**Solution**: Include all required fields:
- `ticket_id` (string)
- `name` (string)
- `phone` (string)

```bash
# ✅ CORRECT - all fields present
curl -X POST https://densityx-ai.onrender.com/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "ticket_id": "DX-005491",
    "name": "John Doe",
    "phone": "9876543210"
  }'
```

---

## Valid Test Tickets

These tickets exist in the backend CSV and will pass validation:

```
DX-005491
DX-010437
DX-019018
DX-028903
DX-059948
DX-063515
DX-066162
DX-071434
DX-107915
DX-095667
```

(Full list in `backend/tickets.csv` - 102 total)

---

## Tools for Testing

### Option 1: cURL (Command Line)
```bash
curl -X POST https://densityx-ai.onrender.com/user/register \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"DX-005491","name":"Test","phone":"1234567890"}'
```

### Option 2: Postman (GUI)
1. Create new request
2. Set method to **POST**
3. Set URL: `https://densityx-ai.onrender.com/user/register`
4. Go to **Body** tab
5. Select **raw** → **JSON**
6. Enter:
   ```json
   {
     "ticket_id": "DX-005491",
     "name": "Test User",
     "phone": "1234567890"
   }
   ```
7. Click **Send**

### Option 3: Browser Console
```javascript
// Open browser F12 → Console
fetch('https://densityx-ai.onrender.com/user/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ticket_id: 'DX-005491',
    name: 'Test User',
    phone: '1234567890'
  })
}).then(r => r.json()).then(d => console.log(d));
```

---

## API Request Summary Table

| Endpoint | Method | Body | Purpose |
|----------|--------|------|---------|
| `/health` | GET | No | Health check |
| `/crowd/locations` | GET | No | Get crowd data |
| `/user/register` | **POST** | **Yes** | Register user |
| `/user/location` | **POST** | **Yes** | Update location |
| `/user/me` | GET | No | Get user profile |
| `/density` | GET | No | Get clusters |
| `/status` | GET | No | System status |

**Bold** = requires JSON body

---

## Key Takeaway

✅ **Always check the HTTP method:**
- **GET** endpoints = Read data (no body needed, can visit in browser)
- **POST** endpoints = Create/modify data (body required, use curl/fetch/Postman)

❌ **Don't mix them up** or you'll get `{"detail":"Method Not Allowed"}`

---

**For more information**: See OPERATIONS_GUIDE.md for deployment instructions
