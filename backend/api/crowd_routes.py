# api/crowd_routes.py
# 🎤 Event-aware endpoints for crowd locations and surge management.

from fastapi import APIRouter

from config import settings
from simulation import density_controller
from density import run_dbscan
from density.cluster_reshaper import reshape_clusters_for_event
from storage import memory_store

router = APIRouter(prefix="/crowd", tags=["crowd"])


@router.get("/locations")
def get_crowd_locations():
    """🎤 EVENT-AWARE CLUSTER RESPONSE
    
    Return current crowd points and event-aware clusters.
    
    Behavior:
    - Verified-only: Only CSV-verified users with GPS
    - Event-aware: Dynamic thresholds based on attendee count
    - Risk levels: Safe → Caution → Alert → Critical
    - Visual properties: Dynamic sizing, color coding
    
    In simulation mode: Returns simulated crowd with event context.
    In real mode: Returns ONLY verified user locations.
    
    Returns:
        {
            "count": number of people,
            "points": [{"lat": ..., "lon": ...}],
            "clusters": [
                {
                    "id": cluster_id,
                    "size": people_count,
                    "centroid": {"lat": ..., "lon": ...},
                    "risk_level": "safe|caution|alert|critical",
                    "color": "#RRGGBB",
                    "visual_radius_meters": 25.0,
                    "stability": 0.0-1.0,
                    "threshold": adaptive_threshold
                }
            ],
            "adaptive_threshold": dynamic_alert_threshold,
            "verified_attendees": total_verified_count,
            "venue_radius_km": settings.VENUE_RADIUS_KM,
            "success": true
        }
    """
    if settings.USE_SIMULATION:
        # Simulation mode: return simulated crowd points
        locations = memory_store.get_locations()
        points = [{"lat": loc.latitude, "lon": loc.longitude} for loc in locations]
        total_attendees = len(points)
    else:
        # 🔐 REAL MODE: Return ONLY verified users with GPS enabled
        users = memory_store.get_verified_gps_users()  # ✅ Verified-only filter
        points = [{"lat": u.latitude, "lon": u.longitude} for u in users]
        total_attendees = len(users)

    # Compute raw DBSCAN clusters
    db_result = run_dbscan(
        points,
        eps_meters=settings.DBSCAN_EPS_METERS,
        min_samples=settings.DBSCAN_MIN_SAMPLES,
        alert_threshold=settings.CLUSTER_ALERT_THRESHOLD,
    )
    
    # 🎤 Reshape with event awareness
    reshaped = reshape_clusters_for_event(
        db_result,
        total_verified_attendees=total_attendees,
        event_capacity=None,  # Can be extended from event config
        spatial_spread_km=settings.VENUE_RADIUS_KM,
    )
    
    # Build response with event context
    clusters = [
        {
            "id": c["id"],
            "cluster_id": c["id"],  # Backward compatibility
            "size": c["size"],
            "cluster_size": c["size"],  # Backward compatibility
            "centroid": {
                "lat": c["centroid_lat"],
                "lon": c["centroid_lon"]
            },
            "risk_level": c.get("risk_level", "safe"),
            "risk_flag": c.get("risk_flag", False),  # Backward compatibility
            "color": c.get("color", "#00AA00"),
            "visual_radius_meters": c.get("visual_radius_meters", 25.0),
            "stability": c.get("stability", 0.0),
            "threshold": c.get("threshold", 80),
        }
        for c in reshaped.get("clusters", [])
    ]

    return {
        "count": len(points),
        "points": points,
        "clusters": clusters,
        "adaptive_threshold": reshaped.get("adaptive_threshold", 80),
        "alert_clusters": len(reshaped.get("alert_clusters", [])),
        "verified_attendees": total_attendees,
        "venue_radius_km": settings.VENUE_RADIUS_KM,
        "success": True,
    }


@router.post("/surge")
def trigger_surge(extra: int = settings.SURGE_EXTRA):
    """Trigger a crowd surge or reset it.

    If `extra` is positive we add that many attendees to the simulated
    base count.  When `extra` is zero we clear any previously applied surge
    so the crowd returns to normal size.
    """
    if extra <= 0:
        # Treat zero or negative as "clear surge" command
        density_controller.clear_surge()
        return {"ok": True, "message": "Surge cleared, crowd back to normal"}

    density_controller.trigger_surge(extra)
    return {"ok": True, "message": f"Surge triggered: +{extra} attendees"}
