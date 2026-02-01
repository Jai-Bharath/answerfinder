/**
 * @file confidence-calculator.js
 * @description Unified confidence scoring for all match types
 * @module lib/matching/confidence-calculator
 * @requires lib/utils/constants
 */

import { CONFIDENCE_THRESHOLDS, MATCH_TYPES, MATCHING_CONFIG } from '../utils/constants.js';

/**
 * Calculate confidence score for a match
 * @param {string} matchType - Type of match (exact, keyword, fuzzy, partial)
 * @param {number} rawScore - Raw similarity score (0-1)
 * @param {Object} context - Additional context for scoring
 * @param {string} context.questionType - Type of question
 * @param {number} context.queryLength - Length of query
 * @param {number} context.questionLength - Length of matched question
 * @returns {number} Confidence score (0-1)
 */
export function calculateConfidence(matchType, rawScore, context = {}) {
    const {
        questionType = 'unknown',
        queryLength = 0,
        questionLength = 0
    } = context;

    let confidence = 0;

    switch (matchType) {
        case MATCH_TYPES.EXACT:
            // Exact matches always get 1.0 confidence
            confidence = CONFIDENCE_THRESHOLDS.EXACT;
            break;

        case MATCH_TYPES.KEYWORD:
            // Keyword matching: scale between min and max
            confidence = scaleScore(
                rawScore,
                MATCHING_CONFIG.KEYWORD_MIN_CONFIDENCE,
                MATCHING_CONFIG.KEYWORD_MAX_CONFIDENCE
            );

            // Boost for longer queries (more keywords = more reliable)
            if (queryLength > 50) {
                confidence = Math.min(confidence * 1.1, 1.0);
            }
            break;

        case MATCH_TYPES.FUZZY:
            // Fuzzy matching: scale between min and max
            confidence = scaleScore(
                rawScore,
                MATCHING_CONFIG.FUZZY_MIN_CONFIDENCE,
                MATCHING_CONFIG.FUZZY_MAX_CONFIDENCE
            );

            // Penalize large length differences
            const lengthRatio = Math.min(queryLength, questionLength) / Math.max(queryLength, questionLength);
            if (lengthRatio < 0.7) {
                confidence *= 0.9;
            }
            break;

        case MATCH_TYPES.PARTIAL:
            // Partial matching: scale between min and max
            confidence = scaleScore(
                rawScore,
                MATCHING_CONFIG.PARTIAL_MIN_CONFIDENCE,
                MATCHING_CONFIG.PARTIAL_MAX_CONFIDENCE
            );

            // Partial matches are inherently less reliable
            confidence *= 0.8;
            break;

        case MATCH_TYPES.AI:
            // AI matches use the raw score directly
            confidence = rawScore;
            break;

        default:
            confidence = 0;
    }

    // Ensure confidence is in valid range
    return Math.max(0, Math.min(1, confidence));
}

/**
 * Scale score from 0-1 to min-max range
 * @param {number} score - Raw score (0-1)
 * @param {number} min - Minimum output value
 * @param {number} max - Maximum output value
 * @returns {number} Scaled score
 */
function scaleScore(score, min, max) {
    return min + (score * (max - min));
}

/**
 * Get confidence level label
 * @param {number} confidence - Confidence score (0-1)
 * @returns {string} Level label (HIGH, MEDIUM, LOW, NONE)
 */
export function getConfidenceLevel(confidence) {
    if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'HIGH';
    if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'MEDIUM';
    if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'LOW';
    return 'NONE';
}

/**
 * Get human-readable confidence explanation
 * @param {string} matchType - Type of match
 * @param {number} confidence - Confidence score
 * @param {number} rawScore - Raw similarity score
 * @returns {string} Explanation text
 */
export function explainConfidence(matchType, confidence, rawScore = null) {
    const level = getConfidenceLevel(confidence);

    const explanations = {
        [MATCH_TYPES.EXACT]: 'Exact match after normalization',
        [MATCH_TYPES.KEYWORD]: `${Math.round(rawScore * 100)}% keyword overlap`,
        [MATCH_TYPES.FUZZY]: `${Math.round(rawScore * 100)}% text similarity`,
        [MATCH_TYPES.PARTIAL]: 'Partial text match',
        [MATCH_TYPES.AI]: 'AI-generated answer'
    };

    const baseExplanation = explanations[matchType] || 'Unknown match type';

    if (level === 'HIGH') {
        return `✓ ${baseExplanation}`;
    } else if (level === 'MEDIUM') {
        return `⚠ ${baseExplanation} (medium confidence)`;
    } else if (level === 'LOW') {
        return `⚠ ${baseExplanation} (low confidence)`;
    } else {
        return `✗ No reliable match found`;
    }
}

/**
 * Determine if confidence is acceptable
 * @param {number} confidence - Confidence score
 * @param {number} threshold - Minimum acceptable threshold
 * @returns {boolean} True if acceptable
 */
export function isAcceptableConfidence(confidence, threshold = CONFIDENCE_THRESHOLDS.LOW) {
    return confidence >= threshold;
}
