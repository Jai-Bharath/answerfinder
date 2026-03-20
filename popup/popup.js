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
