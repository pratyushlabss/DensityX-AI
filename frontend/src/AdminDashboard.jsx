import React, { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://densityx-ai.onrender.com";

function AdminDashboard() {
  const [clusters, setClusters] = useState([]);
  const [points, setPoints] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeClusters: 0,
    highRiskClusters: 0,
    density: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshInterval, setRefreshInterval] = useState(5);

  const fetchDashboardData = async () => {
    try {
      setError("");
      const [crowdRes, densityRes] = await Promise.all([
        fetch(`${API_BASE}/crowd/locations`),
        fetch(`${API_BASE}/density`),
      ]);

      if (!crowdRes.ok || !densityRes.ok) {
        throw new Error(`API Error: ${crowdRes.status} / ${densityRes.status}`);
      }

      const crowdData = await crowdRes.json();
      const densityData = await densityRes.json();

      setPoints(crowdData.points || []);
      setClusters(densityData.clusters || []);

      const highRiskCount = (densityData.clusters || []).filter((c) => c.risk_flag).length;
      const totalDensity = Math.round(
        ((crowdData.count || 0) / 200) * 100
      );

      setStats({
        totalUsers: crowdData.count || 0,
        activeClusters: densityData.clusters?.length || 0,
        highRiskClusters: highRiskCount,
        density: totalDensity,
      });

      setLoading(false);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(`Failed to fetch data: ${err.message}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
      padding: "2rem",
      color: "#fff",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "3rem", textAlign: "center" }}>
        <div style={{
          fontSize: "2.5rem",
          fontWeight: "bold",
          color: "#00d4ff",
          textShadow: "0 0 20px rgba(0, 212, 255, 0.5)",
          marginBottom: "0.5rem",
        }}>
          📊 Admin Dashboard
        </div>
        <div style={{ fontSize: "1rem", color: "#a0aec0" }}>
          Real-time Crowd Density Monitoring
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          background: "rgba(255, 77, 109, 0.2)",
          border: "1px solid rgba(255, 77, 109, 0.5)",
          color: "#ff4d6d",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {/* Controls */}
      <div style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
        alignItems: "center",
      }}>
        <button
          style={{
            background: "linear-gradient(90deg, #00d4ff 0%, #2563eb 100%)",
            color: "#fff",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            transition: "all 0.3s ease",
          }}
          onClick={fetchDashboardData}
          disabled={loading}
        >
          {loading ? "Loading..." : "🔄 Refresh Now"}
        </button>
        <label style={{ fontSize: "0.9rem", color: "#a0aec0" }}>
          Refresh interval:
          <select
            style={{
              background: "rgba(30, 58, 138, 0.8)",
              color: "#fff",
              border: "1px solid rgba(0, 212, 255, 0.3)",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              fontSize: "0.9rem",
              marginLeft: "0.5rem",
            }}
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
          >
            <option value={3}>3 seconds</option>
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={30}>30 seconds</option>
          </select>
        </label>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: "center",
          padding: "3rem",
          fontSize: "1.25rem",
          color: "#00d4ff",
        }}>
          Loading dashboard data...
        </div>
      )}

      {/* Stats Grid */}
      {!loading && (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}>
            <div style={{
              background: "rgba(30, 58, 138, 0.6)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              borderRadius: "12px",
              padding: "1.5rem",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{
                color: "#a0aec0",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "0.5rem",
              }}>Total Users Registered</div>
              <div style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "#00ffb3",
                textShadow: "0 0 10px rgba(0, 255, 179, 0.5)",
              }}>{stats.totalUsers}</div>
            </div>
            <div style={{
              background: "rgba(30, 58, 138, 0.6)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              borderRadius: "12px",
              padding: "1.5rem",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{
                color: "#a0aec0",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "0.5rem",
              }}>Active Clusters</div>
              <div style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "#00ffb3",
                textShadow: "0 0 10px rgba(0, 255, 179, 0.5)",
              }}>{stats.activeClusters}</div>
            </div>
            <div style={{
              background: "rgba(30, 58, 138, 0.6)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              borderRadius: "12px",
              padding: "1.5rem",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{
                color: "#a0aec0",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "0.5rem",
              }}>High Risk Clusters</div>
              <div style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: stats.highRiskClusters > 0 ? "#ff4d6d" : "#00ffb3",
              }}>{stats.highRiskClusters}</div>
            </div>
            <div style={{
              background: "rgba(30, 58, 138, 0.6)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              borderRadius: "12px",
              padding: "1.5rem",
              backdropFilter: "blur(10px)",
            }}>
              <div style={{
                color: "#a0aec0",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "0.5rem",
              }}>Crowd Density</div>
              <div style={{
                fontSize: "2.5rem",
                fontWeight: "bold",
                color: "#00ffb3",
                textShadow: "0 0 10px rgba(0, 255, 179, 0.5)",
              }}>{stats.density}%</div>
            </div>
          </div>

          {/* Clusters Section */}
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#00d4ff" }}>
            🎯 Cluster Details
          </h2>

          {clusters.length === 0 ? (
            <div style={{
              background: "rgba(30, 58, 138, 0.6)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              borderRadius: "12px",
              padding: "2rem",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}>
              No clusters detected. Waiting for crowd data...
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem",
              marginBottom: "3rem",
            }}>
              {clusters.map((cluster, idx) => (
                <div
                  key={idx}
                  style={{
                    background: cluster.risk_flag ? "rgba(255, 77, 109, 0.1)" : "rgba(30, 58, 138, 0.7)",
                    border: cluster.risk_flag ? "1px solid rgba(255, 77, 109, 0.5)" : "1px solid rgba(0, 212, 255, 0.3)",
                    borderRadius: "12px",
                    padding: "1.5rem",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: "#00d4ff",
                    marginBottom: "0.75rem",
                  }}>Cluster {idx + 1}</div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}>
                    <span>Cluster ID:</span>
                    <strong>{cluster.cluster_id}</strong>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}>
                    <span>Size:</span>
                    <strong>{cluster.cluster_size} people</strong>
                  </div>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.5rem",
                    fontSize: "0.9rem",
                  }}>
                    <span>Center:</span>
                    <strong>
                      {cluster.centroid?.lat?.toFixed(4) || "N/A"},{" "}
                      {cluster.centroid?.lon?.toFixed(4) || "N/A"}
                    </strong>
                  </div>
                  <div style={{
                    display: "inline-block",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    background: cluster.risk_flag ? "rgba(255, 77, 109, 0.2)" : "rgba(0, 255, 179, 0.2)",
                    color: cluster.risk_flag ? "#ff4d6d" : "#00ffb3",
                    marginTop: "0.5rem",
                  }}>
                    {cluster.risk_flag ? "🔴 HIGH RISK" : "🟢 NORMAL"}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Points Summary */}
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#00d4ff" }}>
            📍 Points Data
          </h2>
          <div style={{
            background: "rgba(30, 58, 138, 0.6)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            borderRadius: "12px",
            padding: "1.5rem",
            backdropFilter: "blur(10px)",
          }}>
            <div style={{ marginBottom: "1rem" }}>
              <strong>Total Points:</strong> {points.length}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#a0aec0" }}>
              {points.length > 0 ? (
                <>
                  <p>Sample points (first 5):</p>
                  {points.slice(0, 5).map((p, idx) => (
                    <div key={idx}>
                      • Point {idx + 1}: ({p.lat?.toFixed(4)}, {p.lon?.toFixed(4)})
                    </div>
                  ))}
                </>
              ) : (
                "No points available"
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
