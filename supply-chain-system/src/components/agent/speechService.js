/**
 * Dravix Browser Speech Service
 * 
 * Provides unified Speech-to-Text (STT) and Text-to-Speech (TTS) using native
 * Web Speech APIs (SpeechRecognition / webkitSpeechRecognition and window.speechSynthesis).
 * Abstracted so that cloud STT/TTS providers can be plugged in seamlessly in the future.
 */

// ── Speech Recognition (STT) Abstraction ──────────────────────────────────────

export class BrowserSpeechRecognition {
  constructor() {
    const SpeechRec = typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    this.supported = !!SpeechRec;
    this.recognition = SpeechRec ? new SpeechRec() : null;
    this.isListening = false;

    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  isSupported() {
    return this.supported;
  }

  /**
   * Start listening for voice input in the specified language ("ta" or "en").
   * @param {string} langCode - "ta" or "en"
   * @param {object} callbacks - { onStart, onResult, onError, onEnd }
   */
  start(langCode = "ta", callbacks = {}) {
    if (!this.supported) {
      if (callbacks.onError) callbacks.onError(new Error("Web Speech Recognition is not supported in this browser."));
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    // Set BCP-47 language tag
    // Tamil: "ta-IN", English: "en-IN" / "en-US"
    this.recognition.lang = langCode === "ta" ? "ta-IN" : "en-IN";

    this.recognition.onstart = () => {
      this.isListening = true;
      if (callbacks.onStart) callbacks.onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (callbacks.onResult) {
        callbacks.onResult({
          final: finalTranscript.trim(),
          interim: interimTranscript.trim()
        });
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      if (callbacks.onError) callbacks.onError(event);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (callbacks.onEnd) callbacks.onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      this.isListening = false;
      if (callbacks.onError) callbacks.onError(err);
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn("Speech recognition stop error:", err);
      }
    }
    this.isListening = false;
  }
}

// ── Speech Synthesis (TTS) Abstraction ────────────────────────────────────────

export class BrowserSpeechSynthesis {
  constructor() {
    this.supported = typeof window !== "undefined" && "speechSynthesis" in window;
    this.currentUtterance = null;
    this.voices = [];

    if (this.supported) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  isSupported() {
    return this.supported;
  }

  /**
   * Speak a text response in the specified language without translating or distorting.
   * Automatically detects Tamil Unicode characters to enforce ta-IN even if the UI
   * language is set to English or stale.
   * 
   * @param {string} text - text to speak
   * @param {string} langCode - "ta" or "en"
   * @param {object} callbacks - { onStart, onEnd, onError }
   */
  speak(text, langCode = "ta", callbacks = {}) {
    if (!this.supported || !text) return;

    // Cancel any ongoing speech before starting new one
    this.stop();

    // 1. Detect language directly from original text content:
    // If Tamil characters exist, effective language MUST be "ta".
    // If text has Latin characters and no Tamil characters, effective language MUST be "en".
    const isTamil = /[\u0B80-\u0BFF]/.test(text);
    const hasEnglishLetters = /[A-Za-z]/.test(text);
    const effectiveLang = isTamil 
      ? "ta" 
      : (!isTamil && hasEnglishLetters && langCode !== "en" && !/[\u0B80-\u0BFF]/.test(text)
        ? "en"
        : (langCode === "ta" ? "ta" : "en"));

    // Clean text of symbols or markdown asterisks/bullets for clean audio playback
    let cleanText = text.replace(/[*#_`•]/g, " ");
    if (effectiveLang === "ta") {
      cleanText = cleanText
        .replace(/₹/g, " ரூபாய் ")
        .replace(/kg/gi, " கிலோ ");
    } else {
      cleanText = cleanText
        .replace(/₹/g, " rupees ")
        .replace(/\bkg\b/gi, " kilograms ");
    }
    cleanText = cleanText.trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // 2. Set utterance BCP-47 language tag
    utterance.lang = effectiveLang === "ta" ? "ta-IN" : "en-IN";
    utterance.rate = 0.95; // Slightly measured rate for clarity
    utterance.pitch = 1.0;

    // 3. Re-fetch voices dynamically using window.speechSynthesis.getVoices() at speak time
    this.loadVoices();
    const availableVoices = this.voices && this.voices.length > 0 ? this.voices : [];

    // 4. Voice matching rules
    let selectedVoice = null;
    if (effectiveLang === "ta") {
      // Tamil voice matching must support:
      // - lang starting with ta
      // - ta-IN, ta_IN, tam
      // - voice names containing tamil, தமிழ், valluvar, pallava
      const tamilVoice = availableVoices.find(v => {
        const l = (v.lang || "").toLowerCase();
        const n = (v.name || "").toLowerCase();
        return (
          l.startsWith("ta") ||
          l === "ta-in" ||
          l === "ta_in" ||
          l.startsWith("tam") ||
          n.includes("tamil") ||
          n.includes("தமிழ்") ||
          n.includes("valluvar") ||
          n.includes("pallava")
        );
      });

      if (tamilVoice) {
        selectedVoice = tamilVoice;
        utterance.voice = tamilVoice;
        console.log("[TTS] Selected Tamil voice:", tamilVoice.name, "| Lang:", tamilVoice.lang);
      } else {
        console.warn("[TTS] NO TAMIL VOICE AVAILABLE");
      }
      // NEVER intentionally assign an English voice to Tamil text!
      // If no Tamil voice is installed, keep utterance.lang = "ta-IN" and let the browser
      // synthesis engine handle native ta-IN without forcing an English voice.
    } else {
      // English voice matching should prefer en-IN, then en
      const enInVoice = availableVoices.find(v => {
        const l = (v.lang || "").toLowerCase();
        return l === "en-in" || l.startsWith("en-in") || l.startsWith("en_in");
      });

      const anyEnVoice = enInVoice || availableVoices.find(v => {
        const l = (v.lang || "").toLowerCase();
        return l.startsWith("en");
      });

      if (anyEnVoice) {
        selectedVoice = anyEnVoice;
        utterance.voice = anyEnVoice;
        console.log("[TTS] Selected English voice:", anyEnVoice.name, "| Lang:", anyEnVoice.lang);
      }
    }

    // Diagnostic logging as requested
    console.log("[TTS] text:", cleanText);
    console.log("[TTS] requested language:", langCode);
    console.log("[TTS] effective language:", effectiveLang);
    console.log("[TTS] utterance.lang:", utterance.lang);
    console.log("[TTS] utterance.voice:", utterance.voice ? { name: utterance.voice.name, lang: utterance.voice.lang } : null);
    console.log("[TTS] available voices:", (window.speechSynthesis ? window.speechSynthesis.getVoices() : []).map(v => ({
      name: v.name,
      lang: v.lang,
      localService: v.localService
    })));

    utterance.onstart = () => {
      console.log("[TTS] onstart fired for utterance:", cleanText.slice(0, 40) + "...");
      if (callbacks.onStart) callbacks.onStart();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (callbacks.onEnd) callbacks.onEnd();
    };

    utterance.onerror = (err) => {
      this.currentUtterance = null;
      if (callbacks.onError) callbacks.onError(err);
    };

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (this.supported && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking() {
    return this.supported && window.speechSynthesis && window.speechSynthesis.speaking;
  }
}

// Singletons for global use
export const speechRecognitionService = new BrowserSpeechRecognition();
export const speechSynthesisService = new BrowserSpeechSynthesis();
