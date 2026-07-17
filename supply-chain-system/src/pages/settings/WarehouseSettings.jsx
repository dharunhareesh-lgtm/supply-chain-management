import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function WarehouseSettings({ email }) {
  const [loading, setLoading] = useState(true);

  // Profile Details State
  const [warehouseName, setWarehouseName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [storageInformation, setStorageInformation] = useState("");
  const [securitySettings, setSecuritySettings] = useState("");
  const [notification, setNotification] = useState("Email");

  // Coordinates State
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");

  // OTP Verification for Coordinates State
  const [origCoords, setOrigCoords] = useState({ lat: "", lng: "" });
  const [locOtp, setLocOtp] = useState("");
  const [locOtpSent, setLocOtpSent] = useState(false);
  const [sendingLocOtp, setSendingLocOtp] = useState(false);

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
  const [locMsg, setLocMsg] = useState("");
  const [locErr, setLocErr] = useState("");
  const [secMsg, setSecMsg] = useState("");
  const [secErr, setSecErr] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch(`http://localhost:8082/api/settings/warehouse?email=${email}`);
      if (res.ok) {
        const d = await res.json();
        setWarehouseName(d.warehouseName || "");
        setContactNumber(d.contactNumber || "");
        setWorkingHours(d.workingHours || "");
        setStorageInformation(d.storageInformation || "");
        setSecuritySettings(d.securitySettings || "");
        setNotification(d.notificationPreferences || "Email");

        setLatitude(d.latitude != null ? d.latitude : "");
        setLongitude(d.longitude != null ? d.longitude : "");
        setDistrict(d.district || "");
        setState(d.state || "");
        setCountry(d.country || "");
        setPostalCode(d.postalCode || "");
        setAddress(d.address || "");

        setOrigCoords({ lat: d.latitude, lng: d.longitude });
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
      const res = await fetch(`http://localhost:8082/api/settings/warehouse/profile?email=${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseName,
          contactNumber,
          workingHours,
          storageInformation,
          securitySettings,
          notificationPreferences: notification
        }),
      });
      if (res.ok) {
        setProfileMsg("Warehouse profile settings saved successfully.");
        loadData();
      } else {
        setProfileErr("Failed to update warehouse profile.");
      }
    } catch (err) {
      setProfileErr("Error updating warehouse profile.");
    }
  };

  // Location Coordinates Save
  const handleLocationSave = async (e) => {
    e.preventDefault();
    setLocMsg("");
    setLocErr("");

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setLocErr("Latitude must be between -90 and 90");
      return;
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      setLocErr("Longitude must be between -180 and 180");
      return;
    }

    const coordsChanged = latNum !== parseFloat(origCoords.lat) || lngNum !== parseFloat(origCoords.lng);

    if (coordsChanged && !locOtpSent) {
      // Trigger OTP sending first
      setSendingLocOtp(true);
      try {
        const res = await fetch(`http://localhost:8082/api/settings/send-otp?email=${email}`, { method: "POST" });
        if (res.ok) {
          setLocOtpSent(true);
          setLocMsg("Coordinates changed! OTP verification sent to your email.");
        } else {
          setLocErr("Failed to send OTP for coordinates modification.");
        }
      } catch (err) {
        setLocErr("Connection error sending coordinate verification.");
      } finally {
        setSendingLocOtp(false);
      }
      return;
    }

    try {
      const res = await fetch(`http://localhost:8082/api/settings/warehouse/location?email=${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: latNum,
          longitude: lngNum,
          district,
          state,
          country,
          postalCode,
          address,
          otp: locOtp
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLocMsg("Warehouse coordinates and location saved successfully!");
        setLocOtp("");
        setLocOtpSent(false);
        loadData();
      } else {
        setLocErr(data.error || "Failed to update location.");
      }
    } catch (err) {
      setLocErr("Error updating warehouse coordinates.");
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
      
      {/* Warehouse Profile Information Card */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--ink)" }}>🏭 Warehouse Profile</h2>
        {profileMsg && <div style={{ color: "#10B981", fontSize: "13px", marginBottom: "10px" }}>{profileMsg}</div>}
        {profileErr && <div style={{ color: "#EF4444", fontSize: "13px", marginBottom: "10px" }}>{profileErr}</div>}

        <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Warehouse Name</label>
            <input type="text" required value={warehouseName} onChange={(e) => setWarehouseName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Registered Email (Read-Only)</label>
            <input type="text" disabled value={email} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.05)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Warehouse Contact Number</label>
            <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Working Hours</label>
            <input type="text" placeholder="e.g. 08:00 AM - 08:00 PM" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Storage Capability details</label>
            <textarea placeholder="e.g. Cold storage, Dry goods section capacity" value={storageInformation} onChange={(e) => setStorageInformation(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", minHeight: "60px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Warehouse Security Policies</label>
            <textarea placeholder="e.g. CCTV monitoring active, access controls status" value={securitySettings} onChange={(e) => setSecuritySettings(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", minHeight: "60px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Notification Preferences</label>
            <select value={notification} onChange={(e) => setNotification(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}>
              <option value="Email">Email Only</option>
              <option value="SMS">SMS Only</option>
              <option value="Both">Both Email & SMS</option>
            </select>
          </div>
          <button className="btn-premium-primary" type="submit" style={{ marginTop: "10px" }}>Save Profile Details</button>
        </form>
      </div>

      {/* Coordinates & Change Password section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Coordinates Location Card (Requires OTP on coordinate modification) */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--ink)" }}>📍 Warehouse Location Settings</h2>
          {locMsg && <div style={{ color: "#10B981", fontSize: "13px", marginBottom: "10px" }}>{locMsg}</div>}
          {locErr && <div style={{ color: "#EF4444", fontSize: "13px", marginBottom: "10px" }}>{locErr}</div>}

          <form onSubmit={handleLocationSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Latitude</label>
                <input type="number" step="0.000001" value={latitude} onChange={(e) => setLatitude(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Longitude</label>
                <input type="number" step="0.000001" value={longitude} onChange={(e) => setLongitude(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
              </div>
            </div>
            
            {locOtpSent && (
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#16C784", marginBottom: "4px", fontWeight: 700 }}>OTP Code (Coordinate verification)</label>
                <input type="text" placeholder="Enter Coordinate change OTP" value={locOtp} onChange={(e) => setLocOtp(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #16C784", background: "var(--bg)" }} />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>District</label>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>State</label>
              <input type="text" value={state} onChange={(e) => setState(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Address</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Country</label>
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Postal Code</label>
                <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
              </div>
            </div>
            <button className="btn-premium-primary" type="submit" style={{ marginTop: "10px" }}>
              {sendingLocOtp ? "Sending Verification..." : locOtpSent ? "Verify & Save Location" : "Update Location"}
            </button>
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
