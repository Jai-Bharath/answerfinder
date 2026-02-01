/**
 * @file ai-hook.js
 * @description AI integration point (stub for future implementation)
 * @module lib/matching/ai-hook
 */

/**
 * AI matching function (future implementation)
 * @param {string} query - User query
 * @param {Object} context - Additional context
 * @returns {Promise<Object|null>} AI match result or null
 */
export async function aiMatch(query, context = {}) {
    // Future: Integrate with AI service (OpenAI, Gemini, etc.)
    // For now, return null (not implemented)
    return null;
}

/**
 * Check if AI is enabled
 * @returns {boolean} True if AI is enabled
 */
export function isAIEnabled() {
    // Future: Check settings
    return false;
}
