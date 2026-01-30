# models/location.py
# Simple location model for simulated crowd points (no API, no maps).

from dataclasses import dataclass


@dataclass
class Location:
    """A single (latitude, longitude) point inside the venue bounding box."""
    latitude: float
    longitude: float
