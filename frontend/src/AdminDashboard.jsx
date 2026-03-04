import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import StatCard from "./components/dashboard/StatCard";
import MapContainer from "./components/dashboard/MapContainer";
import ActivityFeed from "./components/dashboard/ActivityFeed";
import LiveMap from "./components/dashboard/LiveMap";

const API_BASE = "https://densityx-ai.onrender.com";

const glassCardStyle = {
  background: "rgba(20, 30, 60, 0.85)",
  boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.18)",
  padding: "2.5rem 2rem 2rem 2rem",
  minWidth: 340,
  maxWidth: 400,
  margin: "auto",
  color: "#fff",
  position: "relative",
};

// Remove gradientBg, use Tailwind classes for layout

const neonText = {
  color: "#00d4ff",
  textShadow: "0 0 8px #00d4ff, 0 0 16px #00d4ff80",
  fontWeight: 700,
};

const statBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 32,
  padding: "0 0 12px 0",
  borderBottom: "1px solid #23395d",
  gap: 16,
};

const buttonStyle = {
  background: "linear-gradient(90deg, #00d4ff 0%, #2563eb 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "12px 24px",
  fontWeight: 600,
  fontSize: 16,
  marginTop: 16,
  boxShadow: "0 2px 12px #00d4ff40",
  cursor: "pointer",
  transition: "background 0.2s, box-shadow 0.2s",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: 8,
  border: "1px solid #23395d",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: 16,
  marginBottom: 18,
  outline: "none",
};

const errorStyle = {
  color: "#ff4d6d",
  background: "rgba(255,77,109,0.08)",
  borderRadius: 8,
  padding: "8px 12px",
  marginBottom: 12,
  textAlign: "center",
};

const successStyle = {
  color: "#00ffb3",
  background: "rgba(0,255,179,0.08)",
  borderRadius: 8,
  padding: "8px 12px",
  marginBottom: 12,
  textAlign: "center",
};

