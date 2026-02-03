# density/dbscan.py
# Run DBSCAN on (lat, lon) points; return cluster count, sizes, high-risk flags.

from typing import Any, Dict, List

import numpy as np
from sklearn.cluster import DBSCAN


def run_dbscan(
    points: List[Dict[str, Any]],
    eps: float,
    min_samples: int,
    high_risk_min_size: int,
) -> Dict[str, Any]:
    """
    Run DBSCAN on a list of points with 'lat' and 'lon' keys.
    Returns cluster_count, cluster_sizes, cluster_labels, risk_flags.
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

    X = np.array([[p["lat"], p["lon"]] for p in points], dtype=np.float64)
    clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(X)
    labels = clustering.labels_
    unique, counts = np.unique(labels[labels >= 0], return_counts=True)
    cluster_sizes = counts.tolist()
    cluster_count = len(cluster_sizes)
    high_risk = [int(s) for s in cluster_sizes if s >= high_risk_min_size]
    risk_flags = [i for i, s in enumerate(cluster_sizes) if s >= high_risk_min_size]

    # Centroids for dashboard: mean lat/lon per cluster, and risk flag
    clusters_with_centroids: List[Dict[str, Any]] = []
    for i, (uid, cnt) in enumerate(zip(unique, counts)):
        mask = labels == uid
        centroid_lat = float(np.mean(X[mask, 0]))
        centroid_lon = float(np.mean(X[mask, 1]))
        risk = int(cnt) >= high_risk_min_size
        clusters_with_centroids.append({
            "id": int(uid),
            "size": int(cnt),
            "risk": risk,
            "centroid_lat": centroid_lat,
            "centroid_lon": centroid_lon,
        })

    return {
        "cluster_count": cluster_count,
        "cluster_sizes": cluster_sizes,
        "cluster_labels": labels.tolist(),
        "risk_flags": risk_flags,
        "high_risk_sizes": high_risk,
        "point_count": len(points),
        "clusters": clusters_with_centroids,
    }
