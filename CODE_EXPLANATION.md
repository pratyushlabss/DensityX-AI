# DensityX AI - Complete Code Explanation

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DensityX AI System Architecture                  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  FRONTEND (Browser)  │
├──────────────────────┤
│ • Leaflet Map        │
│ • Heatmap Layer      │
│ • Cluster Markers    │
│ • Real-time Stats    │
└──────────┬───────────┘
           │
    HTTP REST API
           │
┌──────────▼─────────────────────────────────────────────────────┐
│              BACKEND (FastAPI Server)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐      ┌──────────────────────┐         │
│  │  SIMULATION ENGINE  │      │  DENSITY ANALYSIS    │         │
│  ├─────────────────────┤      ├──────────────────────┤         │
│  │ crowd_generator.py  │      │  density/dbscan.py   │         │
│  │ • Hotspot logic     │  →   │ • Coordinate conv    │         │
│  │ • Random scatter    │      │ • DBSCAN clustering  │         │
│  │ • 200 points/2sec   │      │ • Centroid calc      │         │
│  └─────────┬───────────┘      │ • Risk flagging      │         │
│            │                  └──────────┬───────────┘         │
│            ▼                             │                      │
│  ┌──────────────────────────────────────▼────────────┐         │
│  │        MEMORY STORE (In-Memory Database)         │         │
│  ├───────────────────────────────────────────────────┤         │
│  │ • locations: list of Location objects            │         │
│  │ • last_density_result: DBSCAN output             │         │
│  └───────────────────────────────────────────────────┘         │
│            ▲           ▲           ▲                            │
│            │           │           │                            │
│  ┌─────────┴─┐ ┌──────┴────┐ ┌────┴────────┐                  │
│  │  ROUTES   │ │  ROUTES   │ │   ROUTES   │                   │
│  ├───────────┤ ├───────────┤ ├────────────┤                   │
│  │/crowd/*   │ │/density   │ │/location/* │                   │
│  └───────────┘ └───────────┘ └────────────┘                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────┐        │
│  │  SCHEDULER (Background Threads)                    │        │
│  ├────────────────────────────────────────────────────┤        │
│  │ • tick() every 2s → generate crowd points          │        │
│  │ • density_tick() every 10s → run DBSCAN            │        │
│  └────────────────────────────────────────────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
DensityX-AI/
├── backend/                          # FastAPI server
│   ├── main.py                       # Entry point & app initialization
│   ├── config/
│   │   └── settings.py               # Configuration from environment
│   ├── api/
│   │   ├── crowd_routes.py           # /crowd/* endpoints
│   │   ├── density_routes.py         # /density endpoint
│   │   └── location_routes.py        # /location/* endpoints
│   ├── models/
│   │   └── location.py               # Location data model
│   ├── density/
│   │   └── dbscan.py                 # DBSCAN clustering logic
│   ├── simulation/
│   │   ├── crowd_generator.py        # Generate random crowd points
│   │   ├── density_controller.py     # Manage crowd size
│   │   └── scheduler.py              # Background job scheduler
│   ├── storage/
│   │   └── memory_store.py           # In-memory data storage
│   ├── static/dashboard/
│   │   └── index.html                # Frontend dashboard
│   ├── requirements.txt               # Python dependencies
│   └── .env.example                  # Configuration template
├── Dockerfile                         # Docker container definition
├── docker-compose.yml                # Multi-container orchestration
├── DEPLOYMENT.md                     # Deployment guide
└── README_IMPROVED.md                # Complete documentation
```

---

## 🔄 Data Flow (Request to Response)

### Example: Browser requests crowd locations

```
1. Frontend: GET /crowd/locations
                    │
                    ▼
2. FastAPI routing finds crowd_routes.py
                    │
                    ▼
3. Executes: get_crowd_locations()
                    │
                    ▼
4. Fetches from memory_store.get_locations()
    → Returns list of Location objects
                    │
                    ▼
5. Converts to JSON:
    {
      "count": 200,
      "points": [{"lat": ..., "lon": ...}, ...],
      "clusters": [...]
    }
                    │
                    ▼
6. Returns HTTP 200 with JSON body
                    │
                    ▼
7. Frontend parses response
   Updates Leaflet map with new points
   Redraws heatmap
```

---

## 📚 Key Files Explained

### 1. `main.py` - Application Entry Point

**Purpose**: Wire together all components, start scheduler, define FastAPI routes.

**Key Functions**:

```python
def tick() -> None:
    """Runs every 2 seconds (UPDATE_INTERVAL_SECONDS)"""
    # 1. Get target crowd count from controller
    # 2. Generate that many random location points
    # 3. Store in memory
    # 4. Print log message
```

```python
def density_tick() -> None:
    """Runs every 10 seconds (DBSCAN_INTERVAL_SECONDS)"""
    # 1. Get all current locations from memory
    # 2. Convert to {"lat": ..., "lon": ...} format
    # 3. Call run_dbscan() with these points
    # 4. Store result in memory
    # 5. If high-risk clusters: print alert
```

```python
async def lifespan(app: FastAPI):
    """Runs when app starts"""
    # Start background scheduler threads
    # tick() runs every 2 seconds
    # density_tick() runs every 10 seconds
    # Keeps running while app is active
```

**Key Routes**:
- `GET /health` - Returns server status
- `GET /info` - Returns API documentation
- `GET /density` - Latest DBSCAN results
- Mounts static dashboard at `/static/dashboard/`

---

### 2. `density/dbscan.py` - The Core ML Algorithm

**Purpose**: Implement DBSCAN clustering to find crowd density groups.

**How DBSCAN Works**:

```
Input: Points with latitude/longitude
         ↓
Step 1: Convert Geographic Coordinates to Meters
   └─ Latitude/Longitude are angular (hard to use for distance)
   └─ Convert to approximate X,Y meters for accurate distance
   └─ Formula: 
      • 1° of latitude ≈ 111,320 meters
      • 1° of longitude ≈ 111,320 * cos(latitude) meters

Step 2: Fit DBSCAN Clustering
   └─ Algorithm: Find all points within eps_meters of each other
   └─ eps_meters = 100 (default) = within 100 meters
   └─ min_samples = 5 (default) = need at least 5 points
   └─ Output: Each point gets a cluster label (-1 = noise)

Step 3: Compute Cluster Statistics
   └─ For each cluster: calculate centroid (center point)
   └─ For each cluster: count size (number of people)
   └─ For each cluster: check if risk_flag (size ≥ alert_threshold)

Step 4: Return Results
   └─ cluster_count: number of clusters found
   └─ cluster_sizes: [78, 65, 82] people in each cluster
   └─ risk_flags: [2] = cluster 2 has ≥80 people
   └─ clusters: detailed info for each cluster
```

**Function: `_to_xy_meters()`**

```python
def _to_xy_meters(points):
    """Convert lat/lon to meters for DBSCAN"""
    
    # 1. Calculate average latitude
    mean_lat = np.mean([p["lat"] for p in points])
    
    # 2. Compute scale factors
    meters_per_deg_lat = 111_320
    meters_per_deg_lon = 111_320 * np.cos(np.deg2rad(mean_lat))
    
    # 3. Create array: [[X1, Y1], [X2, Y2], ...]
    xy = np.array([
        [p["lon"] * meters_per_deg_lon,
         p["lat"] * meters_per_deg_lat]
        for p in points
    ])
    
    return xy, meters_per_deg_lon
```

**Function: `run_dbscan()`**

```python
def run_dbscan(points, eps_meters=100, min_samples=5, alert_threshold=80):
    """
    Main clustering function
    
    1. Convert points to meters using _to_xy_meters()
    2. Fit DBSCAN: clustering = DBSCAN(eps=100, min_samples=5).fit(X)
    3. Get cluster labels from clustering.labels_
    4. For each cluster:
       - Calculate centroid (average lat/lon)
       - Count size
       - Set risk_flag = (size >= alert_threshold)
    5. Return dictionary with all results
    """
```

**Example Output**:

```python
{
    "cluster_count": 2,
    "cluster_sizes": [78, 82],
    "risk_flags": [1],  # Cluster 1 is risky
    "clusters": [
        {
            "id": 0,
            "size": 78,
            "risk_flag": False,
            "centroid_lat": 13.0850,
            "centroid_lon": 80.2101
        },
        {
            "id": 1,
            "size": 82,
            "risk_flag": True,        # ← HIGH RISK!
            "centroid_lat": 13.0860,
            "centroid_lon": 80.2110
        }
    ]
}
```

---

### 3. `simulation/crowd_generator.py` - Generate Points

**Purpose**: Create realistic random crowd points with natural clustering.

**Algorithm**:

```python
def generate_locations(center_lat, center_lng, delta_lat, delta_lng, count):
    """
    Generate 'count' random points around a venue
    
    Realistic approach:
    - 70-80% of people concentrate at hotspots (markets, main area)
    - 20-30% scattered lightly across the venue
    
    Steps:
    1. Define 4 hotspot seeds (popular areas)
    2. Randomly pick 2-4 of these hotspots to be active
    3. Distribute 70-80% of points at these hotspots
       (with small jitter so not on exact same spot)
    4. Distribute remaining 20-30% scattered everywhere
    5. Return list of Location objects
    """
```

**Hotspot Logic**:

```python
hotspot_seeds = [
    (13.0840, 80.2105),  # Tower Park area
    (13.0875, 80.2200),  # East side
    (13.0805, 80.2005),  # Kilpauk border
    (13.0785, 80.2135),  # Shenoy Nagar side
]

num_hotspots = random.randint(2, 4)  # Pick 2-4 randomly
hotspots = random.sample(hotspot_seeds, num_hotspots)

hotspot_share = random.uniform(0.7, 0.8)  # 70-80%
hotspot_points = int(count * hotspot_share)
scatter_points = count - hotspot_points
```

**Why This Matters**: Realistic crowds don't scatter randomly. They gather at attractions. This simulation creates natural clusters that DBSCAN will detect.

---

### 4. `storage/memory_store.py` - In-Memory Database

**Purpose**: Store crowd points and analysis results.

```python
class MemoryStore:
    def __init__(self):
        self.locations: List[Location] = []
        self.last_density_result: Dict = {}
    
    def set_locations(self, locations):
        """Store current crowd points"""
        self.locations = locations
    
    def get_locations(self):
        """Retrieve current crowd points"""
        return self.locations
    
    def set_last_density_result(self, result):
        """Store DBSCAN results"""
        self.last_density_result = result
    
    def get_last_density_result(self):
        """Retrieve DBSCAN results"""
        return self.last_density_result
```

This is simple but fast. In production, you'd use PostgreSQL/MongoDB.

---

### 5. `models/location.py` - Data Model

```python
from pydantic import BaseModel

class Location(BaseModel):
    latitude: float      # -90 to 90
    longitude: float     # -180 to 180
```

Simple data class representing one person's location.

---

### 6. `api/crowd_routes.py` - API Endpoints

```python
@router.get("/locations")
def get_crowd_locations():
    """
    1. Get all current points from memory_store
    2. Run DBSCAN on them (pre-compute clusters)
    3. Return JSON with:
       - count: total people
       - points: their coordinates
       - clusters: cluster info
    """

@router.post("/surge")
def trigger_surge(extra: int = 500):
    """
    Trigger emergency: add 'extra' people to simulation
    - Used for testing alert response
    """
```

---

### 7. `api/density_routes.py` - Density Results

```python
@router.get("/density")
def get_density():
    """
    Return stored DBSCAN results:
    - cluster_count: how many clusters
    - cluster_sizes: [size1, size2, ...]
    - risk_flags: [id1, id2, ...] clusters > 80 people
    - clusters: detailed cluster data
    
    This is the data the dashboard uses to show alerts
    """
```

---

### 8. `simulation/scheduler.py` - Background Jobs

```python
def start_scheduler(interval, func):
    """
    Start a background thread that runs 'func' every 'interval' seconds
    
    Used for:
    - tick() every 2 seconds → generate points
    - density_tick() every 10 seconds → analyze clusters
    """
```

---

## 📱 Frontend: `static/dashboard/index.html`

### HTML Structure

```html
<div id="app">
  <div id="map"></div>        <!-- Leaflet map container -->
  <div id="panel">            <!-- Right sidebar with stats -->
    <h1>DensityX AI</h1>
    <div id="pointCount">—</div>
    <div id="clusterCount">—</div>
    <div id="clustersList">—</div>
    <!-- ... more stats ... -->
  </div>
</div>
```

### JavaScript Flow

```javascript
// 1. Initialize Leaflet map
const map = L.map('map').setView([13.0850, 80.2101], 15);

// 2. Add tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// 3. Set up refresh loop
async function refresh() {
    // 4. Fetch data
    const crowd = await fetch('/crowd/locations').then(r => r.json());
    const density = await fetch('/density').then(r => r.json());
    
    // 5. Update map
    updateMap(crowd, density);      // Add heatmap + markers
    
    // 6. Update panel
    updatePanel(density, crowd);    // Show stats + alerts
}

// 7. Call every 5 seconds
setInterval(refresh, 5000);
```

### updateMap()

```javascript
function updateMap(crowd, density) {
    // 1. Create heatmap from crowd points
    const heatData = crowd.points.map(p => [p.lat, p.lon, 0.7]);
    heatLayer = L.heatLayer(heatData, {
        radius: 30, blur: 20,
        gradient: {0: '#0000ff', 0.33: '#00ff00', 1: '#ff0000'}
    }).addTo(map);
    
    // 2. Add circle markers for each cluster
    density.clusters.forEach(cluster => {
        const color = cluster.risk_flag ? '#ff3366' : '#6496ff';
        L.circleMarker([cluster.centroid_lat, cluster.centroid_lon], {
            radius: cluster.risk_flag ? 16 : 12,
            fillColor: color,
            weight: 3
        }).addTo(map).bindPopup(`Cluster ${cluster.id}: ${cluster.size} people`);
    });
}
```

### updatePanel()

```javascript
function updatePanel(density, crowd) {
    // 1. Update stats
    document.getElementById('pointCount').textContent = crowd.points.length;
    document.getElementById('clusterCount').textContent = density.cluster_count;
    
    // 2. List clusters
    density.clusters.forEach(c => {
        const li = document.createElement('div');
        li.className = c.risk_flag ? 'alert' : '';
        li.textContent = `Zone: ${c.size} people`;
        document.getElementById('clustersList').appendChild(li);
    });
    
    // 3. Show alert if high-risk clusters
    const highRisk = density.clusters.filter(c => c.risk_flag);
    if (highRisk.length > 0) {
        document.getElementById('alertBanner').textContent = 
            `⚠️ HIGH DENSITY: ${highRisk[0].size} people detected!`;
        document.getElementById('alertBanner').style.display = 'block';
    }
}
```

---

## ⚙️ Configuration: `config/settings.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Venue
    VENUE_CENTER_LAT: float = 13.0850
    VENUE_CENTER_LNG: float = 80.2101
    DELTA_LAT: float = 0.02
    DELTA_LNG: float = 0.02
    
    # Simulation
    BASE_CROWD_SIZE: int = 200          # Start with 200 people
    UPDATE_INTERVAL_SECONDS: int = 2    # Generate every 2 seconds
    
    # DBSCAN
    DBSCAN_EPS_METERS: float = 100      # Max distance to same cluster
    DBSCAN_MIN_SAMPLES: int = 5         # Min points to form cluster
    CLUSTER_ALERT_THRESHOLD: int = 80   # Alert if ≥80 people
    DBSCAN_INTERVAL_SECONDS: int = 10   # Analyze every 10 seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

---

## 🔁 Complete Request/Response Cycle

### When browser loads dashboard:

```
TIME 0s: Browser loads index.html
  └─ Calls JavaScript: refresh()

TIME 0.1s: fetch('/crowd/locations')
  └─ API: get_crowd_locations()
  └─ memory_store.get_locations() → 200 Location objects
  └─ Run DBSCAN on these points (takes ~50ms)
  └─ Return JSON: {"count": 200, "points": [...], "clusters": [...]}

TIME 0.2s: fetch('/density')
  └─ API: get_density()
  └─ Return last DBSCAN result from memory
  └─ Return JSON: {"cluster_count": 2, "cluster_sizes": [...], ...}

TIME 0.3s: updateMap() + updatePanel()
  └─ Draw heatmap on Leaflet
  └─ Draw cluster markers
  └─ Update stats in sidebar
  └─ Check for alerts

TIME 5s: refresh() called again
  └─ Meanwhile in background:
     - TIME 2s: tick() runs → generates 200 new points
     - TIME 4s: tick() runs → generates 200 new points
     - TIME 10s: density_tick() runs → DBSCAN analysis

TIME 5.1s: fetch('/crowd/locations') again with NEW points
  └─ API computes clusters on NEW points
  └─ Returns updated heatmap data

TIME 5.2s: fetch('/density') 
  └─ If TIME 10s happened, returns NEW analysis
  └─ Otherwise returns previous analysis

TIME 5.3s: Map updates with new heatmap + clusters
```

---

## 🚨 Alert Flow

```
TIME 10s: density_tick() runs
  └─ Gets 200 points from memory
  └─ Runs DBSCAN
  └─ Finds clusters: [45 people, 82 people, 60 people]
  └─ 82 people ≥ alert_threshold(80) → ALERT!
  └─ Sets risk_flag = True on cluster 2
  └─ Stores in memory_store
  └─ Prints: "[alert] High crowd density detected: 1 cluster(s)"

TIME 15s: Browser calls refresh()
  └─ fetch('/density')
  └─ Gets cluster with risk_flag=True
  └─ updatePanel() detects high-risk clusters
  └─ Shows red alert banner:
     "⚠️ HIGH CROWD DENSITY in Zone B (82 people)"
  └─ Circle marker turns RED and PULSES
  └─ Console logs alert details
```

---

## 📊 Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Generate 200 points | 5ms | Random locations within bounding box |
| DBSCAN on 200 points | 50ms | Scikit-learn implementation |
| API request | 100ms | Network + JSON serialization |
| Browser render | 200ms | Leaflet map + heatmap redraw |
| **Total refresh cycle** | **500ms** | 5s refresh rate = plenty of time |

---

## 🔐 Security Considerations

| Issue | Current | Production |
|-------|---------|------------|
| CORS | Allow all | Restrict to domain |
| Auth | None | API keys or OAuth2 |
| HTTPS | No | Required |
| Rate limiting | No | Add per IP |
| Database | Memory | Add persistence |

---

## 📈 Scaling Possibilities

### Current (Single Instance)
- ✅ 200 people
- ✅ Refresh every 5s
- ✅ 2 clusters average

### Scaled (With improvements)
- ✅ 10,000+ people
- ✅ Real database (PostgreSQL)
- ✅ WebSocket for real-time updates
- ✅ Multiple backend instances with load balancer
- ✅ Caching layer (Redis)
- ✅ Monitoring (Prometheus)

---

## Summary Table

| Component | Purpose | Technology |
|-----------|---------|------------|
| main.py | App initialization | FastAPI |
| dbscan.py | ML clustering | Scikit-learn + NumPy |
| crowd_generator.py | Random points | Python random |
| memory_store.py | Data storage | Python dict |
| crowd_routes.py | API endpoints | FastAPI routing |
| density_routes.py | Results endpoint | FastAPI routing |
| scheduler.py | Background jobs | Threading |
| index.html | Dashboard | Leaflet.js + Vanilla JS |
| config/settings.py | Configuration | Pydantic |

---

**This system elegantly combines:**
1. **Simulation layer** (realistic crowd data)
2. **ML layer** (DBSCAN clustering)
3. **API layer** (REST endpoints)
4. **Frontend layer** (interactive dashboard)

All working together in real-time! 🎉
