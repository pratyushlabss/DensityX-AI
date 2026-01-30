# storage/memory_store.py
# In-memory storage for current crowd locations and ingested locations (last 60s).

import sys
import time
from pathlib import Path
from typing import Any, Dict, List

if __name__ == "__main__":
    backend = Path(__file__).resolve().parent.parent
    if str(backend) not in sys.path:
        sys.path.insert(0, str(backend))

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
    """Append one ingested location and prune entries older than 60s."""
    _ingested.append(payload)
    _prune_ingested()


def get_ingested_locations_last_60s() -> List[Dict[str, Any]]:
    """Return a copy of ingested locations from the last 60 seconds (prune first)."""
    _prune_ingested()
    return list(_ingested)


if __name__ == "__main__":
    print("memory_store is a module, not an entry point.")
    print("Run the app from the backend directory:  cd backend && python main.py")
