/**
 * @file content-script-bundled.js
 * @description Bundled content script (all modules combined)
 * Combines: selection-handler.js, overlay-manager.js, content-script.js
 */

console.log('[ContentScript] Content script loaded');

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
    return { valid: false, error: 'No text selected' };
  }

  if (text.length < 3) {
    return { valid: false, error: 'Selected text is too short' };
  }

  if (text.length > 500) {
    return { valid: false, error: 'Selected text is too long (max 500 characters)' };
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
    y: rect.bottom + window.scrollY
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

    // Add event listeners
    this.setupEventListeners();
  }

  /**
   * Create overlay element
   * @param {Object} result - Match result
   * @returns {HTMLElement} Overlay element
   */
  createOverlay(result) {
    const overlay = document.createElement('div');
    overlay.id = 'answerfinder-overlay';
    overlay.className = 'answerfinder-overlay';

    if (result.success && result.match) {
      const { question, matchType, confidence, explanation } = result.match;
      const confidenceLevel = this.getConfidenceLevel(confidence);

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
          <div class="answerfinder-meta">
            <small>${explanation}</small>
          </div>
          <div class="answerfinder-question">
            <small><strong>Matched question:</strong> ${this.escapeHtml(question.original.question)}</small>
          </div>
        </div>
        <div class="answerfinder-footer">
          <button class="answerfinder-copy" title="Copy answer">Copy</button>
        </div>
      `;
    } else {
      overlay.innerHTML = `
        <div class="answerfinder-header">
          <span class="answerfinder-badge answerfinder-badge-none">No Match</span>
          <button class="answerfinder-close" title="Close">&times;</button>
        </div>
        <div class="answerfinder-content">
          <div class="answerfinder-message">
            ${result.message || 'No answer found for your query.'}
          </div>
        </div>
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
    overlay.style.left = '';
    overlay.style.top = '';
    overlay.style.right = '20px';
    overlay.style.bottom = '';
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.overlay) return;

    // Close button
    const closeBtn = this.overlay.querySelector('.answerfinder-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideOverlay());
    }

    // Copy button
    const copyBtn = this.overlay.querySelector('.answerfinder-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => this.copyAnswer());
    }

    // Click outside to close
    document.addEventListener('click', this.handleOutsideClick.bind(this));

    // ESC key to close
    document.addEventListener('keydown', this.handleEscKey.bind(this));
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
    if (event.key === 'Escape') {
      this.hideOverlay();
    }
  }

  /**
   * Copy answer to clipboard
   */
  copyAnswer() {
    const answerElement = this.overlay.querySelector('.answerfinder-answer');
    if (answerElement) {
      const text = answerElement.textContent;
      navigator.clipboard.writeText(text).then(() => {
        const copyBtn = this.overlay.querySelector('.answerfinder-copy');
        if (copyBtn) {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
          }, 2000);
        }
      });
    }
  }

  /**
   * Hide overlay
   */
  hideOverlay() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.isVisible = false;

      // Remove event listeners
      document.removeEventListener('click', this.handleOutsideClick);
      document.removeEventListener('keydown', this.handleEscKey);
    }
  }

  /**
   * Get confidence level
   * @param {number} confidence - Confidence score
   * @returns {string} Level (high, medium, low, none)
   */
  getConfidenceLevel(confidence) {
    if (confidence >= 0.85) return 'high';
    if (confidence >= 0.60) return 'medium';
    if (confidence >= 0.30) return 'low';
    return 'none';
  }

  /**
   * Get confidence badge text
   * @param {string} level - Confidence level
   * @returns {string} Badge text
   */
  getConfidenceBadgeText(level) {
    const badges = {
      high: '✓ High Confidence',
      medium: '⚠ Medium Confidence',
      low: '⚠ Low Confidence',
      none: '✗ No Match'
    };
    return badges[level] || 'Unknown';
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
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
  console.log('[ContentScript] Received message:', message.type);
  if (message.type === 'SHOW_ANSWER_OVERLAY') {
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
  const position = getSelectionPosition() || { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  // Show loading state
  overlayManager.showOverlay({
    success: false,
    message: 'Searching for answer...'
  }, position);

  try {
    // Send query to background script
    const response = await chrome.runtime.sendMessage({
      type: 'QUERY_ANSWER',
      payload: { query },
      requestId: Date.now().toString()
    });

    // Show result
    if (response.type === 'RESPONSE') {
      overlayManager.showOverlay(response.payload, position);
    } else if (response.type === 'ERROR') {
      overlayManager.showOverlay({
        success: false,
        message: response.error.error?.message || 'An error occurred'
      }, position);
    }
  } catch (error) {
    console.error('[ContentScript] Error querying answer', error);
    overlayManager.showOverlay({
      success: false,
      message: 'Failed to search for answer. Please try again.'
    }, position);
  }
}

// ============================================================================
// STYLES
// ============================================================================

// Add CSS for overlay
const style = document.createElement('style');
style.textContent = `
  .answerfinder-overlay {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 2147483647;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    width: 350px;
    max-height: 80vh;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    animation: slideInRight 0.3s ease-out;
  }

  @keyframes slideInRight {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  .answerfinder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
    background: #f8f9fa;
    position: sticky;
    top: 0;
  }
  
  .answerfinder-badge {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .answerfinder-badge-high {
    background: #d4edda;
    color: #155724;
  }
  
  .answerfinder-badge-medium {
    background: #fff3cd;
    color: #856404;
  }
  
  .answerfinder-badge-low {
    background: #f8d7da;
    color: #721c24;
  }
  
  .answerfinder-badge-none {
    background: #e2e3e5;
    color: #383d41;
  }
  
  .answerfinder-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 24px;
    height: 24px;
    line-height: 1;
  }
  
  .answerfinder-close:hover {
    color: #000;
  }
  
  .answerfinder-content {
    padding: 16px;
  }
  
  .answerfinder-answer {
    margin-bottom: 15px;
    white-space: pre-wrap;
    word-wrap: break-word;
    font-size: 15px;
    color: #212529;
  }
  
  .answerfinder-meta {
    margin-bottom: 12px;
    color: #666;
    font-style: italic;
  }
  
  .answerfinder-question {
    padding: 10px;
    background: #f1f3f5;
    border-radius: 6px;
    color: #495057;
    border-left: 3px solid #dee2e6;
  }
  
  .answerfinder-message {
    color: #666;
    text-align: center;
    padding: 20px 0;
  }
  
  .answerfinder-footer {
    padding: 12px 16px;
    border-top: 1px solid #eee;
    text-align: right;
    background: #f8f9fa;
    position: sticky;
    bottom: 0;
  }
  
  .answerfinder-copy {
    background: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.2s;
  }
  
  .answerfinder-copy:hover {
    background: #0056b3;
  }
`;
document.head.appendChild(style);
