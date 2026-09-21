import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Trash2, 
  Compass, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Search, 
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from "lucide-react";
import { useFarmerAgent } from "./useFarmerAgent";
import { speechRecognitionService, speechSynthesisService } from "./speechService";

export default function FarmerAgentModal() {
  const {
    isOpen,
    setIsOpen,
    messages,
    setMessages,
    loading,
    currentLanguage,
    setCurrentLanguage,
    sendMessage,
    clearChat,
    role
  } = useFarmerAgent();

  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(() => {
    return localStorage.getItem("farmerAgentAutoSpeak") === "true";
  });
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [handledConfirmations, setHandledConfirmations] = useState(new Set());

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen && !isMinimized && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  // Global listener to trigger agent modal from Sidebar AI Assistant item
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };
    window.addEventListener("openFarmerAgent", handleOpen);
    return () => window.removeEventListener("openFarmerAgent", handleOpen);
  }, [setIsOpen]);

  // Automatically speak assistant replies if autoSpeak is enabled
  useEffect(() => {
    if (!autoSpeak || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant" && !lastMsg.isError) {
      handleSpeak(lastMsg);
    }
  }, [messages, autoSpeak]);

  const toggleAutoSpeak = () => {
    const nextVal = !autoSpeak;
    setAutoSpeak(nextVal);
    localStorage.setItem("farmerAgentAutoSpeak", String(nextVal));
    if (!nextVal) {
      speechSynthesisService.stop();
      setSpeakingMessageId(null);
    }
  };

  const handleSpeak = (message) => {
    if (speakingMessageId === message.id) {
      speechSynthesisService.stop();
      setSpeakingMessageId(null);
      return;
    }

    setSpeakingMessageId(message.id);
    const targetLang = message.language || (/[\u0B80-\u0BFF]/.test(message.content || "") ? "ta" : currentLanguage);
    console.log("[FarmerAgentModal handleSpeak] message.id:", message.id);
    console.log("[FarmerAgentModal handleSpeak] message.content (full length):", (message.content || "").length);
    console.log("[FarmerAgentModal handleSpeak] message.content:", message.content);
    console.log("[FarmerAgentModal handleSpeak] targetLang:", targetLang);
    speechSynthesisService.speak(message.content, targetLang, {
      onEnd: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null)
    });
  };

  const toggleListening = () => {
    if (isListening) {
      speechRecognitionService.stop();
      setIsListening(false);
      return;
    }

    if (!speechRecognitionService.isSupported()) {
      alert(currentLanguage === "ta" 
        ? "உங்கள் உலாவியில் குரல் உள்ளீடு (Voice Input) ஆதரிக்கப்படவில்லை. Chrome/Edge உலாவியைப் பயன்படுத்தவும்."
        : "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    // Stop any ongoing TTS before speaking
    speechSynthesisService.stop();
    setSpeakingMessageId(null);

    speechRecognitionService.start(currentLanguage, {
      onStart: () => setIsListening(true),
      onResult: ({ final, interim }) => {
        if (final) {
          setInput(final);
          // Send immediately once farmer finishes sentence
          speechRecognitionService.stop();
          setIsListening(false);
          sendMessage(final);
          setInput("");
        } else if (interim) {
          setInput(interim);
        }
      },
      onError: (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      },
      onEnd: () => setIsListening(false)
    });
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    speechSynthesisService.stop();
    setSpeakingMessageId(null);
    sendMessage(input);
    setInput("");
  };

  const handleQuickChipAction = (actionKey) => {
    speechSynthesisService.stop();
    setSpeakingMessageId(null);

    if (actionKey === "mandi") {
      sendMessage(currentLanguage === "ta" ? "Pollachi tomato சந்தை விலை என்ன?" : "Pollachi tomato mandi market price");
    } else if (actionKey === "forecast") {
      const savedCrop = localStorage.getItem("selectedCrop") || "";
      if (savedCrop) {
        sendMessage(currentLanguage === "ta" ? `${savedCrop} விலை கணிப்பு` : `${savedCrop} price forecast`);
      } else {
        const clarifyMsg = {
          id: `agent-prompt-crop-${Date.now()}`,
          role: "assistant",
          content: currentLanguage === "ta"
            ? "எந்த பயிருக்கு விலை கணிப்பு வேண்டும்? கீழே உள்ள பயிர்களில் ஒன்றை தேர்ந்தெடுக்கவும்:"
            : "Which crop do you want a price forecast for? Please select a crop below:",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: "PROMPT_CROP_SELECTION",
          language: currentLanguage
        };
        setMessages((prev) => [...prev, clarifyMsg]);
      }
    } else if (actionKey === "stock") {
      const stockMsg = {
        id: `agent-stock-guide-${Date.now()}`,
        role: "assistant",
        content: currentLanguage === "ta"
          ? "📦 இருப்பை மாற்ற: 'Tomato இருப்பை 500 ஆக மாற்று' அல்லது 'Update tomato stock to 500' என்று கூறவும் அல்லது தட்டச்சு செய்யவும்."
          : "📦 To update stock, please type or say: 'Update [crop] stock to [number]' (e.g., 'Update tomato stock to 500').",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "GUIDE_STOCK",
        language: currentLanguage
      };
      setMessages((prev) => [...prev, stockMsg]);
      inputRef.current?.focus();
    } else if (actionKey === "price") {
      const priceMsg = {
        id: `agent-price-guide-${Date.now()}`,
        role: "assistant",
        content: currentLanguage === "ta"
          ? "💰 விலையை மாற்ற: 'Tomato விலையை 45 ஆக மாற்று' அல்லது 'Update tomato price to 45' என்று கூறவும் அல்லது தட்டச்சு செய்யவும்."
          : "💰 To update product price, please type or say: 'Update [crop] price to [amount]' (e.g., 'Update tomato price to 45').",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "GUIDE_PRICE",
        language: currentLanguage
      };
      setMessages((prev) => [...prev, priceMsg]);
      inputRef.current?.focus();
    }
  };

  const handleSelectCropForForecast = (cropName) => {
    if (cropName === "Other") {
      inputRef.current?.focus();
      return;
    }
    localStorage.setItem("selectedCrop", cropName);
    sendMessage(currentLanguage === "ta" ? `${cropName} விலை கணிப்பு` : `${cropName} price forecast`);
  };

  const handleConfirmWrite = (messageId, isConfirmed, lang) => {
    setHandledConfirmations((prev) => new Set(prev).add(messageId));
    if (isConfirmed) {
      sendMessage(lang === "ta" ? "ஆம், உறுதிப்படுத்துகிறேன்" : "Yes, confirm update");
    } else {
      sendMessage(lang === "ta" ? "வேண்டாம், ரத்து செய்" : "No, cancel update");
    }
  };

  // Only display Agent for Farmer/Supplier role or supplier URLs
  const isFarmerContext = role === "SUPPLIER" || window.location.pathname.startsWith("/supplier");
  if (!isFarmerContext) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, right: 28, zIndex: 9999 }}>
      {/* 1. Floating Launch Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "50px",
            padding: "12px 20px",
            boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(16, 185, 129, 0.3)",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "0.02em"
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)"
          }}>
            <Bot size={18} />
          </div>
          <span>DRAVIX Agent</span>
          <span style={{
            fontSize: "10px",
            background: "rgba(0,0,0,0.25)",
            padding: "2px 6px",
            borderRadius: "10px",
            fontWeight: 800
          }}>
            AI
          </span>
        </motion.button>
      )}

      {/* 2. Interactive Agent Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? "64px" : "560px",
              width: "390px"
            }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: "flex",
              flexDirection: "column",
              background: "rgba(10, 15, 29, 0.94)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "20px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 35px -5px rgba(16, 185, 129, 0.15)",
              overflow: "hidden"
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderBottom: isMinimized ? "none" : "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(16, 185, 129, 0.08)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff"
                }}>
                  <Bot size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>DRAVIX Farmer Agent</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                    {currentLanguage === "ta" ? "தமிழ் & English தயார்" : "Tamil & English Ready"}
                  </div>
                </div>
              </div>

              {/* Window Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => setCurrentLanguage((prev) => (prev === "ta" ? "en" : "ta"))}
                  title="Switch Language (தமிழ் / English)"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 7px",
                    cursor: "pointer"
                  }}
                >
                  {currentLanguage === "ta" ? "தமிழ்" : "EN"}
                </button>
                <button
                  onClick={toggleAutoSpeak}
                  title={autoSpeak ? (currentLanguage === "ta" ? "குரல் வாசிப்பை அணைக்கவும்" : "Turn off auto speech") : (currentLanguage === "ta" ? "தானியங்கி குரல் வாசிப்பை இயக்கவும்" : "Turn on auto speech")}
                  style={{
                    background: autoSpeak ? "rgba(16, 185, 129, 0.2)" : "rgba(255,255,255,0.08)",
                    border: autoSpeak ? "1px solid rgba(16, 185, 129, 0.5)" : "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6,
                    color: autoSpeak ? "#34d399" : "rgba(255,255,255,0.6)",
                    padding: "3px 6px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {autoSpeak ? <Volume2 size={13} /> : <VolumeX size={13} />}
                </button>
                <button
                  onClick={clearChat}
                  title="Clear chat history"
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    padding: 4
                  }}
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={() => setIsMinimized((prev) => !prev)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    padding: 4
                  }}
                >
                  {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    padding: 4
                  }}
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            {!isMinimized && (
              <>
                <div style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}>
                  {messages.map((m) => {
                    const isUser = m.role === "user";
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isUser ? "flex-end" : "flex-start",
                          maxWidth: "100%"
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "85%",
                            padding: "10px 14px",
                            borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                            background: isUser
                              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                              : m.isError
                              ? "rgba(239, 68, 68, 0.15)"
                              : "rgba(255, 255, 255, 0.06)",
                            border: isUser
                              ? "none"
                              : m.isError
                              ? "1px solid rgba(239, 68, 68, 0.3)"
                              : "1px solid rgba(255, 255, 255, 0.08)",
                            color: m.isError ? "#fca5a5" : "#ffffff",
                            fontSize: 13,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word"
                          }}
                        >
                          {m.content}

                          {/* Crop selection chips for Forecast clarification */}
                          {(m.action === "PROMPT_CROP_SELECTION" || (m.action === "CLARIFICATION_NEEDED" && (m.content?.toLowerCase().includes("crop") || m.content?.includes("பயிரு")))) && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                              {["Rice", "Wheat", "Maize", "Tomato", "Other"].map((crop) => (
                                <button
                                  key={crop}
                                  onClick={() => handleSelectCropForForecast(crop)}
                                  disabled={loading}
                                  style={{
                                    background: "rgba(16, 185, 129, 0.15)",
                                    border: "1px solid rgba(16, 185, 129, 0.4)",
                                    borderRadius: "14px",
                                    color: "#34d399",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    padding: "4px 10px",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    transition: "all 0.2s"
                                  }}
                                >
                                  {crop === "Rice" ? "🌾 Rice" : crop === "Wheat" ? "🌾 Wheat" : crop === "Maize" ? "🌽 Maize" : crop === "Tomato" ? "🍅 Tomato" : "✏️ Other"}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Interactive Write Action Confirmation Card */}
                          {(m.requiresConfirmation || (m.data && (m.data.action === "UPDATE_PRODUCT_STOCK" || m.data.action === "UPDATE_PRODUCT_PRICE"))) && (
                            <div style={{
                              marginTop: 10,
                              padding: "12px 14px",
                              borderRadius: 12,
                              background: "rgba(16, 185, 129, 0.08)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              display: "flex",
                              flexDirection: "column",
                              gap: 8
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "#34d399" }}>
                                <Sparkles size={14} />
                                <span>{m.language === "ta" ? "மாற்றத்தை உறுதிப்படுத்தவும்" : "Confirm Action Required"}</span>
                              </div>
                              
                              <div style={{ fontSize: 12, color: "#e2e8f0", background: "rgba(0,0,0,0.25)", padding: "8px 10px", borderRadius: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                                <div><strong>{m.language === "ta" ? "பொருள்:" : "Product:"}</strong> {m.data?.productName || "Selected Crop"}</div>
                                {m.data?.newStock != null && (
                                  <div>
                                    <span>{m.language === "ta" ? "இருப்பு:" : "Stock:"} </span>
                                    <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.4)" }}>{m.data?.currentStock ?? "—"} kg</span>
                                    <span style={{ color: "#34d399", fontWeight: 700 }}> → {m.data?.newStock} kg</span>
                                  </div>
                                )}
                                {m.data?.newPrice != null && (
                                  <div>
                                    <span>{m.language === "ta" ? "விலை:" : "Price:"} </span>
                                    <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.4)" }}>₹{m.data?.currentPrice ?? "—"}/kg</span>
                                    <span style={{ color: "#34d399", fontWeight: 700 }}> → ₹{m.data?.newPrice}/kg</span>
                                  </div>
                                )}
                              </div>

                              {!handledConfirmations.has(m.id) ? (
                                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                                  <button
                                    onClick={() => handleConfirmWrite(m.id, true, m.language)}
                                    disabled={loading}
                                    style={{
                                      flex: 1,
                                      padding: "7px 12px",
                                      borderRadius: 8,
                                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                      color: "#fff",
                                      border: "none",
                                      fontWeight: 700,
                                      fontSize: 11,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 4
                                    }}
                                  >
                                    {m.language === "ta" ? "✅ ஆம், உறுதிசெய்" : "✅ Confirm Update"}
                                  </button>
                                  <button
                                    onClick={() => handleConfirmWrite(m.id, false, m.language)}
                                    disabled={loading}
                                    style={{
                                      flex: 1,
                                      padding: "7px 12px",
                                      borderRadius: 8,
                                      background: "rgba(239, 68, 68, 0.15)",
                                      color: "#f87171",
                                      border: "1px solid rgba(239, 68, 68, 0.35)",
                                      fontWeight: 700,
                                      fontSize: 11,
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      gap: 4
                                    }}
                                  >
                                    {m.language === "ta" ? "❌ ரத்து செய்" : "❌ Cancel"}
                                  </button>
                                </div>
                              ) : (
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontStyle: "italic", textAlign: "center" }}>
                                  {m.language === "ta" ? "பதில் அனுப்பப்பட்டது" : "Response submitted"}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Navigation Indicator Badge */}
                          {m.navigationPath && (
                            <div style={{
                              marginTop: 8,
                              paddingTop: 6,
                              borderTop: "1px solid rgba(255,255,255,0.1)",
                              fontSize: 11,
                              color: "#6ee7b7",
                              display: "flex",
                              alignItems: "center",
                              gap: 5
                            }}>
                              <ExternalLink size={12} />
                              <span>Opening page: {m.navigationPath}</span>
                            </div>
                          )}
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginTop: 3,
                          padding: "0 4px"
                        }}>
                          <span style={{
                            fontSize: 10,
                            color: "rgba(255,255,255,0.35)"
                          }}>
                            {m.timestamp}
                          </span>
                          {!isUser && (
                            <button
                              onClick={() => handleSpeak(m)}
                              title={speakingMessageId === m.id ? (currentLanguage === "ta" ? "நிறுத்து" : "Stop speech") : (currentLanguage === "ta" ? "குரலில் கேட்கவும்" : "Listen to speech")}
                              style={{
                                background: speakingMessageId === m.id ? "rgba(16, 185, 129, 0.25)" : "none",
                                border: "none",
                                color: speakingMessageId === m.id ? "#34d399" : "rgba(255,255,255,0.4)",
                                cursor: "pointer",
                                padding: "2px 4px",
                                borderRadius: 4,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                fontSize: 10
                              }}
                            >
                              <Volume2 size={12} className={speakingMessageId === m.id ? "animate-pulse" : ""} />
                              {speakingMessageId === m.id && <span>Speaking...</span>}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", color: "#10b981", fontSize: 12 }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{currentLanguage === "ta" ? "பரிசீலிக்கிறது..." : "Agent thinking..."}</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Action Suggestion Chips */}
                <div style={{
                  padding: "8px 14px",
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                  background: "rgba(0,0,0,0.2)"
                }}>
                  {[
                    { key: "mandi", label: currentLanguage === "ta" ? "🌾 மண்டி விலை" : "🌾 Market Price" },
                    { key: "forecast", label: currentLanguage === "ta" ? "📈 விலை கணிப்பு" : "📈 Price Forecast" },
                    { key: "stock", label: currentLanguage === "ta" ? "📦 இருப்பு புதுப்பிப்பு" : "📦 Update Stock" },
                    { key: "price", label: currentLanguage === "ta" ? "💰 விலை புதுப்பிப்பு" : "💰 Update Product Price" }
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickChipAction(chip.key)}
                      disabled={loading}
                      style={{
                        whiteSpace: "nowrap",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "14px",
                        color: "rgba(255,255,255,0.85)",
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "5px 12px",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Input Form */}
                <form
                  onSubmit={handleSend}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 14px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    background: "rgba(10, 14, 25, 0.8)"
                  }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      currentLanguage === "ta"
                        ? "தமிழில் அல்லது English-ல் கேட்கவும்..."
                        : "Ask in Tamil or English..."
                    }
                    disabled={loading}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      color: "#fff",
                      fontSize: 13,
                      outline: "none"
                    }}
                  />

                  {/* Microphone Voice Input Button */}
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={loading}
                    title={
                      isListening
                        ? (currentLanguage === "ta" ? "பதிவு செய்யப்படுகிறது... நிறுத்த கிளிக் செய்யவும்" : "Listening... Click to stop")
                        : (currentLanguage === "ta" ? "குரலில் பேச மைக்ரோஃபோனை தட்டவும்" : "Tap to speak in Tamil or English")
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      background: isListening
                        ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                        : "rgba(255,255,255,0.08)",
                      border: isListening ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(255,255,255,0.15)",
                      color: isListening ? "#fff" : "#10b981",
                      cursor: "pointer",
                      boxShadow: isListening ? "0 0 15px rgba(239, 68, 68, 0.5)" : "none",
                      transition: "all 0.2s"
                    }}
                  >
                    {isListening ? <MicOff size={18} className="animate-pulse" /> : <Mic size={18} />}
                  </button>

                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      background: input.trim() && !loading
                        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                        : "rgba(255,255,255,0.05)",
                      border: "none",
                      color: input.trim() && !loading ? "#fff" : "rgba(255,255,255,0.2)",
                      cursor: input.trim() && !loading ? "pointer" : "default"
                    }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
