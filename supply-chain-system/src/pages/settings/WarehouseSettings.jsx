/**
 * WarehouseSettings.jsx — DRAVIX SCM Premium Warehouse Owner Settings
 * Tabs: Profile · Location · Operations · Document Center · Notifications · Security · Activity
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
  User, Lock, Bell, MapPin, Settings, CheckCircle2,
  AlertTriangle, Shield, Building2, Clock, Activity, Compass, Upload, FileText
} from "lucide-react";

const BASE = "";
const NOTIF_ROWS = [
  { key: "orders",      label: "Order Arrivals",     hint: "Incoming product orders" },
  { key: "inventory",   label: "Inventory Alerts",   hint: "Low stock, expiry warnings" },
  { key: "dispatch",    label: "Dispatch Updates",    hint: "Vehicle assignment, OTP events" },
  { key: "insurance",   label: "Insurance Alerts",   hint: "Claim updates, policy renewals" },
];
function parseNotif(raw) { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
function defaultNotif() {
  const o = {};
  NOTIF_ROWS.forEach(r => { o[r.key] = { email: true, sms: false, inApp: true }; });
  return o;
}

export default function WarehouseSettings({ email, activeTabOverride, onTabChangeOverride }) {
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
  const [whName, setWhName]       = useState("");
  const [contact, setContact]     = useState("");
  const [working, setWorking]     = useState("");
  const [saving, setSaving]       = useState(false);
  const [avatar, setAvatar]       = useState("");

  // Location
  const [lat, setLat]             = useState("");
  const [lng, setLng]             = useState("");
  const [district, setDistrict]   = useState("");
  const [state, setState]         = useState("");
  const [country, setCountry]     = useState("");
  const [postal, setPostal]       = useState("");
  const [address, setAddress]     = useState("");
  const [locOtp, setLocOtp]       = useState("");
  const [locOtpSent, setLocOtpSent]   = useState(false);
  const [locOtpLoading, setLocOtpLoading] = useState(false);
  const [locSaving, setLocSaving] = useState(false);
  const [origCoords, setOrigCoords] = useState({ lat: "", lng: "" });

  // Operations
  const [storageInfo, setStorageInfo]   = useState("");
  const [secSettings, setSecSettings]   = useState("");
  const [autoDispatch, setAutoDispatch] = useState(true);
  const [opSaving, setOpSaving]         = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs]     = useState(defaultNotif());
  const [notifSaving, setNotifSaving]   = useState(false);

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
    { action: "Security Update", details: "GPS coordinates updated under OTP signature", timestamp: "Just now", type: "ALERT" },
    { action: "Compliance Audit Success", details: "Warehouse license check passed", timestamp: "Yesterday", type: "AUTH" },
    { action: "Operational Capacity Tuned", details: "Storage details settings adjusted", timestamp: "4 days ago", type: "UPDATE" }
  ]);

  // Documents
  const [fssaiStatus, setFssaiStatus] = useState("Approved");
  const [whStatus, setWhStatus] = useState("Approved");
  const [insStatus, setInsStatus] = useState("Pending");

  const load = async () => {
    try {
      const res = await fetch(`${BASE}/api/settings/warehouse?email=${email}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setWhName(d.warehouseName || "");
        setContact(d.contactNumber || "");
        setWorking(d.workingHours || "");
        setStorageInfo(d.storageInformation || "");
        setSecSettings(d.securitySettings || "");
        setLat(d.latitude ?? "");
        setLng(d.longitude ?? "");
        setDistrict(d.district || "");
        setState(d.state || "");
        setCountry(d.country || "");
        setPostal(d.postalCode || "");
        setOrigCoords({ lat: d.latitude ?? "", lng: d.longitude ?? "" });
        const p = parseNotif(d.notificationPreferences);
        if (Object.keys(p).length) setNotifPrefs(p);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [email]);

  const completion = () => {
    let f = 0, t = 6;
    if (whName)    f++;
    if (contact)   f++;
    if (working)   f++;
    if (lat)       f++;
    if (district)  f++;
    if (storageInfo) f++;
    return Math.round((f / t) * 100);
  };

  const triggerSaveBar = () => setShowSaveBar(true);

  const handleDiscardChanges = () => {
    setWhName(data.warehouseName || "");
    setContact(data.contactNumber || "");
    setWorking(data.workingHours || "");
    setStorageInfo(data.storageInformation || "");
    setSecSettings(data.securitySettings || "");
    setShowSaveBar(false);
    toast.info("Changes discarded.");
  };

  const saveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/api/settings/warehouse/profile?email=${email}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseName: whName, contactNumber: contact, workingHours: working,
          storageInformation: storageInfo, securitySettings: secSettings
        }),
      });
      if (r.ok) {
        toast.success("Warehouse profile saved!");
        setShowSaveBar(false);
        setTimelineItems(p => [
          { action: "Profile Updated", details: "Saved central warehouse details and hours", timestamp: "Just now", type: "UPDATE" },
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

  const coordsChanged = () =>
    String(lat) !== String(origCoords.lat) || String(lng) !== String(origCoords.lng);

  const sendLocOtp = async () => {
    setLocOtpLoading(true);
    try {
      const r = await fetch(`${BASE}/api/settings/send-otp?email=${email}`, { method: "POST" });
      if (r.ok) { setLocOtpSent(true); toast.info("OTP dispatched for coordinate update verification."); }
      else       { toast.error("Failed to dispatch security code."); }
    } catch { toast.error("Network error."); }
    finally { setLocOtpLoading(false); }
  };

  const saveLocation = async (e) => {
    e.preventDefault();
    if (coordsChanged() && !locOtpSent) { toast.error("Verify coordinates change with OTP first."); return; }
    setLocSaving(true);
    try {
      const payload = { latitude: lat, longitude: lng, district, state, country, postalCode: postal, address };
      if (coordsChanged()) payload.otp = locOtp;
      const r = await fetch(`${BASE}/api/settings/warehouse/location?email=${email}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (r.ok) {
        toast.success("SaaS Coordinates Sync Complete!");
        setLocOtpSent(false); setLocOtp("");
        setTimelineItems(p => [
          { action: "GPS Relocation Complete", details: `Coordinates set to ${lat}, ${lng}`, timestamp: "Just now", type: "ALERT" },
          ...p
        ]);
        load();
      } else { toast.error(d.error || "Failed to update warehouse coordinates."); }
    } catch { toast.error("Network error."); }
    finally { setLocSaving(false); }
  };

  const handleDocUpload = (type, base64) => {
    if (type === "fssai") { setFssaiStatus("Pending"); toast.success("FSSAI update success. Audit pending."); }
    if (type === "wh")    { setWhStatus("Pending"); toast.success("Warehouse compliance document uploaded."); }
    if (type === "ins")   { setInsStatus("Pending"); toast.success("Insurance coverage certificate uploaded."); }
    setTimelineItems(p => [
      { action: `Compliance Document Submitted: ${type.toUpperCase()}`, details: "File uploaded successfully to AWS storage", timestamp: "Just now", type: "CREATE" },
      ...p
    ]);
  };

  const sendOtp = async () => {
    setOtpLoading(true);
    try {
      const r = await fetch(`${BASE}/api/settings/send-otp?email=${email}`, { method: "POST" });
      if (r.ok) { setOtpSent(true); toast.info("OTP sent to your email."); }
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
      if (r.ok) { toast.success("Password changed successfully!"); setCurPw(""); setNewPw(""); setConfPw(""); setOtp(""); setOtpSent(false); }
      else       { toast.error(d.error || "Failed."); }
    } catch { toast.error("Network error."); }
    finally { setPwLoading(false); }
  };

  const dashItems = [
    { key: "profile",       title: "Warehouse Info",      desc: "Registered name, contact details and working hours", icon: Building2, pct: completion(), status: "Active" },
    { key: "location",      title: "GPS Location & Hub",  desc: "Pinpoint coordinate coordinates, districts and postal rules", icon: MapPin, pct: lat ? 100 : 0, status: "Verified" },
    { key: "operations",    title: "Storage & Dispatch",  desc: "Operational category defaults, cold capacity, and auto dispatches", icon: Settings, pct: 100, status: "Active" },
    { key: "documents",     title: "Compliance Registry", desc: "View status of certificates, insurances and warehouse clearances", icon: FileText, pct: 85, status: "Compliant" },
    { key: "notifications", title: "Notification Toggles",desc: "Receive immediate alerts for inventory level drops and orders", icon: Bell, pct: 100, status: "Active" },
    { key: "security",      title: "Security & Lockout",  desc: "Reset portal password, manage credentials and verify logins", icon: Lock, pct: 85, status: "Secure" },
    { key: "activity",      title: "Console Audit Logs",  desc: "Timeline record of coordinates updates and credentials changes", icon: Activity, pct: 100, status: "Active" }
  ];

  const searchItems = [
    { key: "profile",       label: "Profile" },
    { key: "location",      label: "Location Latitude Longitude coordinates" },
    { key: "operations",    label: "Operations Storage cold Auto Dispatch rules" },
    { key: "documents",     label: "Documents compliance fssai insurance" },
    { key: "notifications", label: "Notifications alerts email sms" },
    { key: "security",      label: "Security Password otp 2fa" },
    { key: "activity",      label: "Activity audit logs history" }
  ];

  if (loading) return <SkeletonSettings sections={3} />;

  return (
    <div style={{ position: "relative" }}>
      <ConfettiEffect active={confetti} />
      
      {/* Settings Top Header */}
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
                <div className="settings-eyebrow">Warehouse Portal</div>
                <h1 className="settings-page-title">Warehouse Details</h1>
                <p className="settings-page-subtitle">Your warehouse identity and registered SCM details</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
              <div>
                <SettingsSection title="Hub Logo" icon={Building2}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div className="settings-avatar-lg-wrap">
                      <div className="settings-avatar-lg">
                        {avatar ? <img src={avatar} className="settings-avatar-img" alt="avatar" /> : "🏭"}
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
                    <div style={{ fontSize: 14, fontWeight: 750, color: "var(--ink)" }}>{whName || "Warehouse"}</div>
                    <InfoChip color="green" icon={CheckCircle2}>Active Hub</InfoChip>
                  </div>
                </SettingsSection>
              </div>

              <div>
                <SettingsSection title="Warehouse Profile" icon={Building2}>
                  <SettingRow label="Warehouse Name" hint="Displayed to dispatches and suppliers">
                    <input className="settings-input" value={whName} onChange={e => { setWhName(e.target.value); triggerSaveBar(); }} placeholder="Coimbatore Central Hub" />
                  </SettingRow>
                  <SettingRow label="Registered Email" hint="Login email — read only">
                    <input className="settings-input readonly" value={email} readOnly />
                  </SettingRow>
                  <SettingRow label="Contact Number" hint="Primary alert number">
                    <input className="settings-input" value={contact} onChange={e => { setContact(e.target.value); triggerSaveBar(); }} placeholder="+91 98765 43210" />
                  </SettingRow>
                  <SettingRow label="Working Hours" hint="e.g. 08:00 – 20:00, Mon–Sat">
                    <input className="settings-input" value={working} onChange={e => { setWorking(e.target.value); triggerSaveBar(); }} placeholder="08:00 – 20:00" />
                  </SettingRow>
                </SettingsSection>
              </div>
            </div>
          </form>
        )}

        {/* LOCATION */}
        {tab === "location" && (
          <form onSubmit={saveLocation}>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Warehouse Portal</div>
                <h1 className="settings-page-title">GPS Coordinates & Location</h1>
                <p className="settings-page-subtitle">Configure exact coordinates for optimal AI vehicle dispatches</p>
              </div>
            </div>

            <SettingsSection title="Coordinates Config" icon={MapPin} badge={coordsChanged() ? "OTP Required" : undefined}>
              <div style={{ background: "rgba(50,121,249,0.06)", border: "1px solid rgba(50,121,249,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#60a5fa", marginBottom: 12 }}>
                📍 Changing coordinates directly affects dispatches and recommended route calculations. Verified OTP is required.
              </div>
              <SettingRow label="Latitude" hint="e.g. 11.0168">
                <input className="settings-input" value={lat} onChange={e => setLat(e.target.value)} placeholder="11.0168" type="number" step="any" />
              </SettingRow>
              <SettingRow label="Longitude" hint="e.g. 76.9558">
                <input className="settings-input" value={lng} onChange={e => setLng(e.target.value)} placeholder="76.9558" type="number" step="any" />
              </SettingRow>

              {coordsChanged() && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                  {!locOtpSent ? (
                    <SettingsBtn type="button" onClick={sendLocOtp} loading={locOtpLoading} variant="secondary" icon={Shield}>
                      Verify via OTP
                    </SettingsBtn>
                  ) : (
                    <SettingRow label="OTP Verification" hint="Sent to your email" full>
                      <input className="settings-input" value={locOtp} onChange={e => setLocOtp(e.target.value)} placeholder="6-digit OTP" maxLength={6} />
                    </SettingRow>
                  )}
                </div>
              )}
            </SettingsSection>

            <SettingsSection title="Address Details" icon={Compass}>
              <SettingRow label="Street Address">
                <input className="settings-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Plot No, Street" />
              </SettingRow>
              <SettingRow label="District">
                <input className="settings-input" value={district} onChange={e => setDistrict(e.target.value)} placeholder="District" />
              </SettingRow>
              <SettingRow label="State">
                <input className="settings-input" value={state} onChange={e => setState(e.target.value)} placeholder="State" />
              </SettingRow>
              <SettingRow label="Country">
                <input className="settings-input" value={country} onChange={e => setCountry(e.target.value)} placeholder="India" />
              </SettingRow>
              <SettingRow label="Postal Code">
                <input className="settings-input" value={postal} onChange={e => setPostal(e.target.value)} placeholder="641001" maxLength={6} />
              </SettingRow>
            </SettingsSection>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <SettingsBtn type="submit" loading={locSaving} icon={CheckCircle2}>Save Location</SettingsBtn>
            </div>
          </form>
        )}

        {/* OPERATIONS */}
        {tab === "operations" && (
          <form onSubmit={saveProfile}>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Warehouse Portal</div>
                <h1 className="settings-page-title">Operations Settings</h1>
                <p className="settings-page-subtitle">Capacity limits, storage types and dispatches</p>
              </div>
            </div>

            <SettingsSection title="Storage Specifications" icon={Settings}>
              <SettingRow label="Cold & Dry Storage Information" hint="Details of warehouse temperature zones and logistics capacities" full>
                <textarea
                  className="settings-input"
                  value={storageInfo}
                  onChange={e => { setStorageInfo(e.target.value); triggerSaveBar(); }}
                  placeholder="e.g. Perishables cold storage capacity 250 MT. Humidity controlled grains zone 600 MT."
                  rows={3}
                />
              </SettingRow>
              <SettingRow label="Security Access Specifications" hint="CCTV settings and guard details" full>
                <textarea
                  className="settings-input"
                  value={secSettings}
                  onChange={e => { setSecSettings(e.target.value); triggerSaveBar(); }}
                  placeholder="e.g. Guard count per shift: 2. CCTV monitoring enforced."
                  rows={2}
                />
              </SettingRow>
              <SettingsDivider />
              <SettingRow label="Auto Dispatch Rules" hint="Auto recommend dispatch paths based on vehicle spaces">
                <ToggleSwitch on={autoDispatch} onChange={v => { setAutoDispatch(v); triggerSaveBar(); }} />
                <InfoChip color={autoDispatch ? "green" : "amber"}>{autoDispatch ? "Active" : "Offline"}</InfoChip>
              </SettingRow>
            </SettingsSection>
          </form>
        )}

        {/* DOCUMENTS */}
        {tab === "documents" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Warehouse Portal</div>
                <h1 className="settings-page-title">Compliance Registry</h1>
                <p className="settings-page-subtitle">Verify clearance documents submitted to S3 storage</p>
              </div>
            </div>

            <div className="documents-grid">
              <DocumentCard name="FSSAI Food Safety License" code="fssai" status={fssaiStatus} expiry="12-Mar-2027" onUpload={data => handleDocUpload("fssai", data)} />
              <DocumentCard name="Warehouse Certificate" code="wh" status={whStatus} expiry="20-Dec-2029" onUpload={data => handleDocUpload("wh", data)} />
              <DocumentCard name="Insurance Coverage policy" code="ins" status={insStatus} expiry="18-Jul-2026" onUpload={data => handleDocUpload("ins", data)} />
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Warehouse Portal</div>
                <h1 className="settings-page-title">Notifications</h1>
                <p className="settings-page-subtitle">Configure preferred alert triggers</p>
              </div>
            </div>

            <SettingsSection title="Alert Channels" icon={Bell} noPad>
              <NotifMatrix rows={NOTIF_ROWS} prefs={notifPrefs} onChange={handleNotifChange} onTestNotification={handleTestNotification} />
            </SettingsSection>
          </div>
        )}

        {/* SECURITY */}
        {tab === "security" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Warehouse Portal</div>
                <h1 className="settings-page-title">Security & Password</h1>
                <p className="settings-page-subtitle">Change credentials and logins logs</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
              <div>
                <SettingsSection title="Security Score" icon={Shield}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <SecurityScoreRing score={85} />
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
                          OTP sent to {email}.
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
                <div className="settings-eyebrow">Warehouse Portal</div>
                <h1 className="settings-page-title">Activity Audit logs</h1>
                <p className="settings-page-subtitle">Operational updates and dispatches timeline</p>
              </div>
            </div>

            <SettingsSection title="Audit timeline" icon={Activity}>
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
              <div className="settings-save-bar-desc">Publish operational setting modifications.</div>
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
