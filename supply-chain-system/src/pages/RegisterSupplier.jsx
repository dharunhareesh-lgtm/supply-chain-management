import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sprout, Warehouse, Truck, Building2, User, Mail, Phone, Lock,
  ArrowRight, ArrowLeft, Check, CheckCircle2, ShieldCheck, Clock,
  Snowflake, MapPin, AlertCircle, Loader2, Sparkles, HelpCircle, ChevronRight
} from "lucide-react";
import {
  AuthLayout, AuthCard, AuthTopBar, AuthHeader,
  AuthInput, AuthPasswordInput, AuthPrimaryButton,
  AuthError, AuthFooter
} from "../components/auth/AuthComponents";

const API = import.meta.env.VITE_API_URL || "";

const INDIAN_STATES = [
  "Tamil Nadu", "Andhra Pradesh", "Karnataka", "Kerala", "Telangana",
  "Maharashtra", "Gujarat", "Punjab", "Haryana", "Uttar Pradesh",
  "Madhya Pradesh", "Rajasthan", "Bihar", "West Bengal", "Odisha"
];

const FLEET_TYPES = [
  "Multi-Axle Heavy Trucks (16-32 Tonnes)",
  "Medium Commercial Trucks (7-15 Tonnes)",
  "Light Commercial Vehicles (Mini Trucks)",
  "Refrigerated / Cold-Chain Vans",
  "Mixed Agricultural Fleet"
];

const SERVICE_AREAS = [
  "Pan-India (Interstate)",
  "South India (TN, KA, KL, AP, TS)",
  "Intra-State (Tamil Nadu)",
  "District & Local Agri-Corridors"
];

