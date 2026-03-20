/**
 * @file popup.js
 * @description Popup UI logic and event handlers
 * @module popup/popup
 */

// DOM elements
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const dropZone = document.getElementById("dropZone");
const fileName = document.getElementById("fileName");
const uploadProgress = document.getElementById("uploadProgress");
const uploadResult = document.getElementById("uploadResult");
const totalQuestionsEl = document.getElementById("totalQuestions");
const cacheSizeEl = document.getElementById("cacheSize");
const lastImportEl = document.getElementById("lastImport");

const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const aiEnabledEl = document.getElementById("aiEnabled");

// Search elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchProcessing = document.getElementById("searchProcessing");
const searchResultArea = document.getElementById("searchResultArea");
const searchResultBadge = document.getElementById("searchResultBadge");
const searchResultAnswer = document.getElementById("searchResultAnswer");
const searchVoiceBtn = document.getElementById("searchVoiceBtn");

let activeUtterance = null;

// Initialize
init();

async function init() {
  // Load stats
  await loadStats();

  // Load settings
  await loadSettings();

  // Check for persisted upload result (from background)
  try {
    const result = await chrome.storage.local.get("uploadResult");
    if (result.uploadResult) {
      const { message, timestamp } = result.uploadResult;
      // Show if less than 5 minutes old
      if (Date.now() - timestamp < 300000) {
        showResult("success", message);
      } else {
        chrome.storage.local.remove("uploadResult");
      }
    }
  } catch (e) {
    console.error("Failed to load persisted result", e);
  }

  // Setup event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Click anywhere on upload area to open file picker
  dropZone.addEventListener("click", (e) => {
    // Prevent double trigger if clicking on the button
    if (e.target !== uploadBtn) {
      fileInput.click();
    }
  });

  uploadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener("change", handleFileUpload);

  // Drag and drop events
  dropZone.addEventListener("dragenter", handleDragEnter);
  dropZone.addEventListener("dragover", handleDragOver);
  dropZone.addEventListener("dragleave", handleDragLeave);
  dropZone.addEventListener("drop", handleDrop);

  aiEnabledEl.addEventListener("change", saveSettings);

  exportBtn.addEventListener("click", handleExport);
  clearBtn.addEventListener("click", handleClear);

  // Search logic
  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  if (searchVoiceBtn) {
    searchVoiceBtn.addEventListener("click", () => {
      const text = searchResultAnswer.textContent;
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        stopSpeaking();
      } else if (text) {
        speak(text);
      }
    });
  }
}

async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) return;

  // UI state
  searchProcessing.classList.remove("hidden");
  searchResultArea.classList.add("hidden");
  searchResultAnswer.textContent = "";
  stopSpeaking();

  try {
    const response = await chrome.runtime.sendMessage({
      type: "QUERY_ANSWER",
      payload: { query },
      requestId: Date.now().toString(),
    });

    searchProcessing.classList.add("hidden");

    if (response.type === "RESPONSE") {
      const result = response.payload;
      searchResultArea.classList.remove("hidden");

      if (result.success && result.match) {
        const { matchType, confidence, question } = result.match;
        const answerText = question.original.answer || "";

        // Setup badge
        searchResultBadge.className = "answerfinder-badge " + getBadgeClass(confidence, matchType);
        searchResultBadge.textContent = getBadgeText(confidence, matchType);

        // Show answer
        searchResultAnswer.textContent = answerText;

        // Auto-play voice if AI
        if (matchType === "ai" && aiEnabledEl.checked) {
          speak("Sir, " + answerText);
        }
      } else {
        searchResultBadge.className = "answerfinder-badge none";
        searchResultBadge.textContent = "No Match";
        searchResultAnswer.textContent = result.message || "No answer found for your query.";
      }
    } else {
      searchProcessing.classList.add("hidden");
      searchResultArea.classList.remove("hidden");
      searchResultBadge.className = "answerfinder-badge low";
      searchResultBadge.textContent = "Error";
      searchResultAnswer.textContent = response.error?.message || "An error occurred";
    }
  } catch (err) {
    searchProcessing.classList.add("hidden");
    searchResultArea.classList.remove("hidden");
    searchResultBadge.className = "answerfinder-badge low";
    searchResultBadge.textContent = "Error";
    searchResultAnswer.textContent = "Failed to communicate with service.";
  }
}

function getBadgeClass(confidence, matchType) {
  if (matchType === "ai") return "ai";
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.6) return "medium";
  if (confidence >= 0.3) return "low";
  return "none";
}

function getBadgeText(confidence, matchType) {
  if (matchType === "ai") return "AI Generated";
  if (confidence >= 0.85) return "High Confidence";
  if (confidence >= 0.6) return "Medium Confidence";
  if (confidence >= 0.3) return "Low Confidence";
  return "No Match";
}

