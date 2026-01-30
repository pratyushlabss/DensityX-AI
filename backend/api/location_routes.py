# api/location_routes.py
# Endpoints for real-time anonymized location ingestion (last 60s only).

from fastapi import APIRouter

from models.location import LocationIngest
from storage import memory_store

router = APIRouter(tags=["location"])


@router.post("/location", status_code=201)
def post_location(payload: LocationIngest):
    """Ingest one anonymized location; store in-memory, keep only last 60s."""
    memory_store.add_ingested_location(payload.model_dump())
    return {"ok": True, "received": True}


@router.get("/location")
def get_location_last_60s():
    """Return all ingested locations from the last 60 seconds (checkpoint: print last 60s anytime)."""
    locations = memory_store.get_ingested_locations_last_60s()
    print(f"[location] last 60s: {len(locations)} locations")
    return {"count": len(locations), "locations": locations}
