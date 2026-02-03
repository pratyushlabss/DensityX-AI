# storage/memory_store.py
# In-memory storage for current crowd locations and ingested locations (last 60s).

import time
from typing import Any, Dict, List

from models.location import Location

# Simulated crowd points (no DB, no persistence)
_locations: List[Location] = []

# Ingested real-time locations: keep only last 60 seconds
_ingested: List[Dict[str, Any]] = []
RETENTION_SECONDS = 60


def _prune_ingested() -> None:
    """Remove ingested entries older than RETENTION_SECONDS."""
    cutoff = int(time.time()) - RETENTION_SECONDS
    global _ingested
    _ingested = [e for e in _ingested if e["timestamp"] >= cutoff]


def get_locations() -> List[Location]:
    """Return a copy of the current crowd locations."""
    return list(_locations)


def set_locations(locations: List[Location]) -> None:
    """Replace the stored crowd with the given list."""
    _locations.clear()
    _locations.extend(locations)


def add_ingested_location(payload: Dict[str, Any]) -> None:
    """Append one ingested location and prune entries older than 60s. Normalize to lat/lng."""
    entry = dict(payload)
    if "lon" in entry and "lng" not in entry:
        entry["lng"] = entry.pop("lon")
    _ingested.append(entry)
    _prune_ingested()


def ingest_locations(payloads: List[Dict[str, Any]]) -> None:
    """Append a batch of ingested locations (same list as generated, including hotspots), then prune once."""
    for payload in payloads:
        entry = dict(payload)
        if "lon" in entry and "lng" not in entry:
            entry["lng"] = entry.pop("lon")
        _ingested.append(entry)
    _prune_ingested()


def get_ingested_locations_last_60s() -> List[Dict[str, Any]]:
    """Return a copy of ingested locations from the last 60 seconds (prune first)."""
    _prune_ingested()
    return list(_ingested)


# Last DBSCAN result (cluster count, sizes, risk flags) for GET /density
_last_density_result: Dict[str, Any] = {}


def set_last_density_result(result: Dict[str, Any]) -> None:
    """Store the latest density detection result."""
    global _last_density_result
    _last_density_result = dict(result)


def get_last_density_result() -> Dict[str, Any]:
    """Return the last density result (empty dict if never run)."""
    return dict(_last_density_result)


if __name__ == "__main__":
    print("memory_store is a module, not an entry point.")
    print("Run: cd backend && python3 -m uvicorn main:app")
