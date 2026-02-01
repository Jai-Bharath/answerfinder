/**
 * @file question-classifier.js
 * @description Deterministic question type classification
 * @module lib/normalization/question-classifier
 * @requires lib/utils/constants
 */

import { QUESTION_TYPES } from '../utils/constants.js';

// MCQ indicators
const MCQ_PATTERNS = [
    /which\s+of\s+the\s+following/i,
    /select\s+the\s+correct/i,
    /choose\s+the\s+correct/i,
    /pick\s+the\s+correct/i,
    /identify\s+the\s+correct/i,
    /what\s+is\s+the\s+correct/i,
    /multiple\s+choice/i,
    /\b[a-d]\)|^\s*[a-d][\.\)]/im, // Options like a) b) c) d)
    /option\s*[a-d]/i
];

const MCQ_KEYWORDS = [
    'following', 'options', 'choices', 'alternatives', 'select', 'choose', 'pick'
];

// True/False indicators
const TRUE_FALSE_PATTERNS = [
    /true\s+or\s+false/i,
    /is\s+it\s+true\s+that/i,
    /is\s+this\s+statement\s+true/i,
    /state\s+whether.*true\s+or\s+false/i,
    /determine\s+if.*true\s+or\s+false/i
];

const TRUE_FALSE_KEYWORDS = [
    'true', 'false', 'correct', 'incorrect', 'right', 'wrong'
];

// Fill in the blank indicators
const FILL_BLANK_PATTERNS = [
    /_+/,  // Underscores
    /\[blank\]/i,
    /\[___\]/,
    /fill\s+in\s+the\s+blank/i,
    /complete\s+the\s+sentence/i,
    /complete\s+the\s+following/i
];

const FILL_BLANK_KEYWORDS = [
    'fill', 'blank', 'complete', 'missing'
];

// Short answer indicators
const SHORT_ANSWER_PATTERNS = [
    /^what\s+is/i,
    /^what\s+are/i,
    /^define/i,
    /^list/i,
    /^name/i,
    /^identify/i,
    /^state/i,
    /^give/i,
    /^mention/i,
    /^write\s+the\s+name/i,
    /in\s+one\s+word/i,
    /in\s+brief/i,
    /briefly/i
];

const SHORT_ANSWER_KEYWORDS = [
    'what', 'define', 'list', 'name', 'identify', 'state', 'mention', 'briefly'
];

// Essay/long answer indicators
const ESSAY_PATTERNS = [
    /^explain/i,
    /^describe/i,
    /^discuss/i,
    /^analyze/i,
    /^analyse/i,
    /^compare\s+and\s+contrast/i,
    /^evaluate/i,
    /^justify/i,
    /^elaborate/i,
    /^illustrate/i,
    /in\s+detail/i,
    /with\s+examples/i,
    /write\s+an\s+essay/i,
    /write\s+a\s+note/i
];

const ESSAY_KEYWORDS = [
    'explain', 'describe', 'discuss', 'analyze', 'analyse', 'compare', 'contrast',
    'evaluate', 'justify', 'elaborate', 'illustrate', 'detail', 'essay'
];

/**
 * Count pattern matches in text
 * @param {string} text - Text to analyze
 * @param {RegExp[]} patterns - Array of regex patterns
 * @returns {number} Number of matches
 */
function countPatternMatches(text, patterns) {
    return patterns.reduce((count, pattern) => {
        return count + (pattern.test(text) ? 1 : 0);
    }, 0);
}

/**
 * Count keyword matches in text
 * @param {string} text - Text to analyze (should be lowercase)
 * @param {string[]} keywords - Array of keywords
 * @returns {number} Number of matches
 */
function countKeywordMatches(text, keywords) {
    const lowerText = text.toLowerCase();
    return keywords.reduce((count, keyword) => {
        return count + (lowerText.includes(keyword) ? 1 : 0);
    }, 0);
}

/**
 * Calculate confidence score for a question type
 * @param {number} patternMatches - Number of pattern matches
 * @param {number} keywordMatches - Number of keyword matches
 * @param {number} totalPatterns - Total number of patterns
 * @param {number} totalKeywords - Total number of keywords
 * @returns {number} Confidence score (0-1)
 */
