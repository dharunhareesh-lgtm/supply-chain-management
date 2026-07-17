import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function SupplierSettings({ email }) {
  const [loading, setLoading] = useState(true);

  // Supplier Settings State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [notification, setNotification] = useState("Email");

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
      const res = await fetch(`http://localhost:8082/api/settings/supplier?email=${email}`);
      if (res.ok) {
        const d = await res.json();
        setName(d.name || "");
        setPhone(d.phone || "");
        setGstNumber(d.gstNumber || "");
        setBankName(d.bankName || "");
        setBankAccountNumber(d.bankAccountNumber || "");
        setBankIfscCode(d.bankIfscCode || "");
        setNotification(d.notificationPreferences || "Email");
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
      const res = await fetch(`http://localhost:8082/api/settings/supplier/profile?email=${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          gstNumber,
          bankName,
          bankAccountNumber,
          bankIfscCode,
          notificationPreferences: notification
        }),
      });
      if (res.ok) {
        setProfileMsg("Supplier settings saved successfully.");
        loadData();
      } else {
        setProfileErr("Failed to update settings.");
      }
    } catch (err) {
      setProfileErr("Error updating settings.");
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
      
      {/* Profile & Business Card */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--ink)" }}>👤 Supplier Profile & Business Info</h2>
        {profileMsg && <div style={{ color: "#10B981", fontSize: "13px", marginBottom: "10px" }}>{profileMsg}</div>}
        {profileErr && <div style={{ color: "#EF4444", fontSize: "13px", marginBottom: "10px" }}>{profileErr}</div>}

        <form onSubmit={handleProfileSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Supplier Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Email (Read-Only)</label>
            <input type="text" disabled value={email} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.05)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Phone Number</label>
            <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>GST Number</label>
            <input type="text" placeholder="e.g. 33AAAAA1111A1Z1" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>

          <h3 style={{ fontSize: "14px", fontWeight: "700", marginTop: "14px", color: "var(--ink)" }}>🏦 Bank Details (For Settlements)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>Bank Name</label>
              <input type="text" placeholder="e.g. SBI Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--ink-soft)", marginBottom: "4px" }}>IFSC Code</label>
              <input type="text" placeholder="e.g. SBIN0001234" value={bankIfscCode} onChange={(e) => setBankIfscCode(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Account Number</label>
            <input type="text" placeholder="e.g. 100200300400" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "12px", color: "var(--ink-soft)", marginBottom: "4px" }}>Notification Preferences</label>
            <select value={notification} onChange={(e) => setNotification(e.target.value)} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}>
              <option value="Email">Email Only</option>
              <option value="SMS">SMS Only</option>
              <option value="Both">Both Email & SMS</option>
            </select>
          </div>

          <button className="btn-premium-primary" type="submit" style={{ marginTop: "15px" }}>Save Supplier Details</button>
        </form>
      </div>

      {/* Security Check & Change Password */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        
        {/* Security / Password Card */}
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
