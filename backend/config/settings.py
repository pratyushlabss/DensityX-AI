# config/settings.py
# Venue and simulation settings for crowd generation (in-memory only).

# Venue center (latitude, longitude) — fake but realistic for a bounded area
VENUE_CENTER_LAT = 37.7749
VENUE_CENTER_LNG = -122.4194

# Bounding box: half-extents from center (degrees). Points generated in
# [center - delta, center + delta] for both lat and lng.
DELTA_LAT = 0.001
DELTA_LNG = 0.001

# Base number of simulated attendees (dynamic; can change at runtime)
BASE_CROWD_SIZE = 200

# How often to regenerate crowd positions (seconds)
UPDATE_INTERVAL_SECONDS = 2

# Extra attendees to add when a surge is triggered
SURGE_EXTRA = 150

# --- Hotspot (cluster) simulation ---
# Fraction of points generated tightly around a single hotspot (~30%)
HOTSPOT_FRACTION = 0.3
# Max random offset from hotspot (degrees); much smaller than venue delta so DBSCAN can cluster
HOTSPOT_DELTA = 0.00003

# --- Density detection (DBSCAN) ---
# How often to run DBSCAN on recent locations (seconds)
DBSCAN_INTERVAL_SECONDS = 10
# Max distance (degrees) for points in same cluster; ~0.0005 ≈ 55m at equator
DBSCAN_EPS = 0.0004 #max distance between two points to be considered neighbors
# Min points to form a cluster
DBSCAN_MIN_SAMPLES = 2
# Cluster size >= this is flagged as high-risk
HIGH_RISK_MIN_SIZE = 5
