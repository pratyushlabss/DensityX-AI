# DensityX-AI Deployment & Operations Guide

## 🎯 Quick Start Commands

### Development Environment

**Frontend (Vite Dev Server)**:
```bash
cd frontend
npm install
npm run dev
# Accessible at http://localhost:5173
# Hot reload enabled for development
```

**Backend (FastAPI Server)**:
```bash
cd backend
python -m pip install -r requirements.txt
python main.py
# Accessible at http://localhost:8003
# Auto-reload disabled for production stability
```

**Both Together (Terminal Split)**:
```bash
# Terminal 1
cd frontend && npm run dev

# Terminal 2
cd backend && python main.py

# Then visit http://localhost:5173 (frontend uses http://localhost:8003 for API)
```

---

## 🚀 Production Deployment

### Option 1: Firebase Hosting + Render Backend (Current Setup)

**Frontend Deployment to Firebase**:
```bash
# Build frontend
cd frontend
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Verify deployment
curl https://density-bbe08.web.app/health

# Open in browser
open https://density-bbe08.web.app
```

**Backend Deployment to Render** (Automated):
```bash
# 1. Push code to GitHub
git add -A
git commit -m "your message"
git push origin main

# 2. Render automatically deploys from GitHub webhook
# Verify with:
curl https://densityx-ai.onrender.com/health

# Expected response:
# {"status":"healthy","version":"1.0.0","timestamp":"..."}
```

### Option 2: Docker Deployment

**Build Docker Image**:
```bash
# Build both services
docker-compose build

# Run services
docker-compose up

# Frontend: http://localhost:3000
# Backend: http://localhost:8003
```

**Docker Compose Services**:
```yaml
# frontend: node.js + Vite dev server
# backend: python + FastAPI + uvicorn
# Both on custom network for inter-service communication
```

### Option 3: Vercel (Frontend) + Render (Backend)

**Frontend on Vercel**:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables:
# VITE_API_BASE=https://densityx-ai.onrender.com
```

---

## 🔧 Configuration Management

### Environment Variables

**Backend (.env file)**:
```bash
USE_SIMULATION=true          # true for simulation, false for real tickets
BASE_CROWD_SIZE=200          # Initial crowd count
VENUE_CENTER_LAT=13.085      # Venue latitude
VENUE_CENTER_LNG=80.2101     # Venue longitude
VENUE_RADIUS_KM=0.5          # Coverage area in km
DBSCAN_EPS_METERS=25         # Neighborhood radius
DBSCAN_MIN_SAMPLES=15        # Min points per cluster
CLUSTER_ALERT_THRESHOLD=25   # Alert when size >= this
UPDATE_INTERVAL_SECONDS=2    # Simulation refresh
DBSCAN_INTERVAL_SECONDS=3    # Clustering frequency
```

**Frontend (vite.config.js)**:
```javascript
// Already configured to use production API:
// https://densityx-ai.onrender.com

// For local development, apiClient.js uses:
const API_BASE = "https://densityx-ai.onrender.com";

// To switch to localhost during development:
// Change API_BASE to "http://localhost:8003"
```

### Render Configuration

**Environment Variables on Render.com**:
1. Go to Service Settings
2. Add environment variables as shown above
3. Render automatically redeploys on variable changes

**Health Check Settings**:
```
Endpoint: /health
Method: GET
Expected status: 200
```

---

## 📊 Monitoring & Logs

### Health Check Endpoints

**System Health**:
```bash
curl https://densityx-ai.onrender.com/health
# {"status":"healthy","version":"1.0.0","timestamp":"..."}
```

**System Status** (with ticket info):
```bash
curl https://densityx-ai.onrender.com/status
# Returns: tickets count, active clusters, crowd stats
```

**API Info**:
```bash
curl https://densityx-ai.onrender.com/info
# Lists all available endpoints
```

### Render Logs

```bash
# View Render logs in real-time:
# 1. Go to https://render.com dashboard
# 2. Select DensityX service
# 3. View "Logs" tab

