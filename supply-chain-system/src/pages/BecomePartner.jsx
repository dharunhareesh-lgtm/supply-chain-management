/**
 * BecomePartner.jsx — Premium Partner Onboarding
 * All business logic, validation, API calls, and field names preserved exactly.
 * Only UI/UX/layout/animations redesigned.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, User, Mail, Phone, MapPin, FileText, Send,
  Package, Warehouse, Truck, Check, X, BadgeCheck, Leaf,
  AlertCircle, Clock, Lock, Shield,
} from "lucide-react";
import {
  OnboardingPage, OnboardingNav, GlassCard, PremiumInput, PremiumTextarea,
  SubmitButton, SectionTitle, FieldError, ServerError, PremiumCheckbox,
  PageHeader, SideTimeline, TrustCards, StaggerForms, SuccessScreen,
  staggerVariants, cardVariants, TOKENS as T, EASE,
} from "../components/site/OnboardingLayout";

/* ─── Constants (unchanged) ─────────────────────────────────────────────── */
const API = "";

const ROLE_OPTIONS = [
  { id: "Supplier",          title: "Supplier",           desc: "Supply agricultural products to warehouses and buyers.", Icon: Package,   rgb: "16,185,129" },
  { id: "Warehouse",         title: "Warehouse Owner",    desc: "Manage storage facilities and inventory.",               Icon: Warehouse,  rgb: "6,182,212"  },
  { id: "Logistics Company", title: "Logistics Provider", desc: "Provide transportation and delivery services.",          Icon: Truck,      rgb: "139,92,246" },
];

const INITIAL_FORM = {
  organizationName: "", contactPerson: "", email: "", phone: "",
  roleRequested: "", businessType: "Enterprise Partner", country: "India",
  state: "", district: "", postalCode: "", address: "",
  gstNumber: "", website: "", description: "", yearsOfExperience: "",
};

const GUIDELINES_SECTIONS = [
  {
    title: "Section 1 – Registration rules",
    items: [
      "All information submitted must be accurate and truthful.",
      "Fake or misleading registrations will be permanently rejected.",
      "The organization must legally exist.",
      "Email and phone number must be active and accessible.",
    ],
  },
  {
    title: "Section 2 – Partner responsibilities",
    items: [
      "Maintain accurate business information.",
      "Keep account credentials confidential.",
      "Follow all Dravix SCM operational policies.",
      "Respond promptly to verification requests.",
    ],
  },
  {
    title: "Section 3 – Account approval",
    items: [
      "Registration does not guarantee approval.",
      "Every request is manually reviewed by the Dravix SCM admin team.",
      "Additional documents may be requested before approval.",
    ],
  },
  {
    title: "Section 4 – Temporary password policy",
    items: [
      "A temporary password is sent to the registered email once approved.",
      "The temporary password is valid for 5 hours only.",
      "It can only be used with the approved email account.",
      "It cannot be reused after expiration.",
      "Password change is mandatory on first login.",
    ],
  },
  {
    title: "Section 5 – Security",
    items: [
      "Users must never share passwords or credentials.",
      "Users must never attempt unauthorized access.",
      "Users must never create duplicate accounts.",
      "Users must never use false business identities or upload malicious content.",
      "Violations may result in permanent suspension.",
    ],
  },
  {
    title: "Section 6 – Privacy",
    items: [
      "Dravix SCM stores only the information required for account management, identity verification, platform security, and operational communication.",
      "Personal and organizational information will not be sold to third parties.",
    ],
  },
];

/* ─── Validation (unchanged) ────────────────────────────────────────────── */
function validate(form, agreed) {
  const errs = {};
  if (!form.organizationName || form.organizationName.trim().length < 3)
    errs.organizationName = "Organization name must be at least 3 characters.";
  else if (form.organizationName.trim().length > 150)
    errs.organizationName = "Organization name cannot exceed 150 characters.";
  if (!form.contactPerson || form.contactPerson.trim().length < 2)
    errs.contactPerson = "Contact person name is required.";
  if (!form.email || !/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email))
    errs.email = "Please enter a valid email address.";
  if (!form.phone || !/^\d{10,15}$/.test(form.phone))
    errs.phone = "Phone must be a valid 10-15 digit number.";
  if (!form.roleRequested) errs.roleRequested = "Please select a role.";
  if (!form.address || form.address.trim().length < 5)
    errs.address = "Full address is required (min 5 characters).";
  if (!form.description || form.description.trim().length < 5)
    errs.description = "Business description is required.";
  if (!agreed) errs.agreed = "You must accept the Dravix SCM Platform Guidelines.";
  return errs;
}

