# models/location.py
# Simple location model for simulated crowd points and ingestion API.

from dataclasses import dataclass
from pydantic import BaseModel


@dataclass
class Location:
    """A single (latitude, longitude) point inside the venue bounding box."""
    latitude: float
    longitude: float


class LocationIngest(BaseModel):
    """Request body for POST /location: anonymized real-time location."""
    user_id: str
    lat: float
    lon: float
    timestamp: int
