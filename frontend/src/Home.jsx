import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const VENUE_CENTER = [13.085, 80.2101];
const REFRESH_MS = 5000;
const API_BASE = "https://densityx-ai.onrender.com";

const clusterName = (id) => `Cluster ${String.fromCharCode(65 + (id % 26))}`;

export default function Home() {
  const [crowd, setCrowd] = useState({ points: [], clusters: [] });
  const [density, setDensity] = useState({ clusters: [], cluster_sizes: [] });
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const previousClustersRef = useRef([]);

  const clusters = density.clusters || [];
  const highRiskClusters = clusters.filter((c) => c.risk_flag);

  const fetchData = useCallback(async () => {
    try {
      console.log("Fetching crowd data from:", `${API_BASE}/crowd/locations`);
      const crowdRes = await fetch(`${API_BASE}/crowd/locations`);
      if (!crowdRes.ok) throw new Error(`Crowd API: ${crowdRes.status}`);
      const crowdData = await crowdRes.json();

      console.log("Fetching density data from:", `${API_BASE}/density`);
      const densityRes = await fetch(`${API_BASE}/density`);
      if (!densityRes.ok) throw new Error(`Density API: ${densityRes.status}`);
      const densityData = await densityRes.json();

      console.log("Crowd data:", crowdData);
      console.log("Density data:", densityData);

      previousClustersRef.current = densityData.clusters || [];

      setCrowd(crowdData);
      setDensity(densityData);
      setError("");
    } catch (err) {
      console.error("Fetch error:", err);
      setError(`Connection error: ${err.message}`);
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

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f5f5f5" }}>
      {/* Header */}
      <div style={{ padding: "1rem", background: "#333", color: "#fff" }}>
        <h1 style={{ margin: "0.5rem 0" }}>🗺️ Crowd Density Monitor</h1>
        <div style={{ fontSize: "0.9rem", color: "#aaa" }}>
          {error ? `⚠️ ${error}` : "🟢 Connected to API"}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p>Loading map and data...</p>
          </div>
        ) : (
          <>
            {/* Map Container */}
            <div style={{ flex: 1, minHeight: "300px" }}>
              <MapContainer
                center={VENUE_CENTER}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Crowd Points */}
                {(crowd.points || []).map((point, idx) => (
                  <Circle
                    key={`point-${idx}`}
                    center={[point.lat, point.lon]}
                    radius={20}
                    color="#1e40af"
                    fillColor="#3b82f6"
                    fillOpacity={0.5}
                  />
                ))}

                {/* Cluster Centroids */}
                {clusters.map((cluster) => (
                  <CircleMarker
                    key={`cluster-${cluster.id}`}
                    center={[cluster.centroid_lat || cluster.lat, cluster.centroid_lon || cluster.lon]}
                    radius={cluster.risk_flag ? 14 : 10}
                    color={cluster.risk_flag ? "#dc2626" : "#16a34a"}
                    fillColor={cluster.risk_flag ? "#ef4444" : "#22c55e"}
                    fillOpacity={0.8}
                    weight={2}
                  >
                    <Popup>
                      <strong>{clusterName(cluster.id)}</strong>
                      <br />
                      Size: {cluster.cluster_size || cluster.size} people
                      <br />
                      Risk: {cluster.risk_flag ? "HIGH" : "NORMAL"}
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            {/* Stats Panel */}
            <div style={{ padding: "1rem", background: "#fff", borderTop: "1px solid #ddd" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ padding: "0.5rem", background: "#f0f9ff", borderRadius: "4px" }}>
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>Total Points</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{crowd.points?.length || 0}</div>
                </div>
                <div style={{ padding: "0.5rem", background: "#f0fdf4", borderRadius: "4px" }}>
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>Active Clusters</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{clusters.length}</div>
                </div>
                <div style={{ padding: "0.5rem", background: "#fef2f2", borderRadius: "4px" }}>
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>High Risk</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#dc2626" }}>{highRiskClusters.length}</div>
                </div>
                <div style={{ padding: "0.5rem", background: "#fef3c7", borderRadius: "4px" }}>
                  <div style={{ fontSize: "0.8rem", color: "#666" }}>Density</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{Math.round(((crowd.points?.length || 0) / 200) * 100)}%</div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => setAutoRefresh((v) => !v)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: autoRefresh ? "#3b82f6" : "#9ca3af",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  {autoRefresh ? "⏸ Pause" : "▶ Resume"}
                </button>
                <button
                  onClick={fetchData}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  🔄 Refresh Now
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
