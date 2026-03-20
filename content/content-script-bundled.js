/**
 * @file content-script-bundled.js
 * @description Bundled content script (all modules combined)
 * Combines: selection-handler.js, overlay-manager.js, content-script.js
 */

console.log("[ContentScript] Content script loaded");

// ============================================================================
// SELECTION HANDLER
// ============================================================================

/**
 * Get currently selected text
 * @returns {string|null} Selected text or null
 */
function getSelectedText() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const text = selection.toString().trim();
  return text.length > 0 ? text : null;
}

/**
 * Validate selected text
 * @param {string} text - Selected text
 * @returns {{valid: boolean, error: string|null}} Validation result
 */
function validateSelection(text) {
  if (!text || text.length === 0) {
    return { valid: false, error: "No text selected" };
  }

  if (text.length < 3) {
    return { valid: false, error: "Selected text is too short" };
  }

  if (text.length > 500) {
    return {
      valid: false,
      error: "Selected text is too long (max 500 characters)",
    };
  }

  return { valid: true, error: null };
}

/**
 * Get selection position on page
 * @returns {{x: number, y: number}|null} Position or null
 */
function getSelectionPosition() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return {
    x: rect.left + window.scrollX,
    y: rect.bottom + window.scrollY,
  };
}

// ============================================================================
// OVERLAY MANAGER
// ============================================================================

/**
 * Overlay manager class
 */
class OverlayManager {
  constructor() {
    this.overlay = null;
    this.isVisible = false;
    this.autoHideTimer = null;
    this.autoHideRemaining = 5000; // 5 seconds
    this.autoHideStartTime = 0;
    this.currentUtterance = null; // TTS keeping track

    // Bind methods
    this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
    this.boundHandleEscKey = this.handleEscKey.bind(this);
  }

  /**
   * Start auto-hide timer
   */
  startAutoHideTimer() {
    this.stopAutoHideTimer();
    this.autoHideRemaining = 5000;

    // Set animation
    if (this.overlay) {
      const progressBar = this.overlay.querySelector(
        ".answerfinder-progress-bar",
      );
      if (progressBar) {
        // Reset animation by triggering reflow
        progressBar.style.animation = "none";
        progressBar.offsetHeight; /* trigger reflow */
        progressBar.style.animation =
          "answerfinder-progress 5s linear forwards";
      }
    }

    this.resumeAutoHideTimer();
  }

