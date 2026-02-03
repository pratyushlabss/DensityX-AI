# simulation/crowd_generator.py
# Pure logic: generate (lat, lng) points inside a bounding box. No API calls.

import random
from typing import List

from config import settings
from models.location import Location


def generate_locations(
    center_lat: float,
    center_lng: float,
    delta_lat: float,
    delta_lng: float,
    count: int,
) -> List[Location]:
    """
    Generate `count` points inside the box. Most are uniform; a configurable
    fraction are clustered around a single hotspot (small offset) so DBSCAN can form clusters.
    """
    locations: List[Location] = []
    frac = settings.HOTSPOT_FRACTION
    h_delta = settings.HOTSPOT_DELTA
    n_hotspot = int(round(count * frac))
    n_uniform = count - n_hotspot

    # Uniform points across the venue
    for _ in range(n_uniform):
        lat = center_lat + random.uniform(-delta_lat, delta_lat)
        lng = center_lng + random.uniform(-delta_lng, delta_lng)
        locations.append(Location(latitude=lat, longitude=lng))

    # Hotspot: one random point inside venue bounds; rest very close to it
    if n_hotspot > 0:
        hotspot_lat = center_lat + random.uniform(-delta_lat, delta_lat)
        hotspot_lng = center_lng + random.uniform(-delta_lng, delta_lng)
        for _ in range(n_hotspot):
            lat = hotspot_lat + random.uniform(-h_delta, h_delta)
            lng = hotspot_lng + random.uniform(-h_delta, h_delta)
            locations.append(Location(latitude=lat, longitude=lng))

    return locations
