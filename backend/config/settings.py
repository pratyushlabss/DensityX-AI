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
