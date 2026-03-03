import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import AdminDashboard from "./AdminDashboard";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin" element={<Home />} />
        <Route path="/onboarding" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;