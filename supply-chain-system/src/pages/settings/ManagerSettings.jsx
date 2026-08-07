/**
 * ManagerSettings.jsx — DRAVIX SCM Premium Warehouse Manager Settings
 * Tabs: Profile · Notifications · Security · Activity
 */
import React, { useState, useEffect } from "react";
import {
  SettingsSection, SettingRow, PasswordInput, PasswordStrength,
  NotifMatrix, SecurityScoreRing, SettingsBtn, InfoChip,
  SkeletonSettings, useToast, ActivityTimeline, ConfettiEffect,
  SettingsDashboard
} from "../../components/settings/SettingsEngine";
import { User, Lock, Bell, CheckCircle2, AlertTriangle, Shield, Activity, Compass } from "lucide-react";

const BASE = "";
const NOTIF_ROWS = [
  { key: "orders",    label: "Order Updates",    hint: "New orders assigned to your warehouse" },
  { key: "dispatch",  label: "Dispatch Events",  hint: "OTP generation, vehicle assignment" },
  { key: "inventory", label: "Inventory Alerts", hint: "Low stock and expiry warnings" },
];
function parseNotif(raw) { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
function defaultNotif() {
  const o = {};
  NOTIF_ROWS.forEach(r => { o[r.key] = { email: true, sms: false, inApp: true }; });
  return o;
}

export default function ManagerSettings({ email, activeTabOverride, onTabChangeOverride }) {
  const { toasts, toast } = useToast();
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTabOverride) setTab(activeTabOverride);
  }, [activeTabOverride]);

  const handleTabChangeLocal = (key) => {
    setTab(key);
    if (onTabChangeOverride) onTabChangeOverride(key);
  };

  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [notifPrefs, setNotifPrefs]   = useState(defaultNotif());
  const [notifSaving, setNotifSaving] = useState(false);

  const [curPw, setCurPw]   = useState("");
  const [newPw, setNewPw]   = useState("");
  const [confPw, setConfPw] = useState("");
  const [otp, setOtp]       = useState("");
  const [otpSent, setOtpSent]     = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [pwLoading, setPwLoading]   = useState(false);

  const [showSaveBar, setShowSaveBar] = useState(false);
  const [confetti, setConfetti] = useState(false);

  const [timelineItems, setTimelineItems] = useState([
    { action: "Login Verified", details: "Secure console manager login from IP 192.168.12.88", timestamp: "Just now", type: "AUTH" },
    { action: "Dispatch Notification Saved", details: "Muted SMS channels for inventory warnings", timestamp: "Yesterday", type: "UPDATE" }
  ]);

  const load = async () => {
    try {
      const r = await fetch(`${BASE}/api/settings/manager?email=${email}`);
      if (r.ok) {
        const d = await r.json();
        setName(d.name || "");
        setPhone(d.phone || "");
        const p = parseNotif(d.notificationPreferences);
        if (Object.keys(p).length) setNotifPrefs(p);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [email]);

  const completion = () => {
    let f = 0;
    if (name)  f++;
    if (email) f++;
    if (phone) f++;
    return Math.round((f / 3) * 100);
  };

  const triggerSaveBar = () => setShowSaveBar(true);

  const saveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/api/settings/manager/profile?email=${email}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, notificationPreferences: JSON.stringify(notifPrefs) }),
      });
      if (r.ok) {
        toast.success("Profile saved!");
        setShowSaveBar(false);
        setTimelineItems(p => [
          { action: "Manager Profile Updated", details: "Saved display name and phone number", timestamp: "Just now", type: "UPDATE" },
          ...p
        ]);
        if (completion() >= 100) {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 3000);
        }
        load();
      } else { toast.error("Failed to save."); }
    } catch { toast.error("Network error."); }
    finally { setSaving(false); }
  };

  const handleNotifChange = (key, ch, val) => {
    setNotifPrefs(p => ({ ...p, [key]: { ...(p[key] || {}), [ch]: val } }));
    triggerSaveBar();
  };

  const sendOtp = async () => {
    setOtpLoading(true);
    try {
      const r = await fetch(`${BASE}/api/settings/send-otp?email=${email}`, { method: "POST" });
      if (r.ok) { setOtpSent(true); toast.info("OTP sent."); }
      else       { toast.error("Failed to send OTP."); }
    } catch { toast.error("Network error."); }
    finally { setOtpLoading(false); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    if (newPw !== confPw) { toast.error("Passwords do not match."); return; }
    setPwLoading(true);
    try {
      const r = await fetch(`${BASE}/api/settings/change-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword: curPw, otp, newPassword: newPw, confirmPassword: confPw }),
      });
      const d = await r.json();
      if (r.ok) { toast.success("Password changed!"); setCurPw(""); setNewPw(""); setConfPw(""); setOtp(""); setOtpSent(false); }
      else       { toast.error(d.error || "Failed."); }
    } catch { toast.error("Network error."); }
    finally { setPwLoading(false); }
  };

  const dashItems = [
    { key: "profile",       title: "Manager Identity",    desc: "Your manager display name and contact phone", icon: User, pct: completion(), status: "Active" },
    { key: "notifications", title: "Notification Matrix", desc: "Select warning alerts for warehouse stock updates", icon: Bell, pct: 100, status: "Active" },
    { key: "security",      title: "Security & Passwords",desc: "Reset portal credentials and configure safety OTPs", icon: Lock, pct: 80, status: "Secure" },
    { key: "activity",      title: "Activity Audit Logs",  desc: "Audit log of dispatches approved and logins verified", icon: Activity, pct: 100, status: "Active" }
  ];

  if (loading) return <SkeletonSettings sections={2} />;

  return (
    <div style={{ position: "relative" }}>
      <ConfettiEffect active={confetti} />
      
      <div style={{ padding: "0 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", background: "var(--surface)", height: 60 }}>
        {tab !== "dashboard" ? (
          <button onClick={() => handleTabChangeLocal("dashboard")} style={{ background: "none", border: "none", color: "#16C784", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            🧭 Back to Console Dashboard
          </button>
        ) : (
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>Settings Dashboard Console</span>
        )}
      </div>

      <div style={{ padding: "30px 48px" }}>
        
        {/* LANDING PAGE */}
        {tab === "dashboard" && (
          <SettingsDashboard items={dashItems} onCardClick={handleTabChangeLocal} />
        )}

        {/* PROFILE */}
        {tab === "profile" && (
          <form onSubmit={saveProfile}>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Manager Console</div>
                <h1 className="settings-page-title">Profile Settings</h1>
                <p className="settings-page-subtitle">Your manager profile details</p>
              </div>
            </div>

            <SettingsSection title="Account Information" icon={User}>
              <SettingRow label="Manager Full Name">
                <input className="settings-input" value={name} onChange={e => { setName(e.target.value); triggerSaveBar(); }} placeholder="Manager name" />
              </SettingRow>
              <SettingRow label="Registered Email" hint="Login email — read only">
                <input className="settings-input readonly" value={email} readOnly />
                <InfoChip color="green" icon={CheckCircle2}>Verified</InfoChip>
              </SettingRow>
              <SettingRow label="Mobile Phone Number" hint="Primary alert number">
                <input className="settings-input" value={phone} onChange={e => { setPhone(e.target.value); triggerSaveBar(); }} placeholder="+91 98765 43210" />
              </SettingRow>
              <SettingRow label="Access Role">
                <InfoChip color="blue">Warehouse Manager</InfoChip>
              </SettingRow>
            </SettingsSection>
          </form>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Manager Console</div>
                <h1 className="settings-page-title">Notifications</h1>
                <p className="settings-page-subtitle">Configure preferred alert triggers</p>
              </div>
            </div>

            <SettingsSection title="Alert Channels" icon={Bell} noPad>
              <NotifMatrix rows={NOTIF_ROWS} prefs={notifPrefs} onChange={handleNotifChange} />
            </SettingsSection>
          </div>
        )}

        {/* SECURITY */}
        {tab === "security" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Manager Console</div>
                <h1 className="settings-page-title">Security & Password</h1>
                <p className="settings-page-subtitle">Change credentials and logins logs</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
              <div>
                <SettingsSection title="Security Score" icon={Shield}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <SecurityScoreRing score={phone ? 80 : 55} />
                  </div>
                </SettingsSection>
              </div>

              <div>
                <SettingsSection title="Change Security Password" icon={Lock}>
                  <form onSubmit={changePw} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <SettingRow label="Current Password" full>
                      <PasswordInput value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="Current password" required />
                    </SettingRow>
                    {!otpSent ? (
                      <SettingsBtn type="button" onClick={sendOtp} loading={otpLoading} disabled={!curPw} variant="secondary" icon={Shield}>
                        Verify via OTP
                      </SettingsBtn>
                    ) : (
                      <>
                        <div style={{ background: "rgba(22,199,132,0.06)", border: "1px solid rgba(22,199,132,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#16C784" }}>
                          OTP sent to <strong>{email}</strong>.
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
                        <SettingsBtn type="submit" loading={pwLoading} icon={Lock}>Update Password</SettingsBtn>
                      </>
                    )}
                  </form>
                </SettingsSection>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVITY */}
        {tab === "activity" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Manager Console</div>
                <h1 className="settings-page-title">Activity Logs</h1>
                <p className="settings-page-subtitle">Recent edits and secure logins timeline</p>
              </div>
            </div>

            <SettingsSection title="Audit Timeline" icon={Activity}>
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
              <div className="settings-save-bar-title">Unsaved Settings Changes</div>
              <div className="settings-save-bar-desc">Publish adjustments to manager profile settings.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <SettingsBtn variant="secondary" size="sm" onClick={handleDiscardChanges}>Discard Changes</SettingsBtn>
            <SettingsBtn variant="primary" size="sm" onClick={saveProfile} loading={saving}>Publish Changes</SettingsBtn>
          </div>
        </div>
      )}
    </div>
  );
}