function RegisterSupplier() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Selected Role: null | "FARMER" | "WAREHOUSE" | "LOGISTICS"
  const [selectedRole, setSelectedRole] = useState(() => {
    const roleParam = searchParams.get("role")?.toLowerCase();
    if (roleParam === "warehouse") return "WAREHOUSE";
    if (roleParam === "logistics") return "LOGISTICS";
    if (roleParam === "farmer" || roleParam === "supplier") return "FARMER";
    return null;
  });

  // Farmer Flow States
  // farmerStep: 0 = FPO question, 1 = Details (Name, Phone, Email), 2 = OTP, 3 = Password
  const [farmerStep, setFarmerStep] = useState(0);
  const [isFpoMember, setIsFpoMember] = useState(null); // true | false
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpVal, setOtpVal] = useState(["", "", "", "", "", ""]);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [resendCooldown, setResendCooldown] = useState(0);

  // Warehouse Flow States
  const [whForm, setWhForm] = useState({
    warehouseName: "",
    contactPerson: "",
    email: "",
    phone: "",
    state: "Tamil Nadu",
    district: "",
    address: "",
    totalCapacity: "",
    coldStorageAvailable: false,
    coldStorageCapacity: "",
    agreed: false
  });

  // Logistics Flow States
  const [logForm, setLogForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    state: "Tamil Nadu",
    district: "",
    serviceArea: SERVICE_AREAS[0],
    fleetType: FLEET_TYPES[0],
    fleetSize: "",
    agreed: false
  });

  // Common Submission States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null); // { type: "FARMER" | "WAREHOUSE" | "LOGISTICS", ... }

  // Resend OTP countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setError("");
    setFarmerStep(0);
    setIsFpoMember(null);
  };

  const handleResetRole = () => {
    setSelectedRole(null);
    setError("");
    setFarmerStep(0);
    setIsFpoMember(null);
    setSuccessData(null);
  };

  // ─────────────────────────────────────────────────────────────
  // PATH A: FARMER REGISTRATION HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleSelectFpoAffiliation = (isFpo) => {
    setIsFpoMember(isFpo);
    setFarmerStep(1);
    setError("");
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otpVal];
    newOtp[index] = value;
    setOtpVal(newOtp);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpVal[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleSendFarmerEmailOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/customer/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        setFarmerStep(2);
        setResendCooldown(30);
      } else {
        setError(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFarmerOtp = async (e) => {
    e.preventDefault();
    const otp = otpVal.join("");
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP sent to your email.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/api/customer/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp }),
      });
      const data = await res.json();
      if (data.success) {
        setFarmerStep(3);
      } else {
        setError(data.message || "Invalid or expired OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendFarmerOtp = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setError("");
    try {
      await fetch(`${API}/api/customer/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
    } catch (err) {
      setError("Failed to resend OTP.");
    }
  };

  const handleFinalFarmerRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const otp = otpVal.join("");
      const res = await fetch(`${API}/api/supplier/register-self`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          password,
          otp,
          isFpoMember: Boolean(isFpoMember),
          supplierType: isFpoMember ? "FPO_MEMBER" : "FARMER",
          verificationTier: "BASIC_REGISTERED",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessData({
          type: "FARMER",
          username: data.username || email,
          name: fullName.trim(),
          isFpoMember: Boolean(isFpoMember)
        });
      } else {
        setError(data.error || data.message || "Registration failed.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PATH B: WAREHOUSE OWNER SUBMISSION
  // ─────────────────────────────────────────────────────────────

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!whForm.warehouseName.trim() || whForm.warehouseName.trim().length < 3) {
      setError("Warehouse name must be at least 3 characters.");
      return;
    }
    if (!whForm.contactPerson.trim() || whForm.contactPerson.trim().length < 2) {
      setError("Please enter the owner or manager's name.");
      return;
    }
    if (!whForm.email.trim() || !whForm.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!whForm.phone.trim() || whForm.phone.trim().length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!whForm.district.trim()) {
      setError("Please enter the facility district.");
      return;
    }
    if (!whForm.totalCapacity || Number(whForm.totalCapacity) <= 0) {
      setError("Please enter a valid total storage capacity (MT).");
      return;
    }
    if (whForm.coldStorageAvailable && (!whForm.coldStorageCapacity || Number(whForm.coldStorageCapacity) <= 0)) {
      setError("Please enter cold storage capacity (MT).");
      return;
    }
    if (!whForm.agreed) {
      setError("You must agree to the Dravix SCM partner terms and conditions.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        organizationName: whForm.warehouseName.trim(),
        contactPerson: whForm.contactPerson.trim(),
        email: whForm.email.trim().toLowerCase(),
        phone: whForm.phone.trim(),
        roleRequested: "Warehouse",
        businessType: "Warehouse Storage Provider",
        country: "India",
        state: whForm.state,
        district: whForm.district.trim(),
        address: whForm.address.trim() || `${whForm.district.trim()}, ${whForm.state}`,
        totalCapacity: Number(whForm.totalCapacity),
        coldStorageAvailable: Boolean(whForm.coldStorageAvailable),
        coldStorageCapacity: whForm.coldStorageAvailable ? Number(whForm.coldStorageCapacity) : null,
        description: `Warehouse Facility: ${whForm.warehouseName.trim()} | Capacity: ${whForm.totalCapacity} MT | Cold Storage: ${whForm.coldStorageAvailable ? `${whForm.coldStorageCapacity} MT` : "None"}`
      };

      const res = await fetch(`${API}/api/public/partner-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessData({
          type: "WAREHOUSE",
          facilityName: whForm.warehouseName.trim(),
          contactPerson: whForm.contactPerson.trim(),
          email: whForm.email.trim().toLowerCase(),
          capacity: whForm.totalCapacity,
          coldStorage: whForm.coldStorageAvailable,
          coldCap: whForm.coldStorageCapacity,
          requestNumber: data.requestNumber
        });
      } else {
        setError(data.message || data.error || "Application submission failed.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PATH C: LOGISTICS PROVIDER SUBMISSION
  // ─────────────────────────────────────────────────────────────

  const handleLogisticsSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!logForm.companyName.trim() || logForm.companyName.trim().length < 3) {
      setError("Company or transporter name must be at least 3 characters.");
      return;
    }
    if (!logForm.contactPerson.trim() || logForm.contactPerson.trim().length < 2) {
      setError("Please enter the contact person's name.");
      return;
    }
    if (!logForm.phone.trim() || logForm.phone.trim().length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!logForm.email.trim() || !logForm.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!logForm.fleetSize || Number(logForm.fleetSize) <= 0) {
      setError("Please enter a valid fleet size (number of vehicles).");
      return;
    }
    if (!logForm.agreed) {
      setError("You must agree to the Dravix SCM partner terms and conditions.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        organizationName: logForm.companyName.trim(),
        contactPerson: logForm.contactPerson.trim(),
        email: logForm.email.trim().toLowerCase(),
        phone: logForm.phone.trim(),
        roleRequested: "Logistics Company",
        businessType: "Logistics & Transport Provider",
        country: "India",
        state: logForm.state,
        district: logForm.district.trim() || logForm.state,
        address: `${logForm.district.trim() || logForm.state}, ${logForm.state}`,
        yearsOfExperience: Number(logForm.fleetSize), // Store fleet size in integer slot
        description: `Service Area: ${logForm.serviceArea} | Fleet Type: ${logForm.fleetType} | Fleet Size: ${logForm.fleetSize} Vehicles`
      };

      const res = await fetch(`${API}/api/public/partner-registration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessData({
          type: "LOGISTICS",
          companyName: logForm.companyName.trim(),
          contactPerson: logForm.contactPerson.trim(),
          email: logForm.email.trim().toLowerCase(),
          fleetSize: logForm.fleetSize,
          fleetType: logForm.fleetType,
          serviceArea: logForm.serviceArea,
          requestNumber: data.requestNumber
        });
      } else {
        setError(data.message || data.error || "Application submission failed.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SUCCESS SCREENS RENDERING
  // ─────────────────────────────────────────────────────────────

  if (successData) {
    if (successData.type === "FARMER") {
      return (
        <AuthLayout>
          <AuthCard>
            <AuthTopBar backTo="/login" backLabel="Back to Login" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ textAlign: "center", padding: "32px 16px" }}
            >
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", border: "2px solid rgba(16,185,129,0.35)",
                boxShadow: "0 0 30px rgba(16,185,129,0.2)"
              }}>
                <ShieldCheck size={42} style={{ color: "#10b981" }} />
              </div>

              <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px", color: "#fff" }}>
                Welcome to Dravix SCM!
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "16px" }}>
                Your {successData.isFpoMember ? "FPO Member Farmer" : "Individual Farmer"} account has been activated.
              </p>

              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px", padding: "16px", margin: "16px 0", textAlign: "left"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Account Name:</span>
                  <span style={{ fontWeight: 600, color: "#fff" }}>{successData.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Login Email:</span>
                  <span style={{ fontWeight: 600, color: "#10b981" }}>{successData.username}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>Status:</span>
                  <span style={{ fontWeight: 700, color: "#10b981" }}>ACTIVE · INSTANT ACCESS</span>
                </div>
              </div>

              <div style={{
                background: successData.isFpoMember ? "rgba(139,92,246,0.08)" : "rgba(16,185,129,0.08)",
                border: `1px solid ${successData.isFpoMember ? "rgba(139,92,246,0.2)" : "rgba(16,185,129,0.2)"}`,
                borderRadius: "12px", padding: "14px", textAlign: "left", marginBottom: "24px"
              }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: successData.isFpoMember ? "#a78bfa" : "#10b981", marginBottom: "4px" }}>
                  {successData.isFpoMember ? "FPO SHARE CERTIFICATE VERIFICATION" : "LAND RECORD VERIFICATION"}
                </div>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.5, margin: 0 }}>
                  {successData.isFpoMember
                    ? "You have instant access to explore mandi prices and farm tools! When you are ready to sell collective produce, simply upload your FPO Share Certificate."
                    : "You have instant access to explore mandi prices and market forecast tools! When you are ready to list crops for sale, you'll complete Land Verification (Patta/Adangal)."}
                </p>
              </div>

              <button
                onClick={() => navigate("/login")}
                style={{
                  width: "100%", padding: "14px", background: "linear-gradient(135deg, #10b981, #059669)",
                  border: "none", borderRadius: "10px", color: "#fff", fontWeight: "700", cursor: "pointer",
                  fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 4px 14px rgba(16,185,129,0.3)"
                }}
              >
                Proceed to Login <ArrowRight size={18} />
              </button>
            </motion.div>
          </AuthCard>
        </AuthLayout>
      );
    }

    // Warehouse or Logistics Success Screen
    return (
      <AuthLayout>
        <AuthCard wide>
          <AuthTopBar backTo="/login" backLabel="Back to Login" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ textAlign: "center", padding: "32px 20px" }}
          >
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", border: "2px solid rgba(245,158,11,0.4)",
              boxShadow: "0 0 30px rgba(245,158,11,0.2)"
            }}>
              <Clock size={40} style={{ color: "#f59e0b" }} />
            </div>

            <div style={{
              display: "inline-block", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              color: "#fbbf24", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.05em", marginBottom: "12px"
            }}>
              PENDING ADMIN VERIFICATION
            </div>

            <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px", color: "#fff" }}>
              Application Submitted Successfully!
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", maxWidth: "560px", margin: "0 auto 20px" }}>
              {successData.type === "WAREHOUSE"
                ? `Our compliance team is reviewing your warehouse storage details. Once approved, your temporary login password will be dispatched to ${successData.email}.`
                : `Our compliance team is reviewing your transport fleet details. Once approved, your temporary login password will be dispatched to ${successData.email}.`}
            </p>

            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "14px", padding: "20px", margin: "20px auto", maxWidth: "560px", textAlign: "left"
            }}>
              {successData.type === "WAREHOUSE" ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Warehouse Name:</span>
                    <span style={{ fontWeight: 600, color: "#fff" }}>{successData.facilityName}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Manager:</span>
                    <span style={{ fontWeight: 600, color: "#fff" }}>{successData.contactPerson}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Capacity:</span>
                    <span style={{ fontWeight: 600, color: "#06b6d4" }}>{successData.capacity} MT (Cold: {successData.coldStorage ? `${successData.coldCap} MT` : "No"})</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Target Email:</span>
                    <span style={{ fontWeight: 600, color: "#f59e0b" }}>{successData.email}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Company Name:</span>
                    <span style={{ fontWeight: 600, color: "#fff" }}>{successData.companyName}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Contact Person:</span>
                    <span style={{ fontWeight: 600, color: "#fff" }}>{successData.contactPerson}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Fleet Size:</span>
                    <span style={{ fontWeight: 600, color: "#a78bfa" }}>{successData.fleetSize} Vehicles ({successData.fleetType})</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ color: "rgba(255,255,255,0.5)" }}>Target Email:</span>
                    <span style={{ fontWeight: 600, color: "#f59e0b" }}>{successData.email}</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "24px" }}>
              <button
                onClick={() => navigate("/")}
                style={{
                  padding: "12px 24px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px"
                }}
              >
                Back to Home
              </button>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "12px 28px", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", border: "none",
                  borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px",
                  display: "flex", alignItems: "center", gap: "6px"
                }}
              >
                Go to Login <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </AuthCard>
      </AuthLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // FIRST SCREEN: 3-ROLE SELECTION
  // ─────────────────────────────────────────────────────────────

  if (!selectedRole) {
    return (
      <AuthLayout>
        <AuthCard wide>
          <AuthTopBar backTo="/login" backLabel="Back to Login" />

          <AuthHeader
            title="How do you want to join Dravix SCM?"
            subtitle="Select your partner role to begin your specialized onboarding process."
            center
          />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, staggerChildren: 0.1 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              marginTop: "28px"
            }}
          >
            {/* 1. Farmer Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect("FARMER")}
              style={{
                background: "radial-gradient(circle at top left, rgba(16,185,129,0.12), rgba(13,17,29,0.95))",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: "18px",
                padding: "26px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(16,185,129,0.6)";
                e.currentTarget.style.boxShadow = "0 14px 35px rgba(16,185,129,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(16,185,129,0.25)";
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
              }}
            >
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start",
                background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)",
                color: "#10b981", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "12px",
                marginBottom: "18px"
              }}>
                <Sparkles size={12} /> INSTANT ACCESS VIA OTP
              </div>

              <div style={{
                width: "56px", height: "56px", borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.05))",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
                border: "1px solid rgba(16,185,129,0.3)"
              }}>
                <Sprout size={30} style={{ color: "#10b981" }} />
              </div>

              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
                Farmer
              </h3>
              <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: "20px", flex: 1 }}>
                Individual farmers & FPO members producing and selling agricultural produce directly with AI pricing intelligence.
              </p>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)",
                fontSize: "13px", fontWeight: 700, color: "#10b981"
              }}>
                <span>Join as Farmer</span>
                <ArrowRight size={16} />
              </div>
            </motion.div>

            {/* 2. Warehouse Owner Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect("WAREHOUSE")}
              style={{
                background: "radial-gradient(circle at top left, rgba(6,182,212,0.12), rgba(13,17,29,0.95))",
                border: "1px solid rgba(6,182,212,0.25)",
                borderRadius: "18px",
                padding: "26px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(6,182,212,0.6)";
                e.currentTarget.style.boxShadow = "0 14px 35px rgba(6,182,212,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(6,182,212,0.25)";
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
              }}
            >
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start",
                background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)",
                color: "#06b6d4", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "12px",
                marginBottom: "18px"
              }}>
                <ShieldCheck size={12} /> ADMIN VERIFIED ONBOARDING
              </div>

              <div style={{
                width: "56px", height: "56px", borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(6,182,212,0.05))",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
                border: "1px solid rgba(6,182,212,0.3)"
              }}>
                <Warehouse size={30} style={{ color: "#06b6d4" }} />
              </div>

              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
                Warehouse Owner
              </h3>
              <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: "20px", flex: 1 }}>
                Facility operators providing standard dry storage & cold storage for agricultural bulk commodities.
              </p>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)",
                fontSize: "13px", fontWeight: 700, color: "#06b6d4"
              }}>
                <span>Apply as Warehouse</span>
                <ArrowRight size={16} />
              </div>
            </motion.div>

            {/* 3. Logistics Provider Card */}
            <motion.div
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect("LOGISTICS")}
              style={{
                background: "radial-gradient(circle at top left, rgba(139,92,246,0.12), rgba(13,17,29,0.95))",
                border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: "18px",
                padding: "26px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflow: "hidden",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)";
                e.currentTarget.style.boxShadow = "0 14px 35px rgba(139,92,246,0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(139,92,246,0.25)";
                e.currentTarget.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
              }}
            >
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start",
                background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)",
                color: "#a78bfa", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "12px",
                marginBottom: "18px"
              }}>
                <ShieldCheck size={12} /> ADMIN VERIFIED ONBOARDING
              </div>

              <div style={{
                width: "56px", height: "56px", borderRadius: "14px",
                background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(139,92,246,0.05))",
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
                border: "1px solid rgba(139,92,246,0.3)"
              }}>
                <Truck size={30} style={{ color: "#a78bfa" }} />
              </div>

              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>
                Logistics Provider
              </h3>
              <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: "20px", flex: 1 }}>
                Commercial transport companies and fleet operators moving produce across farm-to-warehouse corridors.
              </p>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)",
                fontSize: "13px", fontWeight: 700, color: "#a78bfa"
              }}>
                <span>Apply as Logistics</span>
                <ArrowRight size={16} />
              </div>
            </motion.div>
          </motion.div>

          <AuthFooter
            text="Already registered with Dravix SCM?"
            linkText="Sign In"
            linkTo="/login"
          />
        </AuthCard>
      </AuthLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PATH A: FARMER REGISTRATION SCREENS
  // ─────────────────────────────────────────────────────────────

  if (selectedRole === "FARMER") {
    // Step 0: FPO Affiliation Question
    if (farmerStep === 0) {
      return (
        <AuthLayout>
          <AuthCard wide>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <button
                onClick={handleResetRole}
                style={{
                  background: "none", border: "none", color: "#10b981", fontSize: "13px",
                  fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px"
                }}
              >
                <ArrowLeft size={16} /> Change Role
              </button>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Farmer Onboarding</span>
            </div>

            <AuthHeader
              title="Are you a member of an FPO?"
              subtitle="Select your organizational affiliation to set the correct verification protocol."
              center
            />

            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
              gap: "20px", marginTop: "28px"
            }}>
              {/* Option 1: FPO Member */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectFpoAffiliation(true)}
                style={{
                  background: "radial-gradient(circle at top left, rgba(139,92,246,0.12), rgba(13,17,29,0.95))",
                  border: "1px solid rgba(139,92,246,0.3)",
                  borderRadius: "16px",
                  padding: "24px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                <div style={{
                  width: "50px", height: "50px", borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(139,92,246,0.05))",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Building2 size={26} style={{ color: "#a78bfa" }} />
                </div>
                <div>
                  <h4 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
                    YES, I AM AN FPO MEMBER
                  </h4>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                    Affiliated with a registered Farmer Producer Company or Society. Verify produce listing using your <strong>FPO Share Certificate</strong>.
                  </p>
                </div>
                <div style={{ marginTop: "auto", fontSize: "12px", fontWeight: 700, color: "#a78bfa", display: "flex", alignItems: "center", gap: "4px" }}>
                  Select FPO Affiliation <ChevronRight size={14} />
                </div>
              </motion.div>

              {/* Option 2: Individual Farmer */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectFpoAffiliation(false)}
                style={{
                  background: "radial-gradient(circle at top left, rgba(16,185,129,0.12), rgba(13,17,29,0.95))",
                  border: "1px solid rgba(16,185,129,0.3)",
                  borderRadius: "16px",
                  padding: "24px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px"
                }}
              >
                <div style={{
                  width: "50px", height: "50px", borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(16,185,129,0.05))",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  <Sprout size={26} style={{ color: "#10b981" }} />
                </div>
                <div>
                  <h4 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
                    NO, I AM AN INDIVIDUAL FARMER
                  </h4>
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                    Independent farming producer. Verify your produce listing via your <strong>Land Records (Patta / Adangal / Chitta)</strong>.
                  </p>
                </div>
                <div style={{ marginTop: "auto", fontSize: "12px", fontWeight: 700, color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                  Select Individual Farmer <ChevronRight size={14} />
                </div>
              </motion.div>
            </div>
          </AuthCard>
        </AuthLayout>
      );
    }

    // Farmer Form Steps: 1=Details, 2=OTP, 3=Password
    return (
      <AuthLayout>
        <AuthCard>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <button
              onClick={() => {
                if (farmerStep === 1) setFarmerStep(0);
                else setFarmerStep((s) => s - 1);
              }}
              style={{
                background: "none", border: "none", color: "#10b981", fontSize: "13px",
                fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px"
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={handleResetRole}
              style={{
                background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "12px",
                cursor: "pointer"
              }}
            >
              Change Role
            </button>
          </div>

          <AuthHeader
            title={isFpoMember ? "FPO Member Registration" : "Individual Farmer Registration"}
            subtitle={`Step ${farmerStep} of 3 · ${
              farmerStep === 1 ? "Contact Details" : farmerStep === 2 ? "Verify Email" : "Secure Account"
            }`}
          />

          {/* Step Progress Bar */}
          <div style={{ display: "flex", gap: "4px", marginBottom: "24px" }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1, height: "3px", borderRadius: "2px",
                  background: s <= farmerStep ? "#10b981" : "rgba(255,255,255,0.08)",
                  transition: "background 0.3s"
                }}
              />
            ))}
          </div>

          {error && <AuthError message={error} />}

          {/* STEP 1: Details */}
          {farmerStep === 1 && (
            <form onSubmit={handleSendFarmerEmailOtp}>
              <AuthInput
                label="Full Name"
                icon={User}
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <AuthInput
                label="Mobile Number"
                icon={Phone}
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
              />

              <AuthInput
                label="Email Address"
                icon={Mail}
                type="email"
                placeholder="e.g. ramesh@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div style={{ marginTop: "24px" }}>
                <AuthPrimaryButton loading={loading}>
                  Send Email OTP <ArrowRight size={16} />
                </AuthPrimaryButton>
              </div>
            </form>
          )}

          {/* STEP 2: Verify OTP */}
          {farmerStep === 2 && (
            <form onSubmit={handleVerifyFarmerOtp}>
              <div style={{
                textAlign: "center", marginBottom: "20px", padding: "12px",
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px"
              }}>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>6-digit verification code sent to:</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#10b981", marginTop: "2px" }}>{email}</div>
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "20px" }}>
                {otpVal.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    style={{
                      width: "44px", height: "52px", textAlign: "center", fontSize: "20px", fontWeight: 700,
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "10px", color: "#fff", outline: "none"
                    }}
                  />
                ))}
              </div>

              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                {resendCooldown > 0 ? (
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                    Resend code in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendFarmerOtp}
                    style={{ background: "none", border: "none", color: "#10b981", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Resend Verification Code
                  </button>
                )}
              </div>

              <AuthPrimaryButton loading={loading}>
                Verify OTP <Check size={16} />
              </AuthPrimaryButton>
            </form>
          )}

          {/* STEP 3: Set Password */}
          {farmerStep === 3 && (
            <form onSubmit={handleFinalFarmerRegister}>
              <div style={{
                marginBottom: "20px", padding: "12px 16px", background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", fontSize: "13px"
              }}>
                <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>Registering Account For:</div>
                <div style={{ color: "#fff", fontWeight: 700 }}>{fullName} · {email}</div>
                <div style={{ color: isFpoMember ? "#a78bfa" : "#10b981", fontSize: "12px", marginTop: "2px", fontWeight: 600 }}>
                  {isFpoMember ? "FPO Member Account" : "Individual Farmer Account"}
                </div>
              </div>

              <AuthPasswordInput
                label="Create Password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <AuthPasswordInput
                label="Confirm Password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div style={{ marginTop: "24px" }}>
                <AuthPrimaryButton loading={loading}>
                  Complete Registration <ArrowRight size={16} />
                </AuthPrimaryButton>
              </div>
            </form>
          )}
        </AuthCard>
      </AuthLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PATH B: WAREHOUSE OWNER APPLICATION FORM
  // ─────────────────────────────────────────────────────────────

  if (selectedRole === "WAREHOUSE") {
    return (
      <AuthLayout>
        <AuthCard wide>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <button
              onClick={handleResetRole}
              style={{
                background: "none", border: "none", color: "#06b6d4", fontSize: "13px",
                fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px"
              }}
            >
              <ArrowLeft size={16} /> Change Role
            </button>
            <span style={{
              fontSize: "11px", fontWeight: 700, color: "#06b6d4",
              background: "rgba(6,182,212,0.1)", padding: "4px 10px", borderRadius: "10px"
            }}>
              WAREHOUSE ONBOARDING
            </span>
          </div>

          <AuthHeader
            title="Warehouse Owner Application"
            subtitle="Register storage facilities for platform verification. Credentials issued upon admin approval."
          />

          {error && <AuthError message={error} />}

          <form onSubmit={handleWarehouseSubmit} style={{ marginTop: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
              <AuthInput
                label="Warehouse / Facility Name"
                icon={Warehouse}
                placeholder="e.g. Coimbatore Agri Cold Hub"
                value={whForm.warehouseName}
                onChange={(e) => setWhForm({ ...whForm, warehouseName: e.target.value })}
                required
              />

              <AuthInput
                label="Owner / Manager Name"
                icon={User}
                placeholder="e.g. K. Sundaram"
                value={whForm.contactPerson}
                onChange={(e) => setWhForm({ ...whForm, contactPerson: e.target.value })}
                required
              />

              <AuthInput
                label="Email Address"
                icon={Mail}
                type="email"
                placeholder="e.g. sundaram@agrihub.com"
                value={whForm.email}
                onChange={(e) => setWhForm({ ...whForm, email: e.target.value })}
                required
              />

              <AuthInput
                label="Phone Number"
                icon={Phone}
                type="tel"
                placeholder="10-digit mobile number"
                value={whForm.phone}
                onChange={(e) => setWhForm({ ...whForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                required
              />

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
                  State
                </label>
                <select
                  value={whForm.state}
                  onChange={(e) => setWhForm({ ...whForm, state: e.target.value })}
                  style={{
                    width: "100%", height: "46px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "10px", padding: "0 12px", color: "#fff", outline: "none", fontSize: "14px"
                  }}
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st} style={{ background: "#0d111d", color: "#fff" }}>{st}</option>
                  ))}
                </select>
              </div>

              <AuthInput
                label="District"
                icon={MapPin}
                placeholder="e.g. Coimbatore"
                value={whForm.district}
                onChange={(e) => setWhForm({ ...whForm, district: e.target.value })}
                required
              />

              <div style={{ gridColumn: "1 / -1" }}>
                <AuthInput
                  label="Detailed Location / Address"
                  icon={MapPin}
                  placeholder="Facility street address, survey no, or industrial estate"
                  value={whForm.address}
                  onChange={(e) => setWhForm({ ...whForm, address: e.target.value })}
                  required
                />
              </div>

              <AuthInput
                label="Total Storage Capacity (Metric Tonnes)"
                icon={Warehouse}
                type="number"
                placeholder="e.g. 5000"
                value={whForm.totalCapacity}
                onChange={(e) => setWhForm({ ...whForm, totalCapacity: e.target.value })}
                required
              />

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
                  Cold Storage Available?
                </label>
                <select
                  value={whForm.coldStorageAvailable ? "yes" : "no"}
                  onChange={(e) => setWhForm({ ...whForm, coldStorageAvailable: e.target.value === "yes" })}
                  style={{
                    width: "100%", height: "46px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "10px", padding: "0 12px", color: "#fff", outline: "none", fontSize: "14px"
                  }}
                >
                  <option value="no" style={{ background: "#0d111d" }}>No — Ambient Storage Only</option>
                  <option value="yes" style={{ background: "#0d111d" }}>Yes — Temperature Controlled</option>
                </select>
              </div>

              {whForm.coldStorageAvailable && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <AuthInput
                    label="Cold Storage Capacity (Metric Tonnes)"
                    icon={Snowflake}
                    type="number"
                    placeholder="e.g. 1500"
                    value={whForm.coldStorageCapacity}
                    onChange={(e) => setWhForm({ ...whForm, coldStorageCapacity: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: "20px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <input
                type="checkbox"
                id="whTerms"
                checked={whForm.agreed}
                onChange={(e) => setWhForm({ ...whForm, agreed: e.target.checked })}
                style={{ marginTop: "3px", cursor: "pointer" }}
              />
              <label htmlFor="whTerms" style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, cursor: "pointer" }}>
                I confirm the facility specifications submitted are truthful and comply with Dravix SCM warehousing and security guidelines.
              </label>
            </div>

            <div style={{ marginTop: "24px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "14px", background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                  border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 4px 15px rgba(6,182,212,0.3)"
                }}
              >
                {loading ? <Loader2 size={18} className="spin" /> : "Submit Warehouse Application"} <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </AuthCard>
      </AuthLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PATH C: LOGISTICS PROVIDER APPLICATION FORM
  // ─────────────────────────────────────────────────────────────

  return (
    <AuthLayout>
      <AuthCard wide>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <button
            onClick={handleResetRole}
            style={{
              background: "none", border: "none", color: "#a78bfa", fontSize: "13px",
              fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px"
            }}
          >
            <ArrowLeft size={16} /> Change Role
          </button>
          <span style={{
            fontSize: "11px", fontWeight: 700, color: "#a78bfa",
            background: "rgba(139,92,246,0.1)", padding: "4px 10px", borderRadius: "10px"
          }}>
            LOGISTICS ONBOARDING
          </span>
        </div>

        <AuthHeader
          title="Logistics Provider Application"
          subtitle="Register your transport fleet for platform verification. Credentials issued upon admin approval."
        />

        {error && <AuthError message={error} />}

        <form onSubmit={handleLogisticsSubmit} style={{ marginTop: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <AuthInput
              label="Company / Transporter Name"
              icon={Truck}
              placeholder="e.g. Dravix Express Agri Cargo"
              value={logForm.companyName}
              onChange={(e) => setLogForm({ ...logForm, companyName: e.target.value })}
              required
            />

            <AuthInput
              label="Owner / Contact Person Name"
              icon={User}
              placeholder="e.g. Muthukumar V."
              value={logForm.contactPerson}
              onChange={(e) => setLogForm({ ...logForm, contactPerson: e.target.value })}
              required
            />

            <AuthInput
              label="Phone Number"
              icon={Phone}
              type="tel"
              placeholder="10-digit mobile number"
              value={logForm.phone}
              onChange={(e) => setLogForm({ ...logForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              required
            />

            <AuthInput
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="e.g. cargo@dravixexpress.com"
              value={logForm.email}
              onChange={(e) => setLogForm({ ...logForm, email: e.target.value })}
              required
            />

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
                Service Area / Coverage
              </label>
              <select
                value={logForm.serviceArea}
                onChange={(e) => setLogForm({ ...logForm, serviceArea: e.target.value })}
                style={{
                  width: "100%", height: "46px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px", padding: "0 12px", color: "#fff", outline: "none", fontSize: "14px"
                }}
              >
                {SERVICE_AREAS.map((area) => (
                  <option key={area} value={area} style={{ background: "#0d111d" }}>{area}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
                Primary Fleet / Vehicle Type
              </label>
              <select
                value={logForm.fleetType}
                onChange={(e) => setLogForm({ ...logForm, fleetType: e.target.value })}
                style={{
                  width: "100%", height: "46px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px", padding: "0 12px", color: "#fff", outline: "none", fontSize: "14px"
                }}
              >
                {FLEET_TYPES.map((type) => (
                  <option key={type} value={type} style={{ background: "#0d111d" }}>{type}</option>
                ))}
              </select>
            </div>

            <AuthInput
              label="Fleet Size (Operational Vehicles)"
              icon={Truck}
              type="number"
              placeholder="e.g. 15"
              value={logForm.fleetSize}
              onChange={(e) => setLogForm({ ...logForm, fleetSize: e.target.value })}
              required
            />

            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "6px" }}>
                Operational State
              </label>
              <select
                value={logForm.state}
                onChange={(e) => setLogForm({ ...logForm, state: e.target.value })}
                style={{
                  width: "100%", height: "46px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px", padding: "0 12px", color: "#fff", outline: "none", fontSize: "14px"
                }}
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st} style={{ background: "#0d111d" }}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: "20px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <input
              type="checkbox"
              id="logTerms"
              checked={logForm.agreed}
              onChange={(e) => setLogForm({ ...logForm, agreed: e.target.checked })}
              style={{ marginTop: "3px", cursor: "pointer" }}
            />
            <label htmlFor="logTerms" style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, cursor: "pointer" }}>
              I confirm the transport fleet data is valid and our vehicles are equipped to handle safe agricultural transit in compliance with platform policies.
            </label>
          </div>

          <div style={{ marginTop: "24px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "14px", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: "0 4px 15px rgba(139,92,246,0.3)"
              }}
            >
              {loading ? <Loader2 size={18} className="spin" /> : "Submit Logistics Application"} <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}

export default RegisterSupplier;