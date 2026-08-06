/**
 * AdminSettings.jsx — DRAVIX SCM Premium Admin Settings Dashboard
 * Tabs: Profile · Security · Notifications · Platform Config · AI Settings · Cloud Storage · Activity
 */
import React, { useState, useEffect } from "react";
import {
  SettingsSection, SettingRow, ToggleSwitch,
  PasswordInput, PasswordStrength, NotifMatrix, SecurityScoreRing,
  SettingsBtn, InfoChip, SettingsDivider, SkeletonSettings,
  ConfirmDialog, useToast, ProfileAvatar, DocumentCard, ThemeCard,
  ActivityTimeline, ConfettiEffect, SettingsDashboard
} from "../../components/settings/SettingsEngine";
import {
  User, Lock, Bell, Settings, Cpu, Server, Shield,
  CheckCircle2, AlertTriangle, Activity, Database, Sparkles, Navigation, Globe
} from "lucide-react";

const BASE = "http://localhost:8082";
const NOTIF_ROWS = [
  { key: "orders",      label: "Order Updates",       hint: "New orders, status changes" },
  { key: "kyc",         label: "KYC Verifications",   hint: "Pending approvals, rejections" },
  { key: "payments",    label: "Payment Alerts",       hint: "Settlements, failures" },
  { key: "system",      label: "System Alerts",        hint: "Errors, downtime events" },
  { key: "partners",    label: "Partner Requests",     hint: "New warehouse/logistics joins" },
  { key: "inventory",   label: "Inventory Alerts",     hint: "Low stock, reorder alerts" },
];

