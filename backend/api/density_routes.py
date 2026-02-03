# api/density_routes.py
# Endpoints for DBSCAN density detection results.

from fastapi import APIRouter

from storage import memory_store

router = APIRouter(tags=["density"])


@router.get("/density")
def get_density():
    """Return last DBSCAN result: cluster count, sizes, risk flags, clusters with centroids."""
    result = memory_store.get_last_density_result()
    if not result:
        return {
            "cluster_count": 0,
            "cluster_sizes": [],
            "risk_flags": [],
            "clusters": [],
            "message": "No density run yet; ingest locations and wait for next DBSCAN interval.",
        }
    return {
        "cluster_count": result["cluster_count"],
        "cluster_sizes": result["cluster_sizes"],
        "risk_flags": result["risk_flags"],
        "high_risk_sizes": result.get("high_risk_sizes", []),
        "point_count": result.get("point_count", 0),
        "clusters": result.get("clusters", []),
    }
