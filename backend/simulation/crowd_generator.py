# simulation/crowd_generator.py
# Pure logic: generate (lat, lng) points inside a bounding box. No API calls.

import random
from typing import List

from models.location import Location


def generate_locations(
    center_lat: float,
    center_lng: float,
    delta_lat: float,
    delta_lng: float,
    count: int,
) -> List[Location]:
    """
    Generate `count` points uniformly inside the box:
    lat in [center_lat - delta_lat, center_lat + delta_lat],
    lng in [center_lng - delta_lng, center_lng + delta_lng].
    """
    locations: List[Location] = []
    for _ in range(count):
        lat = center_lat + random.uniform(-delta_lat, delta_lat)
        lng = center_lng + random.uniform(-delta_lng, delta_lng)
        locations.append(Location(latitude=lat, longitude=lng))
    return locations
