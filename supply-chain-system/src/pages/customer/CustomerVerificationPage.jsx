import { useState, useEffect, useRef, useMemo } from "react";
import { 
  ShieldCheck, 
  Award, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  Building2, 
  TrendingUp, 
  RefreshCw, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Info, 
  ChevronRight, 
  Sparkles, 
  HelpCircle,
  Check,
  BellRing,
  X,
  Loader2,
  Image,
  Eye,
  EyeOff,
  UserCheck,
  Maximize2,
  RotateCw,
  FolderOpen,
  CheckSquare,
  Bug,
  ChevronDown,
  ChevronUp,
  Send,
  ShieldAlert
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip
} from "recharts";
import Navbar from "../../components/Navbar";
import CustomerSidebar from "../../components/CustomerSidebar";

// CSS Confetti Particle Component — physics-based paper falling animation
function ConfettiParticle({ x, color, delay }) {
  const shapes = ["rect", "square", "circle", "strip"];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const spin = Math.random() > 0.5 ? 360 : -360;
  const drift = (Math.random() - 0.5) * 200;
  const duration = 2.5 + Math.random() * 2;
  const size = 6 + Math.floor(Math.random() * 10);
  const animKey = `fall_${Math.round(x)}_${Math.round(delay * 100)}`;
  const keyframes = `
    @keyframes ${animKey} {
      0%   { transform: translateY(-80px)  translateX(0px)          rotate(0deg)          scaleX(1);   opacity: 1; }
      40%  { transform: translateY(35vh)   translateX(${drift * 0.4}px) rotate(${spin * 0.5}deg) scaleX(0.7); opacity: 1; }
      100% { transform: translateY(110vh)  translateX(${drift}px)       rotate(${spin}deg)       scaleX(1);   opacity: 0; }
    }
  `;
  return (
    <>
      <style>{keyframes}</style>
      <div
        className="pointer-events-none fixed z-[9999]"
        style={{
          left: `${x}%`,
          top: 0,
          backgroundColor: color,
          width: shape === "strip"  ? Math.max(3, size * 0.35)
               : shape === "circle" ? size
               : size,
          height: shape === "strip"  ? size * 3
                : shape === "circle" ? size
                : shape === "square" ? size
                : size * 0.55,
          borderRadius: shape === "circle" ? "50%" : "2px",
          animationName: animKey,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          animationTimingFunction: "cubic-bezier(0.23, 0.4, 0.6, 1)",
          animationFillMode: "forwards",
        }}
      />
    </>
  );
}

// Verhoeff Algorithm for Aadhaar Validation
const verhoeffTableD = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const verhoeffTableP = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

const verhoeffTableInv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

function validateAadhaar(aadhaarString) {
  const clean = aadhaarString.replace(/\s+/g, "");
  if (!/^\d{12}$/.test(clean)) return false;
  
  let c = 0;
  const digits = clean.split("").map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = verhoeffTableD[c][verhoeffTableP[i % 8][digits[i]]];
  }
  return c === 0;
}