# Or via Render CLI:
render logs --service densityx-ai --tail
```

### Firebase Logs

```bash
# View Firebase Hosting deployment logs:
firebase hosting:channel:list
firebase hosting:versions:list

# Monitor usage:
# Go to https://console.firebase.google.com → Hosting → Usage
```

---

## 🔄 Continuous Integration/Deployment

### GitHub Actions (Optional Setup)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Install dependencies
        run: |
          cd frontend && npm install
          cd ../backend && pip install -r requirements.txt
      
      - name: Build frontend
        run: cd frontend && npm run build
      
      - name: Deploy to Firebase
        run: firebase deploy --only hosting --token ${{ secrets.FIREBASE_TOKEN }}
```

---

## 🧪 Testing & Validation

### Local Testing

**Test Frontend**:
```bash
cd frontend
npm run build  # Should complete with 0 errors
npm run preview  # Test production build
```

**Test Backend**:
```bash
cd backend

# Health check
curl http://localhost:8003/health

# Crowd data
curl http://localhost:8003/crowd/locations

# Register a user (test)
curl -X POST http://localhost:8003/user/register \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"DX-005491","name":"Test User","phone":"1234567890"}'
```

### Production Smoke Tests

```bash
# Frontend loads
curl -I https://density-bbe08.web.app

# Backend health
curl https://densityx-ai.onrender.com/health

# API returns data
curl https://densityx-ai.onrender.com/crowd/locations

# Verify map assets load
curl https://density-bbe08.web.app/assets/index-*.js | wc -l
# Should return file size, not 404
```

---

## 🐛 Troubleshooting

### Frontend Issues

**White Screen of Death**:
```bash
# Check console errors: F12 → Console
# Possible causes:
# 1. API_BASE not set correctly
# 2. Backend not responding
# 3. CORS issues

# Solution: Check browser console for error messages
```

**Map Not Showing**:
```bash
# Check that Leaflet CSS is loaded
# Verify API_BASE is correct
# Ensure /crowd/locations endpoint responds
```

**Slow Loading**:
```bash
# Check network tab: F12 → Network
# Large bundle size? (should be ~120KB gzipped)
# Slow API response? (should be <100ms)
```

### Backend Issues

**High Memory Usage**:
```bash
# Monitor with: top -p $(pgrep -f "python main.py")
# DBSCAN can spike with large datasets
# Solution: Reduce UPDATE_INTERVAL_SECONDS or VENUE_RADIUS_KM
```

**Tickets Not Loading**:
```bash
# Verify CSV file exists:
ls -la backend/tickets.csv

# Check format:
head -2 backend/tickets.csv
# Should show: ticket_id (header) then IDs

# Verify validator loads:
curl https://densityx-ai.onrender.com/status
# Should show: "total_valid": <count>
```

**Slow Clustering**:
```bash
# Check DBSCAN parameters:
# Increase DBSCAN_EPS_METERS (wider neighborhood)
# Decrease DBSCAN_MIN_SAMPLES (lower threshold)
# Both reduce computation time
```

---

## 📈 Performance Optimization

### Frontend Optimization

**Already Implemented**:
- ✅ Tree shaking in Vite build
- ✅ Code splitting for components
- ✅ useCallback for stable function references
- ✅ Leaflet CSS minified
- ✅ React 19 latest optimizations

**Further Optimization** (if needed):
```javascript
// Use React.memo for expensive components
const MapView = React.memo(MapViewComponent);

// Lazy load admin dashboard
const Dashboard = React.lazy(() => import('./components/Dashboard'));

// Cache API responses
const cacheData = new Map();
```

### Backend Optimization

**Already Implemented**:
- ✅ DBSCAN with numpy/scikit-learn (C-optimized)
- ✅ In-memory store (no database latency)
- ✅ FastAPI async endpoints
- ✅ Connection pooling ready

