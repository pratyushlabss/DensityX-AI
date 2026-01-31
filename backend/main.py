# backend/main.py
# Application entry point: wire API, config, and continuous crowd simulation.

import sys
from pathlib import Path

# Ensure project root is on path when running from backend/ or elsewhere
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import uvicorn
from fastapi import FastAPI

from api.crowd_routes import router as crowd_router
from api.density_routes import router as density_router
from api.location_routes import router as location_router
from config import settings
from density import run_dbscan
from simulation import crowd_generator, density_controller, scheduler
from storage import memory_store

# Set base crowd size from config (dynamic at runtime)
density_controller.set_base_count(settings.BASE_CROWD_SIZE)


def tick() -> None:
    """One simulation step: generate current target count of points and store them."""
    target = density_controller.get_target_count()
    points = crowd_generator.generate_locations(
        settings.VENUE_CENTER_LAT,
        settings.VENUE_CENTER_LNG,
        settings.DELTA_LAT,
        settings.DELTA_LNG,
        target,
    )
    memory_store.set_locations(points)
    print(f"[simulation] generated {len(points)} points (target={target})")


def density_tick() -> None:
    """Run DBSCAN on last 60s of ingested locations; store result and print to console."""
    points = memory_store.get_ingested_locations_last_60s()
    result = run_dbscan(
        points,
        eps=settings.DBSCAN_EPS,
        min_samples=settings.DBSCAN_MIN_SAMPLES,
        high_risk_min_size=settings.HIGH_RISK_MIN_SIZE,
    )
    memory_store.set_last_density_result(result)
    n = result["cluster_count"]
    sizes = result["cluster_sizes"]
    risk = result["risk_flags"]
    print(f"[density] clusters={n} sizes={sizes} risk_flags={risk}")


app = FastAPI(title="DensityX AI", description="Crowd location simulation")
app.include_router(crowd_router)
app.include_router(density_router)
app.include_router(location_router)


@app.on_event("startup")
def startup():
    """Start continuous crowd generation and density detection in background threads."""
    scheduler.start_scheduler(settings.UPDATE_INTERVAL_SECONDS, tick)
    scheduler.start_scheduler(settings.DBSCAN_INTERVAL_SECONDS, density_tick)
    print(f"[startup] scheduler running every {settings.UPDATE_INTERVAL_SECONDS}s")
    print(f"[startup] DBSCAN running every {settings.DBSCAN_INTERVAL_SECONDS}s")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
