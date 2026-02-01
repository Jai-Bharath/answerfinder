/**
 * @file keyword-matcher.js
 * @description Tier 2: Keyword overlap matching with Jaccard similarity
 * @module lib/matching/keyword-matcher
 * @requires lib/matching/confidence-calculator
 * @requires lib/utils/string-utils
 * @requires lib/utils/constants
 */

import { calculateConfidence, explainConfidence } from './confidence-calculator.js';
import { jaccardSimilarity } from '../utils/string-utils.js';
import { MATCH_TYPES, MATCHING_CONFIG } from '../utils/constants.js';

/**
 * Perform keyword overlap matching
 * @param {Array} queryKeywords - Extracted keywords from query
 * @param {Object} dbManager - Database manager instance
 * @returns {Promise<Object|null>} Match result or null
 */
export async function keywordMatch(queryKeywords, dbManager) {
    if (!queryKeywords || queryKeywords.length === 0) {
        return null;
    }

    // Get all keywords as strings
    const queryKeywordStrings = queryKeywords.map(kw => kw.word);

    // Query database for questions with matching keywords
    const candidates = await dbManager.getQuestionsByKeywords(queryKeywordStrings);

    if (candidates.length === 0) {
        return null;
    }

    // Score each candidate
    let bestMatch = null;
    let bestScore = 0;

    for (const candidate of candidates) {
        const candidateKeywords = candidate.processed.keywords.map(kw => kw.word);

        // Calculate Jaccard similarity
        const querySet = new Set(queryKeywordStrings);
        const candidateSet = new Set(candidateKeywords);
        const similarity = jaccardSimilarity(querySet, candidateSet);

        // Weight by keyword importance
        const importanceBoost = calculateImportanceBoost(queryKeywords, candidate.processed.keywords);
        const weightedScore = similarity * (1 + importanceBoost * 0.2);

        if (weightedScore > bestScore) {
            bestScore = weightedScore;
            bestMatch = candidate;
        }
    }

    // Check if score meets threshold
    if (bestScore < MATCHING_CONFIG.KEYWORD_MIN_OVERLAP) {
        return null;
    }

    // Calculate confidence
    const confidence = calculateConfidence(MATCH_TYPES.KEYWORD, bestScore, {
        queryLength: queryKeywordStrings.length,
        questionLength: bestMatch.processed.keywords.length
    });

    return {
        question: bestMatch,
        matchType: MATCH_TYPES.KEYWORD,
        confidence,
        rawScore: bestScore,
        explanation: explainConfidence(MATCH_TYPES.KEYWORD, confidence, bestScore),
        metadata: {
            tier: 2,
            method: 'keyword_jaccard',
            candidatesEvaluated: candidates.length,
            matchedKeywords: getMatchedKeywords(queryKeywordStrings, bestMatch.processed.keywords.map(kw => kw.word))
        }
    };
}

/**
 * Calculate importance boost based on matched important keywords
 * @param {Array} queryKeywords - Query keywords with importance
 * @param {Array} candidateKeywords - Candidate keywords with importance
 * @returns {number} Importance boost (0-1)
 */
function calculateImportanceBoost(queryKeywords, candidateKeywords) {
    const queryMap = new Map(queryKeywords.map(kw => [kw.word, kw.importance]));
    const candidateMap = new Map(candidateKeywords.map(kw => [kw.word, kw.importance]));

    let totalImportance = 0;
    let matchedImportance = 0;

    for (const [word, importance] of queryMap) {
        totalImportance += importance;
        if (candidateMap.has(word)) {
            matchedImportance += importance;
        }
    }

    return totalImportance > 0 ? matchedImportance / totalImportance : 0;
}

/**
 * Get list of matched keywords
 * @param {string[]} queryKeywords - Query keywords
 * @param {string[]} candidateKeywords - Candidate keywords
 * @returns {string[]} Matched keywords
 */
function getMatchedKeywords(queryKeywords, candidateKeywords) {
    const candidateSet = new Set(candidateKeywords);
    return queryKeywords.filter(kw => candidateSet.has(kw));
}