function calculateTypeConfidence(patternMatches, keywordMatches, totalPatterns, totalKeywords) {
    const patternScore = totalPatterns > 0 ? patternMatches / totalPatterns : 0;
    const keywordScore = totalKeywords > 0 ? keywordMatches / totalKeywords : 0;

    // Weight patterns more heavily than keywords
    const confidence = (patternScore * 0.7) + (keywordScore * 0.3);

    return Math.min(confidence, 1.0);
}

/**
 * Classify question type
 * @param {string} questionText - Question text to classify
 * @returns {{type: string, confidence: number}} Classification result
 */
export function classifyQuestion(questionText) {
    if (!questionText || typeof questionText !== 'string') {
        return { type: QUESTION_TYPES.UNKNOWN, confidence: 0 };
    }

    const text = questionText.trim();

    // Calculate scores for each type
    const scores = {
        [QUESTION_TYPES.MCQ]: {
            patterns: countPatternMatches(text, MCQ_PATTERNS),
            keywords: countKeywordMatches(text, MCQ_KEYWORDS),
            totalPatterns: MCQ_PATTERNS.length,
            totalKeywords: MCQ_KEYWORDS.length
        },
        [QUESTION_TYPES.TRUE_FALSE]: {
            patterns: countPatternMatches(text, TRUE_FALSE_PATTERNS),
            keywords: countKeywordMatches(text, TRUE_FALSE_KEYWORDS),
            totalPatterns: TRUE_FALSE_PATTERNS.length,
            totalKeywords: TRUE_FALSE_KEYWORDS.length
        },
        [QUESTION_TYPES.FILL_BLANK]: {
            patterns: countPatternMatches(text, FILL_BLANK_PATTERNS),
            keywords: countKeywordMatches(text, FILL_BLANK_KEYWORDS),
            totalPatterns: FILL_BLANK_PATTERNS.length,
            totalKeywords: FILL_BLANK_KEYWORDS.length
        },
        [QUESTION_TYPES.SHORT_ANSWER]: {
            patterns: countPatternMatches(text, SHORT_ANSWER_PATTERNS),
            keywords: countKeywordMatches(text, SHORT_ANSWER_KEYWORDS),
            totalPatterns: SHORT_ANSWER_PATTERNS.length,
            totalKeywords: SHORT_ANSWER_KEYWORDS.length
        },
        [QUESTION_TYPES.ESSAY]: {
            patterns: countPatternMatches(text, ESSAY_PATTERNS),
            keywords: countKeywordMatches(text, ESSAY_KEYWORDS),
            totalPatterns: ESSAY_PATTERNS.length,
            totalKeywords: ESSAY_KEYWORDS.length
        }
    };

    // Calculate confidence for each type
    const confidences = {};
    for (const [type, score] of Object.entries(scores)) {
        confidences[type] = calculateTypeConfidence(
            score.patterns,
            score.keywords,
            score.totalPatterns,
            score.totalKeywords
        );
    }

    // Find type with highest confidence
    let maxConfidence = 0;
    let bestType = QUESTION_TYPES.UNKNOWN;

    for (const [type, confidence] of Object.entries(confidences)) {
        if (confidence > maxConfidence) {
            maxConfidence = confidence;
            bestType = type;
        }
    }

    // If confidence is too low, mark as unknown
    if (maxConfidence < 0.1) {
        return { type: QUESTION_TYPES.UNKNOWN, confidence: 0 };
    }

    return { type: bestType, confidence: maxConfidence };
}

/**
 * Get question type display name
 * @param {string} type - Question type constant
 * @returns {string} Display name
 */
export function getQuestionTypeDisplayName(type) {
    const displayNames = {
        [QUESTION_TYPES.MCQ]: 'Multiple Choice',
        [QUESTION_TYPES.TRUE_FALSE]: 'True/False',
        [QUESTION_TYPES.FILL_BLANK]: 'Fill in the Blank',
        [QUESTION_TYPES.SHORT_ANSWER]: 'Short Answer',
        [QUESTION_TYPES.ESSAY]: 'Essay/Long Answer',
        [QUESTION_TYPES.UNKNOWN]: 'Unknown'
    };

    return displayNames[type] || 'Unknown';
}
