# backend/main.py
# Application entry point: wire API, config, and continuous crowd monitoring.
# Supports both simulated and real ticket-based crowd monitoring.

from pathlib import Path
import sys
import math

# Add backend to path for imports
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from starlette.staticfiles import StaticFiles

from api.crowd_routes import router as crowd_router
from api.density_routes import router as density_router
from api.location_routes import router as location_router
from api.user_routes import router as user_router
from config import settings
from density import run_dbscan
from simulation import crowd_generator, density_controller, scheduler
from storage import memory_store

# Set base crowd size from config (dynamic at runtime)
if settings.USE_SIMULATION:
    density_controller.set_base_count(settings.BASE_CROWD_SIZE)


def tick() -> None:
    """One simulation step: generate and store the current set of crowd points.

    The bounding box is defined by ``VENUE_RADIUS_KM`` (in kilometers),
    which is converted to latitude/longitude degrees using the venue center's
    latitude.  This allows intuitive, real-world sizing of the simulation area.
    Increase the km value to expand geographic coverage without changing the
    point count or cluster density (DBSCAN parameters remain fixed).

    An ``AREA_MARGIN_METERS`` buffer is also added on top for breathing room.
    """
    target = density_controller.get_target_count()

    # convert venue radius from km to degrees
    # approximate degree<->meter conversions at the venue latitude
    meters_per_deg_lat = 111_320
    meters_per_deg_lng = 111_320 * abs(
        math.cos(math.radians(settings.VENUE_CENTER_LAT))
    )
    
    # convert km to meters, then to degrees
    radius_meters = settings.VENUE_RADIUS_KM * 1000
    delta_lat = radius_meters / meters_per_deg_lat
    delta_lng = radius_meters / meters_per_deg_lng
    
    # add margin (in meters, converted to degrees)
    margin_deg_lat = settings.AREA_MARGIN_METERS / meters_per_deg_lat
    margin_deg_lng = settings.AREA_MARGIN_METERS / meters_per_deg_lng
    
    # pass the combined deltas to generation
    # (the generator will add extra jitter based on AREA_MARGIN_METERS)
    points = crowd_generator.generate_locations(
        settings.VENUE_CENTER_LAT,
        settings.VENUE_CENTER_LNG,
        delta_lat,
        delta_lng,
        target,
    )
    memory_store.set_locations(points)
    print(
        f"[simulation] Generated {len(points)} points with radius {settings.VENUE_RADIUS_KM} km "
        f"(target={target})"
    )


def density_tick() -> None:
    """
    Run DBSCAN on current locations.
    
    In simulation mode: clusters simulated crowd points
    In real mode: clusters real verified user GPS locations
    """
    if settings.USE_SIMULATION:
        # Simulated mode: use generated points
        locations = memory_store.get_locations()
        points = [{"lat": loc.latitude, "lon": loc.longitude} for loc in locations]
        source = "simulated"
    else:
        # Real mode: use registered users' GPS locations
        users = memory_store.get_gps_enabled_users()
        points = [{"lat": u.latitude, "lon": u.longitude} for u in users]
        source = "real users"
    
    result = run_dbscan(
        points,
        eps_meters=settings.DBSCAN_EPS_METERS,
        min_samples=settings.DBSCAN_MIN_SAMPLES,
        alert_threshold=settings.CLUSTER_ALERT_THRESHOLD,
    )
    memory_store.set_last_density_result(result)
    
    n = result["cluster_count"]
    sizes = result["cluster_sizes"]
    risk = result["risk_flags"]
    risk_clusters = [c for c in result.get("clusters", []) if c.get("risk_flag")]
    
    if risk_clusters:
        print(f"[alert] High crowd density detected in {source}: {len(risk_clusters)} cluster(s) above threshold")
    print(f"[density] {source} clusters={n} sizes={sizes} risk_flags={risk}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start continuous crowd monitoring and density detection in background threads."""
    if settings.USE_SIMULATION:
        # Simulation mode: generate crowd points every UPDATE_INTERVAL_SECONDS
        scheduler.start_scheduler(settings.UPDATE_INTERVAL_SECONDS, tick)
        print(f"[startup] SIMULATION MODE: generating crowd every {settings.UPDATE_INTERVAL_SECONDS}s")
    else:
        # Real mode: no simulation, wait for real user GPS data
        print("[startup] REAL TICKET MODE: waiting for user registrations and GPS data")
    
    # Density detection runs in both modes
    scheduler.start_scheduler(settings.DBSCAN_INTERVAL_SECONDS, density_tick)
    print(f"[startup] DBSCAN clustering every {settings.DBSCAN_INTERVAL_SECONDS}s")
    yield




app = FastAPI(title="DensityX AI", description="Real-time crowd density monitoring system using DBSCAN clustering", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(crowd_router)
app.include_router(density_router)
app.include_router(location_router)
app.include_router(user_router)


# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": __import__("datetime").datetime.utcnow().isoformat()
    }


# API info endpoint
@app.get("/info")
def api_info():
    """Get API information and configuration."""
    return {
        "name": "DensityX AI",
        "version": "1.0.0",
        "mode": "SIMULATION" if settings.USE_SIMULATION else "REAL_TICKET_BASED",
        "description": "Real-time crowd density monitoring with DBSCAN clustering",
        "endpoints": {
            "simulation": "/crowd/locations" if settings.USE_SIMULATION else None,
            "user_register": "/user/register",
            "user_location": "/user/location",
            "user_me": "/user/me",
            "active_users": "/user/active-users",
            "density": "/density",
            "health": "/health",
            "dashboard": "/static/dashboard/index.html"
        }
    }


# Admin dashboard: map + heatmap + high-density overlay
_dashboard_dir = Path(__file__).resolve().parent / "static" / "dashboard"
if _dashboard_dir.exists():
    app.mount("/dashboard", StaticFiles(directory=str(_dashboard_dir), html=True), name="dashboard")
    app.mount("/static/dashboard", StaticFiles(directory=str(_dashboard_dir), html=True), name="dashboard-static")

# Event onboarding: ticket check-in + GPS consent
_onboarding_dir = Path(__file__).resolve().parent / "static" / "onboarding"
if _onboarding_dir.exists():
    app.mount("/onboarding", StaticFiles(directory=str(_onboarding_dir), html=True), name="onboarding")
    app.mount("/static/onboarding", StaticFiles(directory=str(_onboarding_dir), html=True), name="onboarding-static")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003, reload=False)
@app.get("/")
def health():
    return {"status": "ok"}