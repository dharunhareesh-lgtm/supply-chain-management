import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function LogisticsSettings({ email }) {
  const [loading, setLoading] = useState(true);

  // Profile details
  const [companyName, setCompanyName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [vehiclePrefs, setVehiclePrefs] = useState("");
  const [driverPrefs, setDriverPrefs] = useState("");
  const [notification, setNotification] = useState("Email");

  // Search preferences
  const [searchRadius, setSearchRadius] = useState(100);
  const [nearbyDistance, setNearbyDistance] = useState(50);

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  // Status Alerts
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [prefMsg, setPrefMsg] = useState("");
  const [prefErr, setPrefErr] = useState("");
  const [secMsg, setSecMsg] = useState("");
  const [secErr, setSecErr] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch(`http://localhost:8082/api/settings/logistics?email=${email}`);
      if (res.ok) {
        const d = await res.json();
        setCompanyName(d.companyName || "");
        setContactInfo(d.contactInfo || "");
        setVehiclePrefs(d.vehiclePreferences || "");
        setDriverPrefs(d.driverPreferences || "");
        setNotification(d.notificationPreferences || "Email");
        setSearchRadius(d.searchRadiusKm || 100);
        setNearbyDistance(d.nearbyWarehouseDistanceKm || 50);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [email]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    try {
      const res = await fetch(`http://localhost:8082/api/settings/logistics/profile?email=${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          contactInfo,
          vehiclePreferences: vehiclePrefs,
          driverPreferences: driverPrefs,
          notificationPreferences: notification
        }),
      });
      if (res.ok) {
        setProfileMsg("Logistics profile settings saved successfully.");
        loadData();
      } else {
        setProfileErr("Failed to update profile settings.");
      }
    } catch (err) {
      setProfileErr("Error updating profile settings.");
    }
  };

  const handlePreferencesSave = async (e) => {
    e.preventDefault();
    setPrefMsg("");
    setPrefErr("");
    try {
      const res = await fetch(`http://localhost:8082/api/settings/preferences?email=${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchRadiusKm: parseFloat(searchRadius),
          nearbyWarehouseDistanceKm: parseFloat(nearbyDistance)
        }),
      });
      if (res.ok) {
        setPrefMsg("Route search preferences saved successfully.");
        loadData();
      } else {
        setPrefErr("Failed to update search preferences.");
      }
    } catch (err) {
      setPrefErr("Error updating search preferences.");
    }
  };

  const handleSendOtp = async () => {
    setSecMsg("");
    setSecErr("");
    setSendingOtp(true);
    try {
      const res = await fetch(`http://localhost:8082/api/settings/send-otp?email=${email}`, { method: "POST" });
      if (res.ok) {
        setOtpSent(true);
        setSecMsg("OTP sent to your email!");
      } else {
        setSecErr("Failed to send OTP.");
      }
    } catch (e) {
      setSecErr("Error sending OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSecMsg("");
    setSecErr("");

    if (newPassword !== confirmPassword) {
      setSecErr("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8082/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword, otp, newPassword, confirmPassword }),
      });
      const resData = await res.json();
      if (res.ok) {
        setSecMsg("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setOtp("");
        setOtpSent(false);
      } else {
        setSecErr(resData.error || "Failed to change password.");
      }
    } catch (err) {
      setSecErr("Error updating password.");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      
      {/* Logistics Profile Card */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--ink)" }}>🚛 Logistics Company Profile</h2>
        {profileMsg && <div style={{ color: "#10B981", fontSize: "13px", marginBottom: "10px" }}>{profileMsg}</div>}
        {profileErr && <div style={{ color: "#EF4444", fontSize: "13px", marginBottom: "10px" }}>{profileErr}</div>}

        <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Company Name</label>
            <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Registered Email (Read-Only)</label>
            <input type="text" disabled value={email} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.05)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Contact Information (Phone)</label>
            <input type="text" required value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Vehicle Preferences</label>
            <input type="text" placeholder="e.g. Medium Duty Trucks, Heavy Duty Container, Multi-axle" value={vehiclePrefs} onChange={(e) => setVehiclePrefs(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Driver Allocation Preferences</label>
            <input type="text" placeholder="e.g. Assigned routes primary driver, minimum 3+ years experience" value={driverPrefs} onChange={(e) => setDriverPrefs(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Notification Channel</label>
            <select value={notification} onChange={(e) => setNotification(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}>
              <option value="Email">Email Only</option>
              <option value="SMS">SMS Only</option>
              <option value="Both">Both Email & SMS</option>
            </select>
          </div>
          <button className="btn-premium-primary" type="submit" style={{ marginTop: "10px" }}>Save Company Profile</button>
        </form>
      </div>

      {/* Preferences & Password Updates */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Route Preferences Card */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--ink)" }}>🔍 Route Search & Dispatch radius</h2>
          {prefMsg && <div style={{ color: "#10B981", fontSize: "13px", marginBottom: "10px" }}>{prefMsg}</div>}
          {prefErr && <div style={{ color: "#EF4444", fontSize: "13px", marginBottom: "10px" }}>{prefErr}</div>}

          <form onSubmit={handlePreferencesSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Default Search Radius (KM)</label>
              <input type="number" min="10" max="1000" value={searchRadius} onChange={(e) => setSearchRadius(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Nearby Warehouse Distance limit (KM)</label>
              <input type="number" min="5" max="500" value={nearbyDistance} onChange={(e) => setNearbyDistance(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <button className="btn-premium-primary" type="submit" style={{ marginTop: "10px" }}>Save Preferences</button>
          </form>
        </div>

        {/* Change Password Card */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--ink)" }}>🔒 Change Password</h2>
          {secMsg && <div style={{ color: "#10B981", fontSize: "13px", marginBottom: "10px" }}>{secMsg}</div>}
          {secErr && <div style={{ color: "#EF4444", fontSize: "13px", marginBottom: "10px" }}>{secErr}</div>}

          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Current Password</label>
              <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>

            {otpSent ? (
              <>
                <div style={{ padding: "10px", background: "rgba(22,199,132,0.06)", border: "1px solid rgba(22,199,132,0.2)", borderRadius: "8px", fontSize: "12px", color: "#16C784" }}>
                  OTP verification email sent. Enter it below to unlock password updates.
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>OTP Code</label>
                  <input type="text" required placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>New Password</label>
                  <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Confirm New Password</label>
                  <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
                </div>
                <button className="btn-premium-primary" type="submit" style={{ marginTop: "10px" }}>Update Password</button>
              </>
            ) : (
              <button type="button" disabled={sendingOtp || !currentPassword} onClick={handleSendOtp} className="btn-premium-primary" style={{ width: "100%", marginTop: "10px" }}>
                {sendingOtp ? "Sending OTP..." : "Verify & Send OTP"}
              </button>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}
