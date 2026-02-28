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

const API_URL = "http://127.0.0.1:8003/crowd/locations";
const SURGE_URL = "http://127.0.0.1:8003/crowd/surge";

// visual tuning
// default sizes: small dots and modest clusters for clarity
const POINT_RADIUS = parseInt(import.meta.env.VITE_POINT_RADIUS || '10', 10); // meters; dot size
const CLUSTER_BASE_RADIUS = parseInt(import.meta.env.VITE_CLUSTER_BASE_RADIUS || '12', 10);

function App() {
  const [points, setPoints] = useState([]);
  const [clusters, setClusters] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();

        console.log("Clusters received:", data.clusters);

        setPoints(Array.isArray(data.points) ? data.points : []);
        setClusters(Array.isArray(data.clusters) ? data.clusters : []);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const triggerSurge = async (extra) => {
    try {
      await fetch(`${SURGE_URL}?extra=${extra}`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Surge failed", err);
    }
  };

  const riskyClusters = clusters.filter((c) => c.size >= 80);

  const center =
    points.length > 0
      ? [points[0].lat, points[0].lon]
      : [13.085, 80.2101]; // Anna Nagar fallback

  return (
    <div className="app">
      {/* ALERT BANNER */}
      {riskyClusters.length > 0 && (
        <div className="alert-banner">
          ⚠️ High crowd density detected — proactive alert triggered
        </div>
      )}

      {/* DEMO CONTROLS */}
      <div className="controls">
        <button onClick={() => triggerSurge(0)}>Normal Crowd</button>
        {/* increase crowd by 300 when surge button is pressed */}
        <button onClick={() => triggerSurge(300)}>Trigger Surge</button>
      </div>

      {/* LEGEND */}
      <div className="legend">
        <div>
          <span className="dot blue"></span> Person
        </div>
        <div>
          <span className="dot orange"></span> Safe Cluster
        </div>
        <div>
          <span className="dot red"></span> Risk Cluster
        </div>
      </div>

      {/* MAP */}
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* PEOPLE (BLUE DOTS) */}
        {points.map((p, i) =>
          p.lat && p.lon ? (
            <Circle
              key={`p-${i}`}
              center={[p.lat, p.lon]}
              radius={POINT_RADIUS}
              pathOptions={{ color: "blue", fillOpacity: 0.8 }}
            />
          ) : null
        )}

        {/* CLUSTERS */}
        {clusters.map((c) =>
          c.centroid ? (
            <div key={`c-${c.cluster_id}`}>
              <Circle
                center={[c.centroid.lat, c.centroid.lon]}
                radius={CLUSTER_BASE_RADIUS + c.cluster_size}
                pathOptions={{
                  color: c.cluster_size >= 80 ? "red" : "orange",
                  fillOpacity: 0.25,
                }}
                className={c.cluster_size >= 80 ? "cluster-pulse" : ""}
              />

              {/* CLUSTER SIZE LABEL */}
              <Marker position={[c.centroid.lat, c.centroid.lon]}>
                <Popup>
                  <strong>Cluster {c.cluster_id}</strong>
                  <br />
                  Size: {c.cluster_size}
                </Popup>
              </Marker>
            </div>
          ) : null
        )}
      </MapContainer>

      {/* HOW IT WORKS */}
      <div className="how-it-works">
        <h3>How DensityX Detects Crowd Risk</h3>
        <p>
          DensityX continuously monitors crowd density in real time. When people
          accumulate beyond a safe threshold in any area, the system flags the
          zone early and alerts operators before conditions become dangerous.
        </p>
      </div>
    </div>
  );
}

export default App;
