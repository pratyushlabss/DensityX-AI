import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { useOfflineHandler } from "./offlineHandler";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8003";
const API_URL = `${API_BASE}/crowd/locations`;
const SURGE_URL = `${API_BASE}/crowd/surge`;

// visual tuning
const POINT_RADIUS = parseInt(import.meta.env.VITE_POINT_RADIUS || "10", 10);
const CLUSTER_BASE_RADIUS = parseInt(
  import.meta.env.VITE_CLUSTER_BASE_RADIUS || "50",
  10
);

function App() {
  const [points, setPoints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [mapCenter, setMapCenter] = useState([13.085, 80.2101]);
  const [adaptiveThreshold, setAdaptiveThreshold] = useState(80);
  const [verifiedAttendees, setVerifiedAttendees] = useState(0);
  const { isOnline, offlineHandler } = useOfflineHandler();
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Try to fetch from API first
      try {
        const res = await fetch(API_URL, { mode: "cors" });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();

        if (!data.points || !Array.isArray(data.points)) {
          throw new Error("Invalid points format from API");
        }

        setPoints(Array.isArray(data.points) ? data.points : []);
        setClusters(Array.isArray(data.clusters) ? data.clusters : []);
        setAdaptiveThreshold(data.adaptive_threshold || 80);
        setVerifiedAttendees(data.verified_attendees || 0);
        
        // Cache for offline use
        if (data.clusters) {
          offlineHandler.saveClusters(data.clusters);
        }
      } catch (apiError) {
        console.error("❌ API Error:", apiError.message);
        
        // Fallback to localStorage
        const localClusters = offlineHandler.getCachedClusters();
        if (localClusters && localClusters.data && localClusters.data.length > 0) {
          setClusters(localClusters.data);
          console.log("💾 Using cached data from localStorage");
          setError("⚠️  Using cached data (API unavailable)");
        } else {
          setError(`❌ Cannot reach API at ${API_URL} - ${apiError.message}`);
        }
      }
      setLastUpdate(new Date().toLocaleTimeString());

      // Center map on first point if available
      if (data.points.length > 0 && data.points[0].lat && data.points[0].lon) {
        setMapCenter([data.points[0].lat, data.points[0].lon]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch crowd data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000); // Refresh every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const triggerSurge = async (extra) => {
    try {
      const res = await fetch(`${SURGE_URL}?extra=${extra}`, {
        method: "POST",
        mode: "cors",
      });

      if (!res.ok) {
        throw new Error(`Surge API error: ${res.status}`);
      }

      // Immediately refetch data to see new state
      await fetchData();
    } catch (err) {
      console.error("Surge failed", err);
      setError("Failed to trigger surge");
    }
  };

  const riskyClusters = clusters.filter((c) => {
    const riskLevel = c.risk_level || 'safe';
    return riskLevel === 'alert' || riskLevel === 'critical';
  });
  const totalPeople = points.length;
  const avgClusterSize =
    clusters.length > 0
      ? Math.round(
          clusters.reduce((sum, c) => sum + (c.size || c.cluster_size), 0) /
            clusters.length
        )
      : 0;
  
  // Get dynamic risk color based on risk_level
  const getRiskColor = (cluster) => {
    if (cluster.color) return cluster.color;
    const riskLevel = cluster.risk_level || 'safe';
    const colorMap = {
      'safe': '#00AA00',      // Green
      'caution': '#FFAA00',   // Orange
      'alert': '#FF5500',     // Red-orange
      'critical': '#FF0000',  // Red
    };
    return colorMap[riskLevel] || '#00AA00';
  };
  
  // Get risk label text
  const getRiskLabel = (riskLevel) => {
    const labels = {
      'safe': 'Safe',
      'caution': 'Caution',
      'alert': 'Alert',
      'critical': 'Critical',
    };
    return labels[riskLevel] || 'Safe';
  };

  return (
    <div className="app">
      {/* CONNECTION STATUS */}
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 9999,
        backgroundColor: isOnline ? '#00AA00' : '#FF5500',
        color: 'white'
      }}>
        {isOnline ? '🟢 Online' : '🔴 Offline'} | API: {API_BASE}
      </div>

      {/* HEADER */}
      <div className="header">
        <h1>🎤 DensityX AI - Event-Aware Crowd Detection</h1>
        <div className="header-stats">
          <div className="stat">
            <span className="label">Verified Attendees:</span>
            <span className="value">{verifiedAttendees}</span>
          </div>
          <div className="stat">
            <span className="label">Clusters:</span>
            <span className="value">{clusters.length}</span>
          </div>
          <div className="stat">
            <span className="label">Risk Zones:</span>
            <span className="value alert-text">{riskyClusters.length}</span>
          </div>
          <div className="stat">
            <span className="label">Avg Size:</span>
            <span className="value">{avgClusterSize}</span>
          </div>
          <div className="stat">
            <span className="label">Dynamic Threshold:</span>
            <span className="value">{adaptiveThreshold}</span>
          </div>
          <div className="stat">
            <span className="label">Updated:</span>
            <span className="value">{lastUpdate || "---"}</span>
          </div>
        </div>
      </div>

      {/* ALERT BANNER */}
      {riskyClusters.length > 0 && (
        <div className="alert-banner">
          ⚠️ {riskyClusters.length} HIGH RISK ZONE(S) DETECTED - Immediate
          attention required!
        </div>
      )}

      {/* ERROR MESSAGE */}
      {error && <div className="error-banner">{error}</div>}

      {/* DEMO CONTROLS */}
      <div className="controls">
        <button onClick={() => triggerSurge(0)} className="btn-normal">
          🔄 Reset
        </button>
        <button onClick={() => triggerSurge(300)} className="btn-surge">
          ⚡ Trigger Surge (+300)
        </button>
        <button onClick={fetchData} className="btn-refresh">
          🔃 Refresh
        </button>
      </div>

      {/* LEGEND */}
      <div className="legend">
        <h4>🎯 Event-Aware Risk Levels</h4>
        <div className="legend-item">
          <span className="legend-dot" style={{backgroundColor: '#00AA00'}}></span>
          <span>Safe - Below 50% of threshold</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{backgroundColor: '#FFAA00'}}></span>
          <span>Caution - 50-99% of threshold</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{backgroundColor: '#FF5500'}}></span>
          <span>Alert - 100-150% of threshold</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{backgroundColor: '#FF0000'}}></span>
          <span>Critical - 150%+ of threshold</span>
        </div>
        <div style={{marginTop: '8px', fontSize: '12px', color: '#666'}}>
          Dynamic threshold: {adaptiveThreshold} people
        </div>
      </div>

      {/* LOADING INDICATOR */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading crowd data...</p>
        </div>
      )}

      {/* MAP */}
      {!loading && (
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* PEOPLE (BLUE DOTS) */}
          {points.map((p, i) =>
            p.lat && p.lon ? (
              <Circle
                key={`p-${i}`}
                center={[p.lat, p.lon]}
                radius={POINT_RADIUS}
                pathOptions={{
                  color: "blue",
                  fillOpacity: 0.8,
                  weight: 2,
                }}
              />
            ) : null
          )}

          {/* CLUSTERS WITH EVENT-AWARE VISUALIZATION */}
          {clusters.map((c, idx) =>
            c.centroid ? (
              <div key={`c-${c.cluster_id || c.id || idx}`}>
                {/* Dynamic cluster circle with smooth sizing */}
                <Circle
                  center={[c.centroid.lat, c.centroid.lon]}
                  radius={
                    c.visual_radius_meters || 
                    CLUSTER_BASE_RADIUS + (c.cluster_size || c.size || 50)
                  }
                  pathOptions={{
                    color: getRiskColor(c),
                    fillOpacity: 0.25 + (c.stability || 0) * 0.15,
                    weight: 2,
                    dashArray: (c.risk_level === 'critical') ? '5,5' : 'none',
                  }}
                />

                {/* CLUSTER INFO POPUP */}
                <Marker position={[c.centroid.lat, c.centroid.lon]}>
                  <Popup>
                    <div className="popup-content">
                      <strong>
                        Cluster {c.cluster_id || c.id || idx}
                      </strong>
                      <br />
                      <span style={{color: getRiskColor(c), fontWeight: 'bold'}}>
                        {getRiskLabel(c.risk_level || 'safe')}
                      </span>
                      <br />
                      Size: <span style={{fontWeight: 'bold'}}>{c.cluster_size || c.size}</span>
                      <br />
                      Threshold: {c.threshold || adaptiveThreshold}
                      <br />
                      Stability: {((c.stability || 0) * 100).toFixed(0)}%
                      <br />
                      Lat: {c.centroid.lat.toFixed(4)}
                      <br />
                      Lon: {c.centroid.lon.toFixed(4)}
                    </div>
                  </Popup>
                </Marker>
              </div>
            ) : null
          )}
        </MapContainer>
      )}

      {/* HOW IT WORKS */}
      <div className="how-it-works">
        <h3>� Event-Aware Crowd Safety Intelligence</h3>
        <p>
          DensityX AI uses advanced event-aware clustering to protect attendees. 
          The system adapts surge thresholds based on event size, venue layout, and real-time density distribution. 
          Only verified ticket holders are tracked, ensuring accurate, trustworthy crowd intelligence.
        </p>
        <div className="stats-grid">
          <div className="stat-box">
            <h4>✅ Verified-Only Tracking</h4>
            <p>Only CSV-verified tickets create clusters</p>
          </div>
          <div className="stat-box">
            <h4>📊 Dynamic Thresholds</h4>
            <p>Surge alerts adapt to event size and layout</p>
          </div>
          <div className="stat-box">
            <h4>🔄 Live Reshaping</h4>
            <p>Clusters expand, shrink, merge, and split in real-time</p>
          </div>
          <div className="stat-box">
            <h4>🎯 Risk Levels</h4>
            <p>Safe, Caution, Alert, Critical status visualization</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
