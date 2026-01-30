# storage/memory_store.py
# In-memory storage for current crowd locations only.

from typing import List

from models.location import Location

# Single in-memory list of current crowd points (no DB, no persistence)
_locations: List[Location] = []


def get_locations() -> List[Location]:
    """Return a copy of the current crowd locations."""
    return list(_locations)


def set_locations(locations: List[Location]) -> None:
    """Replace the stored crowd with the given list."""
    _locations.clear()
    _locations.extend(locations)
