/**
 * @file ai-service.js
 * @description Service to communicate with AI Backend Proxy
 * @module lib/ai/ai-service
 * @requires lib/ai/prompt-builder
 * @requires lib/storage/cache-manager
 */

import { buildPrompt, parseAIResponse } from "./prompt-builder.js";
import { queryCache } from "../storage/cache-manager.js";
import { generateCacheKey } from "../utils/hash.js";

// Configuration (Should be loaded from settings)
const DEFAULT_CONFIG = {
  proxyUrl: "https://answerfinder-ai-proxy.answerfinder.workers.dev/api/query", // Cloudflare Worker
  enabled: true,
  minConfidence: 0.7,
};

class AIService {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  /**
   * Update configuration
   * @param {Object} newConfig
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Query the AI for an answer
   * @param {string} text - User selection
   * @param {Object} context - Additional context (optional)
   * @returns {Promise<Object>} Match result
   */
  async query(text, context = {}) {
    if (!this.config.enabled) {
      return { success: false, message: "AI disabled" };
    }

    // Check cache first (separate from main matching cache if needed,
    // but we can use the same cache with a special key prefix or just rely on the main cache)
    // Note: The main matching-engine checks cache before calling this.
    // But if we want to cache ONLY AI results specifically or handle them differently:
    const cacheKey = await generateCacheKey("AI_" + text);
    const cached = queryCache.get(cacheKey);
    if (cached) {
      console.log("[AIService] Cache hit");
      return { ...cached, source: "ai", cached: true };
    }

    try {
      const prompt = buildPrompt(text);

      // Generate a unique ID for this installation/user if needed
      // For now using a placeholder. In prod, generate once and store in chrome.storage
      const result = await chrome.storage.local.get("instanceId");
      let instanceId = result.instanceId;
      if (!instanceId) {
        instanceId = "user_" + Date.now();
        await chrome.storage.local.set({ instanceId });
      }

      console.log("[AIService] Querying AI at:", this.config.proxyUrl);

      const response = await fetch(this.config.proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Extension-Key": instanceId,
        },
        body: JSON.stringify({
          inputs: prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Parse response (typically [{ generated_text: "..." }] or [{ summary_text: "..." }])
      const item = Array.isArray(data) ? data[0] : data;
      const rawText = item.generated_text || item.summary_text;

      if (!rawText) {
        throw new Error("Empty response from AI");
      }

      const parsed = parseAIResponse(rawText);

      const resultObj = {
        success: true,
        match: {
          question: { original: { question: text, answer: parsed.answer } },
          confidence: 0.85, // Static high confidence for AI for now
          explanation: parsed.reasoning,
          matchType: "ai",
        },
        source: "ai",
      };

      // Cache the result
      queryCache.set(cacheKey, resultObj);

      return resultObj;
    } catch (error) {
      console.error("[AIService] Request failed", error);
      return {
        success: false,
        message: "AI service unavailable",
        error: error.message,
      };
    }
  }
}

export const aiService = new AIService();
