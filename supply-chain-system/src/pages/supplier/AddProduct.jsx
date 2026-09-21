import SupplierSidebar from "../../components/SupplierSidebar";
import Navbar from "../../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Tag,
  DollarSign,
  BarChart3,
  ImageIcon,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Loader2,
  Warehouse as WarehouseIcon,
  Info,
  ShieldAlert,
  MapPin,
  Upload,
  FileText,
  FileCheck,
  Check,
  Plus,
  Building2,
  RefreshCw,
  CheckCircle2,
  ShieldAlert as ShieldIcon
} from "lucide-react";

function AddProduct() {
  const navigate = useNavigate();

  // Basic Supplier Profile & Gating States
  const [supplier, setSupplier] = useState(null);
  const [verificationTier, setVerificationTier] = useState("UNVERIFIED");
  const [landRecords, setLandRecords] = useState([]);
  const [selectedLandRecordId, setSelectedLandRecordId] = useState("");
  const [showLandRecordForm, setShowLandRecordForm] = useState(false);

  // FPO state
  const [fpoDocStatus, setFpoDocStatus] = useState(null);
  const [fpoCertificateFile, setFpoCertificateFile] = useState(null);
  const [uploadingFpo, setUploadingFpo] = useState(false);
  const [submittingFpo, setSubmittingFpo] = useState(false);
  const [fpoUploadState, setFpoUploadState] = useState("IDLE"); // IDLE, UPLOADING, UPLOADED, ERROR, SUBMITTING
  const [fpoUploadedDoc, setFpoUploadedDoc] = useState(null); // { filePath, originalFileName, fileSize, fileType }
  const [fpoError, setFpoError] = useState("");
  const [fpoSuccess, setFpoSuccess] = useState("");

  // Land form submission states
  const [ownershipType, setOwnershipType] = useState("OWNER"); // OWNER / TENANT
  const [surveyNumber, setSurveyNumber] = useState("");
  const [subDivision, setSubDivision] = useState("");
  const [districtInput, setDistrictInput] = useState("");
  const [villageInput, setVillageInput] = useState("");
  const [talukInput, setTalukInput] = useState("");
  const [landownerPhone, setLandownerPhone] = useState("");
  const [leaseDocUrl, setLeaseDocUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [submittingLand, setSubmittingLand] = useState(false);

  // Geo coords
  const [lat, setLat] = useState(11.0168);
  const [lng, setLng] = useState(76.9558);

  // Standard Product Form States
  const [productName, setProductName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [pricingStrategy, setPricingStrategy] = useState("PROFIT_PER_KG");
  const [marginValue, setMarginValue] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("");
  const [allowedCategories, setAllowedCategories] = useState([]);
  
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [warehouseCapacity, setWarehouseCapacity] = useState(null); 
  const [capacityLoading, setCapacityLoading] = useState(false);

  // Package-based inventory states
  const [packagingStandards, setPackagingStandards] = useState([]);
  const [bagCounts, setBagCounts] = useState({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Yield warning state
  const [yieldWarning, setYieldWarning] = useState("");
  const [selectedLandObj, setSelectedLandObj] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfileAndLands = async () => {
    let supplierId = localStorage.getItem("supplierId");
    const userId = localStorage.getItem("userId");

    // If supplierId is missing, attempt to fetch from user profile
    if (!supplierId && userId) {
      try {
        const uRes = await fetch(`/users/${userId}`);
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData.supplierId) {
            supplierId = String(uData.supplierId);
            localStorage.setItem("supplierId", supplierId);
          }
        }
      } catch (e) {
        console.error("Failed to resolve supplier ID:", e);
      }
    }

    if (!supplierId) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    try {
      const resProfile = await fetch(`/suppliers/${supplierId}`);
      if (resProfile.ok) {
        const data = await resProfile.json();
        setSupplier(data);
        setVerificationTier(data.verificationTier || "UNVERIFIED");
        setDistrictInput(data.district || "");
        setVillageInput(data.village || "");
      }

      const resLands = await fetch(`/api/supplier/land-verifications/supplier/${supplierId}`);
      if (resLands.ok) {
        const data = await resLands.json();
        setLandRecords(data || []);
      }

      try {
        const resFpo = await fetch(`/api/supplier/fpo/status/${supplierId}`);
        if (resFpo.ok) {
          const statusData = await resFpo.json();
          if (statusData) setFpoDocStatus(statusData);
        }
      } catch (err) {
        console.error(err);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfileAndLands();

    // Fetch allowed categories & packaging
    fetch("/products/allowed-categories")
      .then((res) => res.json())
      .then((data) => setAllowedCategories(data))
      .catch((err) => console.error("Failed to load categories:", err));

    fetch("/packaging-standards")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const activeSizes = data.filter(s => s.active).map(s => s.size);
          setPackagingStandards(activeSizes);
          const initialCounts = {};
          activeSizes.forEach(size => {
            initialCounts[size] = 0;
          });
          setBagCounts(initialCounts);
        }
      })
      .catch((err) => console.error(err));

    fetch("/warehouse-locations")
      .then((res) => res.json())
      .then((data) => {
        setWarehouses(data);
      })
      .catch((err) => console.error(err));

    // Get current location for geotag
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      (err) => console.log("Geolocation error:", err)
    );
  }, []);

  // Update AI warehouse recommendations when coordinates are available
  useEffect(() => {
    if (warehouses.length > 0) {
      recommendWarehouse(warehouses, lat, lng);
    }
  }, [warehouses, lat, lng, category]);

  // Expected Yield warning logic: Extent * Category Yield
  const YIELD_LOOKUP = {
    "Cereals": 1500.0,
    "Dry Fruits": 800.0,
    "Grains": 1200.0,
    "Oil Seeds": 700.0,
    "Pulses and Dals": 600.0,
    "Spices": 500.0
  };

  const calculatedStock = Object.keys(bagCounts).reduce(
    (sum, size) => sum + Number(size) * (bagCounts[size] || 0),
    0
  );

  useEffect(() => {
    if (!selectedLandRecordId) {
      setYieldWarning("");
      setSelectedLandObj(null);
      return;
    }

    const land = landRecords.find(r => r.id.toString() === selectedLandRecordId);
    setSelectedLandObj(land);
    if (!land) return;

    // Fetch ledger details for cumulative sold
    fetch(`/api/supplier/land-verifications/ledger/${land.id}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const cumulativeSold = data?.ledger?.cumulativeSoldThisSeason || 0.0;
        const yieldPerAcre = YIELD_LOOKUP[category] || 1000.0;
        const maxExpected = (land.extentAcres || 0.0) * yieldPerAcre;
        
        if (cumulativeSold + calculatedStock > maxExpected) {
          setYieldWarning(`Warning: Entering this listing of ${calculatedStock} KG (on top of ${cumulativeSold} KG already sold) will exceed this land's seasonal expected yield of ${maxExpected} KG. Admin team will flag this listing for manual review.`);
        } else {
          setYieldWarning("");
        }
      })
      .catch(() => {});
  }, [selectedLandRecordId, calculatedStock, category, landRecords]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const recommendWarehouse = async (list, lat, lon) => {
    try {
      const supplierId = localStorage.getItem("supplierId");
      const res = await fetch("/api/warehouse-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: supplierId ? Number(supplierId) : null,
          category: category || "Grains",
          quantity: calculatedStock || 100,
          latitude: lat,
          longitude: lon
        })
      });
      const data = await res.json();
      if (data && data.recommendedWarehouse) {
        setRecommendation({
          mode: data.mode,
          warehouse: data.recommendedWarehouse,
          suitabilityScore: data.suitabilityScore,
          distance: data.recommendedWarehouse.latitude ? Math.round(calculateDistance(lat, lon, data.recommendedWarehouse.latitude, data.recommendedWarehouse.longitude) * 10) / 10 : 0.0,
          reasons: data.reasons || [],
          alternatives: data.alternatives || []
        });
        setSelectedWarehouse(data.recommendedWarehouse.id.toString());
      }
    } catch (err) {
      console.error("Failed to fetch ML recommendation:", err);
      let best = null;
      let minDist = Infinity;
      list.forEach(w => {
        const dist = calculateDistance(lat, lon, w.latitude, w.longitude);
        if (dist < minDist) {
          minDist = dist;
          best = w;
        }
      });
      if (best) {
        setRecommendation({
          mode: "RULE_BASED",
          warehouse: best,
          suitabilityScore: null,
          distance: Math.round(minDist * 10) / 10,
          reasons: [`Closest warehouse geographically (${Math.round(minDist * 10) / 10} km away).`],
          alternatives: []
        });
        setSelectedWarehouse(best.id.toString());
      }
    }
  };

  const handleBagCountChange = (size, value) => {
    setBagCounts((prev) => ({
      ...prev,
      [size]: Math.max(0, Number(value))
    }));
  };

  const calculatedSellingPrice = (() => {
    const base = Number(purchasePrice) || 0;
    const margin = Number(marginValue) || 0;
    if (pricingStrategy === "PROFIT_PERCENTAGE") {
      return base * (1 + margin / 100);
    }
    return base + margin;
  })();

  const selectedWarehouseObj = warehouses.find(
    (w) => String(w.id) === String(selectedWarehouse)
  );

  // Live warehouse capacity fetch
  useEffect(() => {
    if (!selectedWarehouse) {
      setWarehouseCapacity(null);
      return;
    }
    setCapacityLoading(true);
    fetch(`/warehouse-locations/${selectedWarehouse}/capacity`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        setWarehouseCapacity(data);
        setCapacityLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch warehouse capacity:", err);
        setWarehouseCapacity(null);
        setCapacityLoading(false);
      });
  }, [selectedWarehouse]);

  // File Upload Helper
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/supplier/land-verifications/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (type === "lease") {
          setLeaseDocUrl(data.filePath);
        } else {
          setPhotoUrl(data.filePath);
        }
      } else {
        const err = await res.json();
        setError(err.error || "File upload failed.");
      }
    } catch (err) {
      setError("File upload failed. S3 communication error.");
    } finally {
      setUploadingFile(false);
    }
  };

  // Land verification request submission
  const handleLandSubmission = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!surveyNumber.trim() || !villageInput.trim() || !talukInput.trim() || !districtInput.trim()) {
      setError("Please fill in Survey Number, Village, Taluk, and District.");
      return;
    }

    if (ownershipType === "TENANT" && !landownerPhone.trim()) {
      setError("Tenant listings require a landlord phone number for manual verification call.");
      return;
    }

    if (ownershipType === "TENANT" && !leaseDocUrl) {
      setError("Lease agreement document file is required for tenant records.");
      return;
    }

    setSubmittingLand(true);
    try {
      const supplierId = localStorage.getItem("supplierId");
      const payload = {
        supplierId: Number(supplierId),
        surveyNumber,
        subDivision,
        village: villageInput,
        taluk: talukInput,
        district: districtInput,
        ownershipType,
        landownerPhone,
        leaseDocumentUrl: leaseDocUrl,
        photoUrl,
        latitude: lat,
        longitude: lng
      };

      const response = await fetch("/api/supplier/land-verifications/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSuccess("Land verification request submitted successfully! Pending review.");
        setShowLandRecordForm(false);
        setSurveyNumber("");
        setSubDivision("");
        setTalukInput("");
        setLandownerPhone("");
        setLeaseDocUrl("");
        setPhotoUrl("");
        
        await fetchProfileAndLands();
      } else {
        const data = await response.json();
        setError(data.error || "Submission failed.");
      }
    } catch (e) {
      setError("Failed to connect to backend server.");
    } finally {
      setSubmittingLand(false);
    }
  };

  // Format byte sizes for human display
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getCleanFileType = (file) => {
    if (!file) return "DOCUMENT";
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".pdf")) return "PDF Document";
    if (name.endsWith(".png")) return "PNG Image";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "JPG Image";
    return "Document";
  };

  const handleFpoFileSelect = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setFpoError("");
    setFpoSuccess("");
    setFpoUploadedDoc(null);

    // Validate type client-side
    const validExts = [".pdf", ".jpg", ".jpeg", ".png"];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExts.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      setFpoError("Only PDF, JPG, and PNG files are accepted.");
      setFpoCertificateFile(null);
      setFpoUploadState("ERROR");
      return;
    }

    // Validate size client-side (10MB max)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setFpoError("File size exceeds the 10MB limit.");
      setFpoCertificateFile(null);
      setFpoUploadState("ERROR");
      return;
    }

    setFpoCertificateFile(file);
    // Automatically trigger reliable upload
    uploadFpoFile(file);
  };

  const uploadFpoFile = async (fileToUpload) => {
    const file = fileToUpload || fpoCertificateFile;
    if (!file) {
      setFpoError("Please select an FPO Share Certificate file (PDF, JPG, PNG).");
      setFpoUploadState("ERROR");
      return;
    }

    setUploadingFpo(true);
    setFpoUploadState("UPLOADING");
    setFpoError("");
    setFpoSuccess("");

    try {
      const supplierId = localStorage.getItem("supplierId");
      const formData = new FormData();
      formData.append("file", file);
      if (supplierId) {
        formData.append("supplierId", supplierId);
      }

      const res = await fetch("/api/supplier/fpo/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setFpoUploadedDoc(data);
        setFpoUploadState("UPLOADED");
        setFpoSuccess("Certificate uploaded successfully");
      } else {
        // Sanitize error string: never expose Java exceptions, paths, or tomcat temp paths
        let rawErr = data?.error || "";
        const isTechnicalLeak =
          rawErr.includes("Exception") ||
          rawErr.includes("FileNotFound") ||
          rawErr.includes("tomcat") ||
          rawErr.includes("Temp") ||
          rawErr.includes(":\\") ||
          rawErr.includes("/");

        const cleanMsg = isTechnicalLeak || !rawErr
          ? "We couldn't upload your certificate. Please try again."
          : rawErr;

        setFpoError(cleanMsg);
        setFpoUploadState("ERROR");
      }
    } catch (err) {
      setFpoError("We couldn't upload your certificate. Please try again.");
      setFpoUploadState("ERROR");
    } finally {
      setUploadingFpo(false);
    }
  };

  const handleFpoSubmitVerification = async (e) => {
    if (e) e.preventDefault();
    if (!fpoUploadedDoc?.filePath) {
      setFpoError("Please upload your certificate first before submitting for verification.");
      return;
    }

    setSubmittingFpo(true);
    setFpoUploadState("SUBMITTING");
    setFpoError("");

    try {
      const supplierId = localStorage.getItem("supplierId");
      const res = await fetch("/api/supplier/fpo/submit-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          supplierId: Number(supplierId),
          filePath: fpoUploadedDoc.filePath,
          originalFileName: fpoUploadedDoc.originalFileName || fpoCertificateFile?.name || "FPO_Certificate"
        })
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setFpoSuccess("Certificate submitted for verification successfully! Awaiting admin review.");
        setVerificationTier("FPO_PENDING");
        setFpoCertificateFile(null);
        setFpoUploadedDoc(null);
        setFpoUploadState("IDLE");
        await fetchProfileAndLands();
      } else {
        let rawErr = data?.error || "";
        const isTechnicalLeak =
          rawErr.includes("Exception") ||
          rawErr.includes("FileNotFound") ||
          rawErr.includes("tomcat") ||
          rawErr.includes("Temp") ||
          rawErr.includes(":\\");

        const cleanMsg = isTechnicalLeak || !rawErr
          ? "We couldn't submit your certificate for verification. Please try again."
          : rawErr;

        setFpoError(cleanMsg);
        setFpoUploadState("UPLOADED");
      }
    } catch (err) {
      setFpoError("We couldn't submit your certificate for verification. Please try again.");
      setFpoUploadState("UPLOADED");
    } finally {
      setSubmittingFpo(false);
    }
  };

  // Product submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const storedRole = localStorage.getItem("role");
    const storedSupplierType = localStorage.getItem("supplierType");
    const storedIsFpoMember = localStorage.getItem("isFpoMember") === "true";

    const isFpoAccount =
      supplier?.supplierType === "FPO" ||
      supplier?.supplierType === "FPO_MEMBER" ||
      Boolean(supplier?.isFpoMember) ||
      storedRole === "FPO" ||
      storedSupplierType === "FPO" ||
      storedSupplierType === "FPO_MEMBER" ||
      storedIsFpoMember ||
      verificationTier === "FPO_VERIFIED" ||
      supplier?.verificationTier === "FPO_VERIFIED" ||
      Boolean(fpoDocStatus?.documents?.some(d => d.verificationStatus === "APPROVED"));

    if (!isFpoAccount && !selectedLandRecordId) {
      setError("Please select a verified land record cultivation origin.");
      return;
    }

    if (calculatedStock <= 0) {
      setError("Please add at least one packaging bag/sack.");
      return;
    }

    // Capacity validation
    if (warehouseCapacity && warehouseCapacity.availableCapacityKg >= 0) {
      if (calculatedStock > warehouseCapacity.availableCapacityKg) {
        setError(`Insufficient warehouse capacity. Space: ${warehouseCapacity.availableCapacityKg} KG.`);
        return;
      }
    }

    setSubmitting(true);
    const supplierId = localStorage.getItem("supplierId");

    const packageBreakdown = Object.keys(bagCounts)
      .map((size) => ({
        packageSize: Number(size),
        bagCount: Number(bagCounts[size])
      }))
      .filter((p) => p.bagCount > 0);

    const product = {
      productName,
      purchasePrice: Number(purchasePrice),
      pricingStrategy,
      marginValue: Number(marginValue),
      stock: calculatedStock,
      supplierId: Number(supplierId),
      category,
      imageUrl,
      packageBreakdown,
      warehouseId: Number(selectedWarehouse),
      landRecordId: selectedLandRecordId ? Number(selectedLandRecordId) : null
    };

    try {
      const response = await fetch("/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });

      if (response.ok) {
        setSuccess("Listing created! Pending warehouse manager approval.");
        setTimeout(() => navigate("/supplier/products"), 2000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to add product.");
      }
    } catch (err) {
      setError("Network compilation error.");
    } finally {
      setSubmitting(false);
    }
  };

  // Styles
  const labelStyle = {
    display: "block",
    fontSize: "12px",
    color: "var(--ink-soft)",
    marginBottom: "6px",
    fontWeight: "600",
    letterSpacing: "0.03em",
    textTransform: "uppercase"
  };

  const inputStyle = {
    width: "100%",
    height: "48px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "0 14px",
    color: "#fff",
    outline: "none",
    fontSize: "14px",
    transition: "border-color 0.2s"
  };

  const storedRole = localStorage.getItem("role");
  const storedSupplierType = localStorage.getItem("supplierType");
  const storedIsFpoMember = localStorage.getItem("isFpoMember") === "true";

  const isFpo =
    supplier?.supplierType === "FPO" ||
    supplier?.supplierType === "FPO_MEMBER" ||
    Boolean(supplier?.isFpoMember) ||
    storedRole === "FPO" ||
    storedSupplierType === "FPO" ||
    storedSupplierType === "FPO_MEMBER" ||
    storedIsFpoMember ||
    verificationTier === "FPO_VERIFIED" ||
    verificationTier === "FPO_PENDING" ||
    supplier?.verificationTier === "FPO_VERIFIED" ||
    supplier?.verificationTier === "FPO_PENDING" ||
    Boolean(fpoDocStatus?.documents && fpoDocStatus.documents.length > 0);

  const isFpoApproved =
    isFpo &&
    (verificationTier === "FPO_VERIFIED" ||
     supplier?.verificationTier === "FPO_VERIFIED" ||
     verificationTier === "SELL_VERIFIED" ||
     supplier?.verificationTier === "SELL_VERIFIED" ||
     Boolean(fpoDocStatus?.documents?.some(d => d.verificationStatus === "APPROVED")));

  const isFarmerApproved = !isFpo && (verificationTier === "SELL_VERIFIED" || supplier?.verificationTier === "SELL_VERIFIED");
  const isSellVerified = isFpoApproved || isFarmerApproved;

  if (loadingProfile) {
    return (
      <>
        <Navbar />
        <div className="layout">
          <SupplierSidebar />
          <div className="content" style={{ flex: 1, padding: "24px", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", color: "rgba(255,255,255,0.6)" }}>
              <Loader2 size={32} className="animate-spin" style={{ color: "#16c784" }} />
              <span style={{ fontSize: "14px", fontWeight: "500" }}>Checking seller verification status...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="layout">
        <SupplierSidebar />

        <div className="content" style={{ flex: 1, padding: "24px", color: "#fff", minHeight: "100vh" }}>
          
          <div style={{ marginBottom: "24px" }}>
            <span style={{ color: "#16C784", fontWeight: "600", letterSpacing: "0.1em", fontSize: "12px", textTransform: "uppercase" }}>
              AGRICULTURAL CATALOG
            </span>
            <h1 style={{ marginTop: "4px", fontSize: "32px", fontWeight: "800" }}>Add New Listing</h1>
          </div>

          <AnimatePresence mode="wait">
            {!isSellVerified ? (
              // ── SELL GATE VIEW ──
              <motion.div
                key="sell-gate"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}
              >
                {isFpo ? (
                  <>
                    <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "16px", padding: "24px", display: "flex", gap: "16px", alignItems: "start" }}>
                      <Building2 size={32} style={{ color: "#a78bfa", flexShrink: 0 }} />
                      <div>
                        <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700" }}>Verify Your FPO Credentials</h2>
                        <p style={{ margin: "0", fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: "1.5" }}>
                          Upload your registered FPO Share Certificate or Certificate of Incorporation for admin verification before listing collective agricultural produce.
                        </p>
                      </div>
                    </div>

                    {fpoDocStatus?.documents && fpoDocStatus.documents.length > 0 && (
                      <div style={{ background: "rgba(13,17,29,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px" }}>
                        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#a78bfa" }}>Certificate Verification Status</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {fpoDocStatus.documents.map((doc) => (
                            <div key={doc.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ fontWeight: "700", color: "#fff" }}>{doc.originalFileName || "Share_Certificate"}</div>
                                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                                  Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—"}
                                </div>
                                {doc.verificationStatus === "PENDING" && (
                                  <div style={{ fontSize: "11px", color: "#fbbf24", background: "rgba(251,191,36,0.1)", display: "inline-block", padding: "4px 8px", borderRadius: "4px", marginTop: "8px" }}>
                                    Verification in progress — our compliance team is reviewing your certificate. Current status: PENDING
                                  </div>
                                )}
                                {doc.verificationStatus === "REJECTED" && (
                                  <div style={{ fontSize: "11px", color: "#ef4444", background: "rgba(239,68,68,0.1)", display: "inline-block", padding: "4px 8px", borderRadius: "4px", marginTop: "8px" }}>
                                    Rejected: {doc.rejectionReason || "Please upload a valid certificate."}
                                  </div>
                                )}
                              </div>
                              <div style={{
                                fontWeight: "700",
                                color: doc.verificationStatus === "APPROVED" ? "#10b981" : doc.verificationStatus === "REJECTED" ? "#ef4444" : "#fbbf24"
                              }}>
                                {doc.verificationStatus}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="card" style={{ padding: "28px", background: "rgba(13,17,29,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                        <Upload size={20} style={{ color: "#a78bfa" }} /> Verify Your FPO Credentials
                      </h3>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Dropzone & File Selection Area */}
                        <div style={{
                          background: fpoUploadState === "UPLOADED" ? "rgba(16,185,129,0.03)" : "rgba(255,255,255,0.02)",
                          border: fpoUploadState === "UPLOADED" ? "1px solid rgba(16,185,129,0.3)" : "1px dashed rgba(139,92,246,0.3)",
                          borderRadius: "10px",
                          padding: "24px",
                          textAlign: "center"
                        }}>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFpoFileSelect}
                            style={{ display: "none" }}
                            id="fpoCertFile"
                          />

                          {!fpoCertificateFile ? (
                            <label htmlFor="fpoCertFile" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                              <Upload size={28} style={{ color: "#a78bfa" }} />
                              <span style={{ fontSize: "14px", fontWeight: "600", color: "#fff" }}>
                                Click to select FPO Share Certificate
                              </span>
                              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                                Supported formats: PDF, JPG, PNG (Max 10MB)
                              </span>
                            </label>
                          ) : (
                            /* File Details Display */
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                              <div style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                background: "rgba(255,255,255,0.04)",
                                padding: "12px 20px",
                                borderRadius: "8px",
                                border: "1px solid rgba(255,255,255,0.08)",
                                maxWidth: "500px",
                                width: "100%"
                              }}>
                                <FileText size={28} style={{ color: "#a78bfa", flexShrink: 0 }} />
                                <div style={{ textAlign: "left", flex: 1, overflow: "hidden" }}>
                                  <div style={{ fontSize: "14px", fontWeight: "600", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {fpoCertificateFile.name}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" }}>
                                    {getCleanFileType(fpoCertificateFile)} • {formatFileSize(fpoCertificateFile.size)}
                                  </div>
                                </div>
                                {fpoUploadState === "UPLOADED" && (
                                  <CheckCircle2 size={20} style={{ color: "#10b981", flexShrink: 0 }} />
                                )}
                              </div>

                              {/* Upload in Progress */}
                              {uploadingFpo && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#a78bfa", fontSize: "13px" }}>
                                  <Loader2 size={16} className="animate-spin" />
                                  <span>Uploading certificate...</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Error Notification with Action Buttons */}
                        {fpoError && (
                          <div style={{
                            color: "#ef4444",
                            fontSize: "13px",
                            padding: "14px",
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: "8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
                              <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0 }} />
                              <span>{fpoError}</span>
                            </div>
                            <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
                              {fpoCertificateFile && (
                                <button
                                  type="button"
                                  onClick={() => uploadFpoFile(fpoCertificateFile)}
                                  style={{
                                    background: "rgba(239,68,68,0.15)",
                                    border: "1px solid rgba(239,68,68,0.3)",
                                    color: "#fff",
                                    padding: "6px 14px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px"
                                  }}
                                >
                                  <RefreshCw size={13} /> Retry Upload
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setFpoError("");
                                  setFpoCertificateFile(null);
                                  setFpoUploadedDoc(null);
                                  setFpoUploadState("IDLE");
                                  const input = document.getElementById("fpoCertFile");
                                  if (input) {
                                    input.value = "";
                                    input.click();
                                  }
                                }}
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid rgba(255,255,255,0.1)",
                                  color: "rgba(255,255,255,0.8)",
                                  padding: "6px 14px",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "500"
                                }}
                              >
                                Choose Another File
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Green Success State */}
                        {fpoSuccess && (
                          <div style={{
                            color: "#10b981",
                            fontSize: "13px",
                            padding: "12px 16px",
                            background: "rgba(16,185,129,0.08)",
                            border: "1px solid rgba(16,185,129,0.2)",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: "600"
                          }}>
                            <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0 }} />
                            <span>{fpoSuccess}</span>
                          </div>
                        )}

                        {/* Submit Button (Enabled ONLY once uploaded successfully) */}
                        <button
                          type="button"
                          onClick={handleFpoSubmitVerification}
                          disabled={submittingFpo || uploadingFpo || fpoUploadState !== "UPLOADED"}
                          style={{
                            background: fpoUploadState === "UPLOADED"
                              ? "linear-gradient(135deg, #8b5cf6, #7c3aed)"
                              : "rgba(255,255,255,0.05)",
                            border: fpoUploadState === "UPLOADED"
                              ? "none"
                              : "1px solid rgba(255,255,255,0.1)",
                            color: fpoUploadState === "UPLOADED" ? "#fff" : "rgba(255,255,255,0.3)",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            cursor: (submittingFpo || uploadingFpo || fpoUploadState !== "UPLOADED") ? "not-allowed" : "pointer",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            opacity: (submittingFpo || uploadingFpo || fpoUploadState !== "UPLOADED") ? 0.6 : 1,
                            transition: "all 0.2s ease",
                            marginTop: "8px"
                          }}
                        >
                          {submittingFpo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          Submit Certificate for Verification
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "16px", padding: "24px", display: "flex", gap: "16px", alignItems: "start" }}>
                  <ShieldIcon size={32} style={{ color: "#f59e0b", flexShrink: 0 }} />
                  <div>
                    <h2 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "700" }}>Complete Land Verification to Start Selling</h2>
                    <p style={{ margin: "0", fontSize: "14px", color: "rgba(255,255,255,0.7)", lineHeight: "1.5" }}>
                      To prevent unauthorized trading and enforce local yield compliance, all suppliers must link a verified cultivation land record (Patta or Adangal lease document) before listing agricultural products.
                    </p>
                  </div>
                </div>

                {/* Land Record Status cards */}
                {landRecords.length > 0 && !showLandRecordForm && (
                  <div style={{ background: "rgba(13,17,29,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "20px" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", color: "#a78bfa" }}>Verification Tracking Status</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {landRecords.map((r) => (
                        <div key={r.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: "700" }}>Survey Number: {r.surveyNumber} {r.subDivision ? `/ ${r.subDivision}` : ""}</div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" }}>
                              Location: {r.village}, {r.taluk}, {r.district} · {r.ownershipType}
                            </div>
                            
                            {r.verificationStatus === "PENDING" && (
                              <div style={{ fontSize: "11px", color: "#fbbf24", background: "rgba(251,191,36,0.1)", display: "inline-block", padding: "4px 8px", borderRadius: "4px", marginTop: "8px" }}>
                                Verification in progress — our team is checking your Patta/Adangal. We will call the landowner {r.landownerPhone ? `at ${r.landownerPhone}` : ""} to confirm cultivation details. Current status: PENDING
                              </div>
                            )}

                            {r.verificationStatus === "FLAGGED" && (
                              <div style={{ fontSize: "11px", color: "#ef4444", background: "rgba(239,68,68,0.1)", display: "inline-block", padding: "4px 8px", borderRadius: "4px", marginTop: "8px" }}>
                                Verification flagged — cultivator name match issue or landowner confirmation pending. Current status: FLAGGED
                              </div>
                            )}

                            {r.verificationStatus === "REJECTED" && (
                              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", display: "inline-block", padding: "4px 8px", borderRadius: "4px", marginTop: "8px" }}>
                                Verification rejected. Please verify survey records or upload a valid lease agreement. Current status: REJECTED
                              </div>
                            )}
                          </div>

                          <div style={{ fontWeight: "bold" }}>
                            {r.verificationStatus}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => setShowLandRecordForm(true)}
                      style={{ marginTop: "16px", background: "none", border: "1px dashed rgba(139,92,246,0.4)", color: "#a78bfa", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <Plus size={16} /> Link Another Land Record
                    </button>
                  </div>
                )}

                {/* LAND RECORD FORM */}
                {(landRecords.length === 0 || showLandRecordForm) && (
                  <div className="card" style={{ padding: "28px", background: "rgba(13,17,29,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                        <MapPin size={20} style={{ color: "#16C784" }} /> Register Cultivation Land Details
                      </h3>
                      {landRecords.length > 0 && (
                        <button onClick={() => setShowLandRecordForm(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>Cancel</button>
                      )}
                    </div>

                    <form onSubmit={handleLandSubmission} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      
                      {/* Ownership Radio */}
                      <div>
                        <label style={labelStyle}>Ownership Status</label>
                        <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input type="radio" name="ownershipType" value="OWNER" checked={ownershipType === "OWNER"} onChange={() => setOwnershipType("OWNER")} style={{ width: "16px", height: "16px" }} />
                            I Own this Land (Patta)
                          </label>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input type="radio" name="ownershipType" value="TENANT" checked={ownershipType === "TENANT"} onChange={() => setOwnershipType("TENANT")} style={{ width: "16px", height: "16px" }} />
                            I Lease this Land (Tenant)
                          </label>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={labelStyle}>Survey Number</label>
                          <input type="text" placeholder="e.g. 142" value={surveyNumber} onChange={(e) => setSurveyNumber(e.target.value)} required style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Sub-division (Optional)</label>
                          <input type="text" placeholder="e.g. 2B" value={subDivision} onChange={(e) => setSubDivision(e.target.value)} style={inputStyle} />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                        <div>
                          <label style={labelStyle}>District</label>
                          <input type="text" placeholder="e.g. Coimbatore" value={districtInput} onChange={(e) => setDistrictInput(e.target.value)} required style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Taluk</label>
                          <input type="text" placeholder="e.g. Coimbatore North" value={talukInput} onChange={(e) => setTalukInput(e.target.value)} required style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Village</label>
                          <input type="text" placeholder="e.g. Thoppampatti" value={villageInput} onChange={(e) => setVillageInput(e.target.value)} required style={inputStyle} />
                        </div>
                      </div>

                      {/* TENANT INPUTS */}
                      {ownershipType === "TENANT" && (
                        <div style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                          <div>
                            <label style={labelStyle}>Landowner Phone number (for verification call check)</label>
                            <input type="tel" placeholder="Enter landowner's 10-digit number" value={landownerPhone} onChange={(e) => setLandownerPhone(e.target.value)} required style={inputStyle} />
                          </div>

                          <div>
                            <label style={labelStyle}>Lease agreement document file (PDF or Image)</label>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, "lease")} style={{ display: "none" }} id="leaseDoc" />
                              <label htmlFor="leaseDoc" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 16px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                                <Upload size={14} /> Choose File
                              </label>
                              {leaseDocUrl ? (
                                <span style={{ color: "#10b981", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px" }}><Check size={14} /> Document Uploaded</span>
                              ) : (
                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>No document selected</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Geo-tagged photo upload */}
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "16px" }}>
                        <label style={labelStyle}>Crop cultivation field boundary photo (EXIF Location Tagging)</label>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                          <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "photo")} style={{ display: "none" }} id="cropPhoto" />
                          <label htmlFor="cropPhoto" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 16px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                            <Upload size={14} /> Upload Crop Photo
                          </label>
                          {photoUrl ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ color: "#10b981", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: "600" }}><Check size={14} /> Photo Tagged</span>
                              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>EXIF Coordinates: Lat {lat.toFixed(4)}, Lng {lng.toFixed(4)}</span>
                            </div>
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>Geotag coordinates will be auto-attached from GPS boundary parameters</span>
                          )}
                        </div>
                      </div>

                      {error && <div style={{ color: "#ef4444", fontSize: "13px", padding: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px", marginBottom: "12px" }}>{error}</div>}
                      <div style={{ color: "#10b981", fontSize: "13px" }}>{success}</div>

                      <button
                        type="submit"
                        disabled={submittingLand || uploadingFile}
                        style={{ background: "#8b5cf6", border: "none", color: "#fff", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                      >
                        {(submittingLand || uploadingFile) ? <Loader2 size={16} className="animate-spin" /> : null}
                        Submit Land Details for Verification
                      </button>

                    </form>
                  </div>
                )}
                  </>
                )}
              </motion.div>
            ) : (
              // ── ADD PRODUCT FORM VIEW ──
              <motion.div
                key="add-product-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "24px", alignItems: "start" }}
              >
                {/* Form Card */}
                <div className="card" style={{ padding: "28px", background: "rgba(13,17,29,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Package style={{ color: "#16C784" }} size={20} /> Product Details
                  </h3>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    
                    {/* Cultivated Land Selection Dropdown or FPO Verified Badge */}
                    {isFpo ? (
                      <div style={{
                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(139, 92, 246, 0.12))",
                        border: "1px solid rgba(16, 185, 129, 0.35)",
                        borderRadius: "12px",
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "14px"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <Building2 size={24} style={{ color: "#10b981", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: "700", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                              <span>FPO VERIFIED</span>
                              <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "rgba(16, 185, 129, 0.2)",
                                color: "#34d399",
                                border: "1px solid rgba(16, 185, 129, 0.4)",
                                padding: "3px 10px",
                                borderRadius: "100px",
                                fontSize: "12px",
                                fontWeight: "700"
                              }}>
                                ✓ FPO Verified
                              </span>
                            </div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>
                              Your FPO account has been verified by the administrator. You can now list collective agricultural produce.
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label style={labelStyle}><MapPin size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />Select Cultivation Land Origin *</label>
                        <select
                          value={selectedLandRecordId}
                          onChange={(e) => setSelectedLandRecordId(e.target.value)}
                          required
                          style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                        >
                          <option value="" style={{ background: "#0B0F14" }}>Select a verified land record...</option>
                          {landRecords.filter(r => r.verificationStatus === "APPROVED").map(r => (
                            <option key={r.id} value={r.id} style={{ background: "#0B0F14" }}>
                              Survey: {r.surveyNumber} ({r.village}, {r.district}) · Extent: {r.extentAcres} Acres · {r.ownershipType}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Product Name */}
                    <div>
                      <label style={labelStyle}><Tag size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />Product Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Toor Dal, Basmati Rice, Turmeric Powder"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        required
                        style={inputStyle}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label style={labelStyle}><ChevronDown size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                      >
                        <option value="" style={{ background: "#0B0F14" }}>Select a category...</option>
                        {allowedCategories.map((cat) => (
                          <option key={cat} value={cat} style={{ background: "#0B0F14" }}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Warehouse Selection & AI Recommendation */}
                    <div>
                      <label style={labelStyle}><ChevronDown size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />Storage Warehouse</label>
                      <select
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        required
                        style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
                      >
                        <option value="" style={{ background: "#0B0F14" }}>Select a warehouse...</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id} style={{ background: "#0B0F14" }}>
                            {w.warehouseName} ({w.district}, {w.state})
                          </option>
                        ))}
                      </select>

                      {recommendation && (
                        <div style={{ marginTop: "12px", padding: "12px", border: "1px dashed rgba(22,199,132,0.4)", borderRadius: "8px", background: "rgba(22,199,132,0.03)" }}>
                          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#34D399", textTransform: "uppercase", display: "block" }}>
                            {recommendation.mode === "ML" ? "✨ AI Recommended Warehouse" : "Recommended Warehouse"}
                          </span>
                          <strong style={{ fontSize: "14px", color: "white", display: "block", marginTop: "4px" }}>
                            {recommendation.warehouse.warehouseName}
                          </strong>
                          <div style={{ fontSize: "12px", color: "var(--ink-soft)", display: "block", marginTop: "4px" }}>
                            {recommendation.suitabilityScore !== null && (
                              <div style={{ color: "#34D399", fontWeight: "bold", marginBottom: "4px" }}>
                                AI Suitability: {recommendation.suitabilityScore}%
                              </div>
                            )}
                            <div>Distance: {recommendation.distance} km</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pricing Config */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "12px" }}>
                      <div>
                        <label style={labelStyle}>Mandi Base Price (₹/kg)</label>
                        <input type="number" placeholder="₹" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Strategy</label>
                        <select value={pricingStrategy} onChange={(e) => setPricingStrategy(e.target.value)} style={{ ...inputStyle, appearance: "auto" }}>
                          <option value="PROFIT_PER_KG">₹ profit/kg</option>
                          <option value="PROFIT_PERCENTAGE">% markup</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Margin Value</label>
                        <input type="number" placeholder="e.g. 5" value={marginValue} onChange={(e) => setMarginValue(e.target.value)} required style={inputStyle} />
                      </div>
                    </div>

                    {/* Image URL */}
                    <div>
                      <label style={labelStyle}><ImageIcon size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />Image URL</label>
                      <input type="text" placeholder="Paste image url..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={inputStyle} />
                    </div>

                    {/* Dynamic Package Bags Inputs */}
                    <div style={{ marginTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
                      <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "700" }}>Storage Packages Configuration</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
                        {packagingStandards.map((size) => (
                          <div key={size} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                            <label style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{size} KG Sack</label>
                            <input
                              type="number"
                              min="0"
                              value={bagCounts[size] || 0}
                              onChange={(e) => handleBagCountChange(size, e.target.value)}
                              style={{ width: "60px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "4px", color: "#fff", padding: "4px", textAlign: "center", marginTop: "6px", fontSize: "14px" }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Yield Warnings Banner */}
                    {yieldWarning && (
                      <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "12px", display: "flex", gap: "8px", alignItems: "start", fontSize: "12px", color: "#fbbf24" }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                        <span>{yieldWarning}</span>
                      </div>
                    )}

                    {error && <div style={{ color: "#ef4444", fontSize: "13px", padding: "10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "6px" }}>{error}</div>}
                    {success && <div style={{ color: "#10b981", fontSize: "13px" }}>{success}</div>}

                    <button
                      type="submit"
                      disabled={submitting}
                      style={{ background: "#16c784", border: "none", color: "#fff", height: "48px", borderRadius: "10px", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "15px" }}
                    >
                      {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                      Submit Product Listing
                    </button>

                  </form>
                </div>

                {/* Right Column: Live summary */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  {/* Listing overview summary */}
                  <div style={{ background: "rgba(10,14,28,0.72)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px" }}>
                    <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700" }}>Listing Preview Summary</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>Total Stock weight:</span>
                        <strong style={{ color: "#fff" }}>{calculatedStock.toLocaleString("en-IN")} KG</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>Calculated Selling price:</span>
                        <strong style={{ color: "#16c784" }}>₹ {calculatedSellingPrice.toFixed(2)} / kg</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "rgba(255,255,255,0.4)" }}>Pricing margin scheme:</span>
                        <span>{pricingStrategy === "PROFIT_PERCENTAGE" ? `${marginValue}% Markup` : `₹ ${marginValue}/kg Fixed`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Selected warehouse live space info */}
                  {selectedWarehouseObj && (
                    <div style={{ background: "rgba(10,14,28,0.72)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px" }}>
                      <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}><WarehouseIcon size={16} /> Selected Storage Space Info</h3>
                      
                      {capacityLoading ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                          <Loader2 size={14} className="animate-spin" /> Fetching live capacity...
                        </div>
                      ) : warehouseCapacity ? (
                        <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div>District Location: <strong>{selectedWarehouseObj.district}</strong></div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Available Storage Space:</span>
                            <strong style={{ color: "#10b981" }}>{warehouseCapacity.availableCapacityKg.toLocaleString("en-IN")} KG</strong>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>No capacity limits configured for this category at selected warehouse.</span>
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
}

export default AddProduct;