/**
 * LogisticsSettings.jsx — DRAVIX SCM Premium Logistics Manager Settings
 * Tabs: Profile · Fleet Settings · Document Center · Notifications · Security · Activity
 */
import React, { useState, useEffect } from "react";
import {
  SettingsSection, SettingRow, ToggleSwitch,
  PasswordInput, PasswordStrength, NotifMatrix, SecurityScoreRing,
  SettingsBtn, InfoChip, SettingsDivider, SkeletonSettings,
  ConfirmDialog, useToast, ProfileAvatar, DocumentCard,
  ActivityTimeline, ConfettiEffect, SettingsDashboard
} from "../../components/settings/SettingsEngine";
import {
  User, Lock, Bell, Truck, CheckCircle2,
  AlertTriangle, Shield, MapPin, Settings, Activity, Compass, Upload, FileText
} from "lucide-react";

const BASE = "http://localhost:8082";
const NOTIF_ROWS = [
  { key: "deliveries",  label: "Delivery Updates",   hint: "OTP verifications, status changes" },
  { key: "vehicles",    label: "Vehicle Alerts",      hint: "Maintenance, GPS, fuel warnings" },
  { key: "payments",    label: "Payment Alerts",      hint: "Settlement notifications" },
];
function parseNotif(raw) { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
function defaultNotif() {
  const o = {};
  NOTIF_ROWS.forEach(r => { o[r.key] = { email: true, sms: false, inApp: true }; });
  return o;
}

export default function LogisticsSettings({ email, activeTabOverride, onTabChangeOverride }) {
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

  const [data, setData] = useState({});

  // Profile
  const [companyName, setCompanyName] = useState("");
  const [contact, setContact]         = useState("");
  const [saving, setSaving]           = useState(false);
  const [avatar, setAvatar]           = useState("");

  // Fleet
  const [vehiclePref, setVehiclePref] = useState("");
  const [driverPref, setDriverPref]   = useState("");
  const [gpsEnabled, setGpsEnabled]   = useState(true);
  const [otpDelivery, setOtpDelivery] = useState(true);
  const [fleetSaving, setFleetSaving] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs]   = useState(defaultNotif());
  const [notifSaving, setNotifSaving] = useState(false);

  // Password
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
    { action: "Fleet Settings Adjusted", details: "Default vehicle class preferences adjusted", timestamp: "Just now", type: "UPDATE" },
    { action: "Compliance Audit Success", details: "Logistics carriage license verified", timestamp: "Yesterday", type: "AUTH" }
  ]);

  // Documents
  const [licStatus, setLicStatus] = useState("Approved");
  const [insStatus, setInsStatus] = useState("Pending");

  const load = async () => {
    try {
      const r = await fetch(`${BASE}/api/settings/logistics?email=${email}`);
      if (r.ok) {
        const d = await r.json();
        setData(d);
        setCompanyName(d.companyName || "");
        setContact(d.contactInfo || "");
        setVehiclePref(d.vehiclePreferences || "");
        setDriverPref(d.driverPreferences || "");
        const p = parseNotif(d.notificationPreferences);
        if (Object.keys(p).length) setNotifPrefs(p);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [email]);

  const completion = () => {
    let f = 0, t = 4;
    if (companyName) f++;
    if (email)       f++;
    if (contact)     f++;
    if (vehiclePref) f++;
    return Math.round((f / t) * 100);
  };

  const triggerSaveBar = () => setShowSaveBar(true);

  const handleDiscardChanges = () => {
    setCompanyName(data.companyName || "");
    setContact(data.contactInfo || "");
    setVehiclePref(data.vehiclePreferences || "");
    setDriverPref(data.driverPreferences || "");
    setShowSaveBar(false);
    toast.info("Changes discarded.");
  };

  const saveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/api/settings/logistics/profile?email=${email}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName, contactInfo: contact,
          vehiclePreferences: vehiclePref, driverPreferences: driverPref,
          notificationPreferences: JSON.stringify(notifPrefs)
        }),
      });
      if (r.ok) {
        toast.success("Profile saved!");
        setShowSaveBar(false);
        setTimelineItems(p => [
          { action: "Logistics Profile Updated", details: "Saved company info and fleet requirements", timestamp: "Just now", type: "UPDATE" },
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

  const handleDocUpload = (type, data) => {
    if (type === "lic") { setLicStatus("Pending"); toast.success("Carriage license replaced."); }
    if (type === "ins") { setInsStatus("Pending"); toast.success("Insurance policy file uploaded."); }
    setTimelineItems(p => [
      { action: `Compliance Doc Submitted: ${type.toUpperCase()}`, details: "File uploaded successfully", timestamp: "Just now", type: "CREATE" },
      ...p
    ]);
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
    { key: "profile",       title: "Company Info",        desc: "Registered logistics name and active contact dispatches", icon: Truck, pct: completion(), status: "Active" },
    { key: "fleet",         title: "Fleet Preferences",   desc: "Default vehicle class rules and driver allocation preferences", icon: Settings, pct: 100, status: "Active" },
    { key: "documents",     title: "Compliance Registry", desc: "View status of logistics licenses, permits and insurances", icon: FileText, pct: 85, status: "Compliant" },
    { key: "notifications", title: "Notification Center", desc: "Control email dispatches and live driver dispatch updates", icon: Bell, pct: 100, status: "Active" },
    { key: "security",      title: "Security & Logins",   desc: "Manage account password and monitor trusted login sessions", icon: Lock, pct: 80, status: "Secure" },
    { key: "activity",      title: "Activity Audit Logs",  desc: "Audit logs of vehicle allocation updates and login sessions", icon: Activity, pct: 100, status: "Active" }
  ];

  if (loading) return <SkeletonSettings sections={3} />;

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
                <div className="settings-eyebrow">Logistics Portal</div>
                <h1 className="settings-page-title">Company Profile</h1>
                <p className="settings-page-subtitle">Your logistics identity and registration details</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
              <div>
                <SettingsSection title="Company Logo" icon={Truck}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div className="settings-avatar-lg-wrap">
                      <div className="settings-avatar-lg">
                        {avatar ? <img src={avatar} className="settings-avatar-img" alt="logo" /> : "🚛"}
                      </div>
                      <label className="settings-avatar-upload-overlay" style={{ cursor: "pointer" }}>
                        <Upload size={14} />
                        <input
                          type="file" accept="image/*" style={{ display: "none" }}
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onload = () => { setAvatar(r.result); triggerSaveBar(); };
                              r.readAsDataURL(f);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 750, color: "var(--ink)" }}>{companyName || "Logistics Partner"}</div>
                    <InfoChip color="green" icon={CheckCircle2}>Approved partner</InfoChip>
                  </div>
                </SettingsSection>
              </div>

              <div>
                <SettingsSection title="Logistics Profile" icon={Truck}>
                  <SettingRow label="Company Registered Name">
                    <input className="settings-input" value={companyName} onChange={e => { setCompanyName(e.target.value); triggerSaveBar(); }} placeholder="Logistics firm name" />
                  </SettingRow>
                  <SettingRow label="Registered Email" hint="Login email — cannot be changed">
                    <input className="settings-input readonly" value={email} readOnly />
                  </SettingRow>
                  <SettingRow label="Contact Info" hint="Contact number or email details">
                    <input className="settings-input" value={contact} onChange={e => { setContact(e.target.value); triggerSaveBar(); }} placeholder="+91 98765 43210" />
                  </SettingRow>
                </SettingsSection>
              </div>
            </div>
          </form>
        )}

        {/* FLEET */}
        {tab === "fleet" && (
          <form onSubmit={saveProfile}>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Logistics Portal</div>
                <h1 className="settings-page-title">Fleet Settings</h1>
                <p className="settings-page-subtitle">Vehicle classes and allocation parameters</p>
              </div>
            </div>

            <SettingsSection title="Vehicle Preferences" icon={Truck}>
              <SettingRow label="Preferred Vehicles" hint="Carriage and loader requirements" full>
                <textarea
                  className="settings-input"
                  value={vehiclePref}
                  onChange={e => { setVehiclePref(e.target.value); triggerSaveBar(); }}
                  placeholder="e.g. 1-ton tempo, cold storage reefer container rules."
                  rows={3}
                />
              </SettingRow>
              <SettingRow label="Driver Requirements" hint="Notes on driver selection policies" full>
                <textarea
                  className="settings-input"
                  value={driverPref}
                  onChange={e => { setDriverPref(e.target.value); triggerSaveBar(); }}
                  placeholder="e.g. High-rated driver priority, local delivery rotation."
                  rows={2}
                />
              </SettingRow>
            </SettingsSection>

            <SettingsSection title="Live Deliveries" icon={Settings}>
              <SettingRow label="OTP Delivery Check" hint="Verify delivery via customer OTP on destination reach">
                <ToggleSwitch on={otpDelivery} onChange={v => { setOtpDelivery(v); triggerSaveBar(); }} />
                <InfoChip color={otpDelivery ? "green" : "amber"}>{otpDelivery ? "Active" : "Bypassed"}</InfoChip>
              </SettingRow>
              <SettingRow label="GPS Location Tracking" hint="Transmit live coordinates of dispatches">
                <ToggleSwitch on={gpsEnabled} onChange={v => { setGpsEnabled(v); triggerSaveBar(); }} />
                <InfoChip color={gpsEnabled ? "green" : "amber"}>{gpsEnabled ? "Enforced" : "Inactive"}</InfoChip>
              </SettingRow>
            </SettingsSection>
          </form>
        )}

        {/* DOCUMENTS */}
        {tab === "documents" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Logistics Portal</div>
                <h1 className="settings-page-title">Compliance Documents</h1>
                <p className="settings-page-subtitle">Verify clearance logs and permits</p>
              </div>
            </div>

            <div className="documents-grid">
              <DocumentCard name="Logistics Carriage Permit" code="lic" status={licStatus} expiry="12-Dec-2028" onUpload={data => handleDocUpload("lic", data)} />
              <DocumentCard name="Fleet Insurance Coverage" code="ins" status={insStatus} expiry="20-Oct-2026" onUpload={data => handleDocUpload("ins", data)} />
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Logistics Portal</div>
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
                <div className="settings-eyebrow">Logistics Portal</div>
                <h1 className="settings-page-title">Security & Password</h1>
                <p className="settings-page-subtitle">Change credentials and logins logs</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
              <div>
                <SettingsSection title="Security Score" icon={Shield}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <SecurityScoreRing score={80} />
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
                        Request Security OTP
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
                <div className="settings-eyebrow">Logistics Portal</div>
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
              <div className="settings-save-bar-desc">Publish adjustments to logistics fleet settings.</div>
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
