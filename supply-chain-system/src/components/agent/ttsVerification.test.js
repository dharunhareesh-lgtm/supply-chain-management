// Test suite for Dravix Frontend TTS Language Fix
// Tests speechService BrowserSpeechSynthesis voice and language resolution rules

class MockSpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
    this.lang = '';
    this.voice = null;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

class MockSpeechSynthesis {
  constructor(voices = []) {
    this.voices = voices;
    this.speaking = false;
    this.spokenUtterances = [];
    this.onvoiceschanged = null;
  }

  getVoices() {
    return this.voices;
  }

  speak(utterance) {
    this.speaking = true;
    this.spokenUtterances.push(utterance);
    if (utterance.onstart) utterance.onstart();
  }

  cancel() {
    this.speaking = false;
  }
}

// Emulate BrowserSpeechSynthesis logic from speechService.js
class TestBrowserSpeechSynthesis {
  constructor(mockWindow) {
    this.mockWindow = mockWindow;
    this.supported = true;
    this.currentUtterance = null;
    this.voices = [];
    this.loadVoices();
  }

  loadVoices() {
    if (this.mockWindow && this.mockWindow.speechSynthesis) {
      this.voices = this.mockWindow.speechSynthesis.getVoices();
    }
  }

  speak(text, langCode = "ta", callbacks = {}) {
    if (!this.supported || !text) return;
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

    const utterance = new this.mockWindow.SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // 2. Set utterance BCP-47 language tag
    utterance.lang = effectiveLang === "ta" ? "ta-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // 3. Re-fetch voices dynamically using window.speechSynthesis.getVoices() at speak time
    this.loadVoices();
    const availableVoices = this.voices && this.voices.length > 0 ? this.voices : [];

    // 4. Voice matching rules
    if (effectiveLang === "ta") {
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
        utterance.voice = tamilVoice;
      }
    } else {
      const enInVoice = availableVoices.find(v => {
        const l = (v.lang || "").toLowerCase();
        return l === "en-in" || l.startsWith("en-in") || l.startsWith("en_in");
      });

      const anyEnVoice = enInVoice || availableVoices.find(v => {
        const l = (v.lang || "").toLowerCase();
        return l.startsWith("en");
      });

      if (anyEnVoice) {
        utterance.voice = anyEnVoice;
      }
    }

    utterance.onstart = () => {
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

    this.mockWindow.speechSynthesis.speak(utterance);
  }

