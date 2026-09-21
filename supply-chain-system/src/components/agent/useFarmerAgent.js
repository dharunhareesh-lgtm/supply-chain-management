import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../../utils/api";

/**
 * Custom hook to manage Farmer Agent context, chat history, and API communications.
 * Automatically resolves supplierId, username, current route, and page parameters.
 */
export function useFarmerAgent() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome-1",
      role: "assistant",
      content: "வணக்கம்! நான் உங்கள் DRAVIX விவசாய உதவியாளர் (Farmer Agent). பொருட்கள், வருமானம், சந்தை விலை அல்லது முன்னறிவிப்பு பற்றி கேளுங்கள்.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action: "GREETING",
      language: "ta"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [currentLanguage, setCurrentLanguageState] = useState(() => {
    return localStorage.getItem("farmerAgentLanguage") || "ta";
  }); // "ta" or "en"

  const setLanguage = (lang) => {
    const valid = lang === "en" ? "en" : "ta";
    setCurrentLanguageState(valid);
    localStorage.setItem("farmerAgentLanguage", valid);
  };

  const [agentContextState, setAgentContextState] = useState({});

  const supplierId = localStorage.getItem("supplierId") ? Number(localStorage.getItem("supplierId")) : null;
  const username = localStorage.getItem("username") || "Farmer";
  const role = localStorage.getItem("role") || "";

  // Extract selected entity context if present
  const selectedProductId = params.id && location.pathname.includes("/product") ? Number(params.id) : null;
  const selectedOrderId = params.id && location.pathname.includes("/order") ? Number(params.id) : null;

  // Helper to extract live form values if user is on the Add Product page
  const captureCurrentFormState = () => {
    if (!location.pathname.includes("/add-product")) return {};
    try {
      const state = {};
      const nameInput = document.querySelector('input[placeholder*="Toor Dal"]');
      if (nameInput && nameInput.value && nameInput.value.trim()) state.productName = nameInput.value.trim();

      const priceInput = document.querySelector('input[placeholder="₹"]');
      if (priceInput && priceInput.value && priceInput.value.trim() && !isNaN(Number(priceInput.value))) {
        state.purchasePrice = Number(priceInput.value);
      }

      const marginInput = document.querySelector('input[placeholder*="e.g. 5"]');
      if (marginInput && marginInput.value && marginInput.value.trim() && !isNaN(Number(marginInput.value))) {
        state.marginValue = Number(marginInput.value);
      }

      // Dropdowns: A dropdown's first/default option must NOT be considered farmer-selected merely because the DOM contains a value.
      // Only include a value if selectedIndex > 0 and the option value is non-empty and not a placeholder.
      const isValidSelection = (select) => {
        if (!select || select.selectedIndex <= 0) return false;
        const opt = select.options[select.selectedIndex];
        if (!opt || !opt.value || opt.value.trim() === "") return false;
        const text = (opt.text || "").toLowerCase();
        if (text.includes("select a") || text.includes("choose") || text.includes("none")) return false;
        return true;
      };

      const categorySelect = Array.from(document.querySelectorAll('select')).find(s => 
        Array.from(s.options).some(o => o.text.includes("Cereals") || o.text.includes("Grains") || o.text.includes("Select a category"))
      );
      if (isValidSelection(categorySelect)) {
        state.category = categorySelect.value;
      }

      const landSelect = Array.from(document.querySelectorAll('select')).find(s => 
        Array.from(s.options).some(o => o.text.includes("Survey") || o.text.includes("verified land record"))
      );
      if (isValidSelection(landSelect) && !isNaN(Number(landSelect.value))) {
        state.landRecordId = Number(landSelect.value);
      }

      const whSelect = Array.from(document.querySelectorAll('select')).find(s => 
        Array.from(s.options).some(o => o.text.includes("warehouse") || o.text.includes("Warehouse") || o.text.includes("Select a warehouse"))
      );
      if (isValidSelection(whSelect) && !isNaN(Number(whSelect.value))) {
        state.warehouseId = Number(whSelect.value);
      }

      return state;
    } catch {
      return {};
    }
  };

  const sendMessage = useCallback(async (text) => {
    if (!text || !text.trim()) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const activeFormState = captureCurrentFormState();
      const contextPayload = {
        supplierId,
        username,
        role,
        currentRoute: location.pathname,
        currentPage: document.title || location.pathname,
        selectedProductId,
        selectedOrderId,
        preferredLanguage: currentLanguage,
        ...agentContextState,
        extraData: Object.keys(activeFormState).length > 0 ? { formState: activeFormState } : {}
      };

      const sessionHistory = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(`${API_URL}/api/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          context: contextPayload,
          sessionHistory
        })
      });

      if (!res.ok) {
        throw new Error("Failed to receive agent response");
      }

      const data = await res.json();

      if (data.contextUpdates && typeof data.contextUpdates === "object") {
        setAgentContextState((prev) => ({
          ...prev,
          ...data.contextUpdates
        }));
      }

      if (data.language && data.language !== currentLanguage) {
        // Only update if farmer explicitly switched language mid-conversation
        setLanguage(data.language);
      }

      const responseContent = data.userMessage || "Executed.";
      const containsTamil = /[\u0B80-\u0BFF]/.test(responseContent);
      const messageLanguage = data.language || (containsTamil ? "ta" : currentLanguage);

      const agentMessage = {
        id: `agent-${Date.now()}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: data.action,
        navigationPath: data.navigationPath,
        requiresConfirmation: data.requiresConfirmation,
        risk: data.risk,
        language: messageLanguage,
        data: data.data
      };

      setMessages((prev) => [...prev, agentMessage]);

      // If action is a navigation, execute router transition automatically
      if (data.navigationPath && data.navigationPath !== location.pathname) {
        setTimeout(() => {
          navigate(data.navigationPath);
        }, 600);
      }
    } catch (err) {
      console.error("Farmer Agent communication error:", err);
      const errorContent = currentLanguage === "ta"
        ? "மன்னிக்கவும், தகவலைப் பெறுவதில் சிக்கல் ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்."
        : "Sorry, I encountered an issue fulfilling that request. Please try again.";
      const errorContainsTamil = /[\u0B80-\u0BFF]/.test(errorContent);

      const errorMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: errorContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        language: errorContainsTamil ? "ta" : currentLanguage
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [supplierId, username, role, location.pathname, selectedProductId, selectedOrderId, messages, navigate, currentLanguage, agentContextState]);

  const clearChat = () => {
    setAgentContextState({});
    const welcomeContent = currentLanguage === "ta"
      ? "வணக்கம்! என்ன உதவி வேண்டும்?"
      : "Hello! How can I assist you with your farm operations today?";
    const welcomeContainsTamil = /[\u0B80-\u0BFF]/.test(welcomeContent);

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: welcomeContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: "GREETING",
        language: welcomeContainsTamil ? "ta" : currentLanguage
      }
    ]);
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    setMessages,
    loading,
    currentLanguage,
    setCurrentLanguage: setLanguage,
    sendMessage,
    clearChat,
    supplierId,
    role
  };
}
