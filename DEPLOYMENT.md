# DensityX AI - Deployment & Setup Guide

## Overview
DensityX AI is a real-time crowd density monitoring system using DBSCAN clustering to detect high-risk crowd zones in venues.

**Clusters are found using DBSCAN algorithm** that:
1. Converts lat/lon coordinates to approximate meters
2. Groups points within `eps_meters` distance (default: 100m)
3. Requires minimum `min_samples` points to form a cluster (default: 5)
4. Flags clusters with ≥80 people as **HIGH RISK**

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│         Real-time Crowd Simulation                  │
│  (generates 200 random points every 2 seconds)      │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│    DBSCAN Density Clustering Engine                 │
│  (analyzes clusters every 10 seconds)               │
│  - Detects natural density groupings                │
│  - Alerts on high-risk clusters (≥80 people)       │
└─────────────────┬───────────────────────────────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
    ┌────────────┐  ┌─────────────┐
    │ REST API   │  │ WebSocket   │
    │ Endpoints  │  │ (optional)  │
    └────────────┘  └─────────────┘
         │                 │
         └────────┬────────┘
                  ▼
    ┌──────────────────────────┐
    │  Interactive Dashboard   │
    │  - Live heatmap          │
    │  - Cluster markers       │
    │  - Real-time alerts      │
    │  - Risk indicators       │
    └──────────────────────────┘
```

## Quick Start (Local Development)

### Prerequisites
- Python 3.9+
- pip/venv
- Node.js 16+ (for frontend, optional)

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Run development server
python -m uvicorn main:app --reload --port 8000
```

Backend will be available at: **http://localhost:8000**
- API Docs: http://localhost:8000/docs
- Dashboard: http://localhost:8000/static/dashboard/index.html

### Configuration

Edit `.env` to customize:

```env
# Venue location (default: Anna Nagar, Chennai)
VENUE_CENTER_LAT=13.0850
VENUE_CENTER_LNG=80.2101

# Cluster detection parameters
DBSCAN_EPS_METERS=100              # Maximum distance between points in cluster
DBSCAN_MIN_SAMPLES=5               # Minimum points to form cluster
CLUSTER_ALERT_THRESHOLD=80         # People threshold for alerts

# Simulation
BASE_CROWD_SIZE=200                # Starting number of people
UPDATE_INTERVAL_SECONDS=2          # How often to generate new points
DBSCAN_INTERVAL_SECONDS=10         # How often to run density analysis
```

## Docker Deployment

### Build & Run with Docker Compose

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

The system will:
- Run backend on port 8000
- Run Nginx reverse proxy on port 80
- Auto-restart on failure
- Include health checks

### Production Deployment Checklist

- [ ] Set `DEBUG=False` in `.env`
- [ ] Use strong random `SECRET_KEY`
- [ ] Enable HTTPS (update nginx.conf)
- [ ] Set appropriate CORS origins
- [ ] Configure database for persistence
- [ ] Set up monitoring/alerts
- [ ] Configure log aggregation
- [ ] Set resource limits in docker-compose

## API Endpoints

### Get Crowd Locations
```
GET /crowd/locations

Response:
{
  "count": 200,
  "points": [
    {"lat": 13.0850, "lon": 80.2101},
    ...
  ],
  "clusters": [...]
}
```

### Get Density Analysis
```
GET /density

Response:
{
  "cluster_count": 2,
  "cluster_sizes": [78, 82],
  "risk_flags": [1],
  "clusters": [
    {
      "id": 0,
      "size": 78,
      "risk_flag": false,
      "centroid_lat": 13.0850,
      "centroid_lon": 80.2101
    },
    {
      "id": 1,
      "size": 82,
      "risk_flag": true,
      "centroid_lat": 13.0860,
      "centroid_lon": 80.2110
    }
  ]
}
```

### Trigger Surge
```
POST /crowd/surge?extra=500

Response:
{"ok": true, "message": "Surge triggered: +500 attendees"}
```

## Dashboard Features

### Real-time Visualization
- **Heatmap**: Shows crowd density with color gradient
- **Cluster Markers**: Blue circles (normal), Red circles (high-risk)
- **Live Metrics**: Total points, active clusters, alert count
- **Alert Banner**: Appears when high-risk clusters detected

### Cluster Detection Details
- Algorithm: DBSCAN (Density-Based Spatial Clustering)
- Detection interval: 10 seconds (configurable)
- Risk threshold: ≥80 people per cluster
- Distance metric: ~100m radius (configurable)

### Monitoring
- **Green indicator**: System operational
- **Red indicator**: Connection lost
- Auto-refresh every 5 seconds
- Real-time console logging

## Performance Tuning

### For Large Crowds (1000+ people)
```env
DBSCAN_EPS_METERS=150              # Increase distance threshold
DBSCAN_MIN_SAMPLES=10              # Require more points
UPDATE_INTERVAL_SECONDS=5          # Generate less frequently
DBSCAN_INTERVAL_SECONDS=15         # Analyze less frequently
```

### For High Precision
```env
DBSCAN_EPS_METERS=50               # Smaller clusters
DBSCAN_MIN_SAMPLES=3               # More sensitive
CLUSTER_ALERT_THRESHOLD=50         # Lower alert threshold
```

## Troubleshooting

### Dashboard not loading
1. Check backend is running: `curl http://localhost:8000/docs`
2. Check CORS settings in `main.py`
3. Clear browser cache and reload

### No clusters detected
1. Verify `DBSCAN_MIN_SAMPLES` isn't too high
2. Check `DBSCAN_EPS_METERS` isn't too small
3. Monitor logs: `tail -f backend.log`

### High CPU usage
1. Reduce `BASE_CROWD_SIZE`
2. Increase `UPDATE_INTERVAL_SECONDS`
3. Increase `DBSCAN_INTERVAL_SECONDS`
4. Consider deploying on larger instance

## Integration with External Systems

### Send alerts to Slack
```python
# Add to alerts.py
import requests

def send_slack_alert(cluster_id, size):
    webhook_url = os.getenv("SLACK_WEBHOOK")
    requests.post(webhook_url, json={
        "text": f"⚠️ High crowd density in Zone {cluster_id}: {size} people"
    })
```

### Store to database
```python
# Add to storage/memory_store.py
# Implement persistent storage with PostgreSQL, MongoDB, etc.
```

## Support & Resources

- **Documentation**: See `README.md`
- **Issues**: Report on GitHub
- **Performance**: Monitor metrics in backend logs
- **Scaling**: Use load balancer + multiple backend instances

---

**Version**: 1.0.0
**Last Updated**: February 2026
