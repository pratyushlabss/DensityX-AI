import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const VENUE_CENTER = [13.085, 80.2101];
const REFRESH_MS = 5000;
const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://densityx-ai.onrender.com";

const clusterName = (id) => `Cluster ${String.fromCharCode(65 + (id % 26))}`;
const trendColor = (trend) =>
  trend === "up" ? "#ff6b6b" : trend === "down" ? "#22c55e" : "#94a3b8";

const toRiskProbability = (clusters) => {
  if (!clusters.length) return 0;
  const avgRisk =
    clusters.reduce((sum, c) => sum + (c.risk_score || 0), 0) /
    clusters.length;
  return Number(avgRisk.toFixed(1));
};

export default function Home() {
  const [crowd, setCrowd] = useState({ points: [], clusters: [] });
  const [density, setDensity] = useState({ clusters: [], cluster_sizes: [] });
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [history, setHistory] = useState([]);

  const previousClustersRef = useRef([]);

  const clusters = density.clusters || [];
  const highRiskClusters = clusters.filter((c) => c.risk_flag);

  const fetchData = useCallback(async () => {
    try {
      const [crowdRes, densityRes] = await Promise.all([
        fetch(`${API_BASE}/crowd/locations`),
        fetch(`${API_BASE}/density`),
      ]);

      if (!crowdRes.ok || !densityRes.ok) throw new Error("API fetch failed");

      const crowdData = await crowdRes.json();
      const densityData = await densityRes.json();

      const previousClusters = previousClustersRef.current;

      const enrichedClusters = (densityData.clusters || []).map((cluster) => {
        const prevMatch = previousClusters.find((c) => c.id === cluster.id);
        const trend = !prevMatch
          ? "stable"
          : cluster.size > prevMatch.size
          ? "up"
          : cluster.size < prevMatch.size
          ? "down"
          : "stable";
        return { ...cluster, trend };
      });

      previousClustersRef.current = enrichedClusters;

      setCrowd(crowdData);
      setDensity({ ...densityData, clusters: enrichedClusters });

      setHistory((prev) => [
        ...prev.slice(-19),
        {
          timestamp: Date.now(),
          pointCount: crowdData.points?.length || 0,
        },
      ]);

      setError("");
    } catch {
      setError("Backend connection issue. Retrying...");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, fetchData]);

  const movingAveragePrediction = useMemo(() => {
    if (history.length < 3) return 0;
    const last3 = history.slice(-3).map((item) => item.pointCount);
    return Math.round(last3.reduce((a, b) => a + b, 0) / last3.length);
  }, [history]);

  const exportReport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      metrics: {
        totalPoints: crowd.points?.length || 0,
        activeClusters: clusters.length,
        highRiskClusters: highRiskClusters.length,
        riskProbability: toRiskProbability(clusters),
      },
      clusters,
      history,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `densityx-cluster-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1>Main Dashboard</h1>

      {highRiskClusters.length > 0 && (
        <div style={{ background: "#ffdddd", padding: 10 }}>
          ⚠ High Density Alert:{" "}
          {clusterName(highRiskClusters[0].id)} (
          {highRiskClusters[0].size} people)
        </div>
      )}

      <MapContainer
        center={VENUE_CENTER}
        zoom={14}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {(crowd.points || []).map((point, idx) => (
          <Circle
            key={`${point.lat}-${point.lon}-${idx}`}
            center={[point.lat, point.lon]}
            radius={20}
          />
        ))}

        {clusters.map((cluster) => (
          <CircleMarker
            key={cluster.id}
            center={[cluster.centroid_lat, cluster.centroid_lon]}
            radius={cluster.risk_flag ? 14 : 10}
            eventHandlers={{ click: () => setSelectedCluster(cluster) }}
          >
            <Popup>
              {clusterName(cluster.id)} • {cluster.size} people
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      <div style={{ marginTop: 20 }}>
        <p>Total Points: {crowd.points?.length || 0}</p>
        <p>Active Clusters: {clusters.length}</p>
        <p>High Risk Clusters: {highRiskClusters.length}</p>
        <p>Risk Probability: {toRiskProbability(clusters)}%</p>
        <p>Predicted Next Density: {movingAveragePrediction}</p>

        <button onClick={() => setAutoRefresh((v) => !v)}>
          {autoRefresh ? "Pause Refresh" : "Resume Refresh"}
        </button>

        <button onClick={fetchData}>Refresh Now</button>
        <button onClick={exportReport}>Export JSON</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}