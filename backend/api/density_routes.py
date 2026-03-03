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


@router.get("/clusters")
def get_clusters():
    """Compatibility alias that returns cluster list and count."""
    result = memory_store.get_last_density_result()
    clusters = result.get("clusters", []) if result else []
    return {
        "count": len(clusters),
        "clusters": clusters,
    }


@router.get("/metrics")
def get_metrics():
    """Operational metrics endpoint for dashboard summary cards."""
    result = memory_store.get_last_density_result()
    if not result:
        return {
            "total_points": 0,
            "active_clusters": 0,
            "high_risk_clusters": 0,
            "cluster_sizes": [],
        }

    clusters = result.get("clusters", [])
    risk_clusters = [c for c in clusters if c.get("risk_flag")]
    return {
        "total_points": result.get("point_count", 0),
        "active_clusters": result.get("cluster_count", 0),
        "high_risk_clusters": len(risk_clusters),
        "cluster_sizes": result.get("cluster_sizes", []),
    }