/**
 * @file matching-engine.js
 * @description Main matching engine orchestrator with 4-tier cascade
 * @module lib/matching/matching-engine
 * @requires lib/matching/exact-matcher
 * @requires lib/matching/keyword-matcher
 * @requires lib/matching/fuzzy-matcher
 * @requires lib/matching/partial-matcher
 * @requires lib/matching/ai-hook
 * @requires lib/normalization/text-normalizer
 * @requires lib/normalization/keyword-extractor
 * @requires lib/storage/indexeddb-manager
 * @requires lib/storage/cache-manager
 * @requires lib/utils/hash
 * @requires lib/utils/error-handler
 * @requires lib/utils/constants
 * @requires lib/utils/performance
 */

import { exactMatch } from "./exact-matcher.js";
import { keywordMatch } from "./keyword-matcher.js";
import { fuzzyMatch } from "./fuzzy-matcher.js";
import { partialMatch } from "./partial-matcher.js";
import { aiService } from "../ai/ai-service.js";
import { normalizeForMatching } from "../normalization/text-normalizer.js";
import { extractKeywords } from "../normalization/keyword-extractor.js";
import { dbManager } from "../storage/indexeddb-manager.js";
import { queryCache } from "../storage/cache-manager.js";
import { generateCacheKey } from "../utils/hash.js";
import { AppError, handleError } from "../utils/error-handler.js";
import { ERROR_CODES, MATCHING_CONFIG } from "../utils/constants.js";
import { PerformanceTimer } from "../utils/performance.js";

/**
 * Main matching engine class
 */
class MatchingEngine {
  constructor() {
    this.dbManager = dbManager;
    this.cache = queryCache;
  }

  /**
   * Find answer for query
   * @param {string} query - User query text
   * @param {Object} options - Matching options
   * @param {number} options.minConfidence - Minimum confidence threshold
   * @param {boolean} options.fuzzyEnabled - Enable fuzzy matching
   * @param {boolean} options.partialEnabled - Enable partial matching
   * @param {boolean} options.useCache - Use query cache
   * @returns {Promise<Object>} Match result
   */
  async findAnswer(query, options = {}) {
    const timer = new PerformanceTimer("findAnswer");
    timer.start();
    console.log("[MatchingEngine] findAnswer started", { query, options });

    try {
      // Validate query
      this.validateQuery(query);

      // Set default options
      const opts = {
        minConfidence: options.minConfidence || 0.5,
        fuzzyEnabled: options.fuzzyEnabled !== false,
        partialEnabled: options.partialEnabled !== false,
        useCache: options.useCache !== false,
        aiEnabled: options.aiEnabled,
        aiProxyUrl: options.aiProxyUrl,
        query: query,
      };

      // Check cache first
      if (opts.useCache) {
        const cachedResult = await this.checkCache(query);
        if (cachedResult) {
          timer.end();
          console.log(
            `[MatchingEngine] Cache hit (${timer.getDuration().toFixed(2)}ms)`,
          );
          return cachedResult;
        }
      }

      // Preprocess query
      const { normalizedQuery, keywords } = await this.preprocessQuery(query);

      // Run matching pipeline
      const result = await this.runMatchingPipeline(
        normalizedQuery,
        keywords,
        opts,
      );

      // Cache result if successful
      if (result.success && result.match && opts.useCache) {
        await this.cacheResult(query, result);
      }

      timer.end();
      result.processingTime = timer.getDuration();
      console.log(
        `[MatchingEngine] Query processed in ${result.processingTime.toFixed(2)}ms`,
      );

      return result;
    } catch (error) {
      timer.end();
      console.error("[MatchingEngine] findAnswer FAILED:", error); // Explicit log
      return handleError(error, "MatchingEngine.findAnswer");
    }
  }

  /**
   * Validate query
   * @param {string} query - Query text
   * @throws {AppError} If query is invalid
   */
  validateQuery(query) {
    if (!query || typeof query !== "string") {
      throw new AppError(ERROR_CODES.QUERY_EMPTY, "Query is empty or invalid");
    }

    const trimmed = query.trim();

    if (trimmed.length < MATCHING_CONFIG.MIN_QUERY_LENGTH) {
      throw new AppError(ERROR_CODES.QUERY_EMPTY, "Query is too short", {
        length: trimmed.length,
        minLength: MATCHING_CONFIG.MIN_QUERY_LENGTH,
      });
    }

    if (trimmed.length > MATCHING_CONFIG.MAX_QUERY_LENGTH) {
      throw new AppError(ERROR_CODES.QUERY_TOO_LONG, "Query is too long", {
        length: trimmed.length,
        maxLength: MATCHING_CONFIG.MAX_QUERY_LENGTH,
      });
    }
  }

