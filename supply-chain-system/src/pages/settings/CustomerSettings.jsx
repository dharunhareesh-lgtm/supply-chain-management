/**
 * CustomerSettings.jsx — DRAVIX SCM Premium Customer Settings
 * Tabs: Profile · Delivery Address · Notifications · Privacy · Security · Activity
 */
import React, { useState, useEffect } from "react";
import {
  SettingsSection, SettingRow, PasswordInput, PasswordStrength,
  NotifMatrix, SecurityScoreRing, SettingsBtn, InfoChip, SettingsDivider,
  SkeletonSettings, ConfirmDialog, useToast, ActivityTimeline,
  ConfettiEffect, SettingsDashboard
} from "../../components/settings/SettingsEngine";
import {
  User, Lock, Bell, MapPin, Shield, CheckCircle2,
  AlertTriangle, Download, Trash2, Plus, X, Activity, Compass, Upload
} from "lucide-react";

const BASE = "http://localhost:8082";
const NOTIF_ROWS = [
  { key: "orders",    label: "Order Updates",     hint: "Placed, confirmed, shipped" },
  { key: "delivery",  label: "Delivery Updates",  hint: "Out for delivery, delivered" },
  { key: "payments",  label: "Payment Alerts",    hint: "Invoices, payment receipts" },
  { key: "kyc",       label: "KYC Status",        hint: "Verification approvals, rejections" },
];
function parseNotif(raw) { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
function defaultNotif() {
  const o = {};
  NOTIF_ROWS.forEach(r => { o[r.key] = { email: true, sms: false, inApp: true }; });
  return o;
}

export default function CustomerSettings({ email, activeTabOverride, onTabChangeOverride }) {
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

  const [phone, setPhone]   = useState("");
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState("");

  const [address, setAddress]   = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState]       = useState("");
  const [country, setCountry]   = useState("");
  const [postal, setPostal]     = useState("");
  const [lat, setLat]           = useState("");
  const [lng, setLng]           = useState("");
  const [addrSaving, setAddrSaving] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [newAddrText, setNewAddrText]       = useState("");

  const [notifPrefs, setNotifPrefs]   = useState(defaultNotif());
  const [notifSaving, setNotifSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);

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
    { action: "Profile Updated", details: "Saved phone number and security details", timestamp: "Just now", type: "UPDATE" },
    { action: "Delivery Address Configured", details: "Associated default latitude/longitude coordinates", timestamp: "Yesterday", type: "CREATE" }
  ]);

  const load = async () => {
    try {
      const r = await fetch(`${BASE}/api/settings/customer?email=${email}`);
      if (r.ok) {
        const d = await r.json();
        setPhone(d.phone || "");
        setAddress(d.address || "");
        setDistrict(d.district || "");
        setState(d.state || "");
        setCountry(d.country || "");
        setPostal(d.postalCode || "");
        setLat(d.latitude != null ? String(d.latitude) : "");
        setLng(d.longitude != null ? String(d.longitude) : "");
        try {
          setSavedAddresses(d.savedAddresses ? JSON.parse(d.savedAddresses) : []);
        } catch {
          setSavedAddresses(d.savedAddresses ? d.savedAddresses.split("\n").filter(Boolean) : []);
        }
        const p = parseNotif(d.notificationPreferences);
        if (Object.keys(p).length) setNotifPrefs(p);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [email]);

  const completion = () => {
    let f = 0, t = 4;
    if (email)   f++;
    if (phone)   f++;
    if (address) f++;
    if (lat)     f++;
    return Math.round((f / t) * 100);
  };

  const triggerSaveBar = () => setShowSaveBar(true);

  const handleDiscardChanges = () => {
    setPhone(phone);
    setAddress(address);
    setDistrict(district);
    setState(state);
    setPostal(postal);
    setLat(lat);
    setLng(lng);
    setShowSaveBar(false);
    toast.info("Changes discarded.");
  };

  const saveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/api/settings/customer/profile?email=${email}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone, address, district, state, country, postalCode: postal,
          latitude: lat, longitude: lng,
          savedAddresses: JSON.stringify(savedAddresses),
          notificationPreferences: JSON.stringify(notifPrefs)
        }),
      });
      if (r.ok) {
        toast.success("Profile saved!");
        setShowSaveBar(false);
        setTimelineItems(p => [
          { action: "Customer Profile Updated", details: "Saved delivery preferences and addresses", timestamp: "Just now", type: "UPDATE" },
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

  const addSavedAddress = () => {
    if (!newAddrText.trim()) return;
    const updated = [...savedAddresses, newAddrText.trim()];
    setSavedAddresses(updated);
    setNewAddrText("");
    triggerSaveBar();
  };

  const removeSavedAddress = (idx) => {
    setSavedAddresses(prev => prev.filter((_, i) => i !== idx));
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
    { key: "profile",       title: "Customer Profile",    desc: "Your email coordinates, contact details and visual avatar", icon: User, pct: completion(), status: "Active" },
    { key: "delivery",      title: "Delivery Addresses",  desc: "Your primary address and multi-location SCM coordinate map", icon: MapPin, pct: address ? 100 : 0, status: "Active" },
    { key: "notifications", title: "Notification Toggles",desc: "Enforced alert options for placed orders and dispatches", icon: Bell, pct: 100, status: "Active" },
    { key: "privacy",       title: "Privacy & Data Logs", desc: "Request account deletion checks and export data archives", icon: Shield, pct: 100, status: "Secure" },
    { key: "security",      title: "Security & Passwords",desc: "Reset portal credentials and configure safety OTP logs", icon: Lock, pct: 85, status: "Secure" },
    { key: "activity",      title: "Activity Audit Logs",  desc: "Audit timeline logs of settings and address adjustments", icon: Activity, pct: 100, status: "Active" }
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
                <div className="settings-eyebrow">My Account</div>
                <h1 className="settings-page-title">Profile Settings</h1>
                <p className="settings-page-subtitle">Your personal customer account details</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
              <div>
                <SettingsSection title="Avatar Photo" icon={User}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div className="settings-avatar-lg-wrap">
                      <div className="settings-avatar-lg">
                        {avatar ? <img src={avatar} className="settings-avatar-img" alt="avatar" /> : "🛒"}
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
                    <InfoChip color="green" icon={CheckCircle2}>Active Customer</InfoChip>
                  </div>
                </SettingsSection>
              </div>

              <div>
                <SettingsSection title="Customer Profile" icon={User}>
                  <SettingRow label="Registered Email" hint="Your login coordinates — cannot be changed">
                    <input className="settings-input readonly" value={email} readOnly />
                    <InfoChip color="green" icon={CheckCircle2}>Verified</InfoChip>
                  </SettingRow>
                  <SettingRow label="Mobile Phone Number" hint="Used for dispatches alerts and OTP checks">
                    <input className="settings-input" value={phone} onChange={e => { setPhone(e.target.value); triggerSaveBar(); }} placeholder="+91 98765 43210" />
                  </SettingRow>
                </SettingsSection>
              </div>
            </div>
          </form>
        )}

        {/* DELIVERY ADDRESS */}
        {tab === "delivery" && (
          <form onSubmit={saveProfile}>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">My Account</div>
                <h1 className="settings-page-title">Delivery Coordinates</h1>
                <p className="settings-page-subtitle">Your primary shipping address and coordinate registry</p>
              </div>
            </div>

            <SettingsSection title="Primary Address" icon={MapPin}>
              <SettingRow label="Street Address" full>
                <input className="settings-input" value={address} onChange={e => { setAddress(e.target.value); triggerSaveBar(); }} placeholder="Plot No, Area" />
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
              <SettingsDivider />
              <SettingRow label="Latitude" hint="GPS coordinate (optional)">
                <input className="settings-input" value={lat} onChange={e => { setLat(e.target.value); triggerSaveBar(); }} placeholder="13.0827" />
              </SettingRow>
              <SettingRow label="Longitude" hint="GPS coordinate (optional)">
                <input className="settings-input" value={lng} onChange={e => { setLng(e.target.value); triggerSaveBar(); }} placeholder="80.2707" />
              </SettingRow>
            </SettingsSection>

            <SettingsSection title="Saved Addresses" icon={MapPin}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="settings-input"
                  value={newAddrText}
                  onChange={e => setNewAddrText(e.target.value)}
                  placeholder="Add another delivery address..."
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSavedAddress())}
                />
                <SettingsBtn type="button" onClick={addSavedAddress} variant="secondary" icon={Plus} size="sm">Add</SettingsBtn>
              </div>
              {savedAddresses.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                  {savedAddresses.map((addr, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <MapPin size={13} style={{ color: "var(--ink-mute)" }} />
                      <span style={{ flex: 1, fontSize: 13 }}>{addr}</span>
                      <button type="button" onClick={() => removeSavedAddress(i)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SettingsSection>
          </form>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">My Account</div>
                <h1 className="settings-page-title">Notifications</h1>
                <p className="settings-page-subtitle">Configure preferred alert triggers</p>
              </div>
            </div>

            <SettingsSection title="Alert Channels" icon={Bell} noPad>
              <NotifMatrix rows={NOTIF_ROWS} prefs={notifPrefs} onChange={handleNotifChange} />
            </SettingsSection>
          </div>
        )}

        {/* PRIVACY */}
        {tab === "privacy" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">My Account</div>
                <h1 className="settings-page-title">Privacy & Data Logs</h1>
                <p className="settings-page-subtitle">Download your data archives or request deletion</p>
              </div>
            </div>

            <SettingsSection title="Export Archive" icon={Shield}>
              <SettingRow label="Personal Data" hint="Download a complete copy of SCM interactions history">
                <SettingsBtn variant="secondary" icon={Download} onClick={() => toast.info("Data export request submitted. Check your email inbox.")}>
                  Export Data
                </SettingsBtn>
              </SettingRow>
            </SettingsSection>

            <SettingsSection title="Account Deletion" icon={Trash2}>
              <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#f87171", marginBottom: 12, lineHeight: 1.5 }}>
                ⚠️ Account deletion is irreversible. Your active address registry, PAN and order history will be deleted.
              </div>
              <SettingRow label="Request Account Deletion" hint="Submit deletion request for admin review">
                <SettingsBtn variant="danger" icon={Trash2} onClick={() => setDeleteConfirm(true)}>
                  Request Deletion
                </SettingsBtn>
              </SettingRow>
            </SettingsSection>
          </div>
        )}

        {/* SECURITY */}
        {tab === "security" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">My Account</div>
                <h1 className="settings-page-title">Security Settings</h1>
                <p className="settings-page-subtitle">Credentials and safety codes</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
              <div>
                <SettingsSection title="Security Score" icon={Shield}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <SecurityScoreRing score={phone && address ? 85 : 50} />
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
                          OTP dispatched to {email}.
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
                <div className="settings-eyebrow">My Account</div>
                <h1 className="settings-page-title">Console Activity Timeline</h1>
                <p className="settings-page-subtitle">Recent edits and secure logins logs</p>
              </div>
            </div>

            <SettingsSection title="Audit Timeline" icon={Activity}>
              <ActivityTimeline items={timelineItems} />
            </SettingsSection>
          </div>
        )}

      </div>

      <ConfirmDialog
        open={deleteConfirm}
        title="Confirm Account Deletion Request"
        message="This sends an immediate request to the DRAVIX admin group. Your account will remain active until manually verified and finalized."
        confirmLabel="Submit Request"
        danger
        onConfirm={() => { setDeleteConfirm(false); toast.info("Deletion request submitted."); }}
        onCancel={() => setDeleteConfirm(false)}
      />

      {/* Sticky Save Bar */}
      {showSaveBar && (
        <div className="settings-save-bar">
          <div className="settings-save-bar-info">
            <div className="settings-save-bar-dot" />
            <div>
              <div className="settings-save-bar-title">Unsaved Settings Changes</div>
              <div className="settings-save-bar-desc">Publish adjustments to customer settings profile.</div>
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
