import React, { useState, useEffect, useCallback } from "react";
import { MapView } from "./MapView";
import { StatsPanel } from "./StatsPanel";
import { AlertPanel } from "./AlertPanel";
import { LoginRegister } from "./LoginRegister";
import { apiClient } from "../services/apiClient";

export function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [data, setData] = useState({ points: [], clusters: [] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [selectedCluster, setSelectedCluster] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const userTicketId = localStorage.getItem('userTicketId');
    if (userTicketId) {
      setIsLoggedIn(true);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const crowdData = await apiClient.getCrowdData();
      setData(crowdData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchData]);

  const handleClusterClick = (cluster) => {
    setSelectedCluster(cluster);
  };

  const handleLoginSuccess = (ticketId) => {
    setIsLoggedIn(true);
    setLoading(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('userTicketId');
    localStorage.removeItem('userName');
    setIsLoggedIn(false);
    setData({ points: [], clusters: [] });
    setError(null);
  };

  // Show login form if not logged in
  if (!isLoggedIn) {
    return <LoginRegister onLoginSuccess={handleLoginSuccess} />;
  }

  if (error && loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          textAlign: "center",
          padding: "20px",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️ Error</h1>
        <p style={{ fontSize: "1rem", marginBottom: "1.5rem" }}>{error}</p>
        <button
          onClick={fetchData}
          style={{
            padding: "10px 20px",
            fontSize: "1rem",
            background: "#00d4ff",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        background: "#0f172a",
        color: "white",
        overflow: "hidden",
      }}
    >
      {/* Left Side - 70% Map */}
      <div style={{ flex: "0 0 70%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div
          style={{
            background: "linear-gradient(90deg, rgba(15,23,42,0.95) 0%, rgba(30,64,175,0.9) 100%)",
            borderBottom: "1px solid rgba(0, 212, 255, 0.3)",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "bold" }}>
            🗺️ DensityX Monitor
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "0.9rem", color: "#a0aec0" }}>
              {loading ? "Loading..." : "📡 Live"}
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: "rgba(239, 68, 68, 0.8)",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.85rem",
                transition: "opacity 0.3s",
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                background: "linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))",
                fontSize: "1.2rem",
                color: "#a0aec0",
              }}
            >
              ⏳ Loading map...
            </div>
          ) : (
            <MapView
              points={data.points || []}
              clusters={data.clusters || []}
              onClusterClick={handleClusterClick}
            />
          )}
        </div>
      </div>

      {/* Right Side - 30% Admin Panel */}
      <div
        style={{
          flex: "0 0 30%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(20,40,80,0.9) 100%)",
          borderLeft: "1px solid rgba(0, 212, 255, 0.2)",
          overflow: "hidden",
        }}
      >
        {/* Panel Header */}
        <div
          style={{
            background: "rgba(0, 212, 255, 0.1)",
            borderBottom: "1px solid rgba(0, 212, 255, 0.2)",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "#00d4ff" }}>
            ⚙️ Control Panel
          </h2>
          <button
            onClick={fetchData}
            disabled={loading}
            style={{
              background: "#00d4ff",
              color: "#000",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.85rem",
              transition: "opacity 0.3s",
              opacity: loading ? 0.5 : 1,
            }}
          >
            🔄
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Alert Panel */}
          <AlertPanel clusters={data.clusters || []} threshold={25} />

          {/* Stats Panel */}
          <StatsPanel points={data.points || []} clusters={data.clusters || []} />

          {/* Refresh Control */}
          <div
            style={{
              background: "rgba(30, 58, 138, 0.6)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              borderRadius: "8px",
              padding: "12px",
              marginTop: "auto",
            }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "0.85rem",
                color: "#a0aec0",
              }}
            >
              <strong>🕐 Refresh Interval</strong>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                style={{
                  background: "rgba(20, 40, 80, 0.9)",
                  color: "#00d4ff",
                  border: "1px solid rgba(0, 212, 255, 0.3)",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                <option value={2}>2 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </label>
          </div>

          {/* Selected Cluster Info */}
          {selectedCluster && (
            <div
              style={{
                background: "rgba(0, 212, 255, 0.1)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ fontWeight: "bold", color: "#00d4ff", marginBottom: "8px" }}>
                📍 Selected Cluster
              </div>
              <div style={{ color: "#cbd5e1" }}>
                <div>ID: {selectedCluster.cluster_id || "N/A"}</div>
                <div>Size: {selectedCluster.cluster_size} users</div>
                <div>
                  Center: {(selectedCluster.centroid?.lat ?? 0)?.toFixed(4)},{" "}
                  {(selectedCluster.centroid?.lon ?? 0)?.toFixed(4)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Toast */}
      {error && !loading && (
        <div
          style={{
            position: "fixed",
            bottom: "16px",
            left: "16px",
            background: "rgba(239, 68, 68, 0.9)",
            border: "1px solid #ef4444",
            color: "white",
            padding: "12px 16px",
            borderRadius: "8px",
            fontSize: "0.9rem",
            maxWidth: "300px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
            zIndex: 9999,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