**Further Optimization** (if needed):
```python
# Enable Redis caching for clustering results
# Use PostgreSQL instead of in-memory store
# Implement clustering result TTL caching
# Add request rate limiting
```

---

## 🔐 Security Considerations

### Current Setup
- ✅ CORS enabled for frontend domain
- ✅ CSV ticket validation prevents fake registrations
- ✅ No sensitive data in frontend code
- ✅ HTTPS enforced on Firebase and Render

### Recommended Enhancements
1. **API Rate Limiting**: Prevent DoS attacks
2. **Input Validation**: Sanitize all inputs
3. **Authentication**: Add JWT or OAuth for protected endpoints
4. **HTTPS Only**: Enforce HTTPS redirects
5. **CORS Tightening**: Specify allowed origins explicitly
6. **Database Encryption**: If using persistent storage

---

## 📋 Deployment Checklist

- [ ] All changes committed to GitHub
- [ ] Environment variables set on Render
- [ ] Firebase project configured
- [ ] Frontend builds without errors
- [ ] Backend health check passing
- [ ] API endpoints responding
- [ ] Map displaying with sample data
- [ ] Alerts triggering at threshold
- [ ] All stats updating in real-time
- [ ] No console errors in browser F12
- [ ] Certificate/HTTPS working
- [ ] Load tested with sample users

---

## 🎯 Scaling Considerations

### Current Limitations
- In-memory store: ~10,000 users max
- DBSCAN: Linear with point count
- Render free tier: 750 hours/month

### Scaling Solutions

**Short-term** (10K-100K users):
```
- Increase Render plan to standard
- Add Redis for result caching
- Implement result pagination
```

**Long-term** (100K+ users):
```
- Migrate to PostgreSQL or MongoDB
- Implement Redis for caching
- Use Kubernetes for horizontal scaling
- Implement WebSocket for real-time push
- Add CDN for frontend (already on Firebase)
```

---

## 📞 Emergency Procedures

### Service Down

```bash
# 1. Check status
curl https://densityx-ai.onrender.com/health
curl https://density-bbe08.web.app

# 2. View logs
# Render dashboard → Logs tab
# Firebase console → Hosting → Deployment history

# 3. Rollback if needed
git revert <commit-hash>
git push origin main
# Render/Firebase auto-redeploy

# 4. Manual restart
# Render dashboard → Manual Deploy button
```

### Database Corruption

```bash
# In-memory store auto-resets on restart
# No persistent data loss risk
# Just restart the service:

# Via Render dashboard:
# 1. Select service
# 2. Click "Manual Deploy"
# 3. Service restarts with fresh data
```

---

## 📊 Useful Commands Reference

```bash
# Development
npm run dev           # Frontend dev server
python main.py       # Backend dev server

# Building
npm run build         # Frontend production build
npm run preview       # Preview production build

# Deployment
firebase deploy       # Deploy to Firebase
git push origin main  # Trigger Render deploy

# Monitoring
curl /health          # Health check
tail -f logs.txt      # View logs
ps aux | grep python  # Find processes

# Cleanup
rm -rf dist           # Remove build artifacts
rm -rf node_modules   # Remove dependencies (reinstall with npm install)
```

---

## 🎓 Key Concepts

**DBSCAN Clustering**:
- Density-based partitioning
- Groups nearby points (within eps distance)
- Minimum points required per cluster (min_samples)
- Identifies outliers as noise points

**Render Deployment**:
- Automatic redeploy on git push
- Environment variables for config
- Health check endpoints for monitoring
- Logs available in dashboard

**Firebase Hosting**:
- Static site hosting
- Automatic SSL/TLS
- CDN with edge caching
- One-command deployment

---

## 📞 Support Contact

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs on Render dashboard
3. Check frontend console with F12 → Console
4. Inspect network requests with F12 → Network

**System Status Page**: Check `/health` and `/status` endpoints for detailed info.

---

**Deployment Guide - Last Updated: March 4, 2026**
**Status: ✅ Production Ready**
