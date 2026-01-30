# api/crowd_routes.py
# Endpoints only: fetch crowd locations and trigger surge.

from fastapi import APIRouter

from config import settings
from simulation import density_controller
from storage import memory_store

router = APIRouter(prefix="/crowd", tags=["crowd"])


@router.get("/locations")
def get_crowd_locations():
    """Return current simulated crowd points (lat, lng)."""
    locations = memory_store.get_locations()
    return {
        "count": len(locations),
        "points": [
            {"latitude": loc.latitude, "longitude": loc.longitude}
            for loc in locations
        ],
    }


@router.post("/surge")
def trigger_surge(extra: int = settings.SURGE_EXTRA):
    """Trigger a crowd surge: add `extra` to the target attendee count."""
    density_controller.trigger_surge(extra)
    return {"ok": True, "message": f"Surge triggered: +{extra} attendees"}
