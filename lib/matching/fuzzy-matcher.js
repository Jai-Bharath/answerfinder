/**
 * @file fuzzy-matcher.js
 * @description Tier 3: Fuzzy string similarity matching
 * @module lib/matching/fuzzy-matcher
 * @requires lib/matching/confidence-calculator
 * @requires lib/utils/string-utils
 * @requires lib/utils/constants
 */

import { calculateConfidence, explainConfidence } from './confidence-calculator.js';
import { levenshteinSimilarity, jaroWinklerSimilarity } from '../utils/string-utils.js';
import { MATCH_TYPES, MATCHING_CONFIG } from '../utils/constants.js';

/**
 * Perform fuzzy string similarity matching
 * @param {string} normalizedQuery - Normalized query text
 * @param {Array} candidates - Candidate questions from previous tier
 * @returns {Object|null} Match result or null
 */
export function fuzzyMatch(normalizedQuery, candidates) {
    if (!candidates || candidates.length === 0) {
        return null;
    }

    // Limit candidates to avoid performance issues
    const limitedCandidates = candidates.slice(0, MATCHING_CONFIG.FUZZY_MAX_CANDIDATES);

    let bestMatch = null;
    let bestScore = 0;

    for (const candidate of limitedCandidates) {
        const candidateText = candidate.processed.normalizedQuestion;

        // Calculate both Levenshtein and Jaro-Winkler similarities
        const levenshtein = levenshteinSimilarity(normalizedQuery, candidateText);
        const jaroWinkler = jaroWinklerSimilarity(normalizedQuery, candidateText);

        // Use weighted average (Jaro-Winkler is better for short strings)
        const similarity = (levenshtein * 0.6) + (jaroWinkler * 0.4);

        if (similarity > bestScore) {
            bestScore = similarity;
            bestMatch = candidate;
        }
    }

    // Check if score meets threshold
    if (bestScore < MATCHING_CONFIG.FUZZY_MIN_SIMILARITY) {
        return null;
    }

    // Calculate confidence
    const confidence = calculateConfidence(MATCH_TYPES.FUZZY, bestScore, {
        queryLength: normalizedQuery.length,
        questionLength: bestMatch.processed.normalizedQuestion.length
    });

    return {
        question: bestMatch,
        matchType: MATCH_TYPES.FUZZY,
        confidence,
        rawScore: bestScore,
        explanation: explainConfidence(MATCH_TYPES.FUZZY, confidence, bestScore),
        metadata: {
            tier: 3,
            method: 'fuzzy_similarity',
            candidatesEvaluated: limitedCandidates.length
        }
    };
}