function speak(text) {
  if (!window.speechSynthesis) return;
  stopSpeaking();
  const cleanText = text.replace(/[#*\`_~]/g, "").trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  let voices = window.speechSynthesis.getVoices();
  const setVoice = () => {
    voices = window.speechSynthesis.getVoices();
    const jarvisVoice = voices.find(v =>
      (v.name.includes("Google UK English Male")) ||
      (v.lang === "en-GB" && v.name.includes("Male")) ||
      (v.name.includes("Daniel"))
    ) || voices.find(v => v.lang.startsWith("en"));

    if (jarvisVoice) utterance.voice = jarvisVoice;
    utterance.rate = 1.05;
    utterance.pitch = 0.8;
    window.speechSynthesis.speak(utterance);
    activeUtterance = utterance;
  };

  if (voices.length === 0) {
    window.speechSynthesis.onvoiceschanged = setVoice;
  } else {
    setVoice();
  }
}

function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

function handleDragEnter(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add("drag-over");
}

function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.add("drag-over");
}

function handleDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  dropZone.classList.remove("drag-over");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    // Check file type
    if (file.name.endsWith(".json") || file.name.endsWith(".txt")) {
      processFile(file);
    } else {
      showResult("error", "Please upload a JSON or TXT file");
    }
  }
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  processFile(file);
  // Reset file input
  fileInput.value = "";
}

async function processFile(file) {
  fileName.textContent = file.name;
  uploadProgress.hidden = false;
  uploadResult.hidden = true;

  try {
    // Read file
    const fileContent = await readFile(file);

    // Send to background script
    const response = await chrome.runtime.sendMessage({
      type: "UPLOAD_FILE",
      payload: { fileContent, fileName: file.name },
      requestId: Date.now().toString(),
    });

    uploadProgress.hidden = true;

    if (response.type === "RESPONSE" && response.payload.success) {
      showResult(
        "success",
        `Successfully loaded ${response.payload.totalQuestions} questions!`,
      );
      await loadStats();
    } else {
      showResult(
        "error",
        response.payload.error?.message || "Failed to upload file",
      );
    }
  } catch (error) {
    uploadProgress.hidden = true;
    showResult("error", error.message || "Failed to upload file");
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

function showResult(type, message) {
  uploadResult.className = `result ${type}`;
  uploadResult.textContent = message;
  uploadResult.hidden = false;

  // Keep result visible until user closes popup or performs another action
  // Timeout removed based on user request
}

async function loadStats() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_STATS",
      requestId: Date.now().toString(),
    });

    if (response.type === "RESPONSE") {
      const stats = response.payload;
      totalQuestionsEl.textContent = stats.totalQuestions || 0;
      cacheSizeEl.textContent = stats.cache?.size || 0;

      if (stats.lastImport) {
        const date = new Date(stats.lastImport);
        lastImportEl.textContent = `Last import: ${date.toLocaleString()}`;
      } else {
        lastImportEl.textContent = "No data loaded";
      }
    }
  } catch (error) {
    console.error("Failed to load stats", error);
  }
}

async function loadSettings() {
  try {
    // Load directly from chrome.storage.local - this is the source of truth
    const stored = await chrome.storage.local.get("settings");
    console.log("[Popup] Raw storage:", stored);

    if (stored.settings) {
      aiEnabledEl.checked = stored.settings.aiEnabled === true;
      console.log(
        "[Popup] AI enabled from storage:",
        stored.settings.aiEnabled,
      );
    } else {
      // No settings saved yet, default to off
      aiEnabledEl.checked = false;
      console.log("[Popup] No settings in storage, defaulting to off");
    }
  } catch (error) {
    console.error("Failed to load settings", error);
    aiEnabledEl.checked = false;
  }
}

async function saveSettings() {
  const aiEnabled = aiEnabledEl.checked;
  console.log("[Popup] Saving aiEnabled:", aiEnabled);

  try {
    // Get current settings and merge
    const stored = await chrome.storage.local.get("settings");
    const currentSettings = stored.settings || {};
    const newSettings = { ...currentSettings, aiEnabled: aiEnabled };

    // Save to chrome.storage.local
    await chrome.storage.local.set({ settings: newSettings });
    console.log("[Popup] Saved to storage:", newSettings);

    // Also notify background to update its in-memory state
    try {
      await chrome.runtime.sendMessage({
        type: "UPDATE_SETTINGS",
        payload: { aiEnabled: aiEnabled },
        requestId: Date.now().toString(),
      });
      console.log("[Popup] Notified background");
    } catch (e) {
      // Background might not be ready, but storage is saved
      console.log("[Popup] Background notification failed, but storage saved");
    }
  } catch (error) {
    console.error("Failed to save settings", error);
  }
}

async function handleExport() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "EXPORT_DATA",
      requestId: Date.now().toString(),
    });

    if (response.type === "RESPONSE") {
      const data = response.payload;
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `answerfinder-export-${Date.now()}.json`;
      a.click();

      URL.revokeObjectURL(url);
      showResult("success", "Data exported successfully!");
    }
  } catch (error) {
    showResult("error", "Failed to export data");
  }
}

async function handleClear() {
  if (
    !confirm("Are you sure you want to clear all data? This cannot be undone.")
  ) {
    return;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "CLEAR_DATA",
      requestId: Date.now().toString(),
    });

    if (response.type === "RESPONSE" && response.payload.success) {
      showResult("success", "All data cleared successfully!");
      await loadStats();
    } else {
      showResult("error", "Failed to clear data");
    }
  } catch (error) {
    showResult("error", "Failed to clear data");
  }
}
