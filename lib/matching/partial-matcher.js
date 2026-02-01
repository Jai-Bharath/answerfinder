/**
 * @file partial-matcher.js
 * @description Tier 4: Partial/substring matching
 * @module lib/matching/partial-matcher
 * @requires lib/matching/confidence-calculator
 * @requires lib/utils/string-utils
 * @requires lib/utils/constants
 */

import { calculateConfidence, explainConfidence } from './confidence-calculator.js';
import { substringScore, wordPositionSimilarity } from '../utils/string-utils.js';
import { MATCH_TYPES, MATCHING_CONFIG } from '../utils/constants.js';

/**
 * Perform partial/substring matching
 * @param {string} normalizedQuery - Normalized query text
 * @param {Array} candidates - Candidate questions from previous tier
 * @returns {Object|null} Match result or null
 */
export function partialMatch(normalizedQuery, candidates) {
    if (!candidates || candidates.length === 0) {
        return null;
    }

    let bestMatch = null;
    let bestScore = 0;

    for (const candidate of candidates) {
        const candidateText = candidate.processed.normalizedQuestion;

        // Calculate substring containment score
        const substringScoreValue = substringScore(normalizedQuery, candidateText);

        // Calculate word position similarity
        const positionSimilarity = wordPositionSimilarity(normalizedQuery, candidateText);

        // Combine scores (substring is more important)
        const combinedScore = (substringScoreValue * 0.7) + (positionSimilarity * 0.3);

        if (combinedScore > bestScore) {
            bestScore = combinedScore;
            bestMatch = candidate;
        }
    }

    // Check if score meets threshold
    if (bestScore < MATCHING_CONFIG.PARTIAL_MIN_SCORE) {
        return null;
    }

    // Calculate confidence
    const confidence = calculateConfidence(MATCH_TYPES.PARTIAL, bestScore, {
        queryLength: normalizedQuery.length,
        questionLength: bestMatch.processed.normalizedQuestion.length
    });

    return {
        question: bestMatch,
        matchType: MATCH_TYPES.PARTIAL,
        confidence,
        rawScore: bestScore,
        explanation: explainConfidence(MATCH_TYPES.PARTIAL, confidence, bestScore),
        metadata: {
            tier: 4,
            method: 'partial_substring',
            candidatesEvaluated: candidates.length
        }
    };
}
