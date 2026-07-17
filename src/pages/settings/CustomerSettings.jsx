import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import InteractiveMapPicker from "../../components/map/InteractiveMapPicker";

export default function CustomerSettings({ email }) {
  const [loading, setLoading] = useState(true);

  // Profile Details
  const [phone, setPhone] = useState("");
  const [notification, setNotification] = useState("Email");

  // Primary Delivery Address
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  // Saved Addresses List (custom customer multi-address management)
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [newAddressText, setNewAddressText] = useState("");

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
  const [secMsg, setSecMsg] = useState("");
  const [secErr, setSecErr] = useState("");

  const loadData = async () => {
    try {
      const res = await fetch(`http://localhost:8082/api/settings/customer?email=${email}`);
      if (res.ok) {
        const d = await res.json();
        setPhone(d.phone || "");
        setNotification(d.notificationPreferences || "Email");
        setAddress(d.address || "");
        setDistrict(d.district || "");
        setState(d.state || "");
        setCountry(d.country || "");
        setPostalCode(d.postalCode || "");
        setLatitude(d.latitude != null ? d.latitude.toString() : "");
        setLongitude(d.longitude != null ? d.longitude.toString() : "");

        // Saved addresses is stored as JSON list in DB
        try {
          if (d.savedAddresses) {
            setSavedAddresses(JSON.parse(d.savedAddresses));
          } else {
            setSavedAddresses([]);
          }
        } catch (e) {
          setSavedAddresses(d.savedAddresses ? d.savedAddresses.split("\n").filter(Boolean) : []);
        }
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
      const res = await fetch(`http://localhost:8082/api/settings/customer/profile?email=${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          notificationPreferences: notification,
          address,
          district,
          state,
          country,
          postalCode,
          latitude,
          longitude,
          savedAddresses: JSON.stringify(savedAddresses)
        }),
      });
      if (res.ok) {
        setProfileMsg("Customer profile & addresses saved successfully.");
        loadData();
      } else {
        setProfileErr("Failed to update profile settings.");
      }
    } catch (err) {
      setProfileErr("Error updating profile settings.");
    }
  };

  // Add a new address to the saved list
  const handleAddAddress = () => {
    if (!newAddressText.trim()) return;
    const updatedList = [...savedAddresses, newAddressText.trim()];
    setSavedAddresses(updatedList);
    setNewAddressText("");
  };

  // Remove an address from the saved list
  const handleRemoveAddress = (idx) => {
    const updatedList = savedAddresses.filter((_, i) => i !== idx);
    setSavedAddresses(updatedList);
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
      
      {/* Customer Profile & Address Card */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--ink)" }}>👤 Customer Profile & Address Info</h2>
        {profileMsg && <div style={{ color: "#10B981", fontSize: "13px", marginBottom: "10px" }}>{profileMsg}</div>}
        {profileErr && <div style={{ color: "#EF4444", fontSize: "13px", marginBottom: "10px" }}>{profileErr}</div>}

        <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Customer Email (Read-Only)</label>
            <input type="text" disabled value={email} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.05)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Mobile Number</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Notification Preferences</label>
            <select value={notification} onChange={(e) => setNotification(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}>
              <option value="Email">Email Only</option>
              <option value="SMS">SMS Only</option>
              <option value="Both">Both Email & SMS</option>
            </select>
          </div>

          <h3 style={{ fontSize: "14px", fontWeight: "700", marginTop: "14px", color: "var(--ink)" }}>🏠 Primary Delivery Address</h3>
          
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "6px" }}>🗺️ Interactive Map Picker (Click or drag to select location)</label>
            <InteractiveMapPicker
              initialPosition={latitude && longitude ? [parseFloat(latitude), parseFloat(longitude)] : null}
              onLocationSelect={(loc) => {
                setLatitude(loc.latitude.toString());
                setLongitude(loc.longitude.toString());
                if (loc.address) setAddress(loc.address);
                if (loc.district) setDistrict(loc.district);
                if (loc.state) setState(loc.state);
                if (loc.country) setCountry(loc.country);
                if (loc.postalCode) setPostalCode(loc.postalCode);
              }}
              height="260px"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Latitude (Read-Only)</label>
              <input type="text" readOnly value={latitude} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.05)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Longitude (Read-Only)</label>
              <input type="text" readOnly value={longitude} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.05)" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Street Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>District</label>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>State</label>
              <input type="text" value={state} onChange={(e) => setState(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
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

          <button className="btn-premium-primary" type="submit" style={{ marginTop: "10px" }}>Save Profile & Addresses</button>
        </form>
      </div>

      {/* Saved Addresses list & Change password card */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Saved Addresses card */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--ink)" }}>📭 Saved Delivery Locations</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "150px", overflowY: "auto", marginBottom: "14px", border: "1px solid var(--border)", padding: "10px", borderRadius: "8px", background: "var(--bg)" }}>
            {savedAddresses.length === 0 ? (
              <span style={{ fontSize: "12px", color: "var(--ink-soft)", fontStyle: "italic" }}>No other saved locations. Add one below.</span>
            ) : (
              savedAddresses.map((addr, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", background: "var(--surface)", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>{addr}</span>
                  <button type="button" onClick={() => handleRemoveAddress(idx)} style={{ color: "#EF4444", border: "none", background: "none", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>Delete</button>
                </div>
              ))
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <input type="text" placeholder="Add custom saved address" value={newAddressText} onChange={(e) => setNewAddressText(e.target.value)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", fontSize: "12.5px" }} />
            <button type="button" className="btn-premium-primary" onClick={handleAddAddress} style={{ padding: "10px 15px", fontSize: "12.5px" }}>Add</button>
          </div>
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
