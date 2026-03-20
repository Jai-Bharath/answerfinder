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
          <button class="answerfinder-close" title="Close">&times;</button>
        </div>
        <div class="answerfinder-content">
          <div class="answerfinder-answer">
            ${this.escapeHtml(question.original.answer)}
          </div>
          ${
            matchType === "ai" && explanation
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
    top: 16px;
    right: 16px;
    z-index: 2147483647;
    background: #0c0c0f;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    width: 320px;
    max-height: 80vh;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    color: #e4e4e7;
    animation: slideInRight 0.25s ease-out;
  }

  @keyframes slideInRight {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .answerfinder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.02);
    position: sticky;
    top: 0;
  }
  
  .answerfinder-badge {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
  }
  
  .answerfinder-badge-high {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
  }
  
  .answerfinder-badge-medium {
    background: rgba(234, 179, 8, 0.15);
    color: #fbbf24;
  }
  
  .answerfinder-badge-low {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
  }
  
  .answerfinder-badge-none {
    background: rgba(255, 255, 255, 0.05);
    color: #6b7280;
  }
  
  .answerfinder-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 20px;
    height: 20px;
    line-height: 1;
    transition: color 0.2s;
  }
  
  .answerfinder-close:hover {
    color: #ffffff;
  }
  
  .answerfinder-content {
    padding: 12px;
  }
  
  .answerfinder-answer {
    margin-bottom: 12px;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 14px;
    color: #ffffff;
    font-weight: 500;
  }
  
  .answerfinder-meta {
    margin-bottom: 10px;
    color: #6b7280;
    font-style: italic;
    font-size: 11px;
  }
  
  .answerfinder-question {
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    color: #9ca3af;
    border-left: 2px solid rgba(139, 92, 246, 0.5);
    font-size: 12px;
  }
  
  .answerfinder-message {
    color: #6b7280;
    text-align: center;
    padding: 16px 0;
    font-size: 12px;
  }
  
  .answerfinder-footer {
    padding: 10px 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    text-align: right;
    background: rgba(255, 255, 255, 0.02);
    position: sticky;
    bottom: 0;
  }
  
  .answerfinder-copy {
    background: #7c3aed;
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 600;
    transition: background 0.2s;
  }
  
  .answerfinder-copy:hover {
    background: #6d28d9;
  }

  .answerfinder-progress-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background: #7c3aed;
    width: 100%;
    transform-origin: left;
  }

  @keyframes answerfinder-progress {
    from { width: 100%; }
    to { width: 0%; }
  }
  
  .answerfinder-badge-ai {
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(167, 139, 250, 0.15) 100%);
    color: #c4b5fd;
    border: 1px solid rgba(139, 92, 246, 0.3);
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-size: 9px;
    padding: 5px 10px;
  }
  
  .answerfinder-reasoning {
    margin-top: 10px;
    padding: 10px 12px;
    border-top: 1px solid rgba(139, 92, 246, 0.1);
    font-size: 12px;
    color: #a1a1aa;
    background: rgba(139, 92, 246, 0.03);
    border-radius: 6px;
    border-left: 2px solid rgba(139, 92, 246, 0.4);
  }

  .answerfinder-reasoning strong {
    color: #a78bfa;
    display: block;
    margin-bottom: 6px;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    font-weight: 600;
  }
`;
document.head.appendChild(style);