/* ══════════════════════════════════════════════════════════════════════════
   ROLE SELECTOR
══════════════════════════════════════════════════════════════════════════ */
function RoleSelector({ value, onChange, error }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 12 }}>
        Role applying for *
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
        {ROLE_OPTIONS.map(opt => {
          const selected = value === opt.id;
          return (
            <motion.button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={e => {
                if (!selected) { e.currentTarget.style.borderColor = `rgba(${opt.rgb},0.4)`; }
              }}
              onMouseLeave={e => {
                if (!selected) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }
              }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start",
                textAlign: "left", padding: 18, borderRadius: 16,
                background: selected ? `rgba(${opt.rgb},0.08)` : "rgba(9,14,22,0.5)",
                border: `1.5px solid ${selected ? `rgb(${opt.rgb})` : "rgba(255,255,255,0.07)"}`,
                cursor: "pointer",
                boxShadow: selected ? `0 0 24px rgba(${opt.rgb},0.15)` : "none",
                transition: "border-color 0.22s, box-shadow 0.22s, background 0.22s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", width: "100%", marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  background: `rgba(${opt.rgb},0.1)`, color: `rgb(${opt.rgb})`,
                  border: `1px solid rgba(${opt.rgb},0.25)`,
                }}>
                  <opt.Icon size={18} />
                </div>
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      style={{ width: 22, height: 22, borderRadius: "50%", background: `rgb(${opt.rgb})`, display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <Check size={12} color="#030712" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{opt.title}</span>
              <span style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{opt.desc}</span>
            </motion.button>
          );
        })}
      </div>
      <FieldError message={error} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   GUIDELINES MODAL