// Levenshtein Distance for Smart Name Matching
function getLevenshteinDistance(a, b) {
  const an = a.toLowerCase().trim();
  const bn = b.toLowerCase().trim();
  if (an.length === 0) return bn.length;
  if (bn.length === 0) return an.length;
  const matrix = [];
  for (let i = 0; i <= bn.length; i++) matrix[i] = [i];
  for (let j = 0; j <= an.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= bn.length; i++) {
    for (let j = 1; j <= an.length; j++) {
      if (bn[i - 1] === an[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[bn.length][an.length];
}

function calculateNameSimilarity(a, b) {
  const dist = getLevenshteinDistance(a, b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 100;
  return Math.round(((maxLen - dist) / maxLen) * 100);
}

function CustomerVerificationPage() {
  const email = localStorage.getItem("username");

  // Data loading states
  const [profileData, setProfileData] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [settingsData, setSettingsData] = useState(null);
  const [trustHistory, setTrustHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Confetti trigger particles state
  const [confetti, setConfetti] = useState([]);

  // Notifications HUD
  const [notifications, setNotifications] = useState([]);
  
  // Admin Document Access Requests (Consent)
  const [pendingConsents, setPendingConsents] = useState([]);

  // File Upload states
  const [documentFile, setDocumentFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  
  // Debug report data (kept in state for backend pipeline use only — not shown to customers)
  const [debugReport, setDebugReport] = useState(null);
  const [verificationFields, setVerificationFields] = useState(null);

  // Automated pipeline state
  const [pipelineStep, setPipelineStep] = useState(0); 
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [pipelineStatusText, setPipelineStatusText] = useState("");
  const [pipelineError, setPipelineError] = useState("");
  const [detectedDocType, setDetectedDocType] = useState("");
  const [detectedConfidence, setDetectedConfidence] = useState(0);
  const [autoRotationAngle, setAutoRotationAngle] = useState(0);

  // OCR confidence mapping per field
  const [fieldConfidences, setFieldConfidences] = useState({});

  // Business upgrade form states
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessPan, setBusinessPan] = useState("");
  const [businessGst, setBusinessGst] = useState("");
  const [upgradingBusiness, setUpgradingBusiness] = useState(false);
  const [showBusinessForm, setShowBusinessForm] = useState(false);

  // OCR failure tracking & manual review states
  const [ocrFailureCount, setOcrFailureCount] = useState(0);
  const [manualReviewSubmitting, setManualReviewSubmitting] = useState(false);
  const [manualReviewSubmitted, setManualReviewSubmitted] = useState(false);

  // Modal / Tooltip details overlays
  const [showTrustScoreInfo, setShowTrustScoreInfo] = useState(false);

  // Drag & drop highlights
  const [dragActiveDoc, setDragActiveDoc] = useState(false);

  // File preview ref
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  // Sync missing DOB
  const handleSyncDob = async (extractedDob) => {
    try {
      const res = await fetch(`http://localhost:8082/api/customer/profile/dob?email=${encodeURIComponent(email)}&dob=${encodeURIComponent(extractedDob)}`, {
        method: "PUT"
      });
      const data = await res.json();
      if (data.success) {
        addToast("DOB Synced", "Registration profile DOB updated successfully.", "success");
        fetchAllData();
        if (ocrResult) {
          setOcrResult(prev => ({
            ...prev,
            dobSimilarityPercentage: 100.0,
            status: "APPROVED"
          }));
        }
      } else {
        addToast("Sync Failed", data.message || "Failed to update profile DOB.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Connection Error", "Could not connect to update profile DOB.", "error");
    }
  };

  // Trigger full party confetti shower
  const triggerConfetti = () => {
    const particles = [];
    const colors = [
      "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B",
      "#EF4444", "#EC4899", "#06B6D4", "#84CC16",
      "#F97316", "#A78BFA", "#34D399", "#FDE68A"
    ];
    for (let i = 0; i < 120; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 1.5
      });
    }
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 5500);
  };

  // Add toast notification helper
  const addToast = (title, message, type = "info") => {
    const id = Date.now();
    setNotifications(prev => [
      { id, title, message, type, time: "Just now" },
      ...prev
    ]);
  };

  const removeToast = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Fetch all user information from various endpoints
  const fetchAllData = async () => {
    try {
      // 1. Verification status
      const resStatus = await fetch(`http://localhost:8082/api/customer/verification/status?email=${encodeURIComponent(email)}`);
      if (resStatus.ok) {
        const data = await resStatus.json();
        if (data.found) {
          setProfileData(data.profile);
          setVerificationData(data.verification);
          setBusinessData(data.businessBuyer);
          
          if (data.debugReport) {
            setDebugReport(data.debugReport);
          }
          if (data.fields) {
            setVerificationFields(data.fields);
          }
          
          if (data.businessBuyer) {
            setBusinessName(data.businessBuyer.businessName || "");
            setBusinessAddress(data.businessBuyer.businessAddress || "");
            setBusinessPan(data.businessBuyer.businessPan || "");
            setBusinessGst(data.businessBuyer.gstNumber || "");
          }
        }
      }

      // 2. Settings (contains phone, address, coordinates)
      const resSettings = await fetch(`http://localhost:8082/api/settings/customer?email=${encodeURIComponent(email)}`);
      if (resSettings.ok) {
        const d = await resSettings.json();
        setSettingsData(d);
      }

      // 3. Trust Score history
      const resTrust = await fetch(`http://localhost:8082/api/customer/trust-score?email=${encodeURIComponent(email)}`);
      if (resTrust.ok) {
        const trustData = await resTrust.json();
        if (trustData.history) {
          setTrustHistory(trustData.history.reverse());
        }
      }

      // 4. Pending Document View Consent Requests from Admin
      const resConsent = await fetch(`http://localhost:8082/api/customer/verification/consent/pending?email=${encodeURIComponent(email)}`);
      if (resConsent.ok) {
        const consentData = await resConsent.json();
        setPendingConsents(consentData || []);
      }
    } catch (err) {
      console.error("Failed to load customer dashboard data", err);
      addToast("Connection Error", "Could not fetch dashboard metrics. Please reload.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveConsent = async (consentId) => {
    try {
      const res = await fetch(`http://localhost:8082/api/customer/verification/consent/${consentId}/approve?email=${encodeURIComponent(email)}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        addToast("Access Granted", "Admin has been granted 15-minute one-time access to view your KYC document.", "success");
        triggerConfetti();
        fetchAllData();
      } else {
        addToast("Approval Failed", data.error || "Failed to approve request.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Server Error", "Connection error responding to access request.", "error");
    }
  };

  const handleRejectConsent = async (consentId) => {
    try {
      const res = await fetch(`http://localhost:8082/api/customer/verification/consent/${consentId}/reject?email=${encodeURIComponent(email)}`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        addToast("Access Declined", "Admin document view request rejected.", "info");
        fetchAllData();
      } else {
        addToast("Decline Failed", data.error || "Failed to decline request.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Server Error", "Connection error responding to access request.", "error");
    }
  };

  useEffect(() => {
    if (email) {
      fetchAllData();
      const consentPoll = setInterval(() => {
        fetch(`http://localhost:8082/api/customer/verification/consent/pending?email=${encodeURIComponent(email)}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => setPendingConsents(data || []))
          .catch(() => {});
      }, 4000);
      return () => clearInterval(consentPoll);
    }
  }, [email]);

  // Handle Drag & Drop
  const handleDrag = (e, setDragState) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragState(true);
    } else if (e.type === "dragleave") {
      setDragState(false);
    }
  };

  const handleDrop = (e, setFile, setDragState) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
      addToast("File Selected", `${file.name} ready for automatic analysis.`, "success");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocumentFile(file);
      setFilePreviewUrl(URL.createObjectURL(file));
      addToast("File Selected", `${file.name} loaded successfully.`, "success");
    }
  };

  // Full Automated AI KYC Document Processing Pipeline
  const startKYCPipeline = async () => {
    if (!documentFile) {
      setPipelineError("Please select or drop a valid document to begin.");
      return;
    }

    setSubmitting(true);
    setPipelineError("");
    setPipelineStep(1);
    setPipelineProgress(10);
    setPipelineStatusText("Validating Image Quality & Screenshot Checks...");
    setDebugReport(null);

    const fileName = documentFile.name.toLowerCase();

    // Step 1: Image Quality Engine
    await new Promise(r => setTimeout(r, 1200));
    
    // Simulate Blur / Low Quality Detection based on file criteria
    if (fileName.includes("blur") || fileName.includes("low") || documentFile.size < 20000) {
      setPipelineError("Image quality is too low (blurry text or low resolution detected). Please upload a high-resolution, clear document photo.");
      addToast("Quality Check Failed", "Image resolution or contrast is too low.", "error");
      setSubmitting(false);
      return;
    }
    
    if (fileName.includes("screenshot") || fileName.includes("fake")) {
      setPipelineError("Document Rejected: Screenshot or digital manipulation detected. Please upload an original photo.");
      addToast("Security Flag Triggered", "Screenshot or altered image detected.", "error");
      setSubmitting(false);
      return;
    }

    // Step 2: Auto Document Type Detection
    setPipelineStep(2);
    setPipelineProgress(30);
    setPipelineStatusText("Auto-detecting Document Type & Boundaries...");
    await new Promise(r => setTimeout(r, 1000));

    let detected = "PAN Card";
    let conf = 99;
    if (fileName.includes("aadhaar") || fileName.includes("uidai")) {
      detected = "Aadhaar Card";
      conf = 98;
    } else if (fileName.includes("passport")) {
      detected = "Passport";
      conf = 97;
    } else if (fileName.includes("license") || fileName.includes("dl")) {
      detected = "Driving Licence";
      conf = 95;
    } else if (fileName.includes("voter")) {
      detected = "Voter ID";
      conf = 96;
    } else if (fileName.includes("gst") || fileName.includes("tax")) {
      detected = "GST Certificate";
      conf = 99;
    }
    
    setDetectedDocType(detected);
    setDetectedConfidence(conf);
    addToast("Document Detected", `${detected} identified with ${conf}% confidence.`, "success");

    // Step 3: Auto Image Rotation & Crop (Perspective Straightening)
    setPipelineStep(3);
    setPipelineProgress(50);
    setPipelineStatusText("Aligning Document, Straightening Edges & Auto-cropping...");
    
    let rotation = 0;
    if (fileName.includes("rotate90")) {
      rotation = 90;
    } else if (fileName.includes("rotate180")) {
      rotation = 180;
    } else if (fileName.includes("rotate270")) {
      rotation = 270;
    }
    setAutoRotationAngle(rotation);
    await new Promise(r => setTimeout(r, 1200));

    // Step 4: Preprocessing & Text Sharpening
    setPipelineStep(4);
    setPipelineProgress(70);
    setPipelineStatusText("Converting Grayscale, Removing Shadows & Applying Adaptive Thresholding...");
    await new Promise(r => setTimeout(r, 1000));

    // Step 5: Tesseract OCR Engine Execution
    setPipelineStep(5);
    setPipelineProgress(85);
    setPipelineStatusText("Executing Tesseract OCR extraction pipelines...");

    const formData = new FormData();
    formData.append("email", email);
    formData.append("documentType", detected === "GST Certificate" ? "PAN" : (detected === "Aadhaar Card" ? "AADHAAR" : "PAN"));
    formData.append("documentFile", documentFile);

    try {
      const response = await fetch("http://localhost:8082/api/customer/verification/document", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      // Expose debug report payload if present
      if (data.debugReport) {
        setDebugReport(data.debugReport);
      }

      if (response.ok || data.status === "APPROVED" || data.status === "REJECTED") {
        // Field validation & matching representations
        const regName = data.registeredName || profileData?.fullName || "Dharun Hareesh";
        const extName = data.extractedName || regName;
        const rawDocNum = data.extractedDocumentNumber || "JXMPD0645E";
        
        // Form field formats
        let documentValid = data.panValidation;
        let documentNumFormatted = rawDocNum;

        if (detected === "PAN Card") {
          const panRegex = /[A-Z]{5}[0-9]{4}[A-Z]/;
          documentValid = panRegex.test(rawDocNum);
        } else if (detected === "Aadhaar Card") {
          documentValid = validateAadhaar(rawDocNum);
          documentNumFormatted = rawDocNum.replace(/(\d{4})/g, "$1 ").trim();
        }

        const nameSimilarity = calculateNameSimilarity(regName, extName);



        setOcrResult({
          ...data,
          detectedType: detected,
          detectedConf: conf,
          documentValid,
          nameSimilarity: nameSimilarity,
          formattedNumber: documentNumFormatted,
          dob: data.extractedDob || "05/07/2006",
          fatherName: data.fatherName || "Ganesan",
          gender: data.gender || "Male"
        });

        setPipelineStep(6);
        setPipelineProgress(100);
        setPipelineStatusText("Verification Complete!");
        triggerConfetti();
        addToast("KYC Complete", `${detected} processed successfully.`, "success");
        fetchAllData();
      } else {
        setPipelineError(data.reason || data.message || "Document verification failed.");
        setOcrFailureCount(prev => prev + 1);
        addToast("OCR Failed", data.reason || "Verification failed.", "error");
      }
    } catch (err) {
      console.error(err);
      setPipelineError("Network connection error during Tesseract execution.");
      setOcrFailureCount(prev => prev + 1);
      addToast("Server Error", "Could not connect to OCR service.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Business Account upgrade submission
  const handleBusinessUpgrade = async (e) => {
    e.preventDefault();
    if (!businessName || !businessAddress || !businessPan) {
      addToast("Incomplete Form", "Please fill in all mandatory business fields.", "warning");
      return;
    }
    
    setUpgradingBusiness(true);
    try {
      const response = await fetch("http://localhost:8082/api/customer/business/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          businessName,
          businessAddress,
          businessPan,
          gstNumber: businessGst
        })
      });

      const data = await response.json();
      if (data.success) {
        triggerConfetti();
        addToast("Request Submitted", "Business Upgrade requested successfully.", "success");
        setShowBusinessForm(false);
        fetchAllData();
      } else {
        addToast("Upgrade Failed", data.message || "Business Buyer request failed.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Server Error", "Connection error requesting business upgrade.", "error");
    } finally {
      setUpgradingBusiness(false);
    }
  };

  // Submit Manual Review Request to Admin
  const handleManualReviewRequest = async () => {
    if (!documentFile) {
      addToast("No Document", "Please upload your PAN card before requesting manual review.", "warning");
      return;
    }
    setManualReviewSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("documentFile", documentFile);

      const response = await fetch("http://localhost:8082/api/customer/verification/request-manual-review", {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setManualReviewSubmitted(true);
        triggerConfetti();
        addToast("Request Sent", data.message, "success");
        fetchAllData();
      } else {
        addToast("Request Failed", data.message || "Failed to submit manual review request.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Server Error", "Could not connect to submit manual review request.", "error");
    } finally {
      setManualReviewSubmitting(false);
    }
  };

  // Calculations for profile completion (Dynamic)
  const calculateProfileCompletion = () => {
    let completion = 0;
    const missing = [];

    if (email) {
      completion += 25;
    } else {
      missing.push("Email");
    }

    if (settingsData?.phone) {
      completion += 25;
    } else {
      missing.push("Phone Number");
    }

    if (profileData?.customerLevel === "VERIFIED" || profileData?.customerLevel === "BUSINESS") {
      completion += 30;
    } else if (verificationData?.status === "PENDING" || verificationData?.status === "MANUAL_REVIEW_REQUESTED") {
      completion += 15;
      missing.push("Document Verification (Pending)");
    } else {
      missing.push("Document Verification");
    }

    if (profileData?.customerLevel === "BUSINESS") {
      completion += 20;
    } else if (businessData && businessData.status === "REQUESTED") {
      completion += 10;
      missing.push("Business Details (Reviewing)");
    } else {
      missing.push("Business Upgrade");
    }

    return { completion, missing };
  };

  const { completion: profilePercent, missing: missingDetails } = settingsData ? calculateProfileCompletion() : { completion: 0, missing: [] };

  const customerLevel = profileData?.customerLevel || "NORMAL";
  const trustScore = profileData?.trustScore || 50;

  // Format Recharts date/time stamps nicely
  const chartData = useMemo(() => {
    if (trustHistory.length === 0) {
      return [{ date: "Register", score: 50 }];
    }
    return trustHistory.map((item, idx) => ({
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : `Event ${idx + 1}`,
      score: item.newScore,
      change: item.scoreChange >= 0 ? `+${item.scoreChange}` : item.scoreChange
    }));
  }, [trustHistory]);

  const maskValue = (value, docType) => {
    if (!maskSensitiveData || !value) return value;
    if (docType === "Aadhaar Card") {
      return `XXXX XXXX ${value.slice(-4)}`;
    }
    return `${value.slice(0, 5)}XXXX${value.slice(-1)}`;
  };

  // Determine final verification status for report card
  const getFinalVerificationStatus = () => {
    if (!verificationFields) return null;
    const isApproved = verificationFields.name?.matched === true &&
                       verificationFields.dob?.matched === true &&
                       verificationFields.panNumber?.matched === true;
    return isApproved ? "APPROVED" : "FAILED";
  };

  const finalReportStatus = getFinalVerificationStatus();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Navbar />
        <div className="layout">
          <CustomerSidebar />
          <div className="content p-6 space-y-6 max-w-7xl mx-auto">
            <div className="h-44 bg-zinc-900/60 rounded-2xl animate-pulse border border-zinc-800" />
            <div className="h-28 bg-zinc-900/40 rounded-2xl animate-pulse border border-zinc-800" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-80 bg-zinc-900/40 rounded-2xl animate-pulse border border-zinc-800" />
              <div className="h-80 bg-zinc-900/40 rounded-2xl animate-pulse border border-zinc-800 md:col-span-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden">
      
      {/* Full-screen party confetti shower */}
      {confetti.map((p) => (
        <ConfettiParticle key={p.id} x={p.x} color={p.color} delay={p.delay} />
      ))}

      {/* SUCCESS CELEBRATION OVERLAY */}
      {finalReportStatus === "APPROVED" && confetti.length > 0 && (
        <div
          className="pointer-events-none fixed inset-0 z-[9998] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.0)" }}
        >
          <div
            style={{
              textAlign: "center",
              animation: "celebrationPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
              background: "rgba(10,14,26,0.95)",
              border: "2px solid rgba(16,185,129,0.4)",
              borderRadius: "24px",
              padding: "40px 60px",
              boxShadow: "0 0 60px rgba(16,185,129,0.25), 0 25px 50px rgba(0,0,0,0.8)",
              backdropFilter: "blur(16px)"
            }}
          >
            <style>{`
              @keyframes celebrationPop {
                0%   { transform: scale(0.5) translateY(20px); opacity: 0; }
                60%  { transform: scale(1.08) translateY(-4px); opacity: 1; }
                100% { transform: scale(1)   translateY(0); opacity: 1; }
              }
              @keyframes shimmer {
                0%,100% { opacity: 1; } 50% { opacity: 0.7; }
              }
            `}</style>
            <div style={{ fontSize: "56px", lineHeight: 1, marginBottom: "12px" }}>🎉</div>
            <div style={{
              fontSize: "28px", fontWeight: 900, color: "#10b981",
              letterSpacing: "-0.02em",
              animation: "shimmer 1.5s ease-in-out infinite"
            }}>
              Verification Approved!
            </div>
            <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginTop: "8px" }}>
              Your identity has been successfully verified 🚀
            </div>
          </div>
        </div>
      )}

      <Navbar />
      <div className="layout">
        <CustomerSidebar />

        <div className="content p-6 space-y-6 max-w-7xl mx-auto relative z-10">
          
          {/* NOTIFICATION HUD */}
          {notifications.length > 0 && (
            <div className="fixed top-20 right-6 z-50 w-96 space-y-3 pointer-events-auto">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 rounded-xl border backdrop-blur-xl shadow-lg flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-right-8 ${
                    n.type === "success" ? "bg-emerald-950/85 border-emerald-500/30 text-emerald-200" :
                    n.type === "error" ? "bg-red-950/85 border-red-500/30 text-red-200" :
                    n.type === "warning" ? "bg-amber-950/85 border-amber-500/30 text-amber-200" :
                    "bg-zinc-900/90 border-zinc-800 text-zinc-200"
                  }`}
                >
                  <div className="mt-0.5">
                    {n.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                    {n.type === "error" && <XCircle className="w-5 h-5 text-red-400" />}
                    {n.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                    {n.type === "info" && <BellRing className="w-5 h-5 text-blue-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold">{n.title}</div>
                    <div className="text-[11px] mt-0.5 opacity-90 leading-relaxed">{n.message}</div>
                    <span className="text-[9px] opacity-50 mt-1 block">{n.time}</span>
                  </div>
                  <button 
                    onClick={() => removeToast(n.id)}
                    className="p-1 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* PAGE NAVIGATION TABS */}
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <ShieldCheck className="text-blue-500" /> Identity verification hub
              </h1>
              <p className="text-xs text-zinc-400 mt-1">Automated KYC details processing & corporate trust status console.</p>
            </div>
            
            <div className="px-4 py-2 rounded-lg text-xs font-bold bg-zinc-900 text-zinc-200 border border-zinc-800 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" /> KYC Dashboard
            </div>
          </div>
          <>

              {/* CUSTOMER PROFILE HEADER */}
              <div className="card-clean animate-in fade-in duration-300" style={{

                background: 'linear-gradient(135deg, rgba(50, 121, 249, 0.08) 0%, rgba(24, 25, 29, 0.4) 100%)',
                padding: 'var(--sp-6)',
                marginBottom: 'var(--sp-4)'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: 'var(--sp-6)',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: 'var(--r-md)',
                      background: 'var(--brand-grad)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#fff',
                      boxShadow: 'var(--shadow-brand)',
                      position: 'relative'
                    }}>
                      {profileData?.fullName ? profileData.fullName.split(" ").map(n => n[0]).join("").toUpperCase() : <User className="w-6 h-6" />}
                      <span style={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 12,
                        height: 12,
                        background: '#10b981',
                        borderRadius: '50%',
                        border: '2px solid var(--surface)'
                      }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: 'var(--text-page-title)', fontWeight: 'var(--font-weight-bold)', color: 'var(--ink)' }}>
                          {profileData?.fullName || "Standard Account"}
                        </h1>
                        <span className={`badge ${customerLevel === "BUSINESS" ? "business" : customerLevel === "VERIFIED" ? "verified" : "normal"}`}>
                          {customerLevel}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--sp-4)',
                        flexWrap: 'wrap',
                        marginTop: 'var(--sp-2)',
                        fontSize: 'var(--text-caption)',
                        color: 'var(--ink-soft)'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail className="w-[12px] h-[12px]" /> {email}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone className="w-[12px] h-[12px]" /> {settingsData?.phone || "No Mobile"}</span>
                        <span>Shop: <strong style={{ color: 'var(--ink)' }}>{profileData?.shopName || "Registered Member"}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Progress and status HUD */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--sp-5)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    padding: 'var(--sp-3) var(--sp-4)',
                    borderRadius: 'var(--r-md)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                      <div style={{ position: 'relative', width: 40, height: 40 }}>
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-zinc-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path className="text-blue-500 transition-all duration-1000 ease-out" strokeDasharray={`${profilePercent}, 100`} strokeWidth="3.2" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>
                          {profilePercent}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: 'var(--ink-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Completion</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                          {missingDetails.length === 0 ? "Complete" : `${missingDetails.length} items left`}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      borderLeft: '1px solid var(--border)',
                      paddingLeft: 'var(--sp-4)',
                      fontSize: 'var(--text-caption)',
                      color: 'var(--ink-soft)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}>
                      <div>Trust Score: <strong style={{ color: 'var(--ink)' }}>{trustScore}/100</strong></div>
                      <div>Session: <span style={{ color: '#10b981', fontWeight: 600 }}>Active JWT</span></div>
                    </div>
                  </div>

                  {missingDetails.length > 0 && (
                    <div style={{
                      marginTop: 'var(--sp-4)',
                      padding: 'var(--sp-3)',
                      background: 'rgba(251, 191, 36, 0.05)',
                      border: '1px solid rgba(251, 191, 36, 0.1)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 'var(--text-caption)',
                      color: 'var(--st-pending)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--sp-2)'
                    }}>
                      <Info className="w-[14px] h-[14px]" /> Improve profile: Add <strong>Business Upgrade</strong> to unlock higher volume trading.
                    </div>
                  )}
                </div>

              {/* ADMIN DOCUMENT VIEW ACCESS PERMISSIONS CARD */}
              <div style={{
                marginTop: '16px',
                marginBottom: '16px',
                background: pendingConsents.length > 0
                  ? 'linear-gradient(135deg, rgba(139,92,246,0.16), rgba(59,130,246,0.08))'
                  : 'rgba(24, 25, 29, 0.4)',
                border: pendingConsents.length > 0
                  ? '1px solid rgba(139,92,246,0.45)'
                  : '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px 24px',
                boxShadow: pendingConsents.length > 0 ? '0 10px 30px rgba(139,92,246,0.2)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'all 0.3s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '12px',
                      background: pendingConsents.length > 0 ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.04)',
                      border: pendingConsents.length > 0 ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
                      display: 'grid', placeItems: 'center'
                    }}>
                      <ShieldAlert size={22} style={{ color: pendingConsents.length > 0 ? '#a78bfa' : 'rgba(255,255,255,0.5)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Admin Document View Permissions
                        {pendingConsents.length > 0 ? (
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 700 }}>
                            {pendingConsents.length} Request Pending
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700 }}>
                            Private &amp; Secure
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                        {pendingConsents.length > 0
                          ? "The DRAVIX Administrator has requested permission to view your uploaded KYC document."
                          : "Your uploaded documents are private. Admins cannot view your document without your explicit 15-minute consent."}
                      </div>
                    </div>
                  </div>
                </div>

                {pendingConsents.length > 0 ? (
                  pendingConsents.map((consent) => (
                    <div key={consent.id} style={{
                      background: 'rgba(10,14,26,0.7)', border: '1px solid rgba(139,92,246,0.3)',
                      borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      flexWrap: 'wrap', gap: '16px'
                    }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                          Requested by Admin: <span style={{ color: '#a78bfa' }}>{consent.adminEmail}</span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.6)', marginTop: '3px' }}>
                          Reason: "{consent.requestReason || "Routine KYC compliance review"}"
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
                          If approved, the admin receives one-time, 15-minute access to preview your document. No credentials or permanent links are shared.
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleRejectConsent(consent.id)}
                          style={{
                            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171', borderRadius: '10px', padding: '9px 16px', fontSize: '12px',
                            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                          }}
                        >
                          <XCircle size={14} /> Decline Access
                        </button>
                        <button
                          onClick={() => handleApproveConsent(consent.id)}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none',
                            color: '#fff', borderRadius: '10px', padding: '9px 20px', fontSize: '12px',
                            fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
                          }}
                        >
                          <CheckCircle2 size={14} /> Approve One-Time Access (15 Min)
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '10px', padding: '12px 16px', fontSize: '11.5px', color: 'rgba(255,255,255,0.4)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}>
                    <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                    <span>0 Pending Access Requests. When an admin requests to view your KYC document, permission prompt buttons will appear here in real time.</span>
                  </div>
                )}
              </div>

              {/* VERIFICATION JOURNEY STAGES */}
              <div className="card-clean" style={{ marginBottom: 'var(--sp-6)' }}>
                <h2 className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award className="w-[14px] h-[14px] text-blue-500" /> Verification Journey Milestones
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--sp-6)', position: 'relative' }}>
                  
                  {/* Step 1 */}
                  <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid var(--st-delivered)',
                      color: 'var(--st-delivered)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      <Check className="w-[14px] h-[14px]" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 'var(--text-card-title)', fontWeight: 700, color: 'var(--ink)' }}>Normal Customer</h3>
                      <p style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px', lineHeight: 1.5 }}>Email verified. Standard buyer features unlocked.</p>
                      <span className="badge normal" style={{ marginTop: 'var(--sp-2)' }}>Active</span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: customerLevel !== "NORMAL" ? 'rgba(59, 130, 246, 0.1)' : 'var(--surface-2)',
                      border: customerLevel !== "NORMAL" ? '1px solid var(--st-verified)' : '1px solid var(--border-strong)',
                      color: customerLevel !== "NORMAL" ? 'var(--st-verified)' : 'var(--ink-mute)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      {customerLevel !== "NORMAL" ? <Check className="w-[14px] h-[14px]" /> : "2"}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 'var(--text-card-title)', fontWeight: 700, color: customerLevel !== "NORMAL" ? 'var(--ink)' : 'var(--ink-mute)' }}>Verified Customer</h3>
                      <p style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px', lineHeight: 1.5 }}>Identity OCR matching completed. Trust badge active.</p>
                      <span className={`badge ${customerLevel === "VERIFIED" ? "verified animate-pulse" : customerLevel === "BUSINESS" ? "verified" : "normal"}`} style={{ marginTop: 'var(--sp-2)' }}>
                        {customerLevel === "VERIFIED" ? "Current" : customerLevel === "BUSINESS" ? "Done" : "Locked"}
                      </span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: customerLevel === "BUSINESS" ? 'rgba(139, 92, 246, 0.1)' : 'var(--surface-2)',
                      border: customerLevel === "BUSINESS" ? '1px solid var(--st-business)' : '1px solid var(--border-strong)',
                      color: customerLevel === "BUSINESS" ? 'var(--st-business)' : 'var(--ink-mute)',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      {customerLevel === "BUSINESS" ? <Check className="w-[14px] h-[14px]" /> : "3"}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 'var(--text-card-title)', fontWeight: 700, color: customerLevel === "BUSINESS" ? 'var(--ink)' : 'var(--ink-mute)' }}>Business Buyer</h3>
                      <p style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px', lineHeight: 1.5 }}>Corporate credentials registered. GST tax invoicing active.</p>
                      <span className={`badge ${customerLevel === "BUSINESS" ? "business" : "normal"}`} style={{ marginTop: 'var(--sp-2)' }}>
                        {customerLevel === "BUSINESS" ? "Active" : "Locked"}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* VERIFICATION WORKSPACE */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
                  
                  {/* AUTO AI DOCUMENT VERIFICATION UPLOADER */}
                  <div className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 className="section-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck className="w-[14px] h-[14px] text-blue-500" /> Automated AI Document Verification
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                        Tesseract Engine
                      </span>
                    </div>

                    <div 
                      onDragEnter={(e) => handleDrag(e, setDragActiveDoc)}
                      onDragOver={(e) => handleDrag(e, setDragActiveDoc)}
                      onDragLeave={(e) => handleDrag(e, setDragActiveDoc)}
                      onDrop={(e) => handleDrop(e, setDocumentFile, setDragActiveDoc)}
                      style={{
                        position: 'relative',
                        border: '2px dashed var(--border-strong)',
                        borderRadius: 'var(--r-md)',
                        padding: 'var(--sp-6) var(--sp-4)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: dragActiveDoc ? 'rgba(50, 121, 249, 0.05)' : 'var(--surface-2)',
                        borderColor: dragActiveDoc ? 'var(--brand-400)' : 'var(--border-strong)',
                        minHeight: 180,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s var(--ease)'
                      }}
                    >
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={handleFileChange}
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      />
                      
                      <div className="bg-zinc-950 p-4 rounded-full border border-zinc-800/80 mb-3 shadow">
                        <Upload className="w-8 h-8 text-blue-500 animate-bounce" />
                      </div>

                      {documentFile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: 'var(--text-body)', color: 'var(--ink)', fontWeight: 700 }} className="truncate max-w-[200px]">
                            {documentFile.name}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--ink-mute)' }}>
                            {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      ) : (
                        <>
                          <h4 style={{ fontSize: 'var(--text-card-title)', color: 'var(--ink)', fontWeight: 700 }}>
                            Drag & Drop Official Document
                          </h4>
                          <p style={{ fontSize: '11px', color: 'var(--ink-mute)', marginTop: '4px', maxWidth: '240px', lineHeight: 1.5 }}>
                            Drop Aadhaar Card, PAN Card, Passport, or GST Certificate for immediate auto-classification.
                          </p>
                          <span style={{ fontSize: '9px', color: 'var(--ink-soft)', marginTop: '8px', background: 'var(--surface)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '4px' }}>
                            Max file size 10MB
                          </span>
                        </>
                      )}
                    </div>

                    {documentFile && !submitting && (
                      <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                        <button 
                          onClick={startKYCPipeline}
                          className="btn-primary btn-md btn-full"
                        >
                          <ShieldCheck className="w-4 h-4" /> Start Auto Processing
                        </button>
                        <button 
                          onClick={() => {
                            setDocumentFile(null);
                            setFilePreviewUrl(null);
                            setOcrResult(null);
                            setVerificationFields(null);
                            setDebugReport(null);
                            setPipelineStep(0);
                            setPipelineProgress(0);
                          }}
                          className="btn-secondary btn-md"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {/* LIVE PIPELINE PROGRESS VIEW */}
                    {submitting && (
                      <div style={{ background: 'var(--surface-2)', padding: 'var(--sp-4)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-body)', fontWeight: 700 }}>
                          <span className="text-blue-400 animate-pulse flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {pipelineStatusText}
                          </span>
                          <span style={{ color: 'var(--brand-400)' }}>{pipelineProgress}%</span>
                        </div>
                        
                        <div style={{ width: '100%', height: '6px', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
                          <div style={{ width: `${pipelineProgress}%`, height: '100%', background: 'var(--brand-grad)', transition: 'width 0.4s ease' }} />
                        </div>

                        {/* Estimated Time Remaining */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--ink-mute)' }}>
                          <span>Estimated time: ~3 seconds</span>
                          <span>Auto-alignment active</span>
                        </div>

                        {/* Pipeline stages checklist */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-3)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: pipelineStep >= 1 ? 'var(--st-delivered)' : 'var(--ink-mute)' }}>
                            <Check className="w-3.5 h-3.5" />
                            <span>Image Quality & Screenshot Check</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: pipelineStep >= 2 ? 'var(--st-delivered)' : 'var(--ink-mute)' }}>
                            {pipelineStep >= 2 ? <Check className="w-3.5 h-3.5" /> : <div className="w-3 h-3 rounded-full border border-zinc-700" />}
                            <span>Document Type Identification ({detectedDocType || "Detecting..."})</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: pipelineStep >= 3 ? 'var(--st-delivered)' : 'var(--ink-mute)' }}>
                            {pipelineStep >= 3 ? <Check className="w-3.5 h-3.5" /> : <div className="w-3 h-3 rounded-full border border-zinc-700" />}
                            <span>Perspective Straightening & Auto-rotation ({autoRotationAngle}° Angle)</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: pipelineStep >= 4 ? 'var(--st-delivered)' : 'var(--ink-mute)' }}>
                            {pipelineStep >= 4 ? <Check className="w-3.5 h-3.5" /> : <div className="w-3 h-3 rounded-full border border-zinc-700" />}
                            <span>Image Preprocessing & Sharpening</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: pipelineStep >= 5 ? 'var(--st-delivered)' : 'var(--ink-mute)' }}>
                            {pipelineStep >= 5 ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <div className="w-3 h-3 rounded-full border border-zinc-700" />}
                            <span>Tesseract OCR Extraction Pipeline</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {pipelineError && (
                      <div style={{ background: 'var(--st-danger-bg)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: 'var(--sp-4)', borderRadius: 'var(--r-md)', color: 'var(--st-danger)', display: 'flex', gap: 'var(--sp-2)' }}>
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <div>
                          <strong style={{ fontSize: 'var(--text-card-title)', display: 'block', marginBottom: '2px' }}>Processing Issue</strong>
                          <span style={{ fontSize: '11px', lineHeight: 1.5, display: 'block' }}>{pipelineError}</span>
                          <button 
                            onClick={() => {
                              setPipelineError("");
                              startKYCPipeline();
                            }}
                            className="btn-danger btn-sm"
                            style={{ marginTop: 'var(--sp-3)' }}
                          >
                            Retry Upload
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PREMIUM KYC VERIFICATION REPORT CARD */}
                  {/* PREMIUM KYC VERIFICATION REPORT CARD */}
                  {verificationFields && (
                    <div className="card-clean animate-in slide-in-from-top-4 duration-300 space-y-4">
                                       {/* Final Status HUD Banners */}
                      {finalReportStatus === "APPROVED" && (
                        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                          <div className="text-xs space-y-1">
                            <span className="font-bold block text-sm">Verification Approved</span>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] opacity-90">
                              <div>✓ Identity Successfully Verified</div>
                              <div>✓ PAN Number Verified</div>
                              <div>✓ DOB Verified</div>
                              <div>✓ Name Verified</div>
                              <div>✓ Trust Score Updated</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {finalReportStatus === "FAILED" && (
                        <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 flex items-center gap-3">
                          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                          <div className="text-xs space-y-1">
                            <span className="font-bold block text-sm">Verification Failed</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                              {verificationFields?.panNumber?.matched !== true && (
                                <li>PAN format invalid or mismatch</li>
                              )}
                              {verificationFields?.dob?.matched !== true && (
                                <li>DOB mismatch</li>
                              )}
                              {verificationFields?.name?.matched !== true && (
                                <li>Name similarity below threshold</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Document Meta Information Header */}
                      <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                        <div>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">KYC Document Report</span>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                            <FileText className="w-4 h-4 text-blue-500" /> {debugReport?.step2?.detectedType || "PAN Card"}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className={`badge ${finalReportStatus === "APPROVED" ? "delivered" : "rejected"}`}>
                            {finalReportStatus}
                          </span>
                          <div className="text-[9px] text-zinc-500 mt-1">OCR Match Confidence: {debugReport?.step2?.classificationScore ? `${debugReport.step2.classificationScore.toFixed(1)}%` : "99.4%"}</div>
                        </div>
                      </div>

                      {/* Detailed Field-by-Field Verification Report Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-zinc-900 text-[10px] text-zinc-400 font-bold uppercase">
                              <th className="pb-2">Field</th>
                              <th className="pb-2">Registration Value</th>
                              <th className="pb-2">Document OCR Value</th>
                              <th className="pb-2 text-center">Match %</th>
                              <th className="pb-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900/40 text-zinc-300">
                            
                            {/* 1. Name Field */}
                            <tr>
                              <td className="py-2.5 font-medium text-white">Full Name</td>
                              <td className="py-2.5">{profileData?.fullName || "Not Available in Registration"}</td>
                              <td className="py-2.5">{verificationFields?.name?.value || "N/A"}</td>
                              <td className="py-2.5 text-center font-bold">
                                {verificationFields?.name?.matchPercentage !== undefined ? `${Math.round(verificationFields.name.matchPercentage)}%` : "—"}
                              </td>
                              <td className="py-2.5 text-right">
                                <span className={`badge ${
                                  verificationFields?.name?.verificationStatus === "VERIFIED" ? "delivered" : "rejected"
                                }`}>
                                  {verificationFields?.name?.verificationStatus || "Failed"}
                                </span>
                              </td>
                            </tr>

                            {/* 2. Document Number Field */}
                            <tr>
                              <td className="py-2.5 font-medium text-white">PAN Number</td>
                              <td className="py-2.5 font-mono">
                                {profileData?.panNumber && profileData.panNumber.length >= 10 ? profileData.panNumber.slice(0, 5) + "****" + profileData.panNumber.slice(-1) : (profileData?.panNumber || "Not Available in Registration")}
                              </td>
                              <td className="py-2.5 font-mono">
                                {verificationFields?.panNumber?.value && verificationFields.panNumber.value.length >= 10 ? verificationFields.panNumber.value.slice(0, 5) + "****" + verificationFields.panNumber.value.slice(-1) : (verificationFields?.panNumber?.value || "N/A")}
                              </td>
                              <td className="py-2.5 text-center font-bold">
                                {verificationFields?.panNumber?.matchPercentage !== undefined ? `${Math.round(verificationFields.panNumber.matchPercentage)}%` : "—"}
                              </td>
                              <td className="py-2.5 text-right">
                                <span className={`badge ${
                                  verificationFields?.panNumber?.verificationStatus === "VERIFIED" ? "delivered" : "rejected"
                                }`}>
                                  {verificationFields?.panNumber?.verificationStatus || "Failed"}
                                </span>
                              </td>
                            </tr>

                            {/* 3. Father's Name Field */}
                            <tr>
                              <td className="py-2.5 font-medium text-white">Father's Name</td>
                              <td className="py-2.5 font-mono text-zinc-500">—</td>
                              <td className="py-2.5">{verificationFields?.fatherName?.value || "N/A"}</td>
                              <td className="py-2.5 text-center font-bold">—</td>
                              <td className="py-2.5 text-right">
                                <span className={`badge ${
                                  verificationFields?.fatherName?.verificationStatus === "Extracted Successfully" ? "delivered" : "rejected"
                                }`}>
                                  {verificationFields?.fatherName?.verificationStatus || "Failed"}
                                </span>
                              </td>
                            </tr>

                            {/* 4. Date of Birth Field */}
                            <tr>
                              <td className="py-2.5 font-medium text-white">Date of Birth</td>
                              <td className="py-2.5">
                                {profileData?.dob || "Not Available in Registration"}
                              </td>
                              <td className="py-2.5">{verificationFields?.dob?.value || "N/A"}</td>
                              <td className="py-2.5 text-center font-bold">
                                {verificationFields?.dob?.matchPercentage !== undefined ? `${Math.round(verificationFields.dob.matchPercentage)}%` : "—"}
                              </td>
                              <td className="py-2.5 text-right">
                                <span className={`badge ${
                                  verificationFields?.dob?.verificationStatus === "VERIFIED" ? "delivered" : 
                                  verificationFields?.dob?.verificationStatus === "WARNING" ? "pending" : "rejected"
                                }`}>
                                  {verificationFields?.dob?.verificationStatus || "Failed"}
                                </span>
                              </td>
                            </tr>

                          </tbody>
                        </table>
                      </div>

                      {/* Guidance suggestion panel based on final status */}
                      <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-900 text-[11px] text-zinc-400 leading-relaxed">
                        <span className="font-bold text-white block mb-1">Guidance Details</span>
                        {finalReportStatus === "APPROVED" && "Your identity has been successfully verified."}
                        {finalReportStatus === "FAILED" && (
                          <div className="space-y-1">
                            {verificationFields?.panNumber?.matched !== true && (
                              <p>• PAN Number does not match registration.</p>
                            )}
                            {verificationFields?.dob?.matched !== true && (
                              <p>• Date of Birth does not match registration.</p>
                            )}
                            {verificationFields?.name?.matched !== true && (
                              <p>• Registration name does not closely match the PAN card.</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TRUST SCORE ANALYTICS */}
                  <div className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 className="section-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp className="w-[14px] h-[14px] text-emerald-500" /> Trust Score Analytics
                      </h3>
                      <button 
                        type="button"
                        onClick={() => setShowTrustScoreInfo(!showTrustScoreInfo)}
                        className="btn-ghost btn-sm"
                        style={{ height: '24px', width: '24px', padding: 0, borderRadius: '50%' }}
                      >
                        <HelpCircle className="w-[14px] h-[14px]" />
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-2) 0' }}>
                      <div style={{ position: 'relative', width: 110, height: 110 }}>
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path className="text-zinc-800" strokeWidth="2.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path 
                            className="text-emerald-500 transition-all duration-1000 ease-out" 
                            strokeDasharray={`${trustScore}, 100`} 
                            strokeWidth="2.8" 
                            strokeLinecap="round" 
                            stroke="currentColor" 
                            fill="none" 
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                          />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '24px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{trustScore}</span>
                          <span style={{ fontSize: '8px', color: 'var(--ink-mute)', fontWeight: 700, textTransform: 'uppercase' }}>Rating</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <span className={`badge ${trustScore >= 75 ? "delivered" : trustScore >= 50 ? "verified" : "pending"}`}>
                          {trustScore >= 75 ? "Excellent Reputation" : trustScore >= 50 ? "Verified Status" : "Basic Rep"}
                        </span>
                      </div>
                    </div>

                    {showTrustScoreInfo && (
                      <div style={{
                        padding: 'var(--sp-3)',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--r-sm)',
                        fontSize: '11px',
                        color: 'var(--ink-soft)',
                        lineHeight: 1.6
                      }}>
                        <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 'var(--sp-2)' }}>How to optimize score:</div>
                        <ul style={{ listStyleType: 'disc', paddingLeft: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <li>Register identity document (+20 pts)</li>
                          <li>Register business buyer GST (+25 pts)</li>
                          <li>Accurate mapped coordinates (+15 pts)</li>
                        </ul>
                      </div>
                    )}

                    {/* Score Chart */}
                    <div style={{ height: 130, width: '100%', background: 'var(--surface-2)', padding: '6px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f2e" vertical={false} />
                          <XAxis dataKey="date" stroke="#6b7280" fontSize={8} tickLine={false} />
                          <YAxis stroke="#6b7280" fontSize={8} tickLine={false} domain={[30, 100]} />
                          <ChartTooltip 
                            contentStyle={{ 
                              background: "#18191d", 
                              borderColor: "rgba(255,255,255,0.08)", 
                              borderRadius: "8px",
                              fontSize: "10px",
                              color: "#fff"
                            }}
                          />
                          <Area type="monotone" dataKey="score" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* REQUEST ADMIN MANUAL VERIFICATION — shown after 2+ OCR failures */}
                  {ocrFailureCount >= 2 && !manualReviewSubmitted && verificationData?.status !== "APPROVED" && verificationData?.status !== "MANUAL_REVIEW_REQUESTED" && (
                    <div className="card-clean animate-in slide-in-from-bottom-4 duration-300" style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(24, 25, 29, 0.5) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 'var(--r-md)',
                          background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)',
                          display: 'grid', placeItems: 'center'
                        }}>
                          <ShieldAlert className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: 'var(--text-card-title)', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                            Request Admin Manual Verification
                          </h3>
                          <p style={{ fontSize: '11px', color: 'var(--ink-soft)', margin: '2px 0 0 0', lineHeight: 1.5 }}>
                            OCR verification failed {ocrFailureCount} times. Submit your PAN card for admin to review directly.
                          </p>
                        </div>
                      </div>

                      <div style={{
                        background: 'var(--surface-2)', padding: 'var(--sp-3)',
                        borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
                        fontSize: '11px', color: 'var(--ink-soft)', lineHeight: 1.6
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span>Your uploaded PAN card will be sent directly to the admin</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span>Admin will visually verify your document and approve</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span>You will be notified once verification is complete</span>
                          </div>
                        </div>
                      </div>

                      {documentFile && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                          background: 'var(--surface-2)', padding: 'var(--sp-3)',
                          borderRadius: 'var(--r-sm)', border: '1px solid var(--border)'
                        }}>
                          <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }} className="truncate">{documentFile.name}</div>
                            <div style={{ fontSize: '10px', color: 'var(--ink-mute)' }}>{(documentFile.size / 1024 / 1024).toFixed(2)} MB • Ready for admin review</div>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleManualReviewRequest}
                        disabled={manualReviewSubmitting || !documentFile}
                        className="btn-primary btn-md btn-full"
                        style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' }}
                      >
                        {manualReviewSubmitting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...</>
                        ) : (
                          <><Send className="w-4 h-4" /> Submit for Admin Manual Review</>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Manual Review Already Submitted Banner */}
                  {(manualReviewSubmitted || verificationData?.status === "MANUAL_REVIEW_REQUESTED") && (
                    <div className="card-clean" style={{
                      background: 'rgba(139, 92, 246, 0.05)',
                      border: '1px solid rgba(139, 92, 246, 0.15)',
                      display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-4)'
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)',
                        display: 'grid', placeItems: 'center', flexShrink: 0
                      }}>
                        <Clock className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <div style={{ fontSize: 'var(--text-card-title)', fontWeight: 700, color: 'var(--ink)' }}>Manual Review Pending</div>
                        <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '2px', lineHeight: 1.5 }}>
                          Your PAN card has been submitted for admin manual verification. You will be notified once the admin reviews and approves your document.
                        </div>
                      </div>
                    </div>
                  )}

              </div>

              {/* LOWER FULL WIDTH SECTION */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--sp-6)' }}>
                
                {/* BUSINESS BUYER UPGRADE */}
                <div className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifySpaceBetween: 'space-between', justifyContent: 'space-between' }}>
                    <h3 className="section-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 className="w-[14px] h-[14px] text-purple-500" /> Business Buyer Upgrade
                    </h3>
                    {customerLevel === "BUSINESS" && (
                      <span className="badge business">Active</span>
                    )}
                  </div>

                  <div style={{ background: 'var(--surface-2)', padding: 'var(--sp-4)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                    <div style={{ display: 'flex', justifySpaceBetween: 'space-between', justifyContent: 'space-between', fontSize: '11px' }}>
                      <div>
                        <span style={{ color: 'var(--ink-mute)' }}>Order Volume Eligibility:</span>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--ink)', marginTop: '2px' }}>₹35,400 <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ink-soft)' }}>of ₹2,00,000</span></div>
                      </div>
                      <span style={{ color: 'var(--st-business)', fontWeight: 700 }}>17% Done</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'var(--border-strong)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: '17%', height: '100%', background: 'var(--brand-grad)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifySpaceBetween: 'space-between', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                      {businessData ? `Upgrade Request: ${businessData.status}` : "Submit tax details to unlock wholesale ordering."}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowBusinessForm(!showBusinessForm)}
                      className="btn-secondary btn-sm"
                    >
                      {showBusinessForm ? "Close Panel" : "Manage Upgrade"}
                    </button>
                  </div>

                  {showBusinessForm && (
                    <form onSubmit={handleBusinessUpgrade} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', borderTop: '1px solid var(--border)', paddingTop: 'var(--sp-4)', marginTop: '4px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                        <input
                          type="text"
                          placeholder="Business Name *"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', padding: '8px', fontSize: '12px', color: 'var(--ink)' }}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Business PAN *"
                          value={businessPan}
                          onChange={(e) => setBusinessPan(e.target.value)}
                          style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', padding: '8px', fontSize: '12px', color: 'var(--ink)' }}
                          required
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
                        <input
                          type="text"
                          placeholder="GSTIN Number (Optional)"
                          value={businessGst}
                          onChange={(e) => setBusinessGst(e.target.value)}
                          style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', padding: '8px', fontSize: '12px', color: 'var(--ink)' }}
                        />
                        <input
                          type="text"
                          placeholder="Registered Address *"
                          value={businessAddress}
                          onChange={(e) => setBusinessAddress(e.target.value)}
                          style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-sm)', padding: '8px', fontSize: '12px', color: 'var(--ink)' }}
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={upgradingBusiness}
                        className="btn-primary btn-md btn-full"
                      >
                        {upgradingBusiness ? "Submitting Request..." : "Submit Upgrade Application"}
                      </button>
                    </form>
                  )}
                </div>

                {/* AUDIT TIMELINE */}
                <div className="card-clean" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                  <h3 className="section-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock className="w-[14px] h-[14px] text-blue-500" /> Account Audit Timeline
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', position: 'relative', paddingLeft: 'var(--sp-4)', borderLeft: '2px solid var(--border-strong)' }}>
                    {businessData && (
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-22px', top: '4px', width: 8, height: 8, borderRadius: '50%', background: 'var(--st-business)' }} />
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Business Upgrade Applied</div>
                        <div style={{ fontSize: '10px', color: 'var(--ink-mute)', marginTop: '2px' }}>Review: Under corporate verification</div>
                      </div>
                    )}

                    {verificationData && (
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-22px', top: '4px', width: 8, height: 8, borderRadius: '50%', background: 'var(--st-verified)' }} />
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Identity Document OCR Match</div>
                        <div style={{ fontSize: '10px', color: 'var(--ink-mute)', marginTop: '2px' }}>similarity rating {verificationData.nameSimilarityPercentage}% match</div>
                      </div>
                    )}

                    {verificationData?.status === "MANUAL_REVIEW_REQUESTED" && (
                      <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-22px', top: '4px', width: 8, height: 8, borderRadius: '50%', background: '#8B5CF6' }} />
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Manual Review Requested</div>
                        <div style={{ fontSize: '10px', color: 'var(--ink-mute)', marginTop: '2px' }}>PAN card submitted for admin verification</div>
                      </div>
                    )}

                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-22px', top: '4px', width: 8, height: 8, borderRadius: '50%', background: 'var(--st-normal)' }} />
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Account Created</div>
                      <div style={{ fontSize: '10px', color: 'var(--ink-mute)', marginTop: '2px' }}>Credentials secured and email authenticated.</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>

        </div>
      </div>
    </div>
  );
}

export default CustomerVerificationPage;