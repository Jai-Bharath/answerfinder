/**
 * @file exact-matcher.js
 * @description Tier 1: Exact normalized string matching
 * @module lib/matching/exact-matcher
 * @requires lib/matching/confidence-calculator
 * @requires lib/utils/constants
 */

import { calculateConfidence, explainConfidence } from './confidence-calculator.js';
import { MATCH_TYPES } from '../utils/constants.js';

/**
 * Perform exact match on normalized text
 * @param {string} normalizedQuery - Normalized query text
 * @param {Object} dbManager - Database manager instance
 * @returns {Promise<Object|null>} Match result or null
 */
export async function exactMatch(normalizedQuery, dbManager) {
    // Query database by normalized question index
    const question = await dbManager.getQuestionByNormalizedText(normalizedQuery);

    if (!question) {
        return null;
    }

    // Calculate confidence (exact match = 1.0)
    const confidence = calculateConfidence(MATCH_TYPES.EXACT, 1.0, {
        queryLength: normalizedQuery.length,
        questionLength: question.processed.normalizedQuestion.length
    });

    return {
        question,
        matchType: MATCH_TYPES.EXACT,
        confidence,
        rawScore: 1.0,
        explanation: explainConfidence(MATCH_TYPES.EXACT, confidence, 1.0),
        metadata: {
            tier: 1,
            method: 'exact_normalized'
        }
    };
}
