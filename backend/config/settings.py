# config/settings.py
# Configuration for crowd monitoring system (simulation or real ticket-based).

# ============= MODE SELECTION =============
# Set to True for simulated crowd, False for real ticket-verified users
USE_SIMULATION = False

# ============= TICKET VERIFICATION =============
# Path to CSV file containing valid ticket IDs
TICKETS_CSV_PATH = "tickets.csv"

# ============= VENUE CONFIGURATION =============
# Venue center (latitude, longitude) — anchored in Anna Nagar, Chennai
VENUE_CENTER_LAT = 13.0850
VENUE_CENTER_LNG = 80.2101

# Bounding box around Anna Nagar (13.075–13.095 lat, 80.195–80.225 lng)
# Use half-extents so generation stays in this window.
DELTA_LAT = 0.010   # ~13.075 to 13.095
DELTA_LNG = 0.015   # ~80.195 to 80.225

# ============= SIMULATION MODE (when USE_SIMULATION=True) =============
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

# ============= DENSITY DETECTION (DBSCAN) =============
# How often to run DBSCAN on current locations (seconds) - ALWAYS RUNS regardless of mode
DBSCAN_INTERVAL_SECONDS = 10
# Max distance between points in meters for clustering (venue-scale)
DBSCAN_EPS_METERS = 40
# Min points to form a cluster (proactive; crowd-scale)
DBSCAN_MIN_SAMPLES = 12
# Cluster size >= this is flagged as high-risk
HIGH_RISK_MIN_SIZE = 5
# Proactive alert: cluster size above this triggers UI alert and red zone (before extreme crowding)
CLUSTER_ALERT_THRESHOLD = 80