function AdminDashboard() {
  const [step, setStep] = useState(1);
  const [ticketId, setTicketId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [activeUsers, setActiveUsers] = useState(0);
  const [gpsActive, setGpsActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [registeredTicket, setRegisteredTicket] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/user/active-count`)
      .then((res) => res.json())
      .then((data) => {
        setActiveUsers(data.active_users || 0);
      })
      .catch(() => setActiveUsers(0));
  }, [step]);

  // --- Step Handlers ---
  const handleTicketContinue = (e) => {
    e.preventDefault();
    setError("");
    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, ticket_id: ticketId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }
      setSuccess("✔ Registered successfully!");
      setRegisteredTicket(data.ticket_id);
      setGpsActive((prev) => prev + 1);
      setStep(3);
      setLoading(false);
      // Refresh active users
      fetch(`${API_BASE}/user/active-count`)
        .then((res) => res.json())
        .then((data) => setActiveUsers(data.active_users || 0));
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setError("");
    try {
      await fetch(`${API_BASE}/user/logout`, { method: "POST" });
      setStep(1);
      setName("");
      setPhone("");
      setTicketId("");
      setGpsActive((prev) => (prev > 0 ? prev - 1 : 0));
      setRegisteredTicket("");
      setSuccess("");
      setLoading(false);
      // Refresh active users
      fetch(`${API_BASE}/user/active-count`)
        .then((res) => res.json())
        .then((data) => setActiveUsers(data.active_users || 0));
    } catch {
      setError("Logout failed. Try again.");
      setLoading(false);
frontend/src/App.css
    }
  };

  // Layout: Sidebar, TopNav, main dashboard content, map section placeholder
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Prepare stats and activities for DashboardLayout
  const stats = [
    {
      title: "Total Users Checked In",
      value: activeUsers,
      // icon: Users, // Uncomment and import Lucide icons if needed
    },
    {
      title: "Active GPS Nodes",
      value: gpsActive,
      // icon: MapPin,
    },
    {
      title: "Crowd Density Index",
      value: "High", // Replace with real value if available
      color: "text-yellow-400",
      // icon: Activity,
    },
    {
      title: "Risk Clusters",
      value: 3, // Replace with real value if available
      color: "text-density-red",
      // icon: ShieldAlert,
    },
  ];

  const activities = [
    { title: "User DX-9321 Checked In", time: "2 minutes ago • Cluster A" },
    { title: "User DX-9322 Checked In", time: "5 minutes ago • Cluster B" },
    { title: "User DX-9323 Checked In", time: "10 minutes ago • Cluster C" },
    // TODO: Replace with real activity data from API
  ];

  // Fetch real-time GPS-enabled user locations for map
  const [mapMarkers, setMapMarkers] = useState([]);
  useEffect(() => {
    async function fetchGpsMarkers() {
      try {
        const res = await fetch(`${API_BASE}/user/active-users`);
        if (!res.ok) return;
        const data = await res.json();
        // Expecting data.users: array of user objects with latitude, longitude, name/ticket_id
        const markers = (data.users || [])
          .filter(u => u.gps_enabled)
          .map(u => ({ lat: u.latitude, lng: u.longitude, label: u.name || u.ticket_id }));
        setMapMarkers(markers);
      } catch {
        // fallback: keep previous markers
      }
    }
    fetchGpsMarkers();
    const interval = setInterval(fetchGpsMarkers, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen min-w-full bg-gradient-to-br from-[#0f2027] to-[#2c5364] flex">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
      <div className={`flex flex-col flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <TopNav title="Admin Dashboard" />
        <main className="pt-20 px-8 pb-8 flex flex-col gap-8">
          <DashboardLayout
            stats={stats}
            activities={activities}
            mapChildren={<LiveMap markers={mapMarkers} />}
          />
          {/* Stepper remains below dashboard for registration flow */}
          <div className="max-w-md mx-auto w-full mt-8">
            {step === 1 && (
              <form onSubmit={handleTicketContinue} className="flex flex-col gap-4 bg-[#182a4d] rounded-2xl p-8 shadow-lg">
                <div className="font-semibold text-lg mb-2 text-[#e2e8f0]">Enter Ticket ID</div>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-[#23395d] text-[#e2e8f0] text-base mb-2 outline-none border border-[#23395d]"
                  type="text"
                  placeholder="DX-XXXXXX"
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  required
                />
                {error && <div className="text-[#ff4d6d] bg-[#ff4d6d14] rounded-lg px-3 py-2 text-center mb-2">{error}</div>}
                <button type="submit" className="bg-gradient-to-r from-[#00d4ff] to-[#2563eb] text-white rounded-lg px-6 py-3 font-bold shadow-md hover:from-[#009ec3] transition-colors" disabled={loading || !ticketId}>
                  {loading ? "..." : "Continue"}
                </button>
              </form>
            )}
            {step === 2 && (
              <form onSubmit={handleRegister} className="flex flex-col gap-4 bg-[#182a4d] rounded-2xl p-8 shadow-lg">
                <div className="font-semibold text-lg mb-2 text-[#e2e8f0]">Enter Details</div>
                <input
                  className="w-full px-4 py-3 rounded-lg bg-[#23395d] text-[#e2e8f0] text-base mb-2 outline-none border border-[#23395d]"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <input
                  className="w-full px-4 py-3 rounded-lg bg-[#23395d] text-[#e2e8f0] text-base mb-2 outline-none border border-[#23395d]"
                  type="tel"
                  placeholder="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                {error && <div className="text-[#ff4d6d] bg-[#ff4d6d14] rounded-lg px-3 py-2 text-center mb-2">{error}</div>}
                {success && <div className="text-[#00ffb3] bg-[#00ffb314] rounded-lg px-3 py-2 text-center mb-2">{success}</div>}
                <button type="submit" className="bg-gradient-to-r from-[#00d4ff] to-[#2563eb] text-white rounded-lg px-6 py-3 font-bold shadow-md hover:from-[#009ec3] transition-colors" disabled={loading || !name || !phone}>
                  {loading ? "Registering..." : "Register & Enable GPS"}
                </button>
              </form>
            )}
            {step === 3 && (
              <div className="flex flex-col gap-4 bg-[#182a4d] rounded-2xl p-8 shadow-lg text-center">
                <div className="font-semibold text-xl mb-2 text-[#00ffb3]">✔ Registration Complete</div>
                <div className="text-base mb-1 text-[#e2e8f0]">Ticket ID:</div>
                <div className="text-lg font-bold tracking-wide text-[#00d4ff]">{registeredTicket}</div>
                <button className="bg-gradient-to-r from-[#00d4ff] to-[#2563eb] text-white rounded-lg px-6 py-3 font-bold shadow-md hover:from-[#009ec3] transition-colors" onClick={handleLogout} disabled={loading}>
                  {loading ? "Logging out..." : "Logout"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
