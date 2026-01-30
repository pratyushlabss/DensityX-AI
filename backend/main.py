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
from config import settings
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


app = FastAPI(title="DensityX AI", description="Crowd location simulation")
app.include_router(crowd_router)


@app.on_event("startup")
def startup():
    """Start continuous crowd generation in a background thread."""
    scheduler.start_scheduler(settings.UPDATE_INTERVAL_SECONDS, tick)
    print(f"[startup] scheduler running every {settings.UPDATE_INTERVAL_SECONDS}s")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
