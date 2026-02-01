/**
 * @file popup.js
 * @description Popup UI logic and event handlers
 * @module popup/popup
 */

// DOM elements
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileName = document.getElementById("fileName");
const uploadProgress = document.getElementById("uploadProgress");
const uploadResult = document.getElementById("uploadResult");
const totalQuestionsEl = document.getElementById("totalQuestions");
const cacheSizeEl = document.getElementById("cacheSize");
const lastImportEl = document.getElementById("lastImport");
const fuzzyMatchingEl = document.getElementById("fuzzyMatching");
const partialMatchingEl = document.getElementById("partialMatching");
const minConfidenceEl = document.getElementById("minConfidence");
const confidenceValueEl = document.getElementById("confidenceValue");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const aiEnabledEl = document.getElementById("aiEnabled");

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
  uploadBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileUpload);

  fuzzyMatchingEl.addEventListener("change", saveSettings);
  partialMatchingEl.addEventListener("change", saveSettings);
  minConfidenceEl.addEventListener("input", () => {
    confidenceValueEl.textContent = `${minConfidenceEl.value}%`;
    saveSettings();
  });

  aiEnabledEl.addEventListener("change", saveSettings);

  exportBtn.addEventListener("click", handleExport);
  clearBtn.addEventListener("click", handleClear);
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

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

  // Reset file input
  fileInput.value = "";
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
    const response = await chrome.runtime.sendMessage({
      type: "GET_SETTINGS",
      requestId: Date.now().toString(),
    });

    if (response.type === "RESPONSE") {
      const settings = response.payload;
      fuzzyMatchingEl.checked = settings.fuzzyMatchingEnabled !== false;
      partialMatchingEl.checked = settings.partialMatchingEnabled !== false;
      minConfidenceEl.value = (settings.minConfidence || 0.5) * 100;
      confidenceValueEl.textContent = `${minConfidenceEl.value}%`;

      aiEnabledEl.checked = settings.aiEnabled === true;
    }
  } catch (error) {
    console.error("Failed to load settings", error);
  }
}

async function saveSettings() {
  const settings = {
    fuzzyMatchingEnabled: fuzzyMatchingEl.checked,
    partialMatchingEnabled: partialMatchingEl.checked,
    minConfidence: parseInt(minConfidenceEl.value) / 100,
    aiEnabled: aiEnabledEl.checked,
  };

  try {
    await chrome.runtime.sendMessage({
      type: "UPDATE_SETTINGS",
      payload: settings,
      requestId: Date.now().toString(),
    });
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
