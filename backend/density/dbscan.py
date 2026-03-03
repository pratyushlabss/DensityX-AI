from typing import List, Dict, Any
import numpy as np
from sklearn.cluster import DBSCAN

def run_dbscan(
    points: List[Dict[str, float]],
    eps_meters: float,
    min_samples: int,
    alert_threshold: int = 80,
) -> Dict[str, Any]:
    """
    Run DBSCAN on a list of points with 'lat' and 'lon' keys, using an
    approximate meter-scale projection. Returns clusters with centroids and alert flag.
    """
    if len(points) < 2:
        return {
            "cluster_count": 0,
            "cluster_sizes": [],
            "cluster_labels": [],
            "risk_flags": [],
            "point_count": len(points),
            "clusters": [],
        }

    X, _ = _to_xy_meters(points)
    clustering = DBSCAN(eps=eps_meters, min_samples=min_samples).fit(X)
    labels = clustering.labels_
    unique, counts = np.unique(labels[labels >= 0], return_counts=True)
    cluster_sizes = counts.tolist()
    cluster_count = len(cluster_sizes)

    clusters_with_centroids: List[Dict[str, Any]] = []
    total_points = max(len(points), 1)
    for uid, cnt in zip(unique, counts):
        mask = labels == uid
        cluster_pts = [points[i] for i, keep in enumerate(mask) if keep]
        centroid_lat = float(np.mean([p["lat"] for p in cluster_pts]))
        centroid_lon = float(np.mean([p["lon"] for p in cluster_pts]))
        size_int = int(cnt)
        # Additive analytics (non-breaking): density, confidence, risk score
        density_score = float(size_int / max(eps_meters, 1.0))
        confidence_score = float(min(1.0, size_int / max(min_samples * 2, 1)))
        risk_score = int(min(100, round((size_int / max(alert_threshold, 1)) * 100)))
        clusters_with_centroids.append(
            {
                "id": int(uid),
                "size": size_int,
                "risk_flag": size_int >= alert_threshold,
                "centroid_lat": centroid_lat,
                "centroid_lon": centroid_lon,
                "density_score": round(density_score, 3),
                "confidence_score": round(confidence_score, 3),
                "risk_score": risk_score,
                "trend": "stable",
                "share_of_total": round(size_int / total_points, 4),
            }
        )

    risk_flags = [c["id"] for c in clusters_with_centroids if c["risk_flag"]]

    return {
        "cluster_count": cluster_count,
        "cluster_sizes": cluster_sizes,
        "cluster_labels": labels.tolist(),
        "risk_flags": risk_flags,
        "point_count": len(points),
        "clusters": clusters_with_centroids
    }