  stop() {
    if (this.mockWindow && this.mockWindow.speechSynthesis) {
      this.mockWindow.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }
}

// ── Test Runner ─────────────────────────────────────────────────────────────

const mockVoices = [
  { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
  { name: 'Microsoft Ravi - English (India)', lang: 'en-IN' },
  { name: 'Google தமிழ்', lang: 'ta-IN' },
  { name: 'Microsoft Valluvar Online (Natural) - Tamil (India)', lang: 'ta-IN' }
];

let passed = 0;
let failed = 0;

function assert(description, condition, actualInfo = '') {
  if (condition) {
    console.log(`PASS: ${description}`);
    passed++;
  } else {
    console.error(`FAIL: ${description} | Details: ${actualInfo}`);
    failed++;
  }
}

console.log('Running TTS Unit Tests...\n');

// Test 1: Tamil text + currentLanguage "en" -> utterance.lang "ta-IN"
{
  const mockSynth = new MockSpeechSynthesis(mockVoices);
  const mockWin = { speechSynthesis: mockSynth, SpeechSynthesisUtterance: MockSpeechSynthesisUtterance };
  const service = new TestBrowserSpeechSynthesis(mockWin);

  service.speak('வணக்கம் விவசாயி', 'en');
  const utt = mockSynth.spokenUtterances[0];
  assert('1. Tamil text + currentLanguage "en" -> utterance.lang is "ta-IN"', utt && utt.lang === 'ta-IN', utt?.lang);
}

// Test 2: English text + currentLanguage "ta" -> utterance.lang "en-IN"
{
  const mockSynth = new MockSpeechSynthesis(mockVoices);
  const mockWin = { speechSynthesis: mockSynth, SpeechSynthesisUtterance: MockSpeechSynthesisUtterance };
  const service = new TestBrowserSpeechSynthesis(mockWin);

  service.speak('Product updated successfully to 500 kg', 'ta');
  const utt = mockSynth.spokenUtterances[0];
  assert('2. English text + currentLanguage "ta" -> utterance.lang is "en-IN"', utt && utt.lang === 'en-IN', utt?.lang);
}

// Test 3: Tamil voice is selected when available
{
  const mockSynth = new MockSpeechSynthesis(mockVoices);
  const mockWin = { speechSynthesis: mockSynth, SpeechSynthesisUtterance: MockSpeechSynthesisUtterance };
  const service = new TestBrowserSpeechSynthesis(mockWin);

  service.speak('தக்காளி விலை என்ன?', 'ta');
  const utt = mockSynth.spokenUtterances[0];
  assert('3. Tamil voice is selected when available', utt && utt.voice && utt.voice.name === 'Google தமிழ்', utt?.voice?.name);
}

// Test 4: English voice is selected for English (prefers en-IN)
{
  const mockSynth = new MockSpeechSynthesis(mockVoices);
  const mockWin = { speechSynthesis: mockSynth, SpeechSynthesisUtterance: MockSpeechSynthesisUtterance };
  const service = new TestBrowserSpeechSynthesis(mockWin);

  service.speak('Welcome to Dravix Farmer Portal', 'en');
  const utt = mockSynth.spokenUtterances[0];
  assert('4. English voice is selected for English (prefers en-IN)', utt && utt.voice && utt.voice.name === 'Microsoft Ravi - English (India)', utt?.voice?.name);
}

// Test 5: Empty/stale voice list is refreshed with getVoices() dynamically at speak time
{
  const mockSynth = new MockSpeechSynthesis([]); // initially empty
  const mockWin = { speechSynthesis: mockSynth, SpeechSynthesisUtterance: MockSpeechSynthesisUtterance };
  const service = new TestBrowserSpeechSynthesis(mockWin);

  assert('5a. Service initialized with empty voices', service.voices.length === 0);
  
  // Later, voices arrive in the browser
  mockSynth.voices = mockVoices;
  service.speak('வணக்கம்', 'ta');
  const utt = mockSynth.spokenUtterances[0];
  assert('5b. Service refreshes voices dynamically at speak time and picks Tamil voice', utt && utt.voice && utt.voice.lang === 'ta-IN', utt?.voice?.lang);
}

// Test 6: Tamil text must never be assigned an English voice when no Tamil voice is installed
{
  const onlyEnglishVoices = [
    { name: 'Microsoft David Desktop - English (United States)', lang: 'en-US' },
    { name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US' }
  ];
  const mockSynth = new MockSpeechSynthesis(onlyEnglishVoices);
  const mockWin = { speechSynthesis: mockSynth, SpeechSynthesisUtterance: MockSpeechSynthesisUtterance };
  const service = new TestBrowserSpeechSynthesis(mockWin);

  service.speak('உங்கள் Toor Dal இருப்பை 500 kg-ஆக மாற்ற வேண்டுமா?', 'en');
  const utt = mockSynth.spokenUtterances[0];
  assert('6a. Utterance lang is strictly ta-IN for Tamil text even when UI is en', utt && utt.lang === 'ta-IN', utt?.lang);
  assert('6b. Tamil text must never be assigned an English voice when Tamil voice is absent', utt && utt.voice === null, utt?.voice?.name);
}

// Test 7: Clean text pre-processing converts symbols (₹ -> ரூபாய், kg -> கிலோ)
{
  const mockSynth = new MockSpeechSynthesis(mockVoices);
  const mockWin = { speechSynthesis: mockSynth, SpeechSynthesisUtterance: MockSpeechSynthesisUtterance };
  const service = new TestBrowserSpeechSynthesis(mockWin);

  service.speak('விலை ₹130 மற்றும் அளவு 500kg', 'ta');
  const utt = mockSynth.spokenUtterances[0];
  assert('7. Clean text pre-processing replaces ₹ with ரூபாய் and kg with கிலோ for Tamil', utt && utt.text.includes('ரூபாய்') && utt.text.includes('கிலோ'), utt?.text);
}

console.log(`\n========================================`);
console.log(`Tests run: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
