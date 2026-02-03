# ai_engine.py
# Stub so main.py imports succeed; replace with real DBSCAN when implementing.

from typing import Any, Dict, List


def run_dbscan(
    points: List[Dict[str, Any]],
    eps: float = 0.0005,
    min_samples: int = 2,
    high_risk_min_size: int = 5,
) -> Dict[str, Any]:
    """Stub: returns shape expected by main.density_tick."""
    return {
        "cluster_count": 0,
        "cluster_sizes": [],
        "risk_flags": [],
    }