  /**
   * Stop auto-hide timer
   */
  stopAutoHideTimer() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  /**
   * Pause auto-hide timer
   */
  pauseAutoHideTimer() {
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;

      // Calculate remaining time
      const elapsed = Date.now() - this.autoHideStartTime;
      this.autoHideRemaining -= elapsed;
      if (this.autoHideRemaining < 0) this.autoHideRemaining = 0;

      // Pause animation
      if (this.overlay) {
        const progressBar = this.overlay.querySelector(
          ".answerfinder-progress-bar",
        );
        if (progressBar) {
          progressBar.style.animationPlayState = "paused";
        }
      }
    }
  }

  /**
   * Resume auto-hide timer
   */
  resumeAutoHideTimer() {
    if (this.autoHideRemaining <= 0) {
      this.hideOverlay();
      return;
    }

    if (this.autoHideRemaining > 0 && !this.autoHideTimer) {
      this.autoHideStartTime = Date.now();
      this.autoHideTimer = setTimeout(
        () => this.hideOverlay(),
        this.autoHideRemaining,
      );

      // Resume animation
      if (this.overlay) {
        const progressBar = this.overlay.querySelector(
          ".answerfinder-progress-bar",
        );
        if (progressBar) {
          progressBar.style.animationPlayState = "running";
        }
      }
    }
  }

  /**
   * Show answer overlay
   * @param {Object} result - Match result
   * @param {{x: number, y: number}} position - Position to show overlay
   */
  showOverlay(result, position) {
    // Remove existing overlay
    this.hideOverlay();

    // Create overlay element
    this.overlay = this.createOverlay(result);

    // Position overlay
    this.positionOverlay(this.overlay, position);

    // Add to page
    document.body.appendChild(this.overlay);
    this.isVisible = true;

    // Start auto-hide timer
    this.startAutoHideTimer();

    // Add event listeners
    this.setupEventListeners();

    // Auto-play TTS if AI match
    if (result.success && result.match && result.match.matchType === "ai") {
      this.speak("Sir, " + result.match.question.original.answer);
    }
  }

  /**
   * Create overlay element
   * @param {Object} result - Match result
   * @returns {HTMLElement} Overlay element
   */
  createOverlay(result) {
    const overlay = document.createElement("div");
    overlay.id = "answerfinder-overlay";
    overlay.className = "answerfinder-overlay";

    if (result.success && result.match) {
      const { question, matchType, confidence, explanation } = result.match;
      const confidenceLevel = this.getConfidenceLevel(confidence, matchType);

      overlay.innerHTML = `
        <div class="answerfinder-header">
          <span class="answerfinder-badge answerfinder-badge-${confidenceLevel}">
            ${this.getConfidenceBadgeText(confidenceLevel)}
          </span>
          <div style="display: flex; gap: 8px; align-items: center;">
            ${matchType === "ai" ? `<button class="answerfinder-voice-btn" title="Toggle Voice">🔊</button>` : ''}
            <button class="answerfinder-close" title="Close">&times;</button>
          </div>
        </div>
        <div class="answerfinder-content">
          <div class="answerfinder-answer">
            ${this.escapeHtml(question.original.answer)}
          </div>
          ${matchType === "ai" && explanation
          ? `
          <div class="answerfinder-reasoning">
            <strong>Reasoning:</strong>
            ${this.escapeHtml(explanation)}
          </div>
          `
          : `
          <div class="answerfinder-meta">
            <small>${explanation}</small>
          </div>
          <div class="answerfinder-question">
            <small><strong>Matched question:</strong> ${this.escapeHtml(question.original.question)}</small>
          </div>
          `
        }
        </div>
        <div class="answerfinder-footer">
          <button class="answerfinder-copy" title="Copy answer">Copy</button>
        </div>
        <div class="answerfinder-progress-bar"></div>
      `;
    } else {
      overlay.innerHTML = `
        <div class="answerfinder-header">
          <span class="answerfinder-badge answerfinder-badge-none">No Match</span>
          <button class="answerfinder-close" title="Close">&times;</button>
        </div>
        <div class="answerfinder-content">
          <div class="answerfinder-message">
            ${result.message || "No answer found for your query."}
          </div>
        </div>
        <div class="answerfinder-progress-bar"></div>
      `;
    }

    return overlay;
  }

  /**
   * Position overlay on page
   * @param {HTMLElement} overlay - Overlay element
   * @param {{x: number, y: number}} position - Position (ignored for sidebar)
   */
  positionOverlay(overlay, position) {
    // Sidebar mode: Reset any manual positioning and let CSS handle it
    overlay.style.left = "";
    overlay.style.top = "";
    overlay.style.right = "20px";
    overlay.style.bottom = "";
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.overlay) return;

    // Close button
    const closeBtn = this.overlay.querySelector(".answerfinder-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.hideOverlay());
    }

    // Voice button
    const voiceBtn = this.overlay.querySelector(".answerfinder-voice-btn");
    if (voiceBtn) {
      voiceBtn.addEventListener("click", () => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          this.stopSpeaking();
        } else {
          const answerText = this.overlay.querySelector(".answerfinder-answer").textContent;
          this.speak(answerText);
        }
      });
    }

    // Copy button
    const copyBtn = this.overlay.querySelector(".answerfinder-copy");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => this.copyAnswer());
    }

    // Click outside to close
    document.addEventListener("click", this.boundHandleOutsideClick);

    // ESC key to close
    document.addEventListener("keydown", this.boundHandleEscKey);

    // Pause/Resume on hover
    this.overlay.addEventListener("mouseenter", () =>
      this.pauseAutoHideTimer(),
    );
    this.overlay.addEventListener("mouseleave", () =>
      this.resumeAutoHideTimer(),
    );
  }

  /**
   * Handle click outside overlay
   * @param {Event} event - Click event
   */
  handleOutsideClick(event) {
    if (this.overlay && !this.overlay.contains(event.target)) {
      this.hideOverlay();
    }
  }

  /**
   * Handle ESC key press
   * @param {Event} event - Keyboard event
   */
  handleEscKey(event) {
    if (event.key === "Escape") {
      this.hideOverlay();
    }
  }

  /**
   * Copy answer to clipboard
   */
  copyAnswer() {
    const answerElement = this.overlay.querySelector(".answerfinder-answer");
    if (answerElement) {
      const text = answerElement.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const copyBtn = this.overlay.querySelector(".answerfinder-copy");
        if (copyBtn) {
          copyBtn.textContent = "Copied!";
          setTimeout(() => {
            copyBtn.textContent = "Copy";
          }, 2000);
        }
      });
    }
  }

  /**
   * Hide overlay
   */
  hideOverlay() {
    this.stopAutoHideTimer();
    this.stopSpeaking();
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.isVisible = false;

      // Remove event listeners
      document.removeEventListener("click", this.boundHandleOutsideClick);
      document.removeEventListener("keydown", this.boundHandleEscKey);
    }
  }

  /**
   * Speak text using TTS (Jarvis voice)
   * @param {string} text - Text to speak
   */
  speak(text) {
    if (!window.speechSynthesis) return;
    this.stopSpeaking();

    // Force lowercase matching for text cleanup to sound better
    const cleanText = text.replace(/[#*`_~]/g, "").trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Wait for voices to load if not ready
    let voices = window.speechSynthesis.getVoices();
    const setVoice = () => {
      voices = window.speechSynthesis.getVoices();
      // Try finding a British Male voice (closest to Jarvis out-of-the-box browser TTS)
      const jarvisVoice = voices.find(v =>
        (v.name.includes("Google UK English Male")) ||
        (v.lang === "en-GB" && v.name.includes("Male")) ||
        (v.name.includes("Daniel"))
      ) || voices.find(v => v.lang.startsWith("en"));

      if (jarvisVoice) {
        utterance.voice = jarvisVoice;
      }
      utterance.rate = 1.05;
      utterance.pitch = 0.8; // Deeper pitch
      window.speechSynthesis.speak(utterance);
      this.currentUtterance = utterance;
    };

    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = setVoice;
    } else {
      setVoice();
    }
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Get confidence level
   * @param {number} confidence - Confidence score
   * @returns {string} Level (high, medium, low, none)
   */
  getConfidenceLevel(confidence, matchType) {
    if (matchType === "ai") return "ai";
    if (confidence >= 0.85) return "high";
    if (confidence >= 0.6) return "medium";
    if (confidence >= 0.3) return "low";
    return "none";
  }

  /**
   * Get confidence badge text
   * @param {string} level - Confidence level
   * @returns {string} Badge text
   */
  getConfidenceBadgeText(level) {
    const badges = {
      high: "✓ High Confidence",
      medium: "⚠ Medium Confidence",
      low: "⚠ Low Confidence",
      none: "✗ No Match",
      ai: "AI Generated",
    };
    return badges[level] || "Unknown";
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create singleton instance
const overlayManager = new OverlayManager();

// ============================================================================
// MAIN CONTENT SCRIPT
// ============================================================================

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[ContentScript] Received message:", message.type);
  if (message.type === "SHOW_ANSWER_OVERLAY") {
    handleShowAnswerOverlay(message.payload);
  }
});

/**
 * Handle show answer overlay request
 * @param {Object} payload - Message payload
 */
async function handleShowAnswerOverlay(payload) {
  const { query } = payload;

  // Get selection position
  const position = getSelectionPosition() || {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  // Show loading state
  overlayManager.showOverlay(
    {
      success: false,
      message: "Searching for answer...",
    },
    position,
  );

  try {
    // Send query to background script
    const response = await chrome.runtime.sendMessage({
      type: "QUERY_ANSWER",
      payload: { query },
      requestId: Date.now().toString(),
    });

    // Show result
    if (response.type === "RESPONSE") {
      overlayManager.showOverlay(response.payload, position);
    } else if (response.type === "ERROR") {
      overlayManager.showOverlay(
        {
          success: false,
          message: response.error.error?.message || "An error occurred",
        },
        position,
      );
    }
  } catch (error) {
    console.error("[ContentScript] Error querying answer", error);
    overlayManager.showOverlay(
      {
        success: false,
        message: "Failed to search for answer. Please try again.",
      },
      position,
    );
  }
}

// ============================================================================
// STYLES
// ============================================================================

// Add CSS for overlay
const style = document.createElement("style");
style.textContent = `
  .answerfinder-overlay {
    position: fixed;
    top: 5vmin;
    right: 5vmin;
    z-index: 2147483647;
    background: rgba(18, 18, 20, 0.75);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
    width: clamp(280px, 90vw, 360px);
    max-height: 85vh;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #f4f4f5;
    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes slideInRight {
    from { transform: translateX(100px) scale(0.95); opacity: 0; }
    to { transform: translateX(0) scale(1); opacity: 1; }
  }
  
  .answerfinder-overlay::-webkit-scrollbar {
    width: 6px;
  }
  .answerfinder-overlay::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
  }
  
  .answerfinder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    background: rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .answerfinder-badge {
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .answerfinder-badge-high {
    background: rgba(52, 211, 153, 0.1);
    color: #34d399;
    border: 1px solid rgba(52, 211, 153, 0.2);
  }
  
  .answerfinder-badge-medium {
    background: rgba(251, 191, 36, 0.1);
    color: #fbbf24;
    border: 1px solid rgba(251, 191, 36, 0.2);
  }
  
  .answerfinder-badge-low {
    background: rgba(248, 113, 113, 0.1);
    color: #f87171;
    border: 1px solid rgba(248, 113, 113, 0.2);
  }
  
  .answerfinder-badge-none {
    background: rgba(161, 161, 170, 0.1);
    color: #a1a1aa;
    border: 1px solid rgba(161, 161, 170, 0.2);
  }
  
  .answerfinder-close, .answerfinder-voice-btn {
    background: rgba(255, 255, 255, 0.05);
    border: none;
    cursor: pointer;
    color: #a1a1aa;
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .answerfinder-close:hover, .answerfinder-voice-btn:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.15);
    transform: scale(1.05);
  }
  
  .answerfinder-content {
    padding: 18px;
  }
  
  .answerfinder-answer {
    margin-bottom: 16px;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 15px;
    color: #ffffff;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
  
  .answerfinder-meta {
    margin-bottom: 12px;
    color: #a1a1aa;
    font-style: italic;
    font-size: 12px;
  }
  
  .answerfinder-question {
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    color: #d4d4d8;
    border-left: 3px solid #8b5cf6;
    font-size: 13px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
  }
  
  .answerfinder-message {
    color: #a1a1aa;
    text-align: center;
    padding: 24px 0;
    font-size: 14px;
    font-weight: 500;
  }
  
  .answerfinder-footer {
    padding: 12px 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.04);
    text-align: right;
    background: rgba(0, 0, 0, 0.1);
    position: sticky;
    bottom: 0;
    z-index: 10;
  }
  
  .answerfinder-copy {
    background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
    color: white;
    border: none;
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
  }
  
  .answerfinder-copy:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
    filter: brightness(1.1);
  }

  .answerfinder-progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #8b5cf6, #3b82f6);
    width: 100%;
    transform-origin: left;
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
  }

  @keyframes answerfinder-progress {
    from { width: 100%; }
    to { width: 0%; }
  }
  
  .answerfinder-badge-ai {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
    color: #c4b5fd;
    border: 1px solid rgba(139, 92, 246, 0.4);
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-size: 10px;
    padding: 4px 12px;
    box-shadow: 0 0 16px rgba(139, 92, 246, 0.15);
  }
  
  .answerfinder-reasoning {
    margin-top: 14px;
    padding: 14px;
    font-size: 13px;
    color: #d4d4d8;
    background: rgba(139, 92, 246, 0.05);
    border-radius: 10px;
    border: 1px solid rgba(139, 92, 246, 0.1);
    line-height: 1.5;
  }

  .answerfinder-reasoning strong {
    color: #a78bfa;
    display: block;
    margin-bottom: 8px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }
`;
document.head.appendChild(style);