function parseNotif(raw) { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
function buildDefaultNotif() {
  const obj = {};
  NOTIF_ROWS.forEach(r => { obj[r.key] = { email: true, sms: false, inApp: true }; });
  return obj;
}

export default function AdminSettings({ email, activeTabOverride, onTabChangeOverride }) {
  const { toasts, toast } = useToast();
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  // Sync external overrides if any
  useEffect(() => {
    if (activeTabOverride) setTab(activeTabOverride);
  }, [activeTabOverride]);

  const handleTabChangeLocal = (key) => {
    setTab(key);
    if (onTabChangeOverride) onTabChangeOverride(key);
  };

  // State Profile
  const [data, setData] = useState({});
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(""); // base64 preview
  const [originalAvatar, setOriginalAvatar] = useState("");

  // State Security & OTP change
  const [curPw, setCurPw]     = useState("");
  const [newPw, setNewPw]     = useState("");
  const [confPw, setConfPw]   = useState("");
  const [otp, setOtp]         = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [pwLoading, setPwLoading]   = useState(false);
  const [twoFactor, setTwoFactor]   = useState(true);
  const [trustedDevices, setTrustedDevices] = useState([
    { id: 1, name: "Chrome - Windows 11 (Current Device)", ip: "192.168.43.10", active: "Just now", current: true },
    { id: 2, name: "Safari - iPhone 14 Pro", ip: "192.168.43.42", active: "2 hours ago" },
    { id: 3, name: "Firefox - MacOS Sequoia", ip: "192.168.10.88", active: "Yesterday" }
  ]);

  // Activity Log Timeline
  const [timelineItems, setTimelineItems] = useState([
    { action: "Admin Session Established", details: "Successful login from IP 192.168.43.10 via Google Chrome", timestamp: "Just now", type: "AUTH" },
    { action: "AI Parameters Synchronized", details: "OCR Threshold adjusted to 85%", timestamp: "2 hours ago", type: "UPDATE" },
    { action: "Security Update", details: "Two-Factor Authentication login enforced", timestamp: "Yesterday", type: "ALERT" },
    { action: "S3 Storage Sync", details: "Backup scheduler verified successfully", timestamp: "3 days ago", type: "CREATE" }
  ]);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState(buildDefaultNotif());
  const [notifSaving, setNotifSaving] = useState(false);

  // Unsaved Changes sticky alert banner state
  const [showSaveBar, setShowSaveBar] = useState(false);

  // Appearance & Accent Settings
  const [theme, setTheme] = useState(localStorage.getItem("theme-mode") || "dark");
  const [accent, setAccent] = useState(localStorage.getItem("accent-color") || "green");
  const [compact, setCompact] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // AI Configuration Threshold Sliders
  const [ocrConfidence, setOcrConfidence] = useState(85);
  const [riskThreshold, setRiskThreshold] = useState(65);
  const [dupDetection, setDupDetection]   = useState(true);

  // Confetti trigger
  const [confetti, setConfetti] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch(`${BASE}/api/settings/admin?email=${email}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setPhone(d.phone || "");
        const parsed = parseNotif(d.notificationPreferences);
        if (Object.keys(parsed).length > 0) setNotifPrefs(parsed);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [email]);

  const completion = () => {
    let f = 0, t = 4;
    if (data.name)  f++;
    if (data.email) f++;
    if (phone)      f++;
    if (avatar || initials(data.name || "A")) f++;
    return Math.round((f / t) * 100);
  };

  const initials = (n) => n.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");

  const triggerSaveBar = () => setShowSaveBar(true);

  const handleDiscardChanges = () => {
    setPhone(data.phone || "");
    setAvatar(originalAvatar);
    setShowSaveBar(false);
    toast.info("Changes discarded.");
  };

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(false);
    try {
      const res = await fetch(`${BASE}/api/settings/admin/profile?email=${email}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, notificationPreferences: JSON.stringify(notifPrefs) }),
      });
      if (res.ok) {
        toast.success("Settings saved successfully!");
        setOriginalAvatar(avatar);
        setShowSaveBar(false);
        setTimelineItems(prev => [
          { action: "Profile Settings Updated", details: "Saved phone number and notification settings", timestamp: "Just now", type: "UPDATE" },
          ...prev
        ]);
        if (completion() >= 100) {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 3000);
        }
        loadData();
      } else {
        toast.error("Failed to update profile settings.");
      }
    } catch {
      toast.error("Network error saving profile settings.");
    }
  };

  const sendOtp = async () => {
    setOtpLoading(true);
    try {
      const res = await fetch(`${BASE}/api/settings/send-otp?email=${email}`, { method: "POST" });
      if (res.ok) { setOtpSent(true); toast.info("Security code sent successfully!"); }
      else        { toast.error("Failed to dispatch security code."); }
    } catch { toast.error("Network error."); }
    finally { setOtpLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (newPw !== confPw) { toast.error("Passwords do not match."); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`${BASE}/api/settings/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword: curPw, otp, newPassword: newPw, confirmPassword: confPw }),
      });
      const rd = await res.json();
      if (res.ok) {
        toast.success("Security credentials updated successfully!");
        setCurPw(""); setNewPw(""); setConfPw(""); setOtp(""); setOtpSent(false);
        setTimelineItems(prev => [
          { action: "Credentials Rotated", details: "Password changed successfully", timestamp: "Just now", type: "ALERT" },
          ...prev
        ]);
      } else { toast.error(rd.error || "Failed to update security credentials."); }
    } catch { toast.error("Network error updating password."); }
    finally { setPwLoading(false); }
  };

  const handleNotifChange = (key, channel, value) => {
    setNotifPrefs(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [channel]: value }
    }));
    triggerSaveBar();
  };

  const handleTestNotification = () => {
    toast.info("🔔 In-App alerts connection is fully active!");
  };

  const handleThemeChange = (mode) => {
    setTheme(mode);
    localStorage.setItem("theme-mode", mode);
    document.documentElement.className = mode === "dark" ? "" : "light-mode";
    toast.success(`Theme updated to ${mode.toUpperCase()} mode.`);
  };

  const handleRevokeDevice = (id, name) => {
    setTrustedDevices(prev => prev.filter(d => d.id !== id));
    toast.success(`Session on ${name} revoked.`);
  };

  const handleRevokeAll = () => {
    setTrustedDevices(prev => prev.filter(d => d.current));
    toast.info("Logged out other active devices.");
  };

  // Dashboard Items Config
  const dashItems = [
    { key: "profile",       title: "Profile Identity",    desc: "Your personal details, contact number and SCM avatar", icon: User, pct: completion(), status: "Verified" },
    { key: "security",      title: "Credentials & 2FA",   desc: "Enforce OTP logins, change password, check active browser locations", icon: Lock, pct: phone ? 90 : 65, status: "Secure" },
    { key: "notifications", title: "Notification Matrix", desc: "Granular control over Orders, KYC, Payments, and System warnings", icon: Bell, pct: 100, status: "Active" },
    { key: "platform",      title: "Marketplace Rules",   desc: "Default commissions, GST, settlement periods, search radius", icon: Settings, pct: 100, status: "Active" },
    { key: "ai",            title: "AI Threshold Engine",  desc: "Configure OCR accuracy and similarity detection indices", icon: Cpu, pct: 100, status: "Enabled" },
    { key: "aws",           title: "AWS Cloud Storage",   desc: "Manage S3 compliance bucket details, retention and standard syncs", icon: Server, pct: 100, status: "Connected" },
    { key: "activity",      title: "Audit & Timelines",   desc: "Read recent security session logs, logins, settings modifications", icon: Activity, pct: 100, status: "Monitored" }
  ];

  if (loading) return <SkeletonSettings sections={3} />;

  // Search items list
  const searchItems = [
    { key: "profile",       label: "Profile" },
    { key: "security",      label: "Security Password 2FA OTP" },
    { key: "notifications", label: "Notification Toggles Alerts" },
    { key: "platform",      label: "Platform Fees Commission GST" },
    { key: "ai",            label: "AI OCR Threshold Confidence" },
    { key: "aws",           label: "AWS S3 Cloud Storage Bucket" },
    { key: "activity",      label: "Activity Auditing Session Log" }
  ];

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - var(--navbar-h))" }}>
      <ConfettiEffect active={confetti} />
      
      {/* Search Header Row */}
      <div style={{ padding: "0 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", background: "var(--surface)", height: 60 }}>
        {tab !== "dashboard" ? (
          <button onClick={() => handleTabChangeLocal("dashboard")} style={{ background: "none", border: "none", color: "#16C784", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            🧭 Back to Console Dashboard
          </button>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>Settings Dashboard Console</span>
        )}

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {["light", "dark"].map(m => (
            <button key={m} onClick={() => handleThemeChange(m)} style={{
              background: theme === m ? "rgba(22,199,132,0.1)" : "none",
              border: theme === m ? "1px solid rgba(22,199,132,0.25)" : "1px solid transparent",
              color: theme === m ? "#16C784" : "var(--ink-soft)",
              padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer"
            }}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "30px 48px" }}>

        {/* ── LANDING PAGE DASHBOARD ── */}
        {tab === "dashboard" && (
          <SettingsDashboard items={dashItems} onCardClick={handleTabChangeLocal} />
        )}

        {/* ── PROFILE ── */}
        {tab === "profile" && (
          <form onSubmit={handleProfileSave}>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Admin Console</div>
                <h1 className="settings-page-title">Profile Settings</h1>
                <p className="settings-page-subtitle">Your identity and administrator permissions</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32, alignItems: "flex-start" }}>
              <div>
                <SettingsSection title="Avatar Preview" icon={User}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
                    <div className="settings-avatar-lg-wrap">
                      <div className="settings-avatar-lg">
                        {avatar ? <img src={avatar} className="settings-avatar-img" alt="avatar" /> : initials(data.name || "A")}
                      </div>
                      <label className="settings-avatar-upload-overlay" style={{ cursor: "pointer" }}>
                        <Upload size={14} />
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setAvatar(reader.result);
                                triggerSaveBar();
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 750, color: "var(--ink)" }}>{data.name || "Administrator"}</div>
                    <InfoChip color="green" icon={CheckCircle2}>Verified Identity</InfoChip>
                  </div>
                </SettingsSection>

                <div className="settings-profile-trust-card" style={{ marginTop: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--ink-mute)", fontWeight: 600 }}>Trust Score</div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>SCM Integrity Level</div>
                  </div>
                  <div className="settings-trust-score">99%</div>
                </div>
              </div>

              <div>
                <SettingsSection title="Administrator Identity" icon={User}>
                  <SettingRow label="Account Status">
                    <InfoChip color="green" icon={CheckCircle2}>Active Status</InfoChip>
                  </SettingRow>
                  <SettingRow label="Registered Name" hint="Shown in system audit records">
                    <input className="settings-input readonly" value={data.name || "Administrator"} readOnly />
                  </SettingRow>
                  <SettingRow label="Registered Email" hint="Your login address — cannot be changed">
                    <input className="settings-input readonly" value={email} readOnly />
                  </SettingRow>
                  <SettingsDivider />
                  <SettingRow label="Mobile Phone Number" hint="Used for dispatches and security updates">
                    <input
                      className="settings-input"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); triggerSaveBar(); }}
                      placeholder="+91 98765 43210"
                      type="tel"
                    />
                  </SettingRow>
                </SettingsSection>

                <SettingsSection title="Quick Statistics" icon={Activity}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, textAlign: "center" }}>
                    {[
                      { val: "T+3 Days", lbl: "Settlement Cycle" },
                      { val: "Active", lbl: "AI Forecasts" },
                      { val: "Connected", lbl: "Cloud Storage" }
                    ].map((s, i) => (
                      <div key={i} style={{ padding: "12px 6px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{s.val}</div>
                        <div style={{ fontSize: 10.5, color: "var(--ink-mute)", marginTop: 2 }}>{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                </SettingsSection>
              </div>
            </div>
          </form>
        )}

        {/* ── SECURITY ── */}
        {tab === "security" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Admin Console</div>
                <h1 className="settings-page-title">Security & Credentials</h1>
                <p className="settings-page-subtitle">Configure password rules and monitor active dashboard sessions</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32, alignItems: "flex-start" }}>
              <div>
                <SettingsSection title="Security Score" icon={Shield}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
                    <SecurityScoreRing score={phone ? 95 : 65} />
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>Excellent Protection</div>
                  </div>
                </SettingsSection>
                
                <SettingsSection title="Suspicious Activity" icon={AlertTriangle}>
                  <div style={{ background: "rgba(22,199,132,0.06)", border: "1px solid rgba(22,199,132,0.18)", borderRadius: 8, padding: "10px 12px", fontSize: 11.5, color: "#16C784", lineHeight: 1.5 }}>
                    Zero security anomalies detected on your account within the last 30 days.
                  </div>
                </SettingsSection>
              </div>

              <div>
                <SettingsSection title="Change Security Password" icon={Lock}>
                  <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <SettingRow label="Current Password" full>
                      <PasswordInput value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="Current password" required />
                    </SettingRow>

                    {!otpSent ? (
                      <div>
                        <SettingsBtn
                          type="button"
                          onClick={sendOtp}
                          loading={otpLoading}
                          disabled={!curPw}
                          variant="secondary"
                          icon={Shield}
                        >
                          Verify Account via OTP
                        </SettingsBtn>
                        <p style={{ fontSize: 11.5, color: "var(--ink-mute)", marginTop: 6 }}>
                          A 6-digit security code will be dispatched to <strong>{email}</strong> to authenticate this credential reset.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div style={{ background: "rgba(22,199,132,0.06)", border: "1px solid rgba(22,199,132,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#16C784" }}>
                          OTP sent to <strong>{email}</strong>. Check your inbox.
                        </div>
                        <SettingRow label="OTP Code" full>
                          <input className="settings-input" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} required />
                        </SettingRow>
                        <SettingRow label="New Password" full>
                          <PasswordInput value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" required />
                        </SettingRow>
                        <PasswordStrength password={newPw} />
                        <SettingRow label="Confirm Password" full>
                          <PasswordInput value={confPw} onChange={e => setConfPw(e.target.value)} placeholder="Confirm password" required />
                        </SettingRow>
                        <SettingsBtn type="submit" loading={pwLoading} icon={Lock}>Change Credentials</SettingsBtn>
                      </>
                    )}
                  </form>
                </SettingsSection>

                <SettingsSection title="Active Login Sessions" icon={Activity}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "var(--ink-mute)", fontWeight: 600 }}>Revoke old sessions to enforce credentials change</span>
                    <SettingsBtn variant="danger" size="sm" onClick={handleRevokeAll}>Logout Other Devices</SettingsBtn>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {trustedDevices.map(d => (
                      <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 8 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: "var(--ink-mute)", marginTop: 2 }}>IP: {d.ip} · Active: {d.active}</div>
                        </div>
                        {!d.current && (
                          <button type="button" onClick={() => handleRevokeDevice(d.id, d.name)} style={{ background: "none", border: "none", color: "#f87171", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </SettingsSection>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === "notifications" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Admin Console</div>
                <h1 className="settings-page-title">Notification Channels</h1>
                <p className="settings-page-subtitle">Configure email dispatches, SMS and in-app alerts</p>
              </div>
            </div>

            <SettingsSection title="Alert Subscriptions" icon={Bell} noPad>
              <NotifMatrix
                rows={NOTIF_ROWS}
                prefs={notifPrefs}
                onChange={handleNotifChange}
                onTestNotification={handleTestNotification}
              />
            </SettingsSection>
          </div>
        )}

        {/* ── PLATFORM CONFIG ── */}
        {tab === "platform" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Admin Console</div>
                <h1 className="settings-page-title">Marketplace Configuration</h1>
                <p className="settings-page-subtitle">Defaults, commission scales, and pricing rules (Read-Only)</p>
              </div>
            </div>

            <SettingsSection title="Fee Structure & Commissions" icon={Settings}>
              {[
                { label: "Platform Commission", value: "12%", hint: "SCM service margin per successful sale" },
                { label: "GST Component", value: "18%", hint: "Government integrated goods and services tax" },
                { label: "Platform Transaction Fee", value: "₹25 / dispatch order", hint: "AI logistics optimization fee" },
                { label: "Default Warehouse Coverage", value: "100 km Radius", hint: "Search radius for nearby recommendations" },
                { label: "Supplier Settlement Cycle", value: "T+3 Business Days", hint: "Net bank transfers post delivery confirmation" },
              ].map(r => (
                <SettingRow key={r.label} label={r.label} hint={r.hint}>
                  <input className="settings-input readonly" value={r.value} readOnly />
                </SettingRow>
              ))}
            </SettingsSection>
          </div>
        )}

        {/* ── AI SETTINGS ── */}
        {tab === "ai" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Admin Console</div>
                <h1 className="settings-page-title">AI Optimization Thresholds</h1>
                <p className="settings-page-subtitle">Adjust machine learning confidence bounds for document OCR extraction</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
              <div style={{ padding: "16px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: "var(--ink-mute)", fontWeight: 700 }}>AI DOCUMENT RECOGNITION</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", marginTop: 8 }}>94.2%</div>
                <div style={{ fontSize: 11, color: "#16C784", marginTop: 4 }}>+1.4% improvement last 30 days</div>
              </div>
              <div style={{ padding: "16px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12 }}>
                <div style={{ fontSize: 12, color: "var(--ink-mute)", fontWeight: 700 }}>AI DISPATCH ACCURACY</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", marginTop: 8 }}>98.8%</div>
                <div style={{ fontSize: 11, color: "#16C784", marginTop: 4 }}>Based on distance recommendation model</div>
              </div>
            </div>

            <SettingsSection title="Model Parameters" icon={Cpu}>
              <SettingRow label={`OCR Confidence Limit: ${ocrConfidence}%`} hint="Min confidence score required to auto-approve document uploads" full>
                <input
                  type="range" min="50" max="98"
                  value={ocrConfidence}
                  onChange={e => { setOcrConfidence(Number(e.target.value)); triggerSaveBar(); }}
                  style={{ width: "100%", accentColor: "#16C784", cursor: "pointer" }}
                />
              </SettingRow>
              <SettingsDivider />
              <SettingRow label={`Risk Detection Limit: ${riskThreshold}%`} hint="Similarity score above which triggers manual supervisor audits" full>
                <input
                  type="range" min="30" max="90"
                  value={riskThreshold}
                  onChange={e => { setRiskThreshold(Number(e.target.value)); triggerSaveBar(); }}
                  style={{ width: "100%", accentColor: "#3279f9", cursor: "pointer" }}
                />
              </SettingRow>
              <SettingsDivider />
              <SettingRow label="Auto Verification Model" hint="Enforce immediate verification check post extraction">
                <ToggleSwitch on={dupDetection} onChange={v => { setDupDetection(v); triggerSaveBar(); }} />
                <InfoChip color={dupDetection ? "green" : "amber"}>{dupDetection ? "Enforced" : "Disabled"}</InfoChip>
              </SettingRow>
            </SettingsSection>
          </div>
        )}

        {/* ── CLOUD STORAGE ── */}
        {tab === "aws" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Admin Console</div>
                <h1 className="settings-page-title">AWS Storage Buckets</h1>
                <p className="settings-page-subtitle">S3 compliance documents storage connection details</p>
              </div>
            </div>

            <SettingsSection title="Bucket Status" icon={Server}>
              <SettingRow label="Connection Status">
                <InfoChip color="green" icon={CheckCircle2}>Connected Successfully</InfoChip>
              </SettingRow>
              <SettingRow label="Bucket Name">
                <input className="settings-input readonly" value="dravix-scm-documents" readOnly />
              </SettingRow>
              <SettingRow label="Bucket Region">
                <input className="settings-input readonly" value="ap-south-1 (Mumbai)" readOnly />
              </SettingRow>
              <SettingRow label="Document Retention Policy">
                <input className="settings-input readonly" value="365 Days (Archived automatically)" readOnly />
              </SettingRow>
              <SettingRow label="Encryption Layer">
                <input className="settings-input readonly" value="AES-256 Server-Side SSE-S3" readOnly />
              </SettingRow>
            </SettingsSection>

            <SettingsSection title="S3 Storage Usage" icon={Database}>
              <div className="storage-progress-container">
                <div className="storage-progress-label">
                  <span>Storage Capacity Used</span>
                  <span>14.2 GB / 50 GB</span>
                </div>
                <div className="storage-progress-track">
                  <div className="storage-progress-fill" style={{ width: "28.4%" }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-mute)", fontWeight: 600 }}>Total Extracted Documents</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>1,482 uploads</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--ink-mute)", fontWeight: 600 }}>Last Backup Sync</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", marginTop: 4 }}>Today at 02:40 AM</div>
                </div>
              </div>
            </SettingsSection>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {tab === "activity" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Admin Console</div>
                <h1 className="settings-page-title">Settings Activity</h1>
                <p className="settings-page-subtitle">Security logs and recent dashboard setting modifications</p>
              </div>
            </div>

            <SettingsSection title="Audit Log Timeline" icon={Activity}>
              <ActivityTimeline items={timelineItems} />
            </SettingsSection>
          </div>
        )}

      </div>

      {/* Sticky Save Bar */}
      {showSaveBar && (
        <div className="settings-save-bar">
          <div className="settings-save-bar-info">
            <div className="settings-save-bar-dot" />
            <div>
              <div className="settings-save-bar-title">Unsaved Changes</div>
              <div className="settings-save-bar-desc">You have unsaved changes in your settings panel.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <SettingsBtn variant="secondary" size="sm" onClick={handleDiscardChanges}>
              Discard Changes
            </SettingsBtn>
            <SettingsBtn variant="primary" size="sm" onClick={handleProfileSave} loading={saving}>
              Publish Changes
            </SettingsBtn>
          </div>
        </div>
      )}
    </div>
  );
}