══════════════════════════════════════════════════════════════════════════ */
function GuidelinesModal({ open, onClose, onAgree }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 640, maxHeight: "85vh", background: "rgba(9,14,22,0.98)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, display: "flex", flexDirection: "column", overflow: "hidden", backdropFilter: "blur(20px)" }}
          >
            {/* Header */}
            <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>Dravix SCM Platform Guidelines</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: T.muted }}>Please read before submitting your registration.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* Content */}
            <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {GUIDELINES_SECTIONS.map(s => (
                  <div key={s.title}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: T.em }}>{s.title}</h4>
                    <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
                      {s.items.map(item => (
                        <li key={item} style={{ fontSize: 13, color: item.startsWith("Violations") ? "#f87171" : T.muted, lineHeight: 1.55 }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Confirmation box */}
                <div style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: "16px 18px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: T.text }}>By clicking "I Agree", I confirm that:</p>
                  {["I have read all guidelines.", "I agree to follow Dravix SCM policies.", "The information I provide is accurate.", "I understand my application will be reviewed before approval."].map(t => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.muted, marginBottom: 6 }}>
                      <Check size={13} color={T.em} /> {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "20px 28px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "flex-end", gap: 12, flexShrink: 0 }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={onClose}
                style={{ padding: "10px 20px", borderRadius: 12, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: T.muted, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 24px rgba(16,185,129,0.3)" }}
                whileTap={{ scale: 0.97 }}
                onClick={onAgree}
                style={{ padding: "10px 24px", borderRadius: 12, background: T.em, color: "#030712", fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none" }}
              >
                I Agree
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function BecomePartner() {
  const [form, setForm]               = useState(INITIAL_FORM);
  const [agreed, setAgreed]           = useState(false);
  const [errors, setErrors]           = useState({});
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [requestNumber, setRequestNumber] = useState("");
  const [serverError, setServerError] = useState("");
  const [modalOpen, setModalOpen]     = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: "" }));
  };

  const handleRoleSelect = id => {
    setForm(p => ({ ...p, roleRequested: id }));
    if (errors.roleRequested) setErrors(p => ({ ...p, roleRequested: "" }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setServerError("");
    const errs = validate(form, agreed);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/public/partner-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, yearsOfExperience: form.yearsOfExperience ? parseInt(form.yearsOfExperience, 10) : null }),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(true); setRequestNumber(data.requestNumber || ""); }
      else setServerError(data.message || "Registration request failed.");
    } catch { setServerError("Network error. Please try again in a moment."); }
    finally { setLoading(false); }
  };

  /* ── Success screen ─────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <SuccessScreen
        icon={BadgeCheck}
        title="Registration Submitted!"
        description="Your partner registration request has been submitted successfully. Our team will review your application and you'll receive an email with credentials once approved."
        requestNumber={requestNumber}
        checks={["Application received", "Pending admin review", "Email notification will be sent", "Temporary password valid for 5 hours"]}
        backTo="/"
        backLabel="Back to home"
        onBack={() => { setSubmitted(false); setForm(INITIAL_FORM); setAgreed(false); }}
      />
    );
  }

  /* ── Main layout ────────────────────────────────────────────────────── */
  return (
    <OnboardingPage>
      <OnboardingNav />

      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "104px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32, alignItems: "start" }}>

          {/* ══ DESKTOP: two-column ══ */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,400px) 1fr", gap: 40, alignItems: "start" }}>

            {/* LEFT COLUMN — sticky */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
              style={{ position: "sticky", top: 88 }}
            >
              <motion.div variants={cardVariants}>
                <PageHeader
                  eyebrow="Partner Onboarding"
                  title="Become a Dravix SCM Partner"
                  description="Join India's trusted agricultural supply chain network. Submit your details — our team reviews every application before granting secure platform access."
                />
              </motion.div>

              <div style={{ marginTop: 32 }}>
                <SideTimeline />
              </div>

              <div style={{ marginTop: 24 }}>
                <TrustCards />
              </div>
            </motion.div>

            {/* RIGHT COLUMN — form */}
            <StaggerForms>
              <ServerError message={serverError} />

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                  {/* ── Card 1: Organization Details ── */}
                  <GlassCard variants={cardVariants}>
                    <SectionTitle icon={Building2}>Organization Details</SectionTitle>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <PremiumInput
                        label="Organization name *"
                        name="organizationName"
                        value={form.organizationName}
                        onChange={handleChange}
                        placeholder="e.g. Green Harvest Agro Pvt Ltd"
                        error={errors.organizationName}
                        icon={Building2}
                      />
                      <RoleSelector
                        value={form.roleRequested}
                        onChange={handleRoleSelect}
                        error={errors.roleRequested}
                      />
                    </div>
                  </GlassCard>

                  {/* ── Card 2: Contact Information ── */}
                  <GlassCard variants={cardVariants}>
                    <SectionTitle icon={User} accentRgb="6,182,212">Contact Information</SectionTitle>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20 }}>
                      <PremiumInput label="Contact person *" name="contactPerson" value={form.contactPerson} onChange={handleChange} placeholder="Full name" error={errors.contactPerson} icon={User} />
                      <PremiumInput label="Email address *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@company.com" error={errors.email} icon={Mail} />
                      <PremiumInput label="Phone number *" name="phone" inputMode="numeric" value={form.phone} onChange={handleChange} placeholder="9876543210" error={errors.phone} icon={Phone} />
                      <PremiumInput label="Website" name="website" value={form.website} onChange={handleChange} placeholder="https://example.com" optional />
                    </div>
                  </GlassCard>

                  {/* ── Card 3: Location Details ── */}
                  <GlassCard variants={cardVariants}>
                    <SectionTitle icon={MapPin} accentRgb="139,92,246">Location Details</SectionTitle>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20 }}>
                      <PremiumInput label="Country" name="country" value={form.country} onChange={handleChange} placeholder="India" />
                      <PremiumInput label="State" name="state" value={form.state} onChange={handleChange} placeholder="e.g. Tamil Nadu" />
                      <PremiumInput label="District" name="district" value={form.district} onChange={handleChange} placeholder="e.g. Coimbatore" />
                      <PremiumInput label="Postal code" name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="e.g. 641001" />
                      <div style={{ gridColumn: "1/-1" }}>
                        <PremiumTextarea label="Full address *" name="address" value={form.address} onChange={handleChange} placeholder="Street, area, landmark, city" error={errors.address} rows={3} />
                      </div>
                    </div>
                  </GlassCard>

                  {/* ── Card 4: Business Details ── */}
                  <GlassCard variants={cardVariants}>
                    <SectionTitle icon={FileText} accentRgb="245,158,11">Business Details</SectionTitle>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 20 }}>
                      <PremiumInput label="GST number" name="gstNumber" value={form.gstNumber} onChange={handleChange} placeholder="e.g. 33AADCB2230M1ZX" optional />
                      <PremiumInput label="Years of experience" name="yearsOfExperience" type="number" min="0" value={form.yearsOfExperience} onChange={handleChange} placeholder="e.g. 5" optional />
                      <div style={{ gridColumn: "1/-1" }}>
                        <PremiumTextarea label="Business description *" name="description" value={form.description} onChange={handleChange} placeholder="Describe your primary services, storage space, logistics fleet, etc." error={errors.description} rows={4} />
                      </div>
                    </div>
                  </GlassCard>

                  {/* ── Card 5: Terms ── */}
                  <GlassCard variants={cardVariants} style={{ padding: "24px 32px" }}>
                    <PremiumCheckbox
                      checked={agreed}
                      onChange={() => setModalOpen(true)}
                      error={errors.agreed}
                    >
                      I agree to the{" "}
                      <span
                        onClick={e => { e.stopPropagation(); setModalOpen(true); }}
                        style={{ color: T.em, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                      >
                        Dravix SCM Platform Guidelines &amp; Operational Policies
                      </span>
                    </PremiumCheckbox>
                  </GlassCard>

                  {/* ── Submit ── */}
                  <motion.div variants={cardVariants}>
                    <SubmitButton loading={loading} disabled={!agreed}>
                      <Send size={18} /> Submit Registration Request
                    </SubmitButton>
                  </motion.div>

                </div>
              </form>
            </StaggerForms>

          </div>
        </div>
      </div>

      {/* Guidelines modal */}
      <GuidelinesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAgree={() => { setAgreed(true); setModalOpen(false); if (errors.agreed) setErrors(p => ({ ...p, agreed: "" })); }}
      />
    </OnboardingPage>
  );
}