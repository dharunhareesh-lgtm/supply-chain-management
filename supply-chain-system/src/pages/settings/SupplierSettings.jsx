/**
 * SupplierSettings.jsx — DRAVIX SCM Premium Supplier Settings
 * Tabs: Profile · Business Info · Bank Details · Document Center · Notifications · Security · Activity
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
  User, Lock, Bell, Building2, CreditCard, CheckCircle2,
  AlertTriangle, Shield, FileText, Activity, Compass, Upload
} from "lucide-react";

const BASE = "http://localhost:8082";
const NOTIF_ROWS = [
  { key: "orders",    label: "Order Updates",     hint: "New orders, confirmations" },
  { key: "payments",  label: "Payment & Settlements", hint: "Invoices, payment receipts" },
  { key: "inventory", label: "Inventory Alerts",  hint: "Stock levels, reorder points" },
  { key: "ai",        label: "AI Forecast Alerts", hint: "Demand forecast notifications" },
];
function parseNotif(raw) { try { return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
function buildDefault() {
  const o = {};
  NOTIF_ROWS.forEach(r => { o[r.key] = { email: true, sms: false, inApp: true }; });
  return o;
}

export default function SupplierSettings({ email, activeTabOverride, onTabChangeOverride }) {
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
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [originalAvatar, setOriginalAvatar] = useState("");

  const [gst, setGst]     = useState("");
  const [bizSaving, setBizSaving] = useState(false);

  const [bankName, setBankName]     = useState("");
  const [accNum, setAccNum]         = useState("");
  const [ifsc, setIfsc]             = useState("");
  const [bankSaving, setBankSaving] = useState(false);

  const [notifPrefs, setNotifPrefs]   = useState(buildDefault());
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
    { action: "Profile Updated", details: "Contact phone details changed", timestamp: "Just now", type: "UPDATE" },
    { action: "GST Verification Approved", details: "Tax compliance check verified automatically", timestamp: "3 days ago", type: "AUTH" },
    { action: "Settlement Account Configured", details: "Linked State Bank account", timestamp: "1 week ago", type: "CREATE" }
  ]);

  // Documents
  const [gstStatus, setGstStatus] = useState("Approved");
  const [panStatus, setPanStatus] = useState("Approved");
  const [fssaiStatus, setFssaiStatus] = useState("Pending");

  const load = async () => {
    try {
      const res = await fetch(`${BASE}/api/settings/supplier?email=${email}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setName(d.name || "");
        setPhone(d.phone || "");
        setGst(d.gstNumber || "");
        setBankName(d.bankName || "");
        setAccNum(d.bankAccountNumber || "");
        setIfsc(d.bankIfscCode || "");
        const p = parseNotif(d.notificationPreferences);
        if (Object.keys(p).length) setNotifPrefs(p);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [email]);

  const completion = () => {
    let f = 0, t = 6;
    if (name)     f++;
    if (email)    f++;
    if (phone)    f++;
    if (gst)      f++;
    if (bankName) f++;
    if (accNum)   f++;
    return Math.round((f / t) * 100);
  };

  const triggerSaveBar = () => setShowSaveBar(true);

  const handleDiscardChanges = () => {
    setName(data.name || "");
    setPhone(data.phone || "");
    setAvatar(originalAvatar);
    setShowSaveBar(false);
    toast.info("Changes discarded.");
  };

  const handleProfileSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/api/settings/supplier/profile?email=${email}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, notificationPreferences: JSON.stringify(notifPrefs) }),
      });
      if (res.ok) {
        toast.success("Supplier profile updated!");
        setOriginalAvatar(avatar);
        setShowSaveBar(false);
        setTimelineItems(p => [
          { action: "Profile Updated", details: "Saved company phone and notifications preferences", timestamp: "Just now", type: "UPDATE" },
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

  const handleDocUpload = (type, dataBase64) => {
    if (type === "gst")   { setGstStatus("Pending"); toast.success("GST Document replaced! Pending review."); }
    if (type === "pan")   { setPanStatus("Pending"); toast.success("PAN document updated."); }
    if (type === "fssai") { setFssaiStatus("Pending"); toast.success("FSSAI license upload success."); }
    setTimelineItems(p => [
      { action: `Uploaded Document: ${type.toUpperCase()}`, details: "Corporate compliance document submitted for AI audit", timestamp: "Just now", type: "CREATE" },
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
      if (r.ok) {
        toast.success("Security credentials updated!");
        setCurPw(""); setNewPw(""); setConfPw(""); setOtp(""); setOtpSent(false);
      } else { toast.error(d.error || "Failed."); }
    } catch { toast.error("Network error."); }
    finally { setPwLoading(false); }
  };

  const dashItems = [
    { key: "profile",       title: "Profile Identity",    desc: "Your company/farm details and supplier SCM contact", icon: User, pct: completion(), status: "Active" },
    { key: "business",      title: "Business Info",       desc: "Corporate registration details, GST and compliance records", icon: Building2, pct: 100, status: "Verified" },
    { key: "bank",          title: "Bank Details",        desc: "Configure settlement account for payments and earnings", icon: CreditCard, pct: bankName ? 100 : 0, status: "Configured" },
    { key: "documents",     title: "Compliance Center",   desc: "Status logs for GST, PAN registration and FSSAI licenses", icon: FileText, pct: 85, status: "Audited" },
    { key: "notifications", title: "Notification Matrix", desc: "Select preferred channels for orders, dispatches, settlements", icon: Bell, pct: 100, status: "Active" },
    { key: "security",      title: "Security & Logins",   desc: "Enforce OTP credentials change and review active session logs", icon: Lock, pct: 85, status: "Secure" },
    { key: "activity",      title: "Activity Timelines",  desc: "Audit logs of setting updates and successful secure connections", icon: Activity, pct: 100, status: "Active" }
  ];

  const searchItems = [
    { key: "profile",       label: "Profile" },
    { key: "business",      label: "Business GST PAN Registration" },
    { key: "bank",          label: "Bank Account Settlement IFSC" },
    { key: "documents",     label: "Documents Center GST PAN Compliance" },
    { key: "notifications", label: "Notification Channels matrix" },
    { key: "security",      label: "Security Password 2FA" },
    { key: "activity",      label: "Activity Audit Logs" }
  ];

  if (loading) return <SkeletonSettings sections={3} />;

  return (
    <div style={{ position: "relative" }}>
      <ConfettiEffect active={confetti} />
      
      {/* Settings Top Breadcrumb Header */}
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
          <form onSubmit={handleProfileSave}>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Supplier Portal</div>
                <h1 className="settings-page-title">Profile Settings</h1>
                <p className="settings-page-subtitle">Your public supplier identity on DRAVIX</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 32 }}>
              <div>
                <SettingsSection title="Supplier Logo" icon={User}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div className="settings-avatar-lg-wrap">
                      <div className="settings-avatar-lg">
                        {avatar ? <img src={avatar} className="settings-avatar-img" alt="logo" /> : "🌾"}
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
                    <div style={{ fontSize: 14, fontWeight: 750, color: "var(--ink)" }}>{name || "Supplier"}</div>
                    <InfoChip color="green" icon={CheckCircle2}>Active Partner</InfoChip>
                  </div>
                </SettingsSection>

                <div className="settings-profile-trust-card" style={{ marginTop: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--ink-mute)", fontWeight: 700 }}>SCM Trust Factor</div>
                    <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 2 }}>KYC Verification status</div>
                  </div>
                  <div className="settings-trust-score">94%</div>
                </div>
              </div>

              <div>
                <SettingsSection title="Personal Information" icon={User}>
                  <SettingRow label="Business Name" hint="Shown in purchase orders and invoices">
                    <input className="settings-input" value={name} onChange={e => { setName(e.target.value); triggerSaveBar(); }} placeholder="Your farm or trade name" />
                  </SettingRow>
                  <SettingRow label="Registered Email" hint="Login email — read only">
                    <input className="settings-input readonly" value={email} readOnly />
                  </SettingRow>
                  <SettingRow label="Mobile Phone Number" hint="Primary alert number">
                    <input className="settings-input" value={phone} onChange={e => { setPhone(e.target.value); triggerSaveBar(); }} placeholder="+91 98765 43210" />
                  </SettingRow>
                </SettingsSection>
              </div>
            </div>
          </form>
        )}

        {/* BUSINESS INFO */}
        {tab === "business" && (
          <form onSubmit={handleProfileSave}>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Supplier Portal</div>
                <h1 className="settings-page-title">Business Information</h1>
                <p className="settings-page-subtitle">Registration and tax details</p>
              </div>
            </div>

            <SettingsSection title="Corporate Registration" icon={Building2}>
              <SettingRow label="GST Registration No.">
                <input className="settings-input" value={gst} onChange={e => { setGst(e.target.value); triggerSaveBar(); }} placeholder="GSTIN" />
              </SettingRow>
              <SettingRow label="Tax Compliance Status">
                <InfoChip color="green" icon={CheckCircle2}>Compliant</InfoChip>
              </SettingRow>
            </SettingsSection>
          </form>
        )}

        {/* BANK */}
        {tab === "bank" && (
          <form onSubmit={handleProfileSave}>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Supplier Portal</div>
                <h1 className="settings-page-title">Settlement Account</h1>
                <p className="settings-page-subtitle">Linked bank account for sales payments</p>
              </div>
            </div>

            <SettingsSection title="Settlement Details" icon={CreditCard}>
              <SettingRow label="Bank Name" hint="e.g. State Bank of India">
                <input className="settings-input" value={bankName} onChange={e => { setBankName(e.target.value); triggerSaveBar(); }} placeholder="Bank name" />
              </SettingRow>
              <SettingRow label="Bank Account Number">
                <input className="settings-input" value={accNum} onChange={e => { setAccNum(e.target.value); triggerSaveBar(); }} placeholder="Account number" />
              </SettingRow>
              <SettingRow label="IFSC Code">
                <input className="settings-input" value={ifsc} onChange={e => { setIfsc(e.target.value.toUpperCase()); triggerSaveBar(); }} placeholder="IFSC Code" maxLength={11} />
              </SettingRow>
            </SettingsSection>
          </form>
        )}

        {/* DOCUMENTS */}
        {tab === "documents" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Supplier Portal</div>
                <h1 className="settings-page-title">Compliance Documents</h1>
                <p className="settings-page-subtitle">Status of compliance certificates checked by AI engine</p>
              </div>
            </div>

            <div className="documents-grid">
              <DocumentCard name="GSTIN Certificate" code="gst" status={gstStatus} expiry="12-Dec-2028" onUpload={data => handleDocUpload("gst", data)} />
              <DocumentCard name="Permanent Account Number (PAN)" code="pan" status={panStatus} expiry="No Expiry" onUpload={data => handleDocUpload("pan", data)} />
              <DocumentCard name="FSSAI License" code="fssai" status={fssaiStatus} expiry="20-Oct-2026" onUpload={data => handleDocUpload("fssai", data)} />
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div>
            <div className="settings-page-header">
              <div>
                <div className="settings-eyebrow">Supplier Portal</div>
                <h1 className="settings-page-title">Notification Center</h1>
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
                <div className="settings-eyebrow">Supplier Portal</div>
                <h1 className="settings-page-title">Security Settings</h1>
                <p className="settings-page-subtitle">Credentials and login logs</p>
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
                <div className="settings-eyebrow">Supplier Portal</div>
                <h1 className="settings-page-title">Console Activity Logs</h1>
                <p className="settings-page-subtitle">Recent edits and secure connections timeline</p>
              </div>
            </div>

            <SettingsSection title="Audit Timeline" icon={Activity}>
              <ActivityTimeline items={timelineItems} />
            </SettingsSection>
          </div>
        )}

      </div>

      {/* Sticky Save Alert Bar */}
      {showSaveBar && (
        <div className="settings-save-bar">
          <div className="settings-save-bar-info">
            <div className="settings-save-bar-dot" />
            <div>
              <div className="settings-save-bar-title">Unsaved Settings Changes</div>
              <div className="settings-save-bar-desc">Publish adjustments to your supplier settings profile.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <SettingsBtn variant="secondary" size="sm" onClick={handleDiscardChanges}>Discard Changes</SettingsBtn>
            <SettingsBtn variant="primary" size="sm" onClick={handleProfileSave} loading={saving}>Publish Changes</SettingsBtn>
          </div>
        </div>
      )}
    </div>
  );
}