  /**
   * Check cache for query
   * @param {string} query - Query text
   * @returns {Promise<Object|null>} Cached result or null
   */
  async checkCache(query) {
    const cacheKey = await generateCacheKey(query);
    return this.cache.get(cacheKey);
  }

  /**
   * Cache query result
   * @param {string} query - Query text
   * @param {Object} result - Match result
   */
  async cacheResult(query, result) {
    const cacheKey = await generateCacheKey(query);
    this.cache.set(cacheKey, result);
  }

  /**
   * Preprocess query
   * @param {string} query - Raw query text
   * @returns {Promise<Object>} Preprocessed data
   */
  async preprocessQuery(query) {
    const normalizedQuery = normalizeForMatching(query);
    const keywords = extractKeywords(query);

    return { normalizedQuery, keywords };
  }

  /**
   * Run 4-tier matching pipeline with early exit
   * @param {string} normalizedQuery - Normalized query
   * @param {Array} keywords - Extracted keywords
   * @param {Object} options - Matching options
   * @returns {Promise<Object>} Match result
   */
  async runMatchingPipeline(normalizedQuery, keywords, options) {
    // Check if database has data
    const stats = await this.dbManager.getStats();
    const hasData = stats.totalQuestions > 0;

    if (!hasData) {
      console.log(
        "[MatchingEngine] No local data loaded. Skipping local tiers.",
      );
    }

    let candidates = [];

    // Run local tiers only if we have data
    if (hasData) {
      // Tier 1: Exact Match
      console.log("[MatchingEngine] Tier 1: Exact match");
      const exactResult = await exactMatch(normalizedQuery, this.dbManager);
      if (exactResult && exactResult.confidence >= options.minConfidence) {
        return {
          success: true,
          match: exactResult,
          tier: 1,
        };
      }

      // Tier 2: Keyword Match
      console.log("[MatchingEngine] Tier 2: Keyword match");
      const keywordResult = await keywordMatch(keywords, this.dbManager);
      if (keywordResult && keywordResult.confidence >= options.minConfidence) {
        return {
          success: true,
          match: keywordResult,
          tier: 2,
        };
      }

      // Get candidates from keyword match for fuzzy/partial matching
      if (keywords.length > 0) {
        const keywordStrings = keywords.map((kw) => kw.word);
        candidates =
          await this.dbManager.getQuestionsByKeywords(keywordStrings);
      }

      // If no candidates from keywords, get all questions (expensive!)
      if (candidates.length === 0) {
        console.warn(
          "[MatchingEngine] No keyword candidates, using all questions",
        );
        candidates = await this.dbManager.getAllQuestions();
      }

      // Tier 3: Fuzzy Match
      if (options.fuzzyEnabled) {
        console.log("[MatchingEngine] Tier 3: Fuzzy match");
        const fuzzyResult = fuzzyMatch(normalizedQuery, candidates);
        if (fuzzyResult && fuzzyResult.confidence >= options.minConfidence) {
          return {
            success: true,
            match: fuzzyResult,
            tier: 3,
          };
        }
      }

      // Tier 4: Partial Match
      if (options.partialEnabled) {
        console.log("[MatchingEngine] Tier 4: Partial match");
        const partialResult = partialMatch(normalizedQuery, candidates);
        if (
          partialResult &&
          partialResult.confidence >= options.minConfidence
        ) {
          return {
            success: true,
            match: partialResult,
            tier: 4,
          };
        }
      }
    }

    // Tier 5: AI Match
    // Check if AI is enabled via service config (or passed options)
    // We assume options.aiEnabled might override, or we check service
    const aiEnabled = options.aiEnabled !== false; // Default to true if not specified, but service checks internal config too

    if (aiEnabled) {
      console.log("[MatchingEngine] Tier 5: AI match");

      // Update AI service config with latest settings
      if (options.aiProxyUrl) {
        aiService.updateConfig({
          proxyUrl: options.aiProxyUrl,
          enabled: aiEnabled,
        });
      }

      // We use the original query for AI to preserve context, but normalized is also fine
      // aiService.query handles the "is enabled" check internally too
      const aiResult = await aiService.query(options.query, {
        keywords,
        candidates,
      });

      if (aiResult && aiResult.success && aiResult.match) {
        return {
          success: true,
          match: aiResult.match,
          tier: 5,
          source: "ai",
        };
      }
    }

    // No match found
    console.log("[MatchingEngine] No match found");

    let message =
      "No match found in your database. Enable AI Answering for better results!";

    if (!hasData) {
      message =
        "No Q&A file uploaded yet. Click the extension icon to upload your questions, or enable AI for instant answers.";
    } else if (!aiEnabled) {
      message =
        "No match found in your uploaded files. Enable AI Answering in settings for better results!";
    }

    return {
      success: false,
      match: null,
      message: message,
      tier: 0,
    };
  }
}

// Export singleton instance
export const matchingEngine = new MatchingEngine();
