# DensityX Event Check-In — Quick Start

## 🚀 5-Minute Setup

### 1. Generate Test Tickets

```bash
cd backend
python scripts/generate_tickets.py --count 100
```

**Output:**
```
✓ Generated 100 tickets
✓ Saved to backend/data/tickets.csv
Sample: DX-A9F3K2, DX-K8M2L1, DX-R4P9X5
```

### 2. Switch to Real Ticket Mode

Edit `backend/config/settings.py`:

```python
# Change from:
USE_SIMULATION = True

# To:
USE_SIMULATION = False
```

### 3. Start Backend

```bash
cd backend
source venv/bin/activate
python -m uvicorn main:app --reload --port 8000
```

**Output should show:**
```
[startup] REAL TICKET MODE: waiting for user registrations
[startup] DBSCAN clustering every 10s
Uvicorn running on http://0.0.0.0:8000
```

### 4. Open Event Check-In UI

Visit in browser:
```
http://localhost:8000/onboarding
```

---

## 👤 Test User Flow

### Example with Sample Ticket

**Ticket ID**: `DX-A9F3K2` (generated from step 1)

1. **Step 1 — Ticket**
   - Input: `DX-A9F3K2`
   - Click: "Continue"
   - Expected: Moves to Step 2

2. **Step 2 — Details**
   - Name: `John Doe`
   - Phone: `+91-9876543210`
   - Click: "Next"
   - Expected: Moves to Step 3

3. **Step 3 — GPS**
   - Click: "Allow & Continue"
   - Browser: "Allow location access?"
   - Expected: Moves to Step 4

4. **Step 4 — Confirmation**
   - Status: "✔ You're Checked In!"
   - Indicator: "✔ Live Tracking Enabled"
   - Location: Sent every 5 seconds

---

## 📊 Live Status Panel

The top header shows:

| Metric | What It Shows |
|--------|---------------|
| **Users Checked In** | Total active user sessions |
| **GPS Active** | Users with location enabled |
| **System Status** | Backend connection (green=connected) |

Updates automatically every 5 seconds.

---

## ✅ Verify It's Working

### 1. Check Active Users

Open second terminal, same directory:

```bash
curl http://localhost:8000/user/active-count
```

**Response after check-in:**
```json
{
  "active_users": 1,
  "gps_enabled": 1
}
```

### 2. Check Clustering

```bash
curl http://localhost:8000/density
```

**Response (real ticket mode):**
```json
{
  "cluster_count": 1,
  "clusters": [
    {
      "id": 0,
      "size": 1,
      "centroid_lat": 13.0850,
      "centroid_lon": 80.2101,
      "risk_flag": false
    }
  ]
}
```

### 3. Watch Live Logs

In backend terminal, you'll see:

```
[density] real users clusters=1 sizes=[1] risk_flags=[]
```

---

## 🎨 UI Walkthrough

### Header (Top)
- Real-time user counts
- Green dot = connected
- Red dot = offline

### Onboarding Card (Center)
- Progress bar showing 4 steps
- Current step form
- Back/Next buttons
- Error messages (if any)

### Success Screen (After Step 4)
- Green checkmark animation
- "You're Checked In!" message
- Live tracking status
- Automatic location sending

---

## 🔗 URLs Reference

| Purpose | URL |
|---------|-----|
| **Event Check-In** | `http://localhost:8000/onboarding` |
| **Admin Dashboard** | `http://localhost:8000/dashboard` |
| **API Docs** | `http://localhost:8000/docs` |
| **Health Check** | `http://localhost:8000/health` |

---

## 🛠️ Troubleshooting

### Issue: "Invalid ticket ID"
- ✓ Check ticket is from `backend/data/tickets.csv`
- ✓ Verify format: `DX-XXXXXX` (uppercase)
- ✓ Run again: `python scripts/generate_tickets.py`

### Issue: Status panel shows 0 users
- ✓ Is backend running? (Check terminal)
- ✓ Did you switch `USE_SIMULATION = False`?
- ✓ Try refresh page (F5)

### Issue: GPS asks for permission but won't allow
- ✓ Check browser permissions: Settings → Privacy → Location
- ✓ Try incognito/private mode
- ✓ HTTPS required in production (localhost works)

### Issue: "Location update failed"
- ✓ Check network tab (F12 → Network)
- ✓ POST to `/user/location` should return 200
- ✓ Verify JSON format matches documentation

---

## 📈 Multi-User Testing

### Add 5 More Check-Ins

Open 5 browser tabs:
1. Tab 1: `http://localhost:8000/onboarding` (Ticket: DX-XXXXX1)
2. Tab 2: `http://localhost:8000/onboarding` (Ticket: DX-XXXXX2)
3. Tab 3: `http://localhost:8000/onboarding` (Ticket: DX-XXXXX3)
4. Tab 4: `http://localhost:8000/onboarding` (Ticket: DX-XXXXX4)
5. Tab 5: `http://localhost:8000/onboarding` (Ticket: DX-XXXXX5)

Check backend logs:
```
[density] real users clusters=1 sizes=[5] risk_flags=[]
```

Status panel:
```
Users Checked In: 5
GPS Active: 5
```

---

## 🎯 Next Steps

### Option A: Test with Simulator
1. Keep `USE_SIMULATION = False`
2. Open `/onboarding` in browser
3. Complete check-in
4. See your location in admin dashboard

### Option B: Switch to Simulation (Testing)
1. Set `USE_SIMULATION = True`
2. Restart backend
3. Admin dashboard shows 200 simulated people
4. See DBSCAN clusters visualized

### Option C: Monitor Live
```bash
# Watch live density calculations
tail -f /tmp/densityx.log

# Or in backend terminal, watch for:
# [density] real users clusters=X sizes=[] risk_flags=[]
```

---

## 📚 Full Documentation

See [ONBOARDING_UI.md](ONBOARDING_UI.md) for:
- Complete UI features
- API integration details
- Design philosophy
- Mobile optimization
- Security features
- Advanced troubleshooting

---

## ✨ Features

✅ **4-Step Check-In Process**
- Ticket validation
- Personal details
- GPS consent
- Live confirmation

✅ **Real-Time Status Panel**
- Active user count
- GPS enabled count
- System health indicator
- Auto-refreshing every 5 seconds

✅ **Mobile-Friendly Design**
- Responsive layout
- Touch-optimized buttons
- Full-screen mobile view
- Landscape support

✅ **Live Location Tracking**
- Automatic GPS every 5 seconds
- Real-time clustering
- Crowd density alerts
- User position on admin map

✅ **Event-Style UI**
- Modern dark theme
- Cyan accent colors
- Smooth animations
- Professional appearance

---

## 🎉 You're Ready!

Your DensityX event check-in system is live and ready to:
1. Validate attendee tickets
2. Collect contact information
3. Request GPS permission
4. Send real-time location data
5. Cluster attendees into crowd zones
6. Alert on high-density areas

**Start with**: `http://localhost:8000/onboarding`

Questions? See [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md) or [ONBOARDING_UI.md](ONBOARDING_UI.md)
