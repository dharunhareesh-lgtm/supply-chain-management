/**
 * DriverSettings.jsx — DRAVIX SCM Premium Driver Settings
 * Tabs: Profile · Availability · Document Center · Notifications · Security · Activity
 */
import React, { useState, useEffect } from "react";
import {
  SettingsSection, SettingRow, ToggleSwitch,
  PasswordInput, PasswordStrength, NotifMatrix, SecurityScoreRing,
  SettingsBtn, InfoChip, SettingsDivider, SkeletonSettings, useToast,
  DocumentCard, ActivityTimeline, ConfettiEffect, SettingsDashboard
} from "../../components/settings/SettingsEngine";
import {
  User, Lock, Bell, Shield, Navigation, Compass, FileText, CheckCircle2,
  AlertTriangle, Activity, Upload
} from "lucide-react";

const BASE = "";
const NOTIF_ROWS = [
  { key: "dispatch",   label: "Dispatch Assignments", hint: "New trips, route changes" },
  { key: "delivery",   label: "Delivery Alerts",      hint: "OTP verifications, customer notices" },
  { key: "payments",   label: "Earning Alerts",       hint: "Trip payouts, commission updates" },
];
function parseNotif(raw) { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
function defaultNotif() {
  const o = {};
  NOTIF_ROWS.forEach(r => { o[r.key] = { email: true, sms: true, inApp: true }; });
  return o;
}

export default function DriverSettings({ email, activeTabOverride, onTabChangeOverride }) {
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
  const [phone, setPhone]           = useState("");
  const [drivingLicense, setDl]     = useState("");
  const [vehicle, setVehicle]       = useState("");
  const [saving, setSaving]           = useState(false);
  const [avatar, setAvatar]           = useState("");

  // Address
  const [address, setAddress]       = useState("");
  const [district, setDistrict]     = useState("");
  const [state, setState]           = useState("");
  const [country, setCountry]       = useState("");
  const [postal, setPostal]         = useState("");

  // Status & Routes
  const [availability, setAvail]    = useState(true);
  const [status, setStatus]         = useState("Active");
  const [gps, setGps]               = useState(true);
  const [routePref, setRoutePref]   = useState("");
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
    { action: "Driver Availability Saved", details: "Status set to Active & Available", timestamp: "Just now", type: "UPDATE" },
    { action: "License Verification Complete", details: "Driver license approved by AI engine", timestamp: "3 days ago", type: "AUTH" }
  ]);

  // Documents
  const [dlStatus, setDlStatus] = useState("Approved");

  const load = async () => {
    try {
      const r = await fetch(`${BASE}/api/settings/driver?email=${email}`);
      if (r.ok) {
        const d = await r.json();
        setData(d);
        setPhone(d.phone || "");
        setDl(d.drivingLicense || "");
        setVehicle(d.vehicleAssignment || "");
        setAvail(d.availability ?? true);
        setStatus(d.currentStatus || "Active");
        setGps(d.gpsPermissions ?? true);
        setRoutePref(d.routePreferences || "");
        setAddress(d.address || "");
        setDistrict(d.district || "");
        setState(d.state || "");
        setCountry(d.country || "");
        setPostal(d.postalCode || "");
        const p = parseNotif(d.notificationPreferences);
        if (Object.keys(p).length) setNotifPrefs(p);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [email]);

  const completion = () => {
    let f = 0, t = 5;
    if (phone)          f++;
    if (drivingLicense) f++;
    if (vehicle)        f++;
    if (routePref)      f++;
    if (address)        f++;
    return Math.round((f / t) * 100);
  };

  const triggerSaveBar = () => setShowSaveBar(true);

  const handleDiscardChanges = () => {
    setPhone(data.phone || "");
    setDl(data.drivingLicense || "");
    setAddress(data.address || "");
    setDistrict(data.district || "");
    setState(data.state || "");
    setPostal(data.postalCode || "");
    setRoutePref(data.routePreferences || "");
    setShowSaveBar(false);
    toast.info("Changes discarded.");
  };

  const saveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/api/settings/driver/profile?email=${email}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone, drivingLicense, address, district, state, country, postalCode: postal,
          vehicleAssignment: vehicle, availability, currentStatus: status,
          gpsPermissions: gps, routePreferences: routePref,
          notificationPreferences: JSON.stringify(notifPrefs)
        }),
      });
      if (r.ok) {
        toast.success("Settings saved!");
        setShowSaveBar(false);
        setTimelineItems(p => [
          { action: "Driver Settings Updated", details: "Saved phone number and license details", timestamp: "Just now", type: "UPDATE" },
          ...p
        ]);
        if (completion() >= 100) {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 3000);
        }
        load();
      } else { toast.error("Failed to save profile."); }
    } catch { toast.error("Network error."); }
    finally { setSaving(false); }
  };

  const handleDocUpload = (type, data) => {
    if (type === "dl") { setDlStatus("Pending"); toast.success("Driving license replaced."); }
    setTimelineItems(p => [
      { action: "Compliance DL Uploaded", details: "Driving license submitted successfully", timestamp: "Just now", type: "CREATE" },
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
    { key: "profile",       title: "Driver Profile",      desc: "Registered licensing numbers and driver SCM contact", icon: User, pct: completion(), status: "Active" },
    { key: "availability",  title: "Duty Status & GPS",   desc: "Configure dispatch availability toggles and OSRM route rules", icon: Navigation, pct: 100, status: "Active" },
    { key: "documents",     title: "License Registry",    desc: "Verify active status of driving license and carrier permits", icon: FileText, pct: 100, status: "Compliant" },
    { key: "notifications", title: "Notification Toggles",desc: "Preferred channels for dispatches and delivery payouts", icon: Bell, pct: 100, status: "Active" },
    { key: "security",      title: "Security & Logins",   desc: "Change password credentials and enforce secure session OTPs", icon: Lock, pct: 85, status: "Secure" },
    { key: "activity",      title: "Activity Audit Logs",  desc: "Timeline audit logs of dispatches approved and logins verified", icon: Activity, pct: 100, status: "Active" }
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
                <div className="settings-eyebrow">Driver Console</div>
                <h1 className="settings-page-title">Driver Profile</h1>
                <p className="settings-page-subtitle">Your identity and licensing details</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
              <div>
                <SettingsSection title="Driver Photo" icon={User}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div className="settings-avatar-lg-wrap">
                      <div className="settings-avatar-lg">
                        {avatar ? <img src={avatar} className="settings-avatar-img" alt="avatar" /> : "🚙"}
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
                    <div style={{ fontSize: 14, fontWeight: 750, color: "var(--ink)" }}>{email.split("@")[0]}</div>
                    <InfoChip color="green" icon={CheckCircle2}>Active Driver</InfoChip>
                  </div>
                </SettingsSection>
              </div>

              <div>
                <SettingsSection title="Driver Profile" icon={User}>
                  <SettingRow label="Driving License No." hint="Regulatory license number">
                    <input className="settings-input" value={drivingLicense} onChange={e => { setDl(e.target.value); triggerSaveBar(); }} placeholder="DL-1420110012345" />
                  </SettingRow>
                  <SettingRow label="Registered Email" hint="Login email — read only">
                    <input className="settings-input readonly" value={email} readOnly />
                    <InfoChip color="green" icon={CheckCircle2}>Verified</InfoChip>
                  </SettingRow>
                  <SettingRow label="Mobile Phone Number" hint="Primary alert number">
                    <input className="settings-input" value={phone} onChange={e => { setPhone(e.target.value); triggerSaveBar(); }} placeholder="+91 98765 43210" />
                  </SettingRow>
                </SettingsSection>

                <SettingsSection title="Address Details" icon={Compass}>
                  <SettingRow label="Address">
                    <input className="settings-input" value={address} onChange={e => { setAddress(e.target.value); triggerSaveBar(); }} placeholder="Street, Area" />
                  </SettingRow>
                  <SettingRow label="District">
                    <input className="settings-input" value={district} onChange={e => { setDistrict(e.target.value); triggerSaveBar(); }} placeholder="District" />
                  </SettingRow>
                  <SettingRow label="State">
                    <input className="settings-input" value={state} onChange={e => { setState(e.target.value); triggerSaveBar(); }} placeholder="State" />
                  </SettingRow>
                  <SettingRow label="Country">
                    <input className="settings-input" value={country} onChange={e => { setCountry(e.target.value); triggerSaveBar(); }} placeholder="India" />
                  </SettingRow>
                  <SettingRow label="Postal Code">
                    <input className="settings-input" value={postal} onChange={e => { setPostal(e.target.value); triggerSaveBar(); }} placeholder="600001" maxLength={6} />
                  </SettingRow>
                </SettingsSection>
              </div>
            </div>
          </form>
        )}

        {/* AVAILABILITY */}
        {tab === "availability" && (
          <form onSubmit={saveProfile}>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Driver Console</div>
                <h1 className="settings-page-title">Availability & GPS</h1>
                <p className="settings-page-subtitle">Configure live tracking permissions and route rules</p>
              </div>
            </div>

            <SettingsSection title="Availability Status" icon={Navigation}>
              <SettingRow label="Duty Status" hint="Indicate dispatches readiness">
                <ToggleSwitch on={availability} onChange={v => { setAvail(v); triggerSaveBar(); }} />
                <InfoChip color={availability ? "green" : "amber"}>{availability ? "On Duty" : "Off Duty"}</InfoChip>
              </SettingRow>
              <SettingRow label="GPS Location Permissions" hint="Allow live dispatches coordination">
                <ToggleSwitch on={gps} onChange={v => { setGps(v); triggerSaveBar(); }} />
                <InfoChip color={gps ? "green" : "amber"}>{gps ? "GPS On" : "GPS Off"}</InfoChip>
              </SettingRow>
              <SettingRow label="Assigned Vehicle" hint="Assigned by logistics manager (Read-Only)">
                <input className="settings-input readonly" value={vehicle || "No vehicle assigned"} readOnly />
              </SettingRow>
            </SettingsSection>

            <SettingsSection title="Route Preferences" icon={Compass}>
              <SettingRow label="Route Preference Comments" hint="e.g. Coimbatore highway dispatches only" full>
                <textarea
                  className="settings-input"
                  value={routePref}
                  onChange={e => { setRoutePref(e.target.value); triggerSaveBar(); }}
                  placeholder="e.g. State highway dispatches only."
                  rows={3}
                />
              </SettingRow>
            </SettingsSection>
          </form>
        )}

        {/* DOCUMENTS */}
        {tab === "documents" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Driver Console</div>
                <h1 className="settings-page-title">Clearance Certificates</h1>
                <p className="settings-page-subtitle">View status of driving license permit</p>
              </div>
            </div>

            <div className="documents-grid">
              <DocumentCard name="Driving License" code="dl" status={dlStatus} expiry="12-Mar-2035" onUpload={data => handleDocUpload("dl", data)} />
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Driver Console</div>
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
                <div className="settings-eyebrow">Driver Console</div>
                <h1 className="settings-page-title">Security & Password</h1>
                <p className="settings-page-subtitle">Change credentials and logins logs</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
              <div>
                <SettingsSection title="Security Score" icon={Shield}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <SecurityScoreRing score={drivingLicense ? 85 : 50} />
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
                <div className="settings-eyebrow">Driver Console</div>
                <h1 className="settings-page-title">Activity Timeline</h1>
                <p className="settings-page-subtitle">Recent edits and dispatches timeline</p>
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
              <div className="settings-save-bar-desc">Publish availability and route modifications.</div>
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
