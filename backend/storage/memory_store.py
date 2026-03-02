# storage/memory_store.py
# In-memory storage for current crowd locations and user data.

import time
from typing import Any, Dict, List, Optional

from models.location import Location
from models.user_location import UserLocation

# Simulated crowd points (no DB, no persistence)
_locations: List[Location] = []

# Real verified users with GPS locations
# Key: ticket_id, Value: UserLocation
_active_users: Dict[str, UserLocation] = {}

# DBSCAN clustering results
_last_density_result: Dict[str, Any] = {}

# Ingested real-time locations: keep only last 60 seconds
_ingested: List[Dict[str, Any]] = []
RETENTION_SECONDS = 60


def _prune_ingested() -> None:
    """Remove ingested entries older than RETENTION_SECONDS."""
    cutoff = int(time.time()) - RETENTION_SECONDS
    global _ingested
    _ingested = [e for e in _ingested if e["timestamp"] >= cutoff]


def get_locations() -> List[Location]:
    """Return a copy of the current crowd locations (simulated)."""
    return list(_locations)


def set_locations(locations: List[Location]) -> None:
    """Replace the stored crowd with the given list (simulated)."""
    _locations.clear()
    _locations.extend(locations)


# ============= REAL USER MANAGEMENT =============

def register_user(user: UserLocation) -> bool:
    """
    Register or update a user session.
    One ticket_id = one active user (overwrites previous session).
    
    Args:
        user: UserLocation with verified ticket_id
        
    Returns:
        True if registered successfully
    """
    global _active_users
    _active_users[user.ticket_id] = user
    return True


def update_user_location(ticket_id: str, latitude: float, longitude: float, gps_enabled: bool = True) -> Optional[UserLocation]:
    """
    Update user GPS location.
    
    Args:
        ticket_id: User's verified ticket ID
        latitude: Updated latitude
        longitude: Updated longitude
        gps_enabled: GPS tracking status
        
    Returns:
        Updated UserLocation or None if user not found
    """
    global _active_users
    if ticket_id not in _active_users:
        return None
    
    user = _active_users[ticket_id]
    user.latitude = latitude
    user.longitude = longitude
    user.gps_enabled = gps_enabled
    user.last_updated = __import__('datetime').datetime.utcnow()
    
    _active_users[ticket_id] = user
    return user


def get_user(ticket_id: str) -> Optional[UserLocation]:
    """Get user by ticket ID."""
    return _active_users.get(ticket_id)


def get_active_users() -> List[UserLocation]:
    """Get all active users."""
    return list(_active_users.values())


def get_active_users_count() -> int:
    """Get count of active registered users."""
    return len(_active_users)


def get_gps_enabled_users() -> List[UserLocation]:
    """Get users with GPS enabled."""
    return [u for u in _active_users.values() if u.gps_enabled]


def get_verified_gps_users() -> List[UserLocation]:
    """
    🔐 VERIFIED-ONLY CLUSTER DATA SOURCE
    
    Get only verified users with GPS enabled.
    This is the ONLY source of truth for clustering.
    
    Returns:
        List of UserLocation where verified==true AND gps_enabled==true
    """
    return [
        u for u in _active_users.values() 
        if u.verified and u.gps_enabled and u.latitude != 0.0 and u.longitude != 0.0
    ]


def clear_active_users() -> None:
    """Clear all active users (for testing or reset)."""
    global _active_users
    _active_users.clear()


# ============= DENSITY RESULTS =============

def set_last_density_result(result: Dict[str, Any]) -> None:
    """Store the latest density detection result."""
    global _last_density_result
    _last_density_result = dict(result)


def get_last_density_result() -> Dict[str, Any]:
    """Return the last DBSCAN analysis result."""
    return dict(_last_density_result) if _last_density_result else {}
    """Return the last density result (empty dict if never run)."""
    return dict(_last_density_result)


if __name__ == "__main__":
    print("memory_store is a module, not an entry point.")
    print("Run: cd backend && python3 -m uvicorn main:app")
