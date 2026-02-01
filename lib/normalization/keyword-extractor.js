/**
 * @file keyword-extractor.js
 * @description Multi-stage keyword extraction engine
 * @module lib/normalization/keyword-extractor
 * @requires lib/normalization/stopwords
 * @requires lib/normalization/text-normalizer
 * @requires lib/utils/constants
 */

import { isStopword, QUESTION_WORDS } from './stopwords.js';
import { normalizeForKeywords } from './text-normalizer.js';
import { KEYWORD_CONFIG, KEYWORD_TYPES } from '../utils/constants.js';

/**
 * Detect if word is a number
 * @param {string} word - Word to check
 * @returns {boolean} True if number
 */
function isNumber(word) {
    return /^\d+(\.\d+)?$/.test(word) || /^\d+(st|nd|rd|th)$/.test(word);
}

/**
 * Detect if word is a date-related term
 * @param {string} word - Word to check
 * @returns {boolean} True if date-related
 */
function isDateRelated(word) {
    const dateWords = new Set([
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december',
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        'today', 'tomorrow', 'yesterday', 'year', 'month', 'week', 'day'
    ]);
    return dateWords.has(word.toLowerCase());
}

/**
 * Detect if word is a proper noun (capitalized in original text)
 * @param {string} word - Word from original text
 * @param {string} originalText - Original text before normalization
 * @returns {boolean} True if likely proper noun
 */
function isProperNoun(word, originalText) {
    // Check if word appears capitalized in original text (not at sentence start)
    const regex = new RegExp(`[^.!?]\\s+${word}`, 'i');
    const match = originalText.match(regex);
    if (match) {
        const matchedWord = match[0].trim().split(/\s+/).pop();
        return matchedWord[0] === matchedWord[0].toUpperCase();
    }
    return false;
}

/**
 * Detect if word is a technical term (contains special characters or is all caps)
 * @param {string} word - Word to check
 * @param {string} originalWord - Original word before normalization
 * @returns {boolean} True if technical term
 */
function isTechnicalTerm(word, originalWord) {
    // Contains numbers, hyphens, or special characters
    if (/[\d\-@#$%]/.test(originalWord)) return true;

    // All caps (acronym)
    if (originalWord.length > 1 && originalWord === originalWord.toUpperCase()) return true;

    // CamelCase or PascalCase
    if (/[a-z][A-Z]/.test(originalWord)) return true;

    return false;
}

/**
 * Calculate word importance using TF-IDF-like approach
 * @param {string} word - Word to score
 * @param {string[]} allWords - All words in document
 * @param {Object} wordFrequency - Word frequency map
 * @returns {number} Importance score (0-1)
 */
function calculateWordImportance(word, allWords, wordFrequency) {
    // Term frequency (TF)
    const tf = wordFrequency[word] / allWords.length;

    // Inverse document frequency (IDF) - simulate with word rarity
    // Rare words (low frequency) get higher scores
    const maxFreq = Math.max(...Object.values(wordFrequency));
    const idf = Math.log(maxFreq / (wordFrequency[word] + 1));

    // Combine TF and IDF
    const tfidf = tf * idf;

    // Normalize to 0-1 range
    return Math.min(tfidf * 10, 1.0);
}

/**
 * Extract n-grams (phrases) from words
 * @param {string[]} words - Array of words
 * @param {number} n - N-gram size (2 or 3)
 * @returns {string[]} Array of n-grams
 */
function extractNGrams(words, n = 2) {
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
        const ngram = words.slice(i, i + n).join(' ');
        // Only include if not all stop words
        const ngramWords = words.slice(i, i + n);
        const hasContentWord = ngramWords.some(w => !isStopword(w));
        if (hasContentWord) {
            ngrams.push(ngram);
        }
    }
    return ngrams;
}

/**
 * Classify keyword type
 * @param {string} word - Word to classify
 * @param {string} originalText - Original text
 * @param {string} originalWord - Original word before normalization
 * @returns {string} Keyword type
 */
function classifyKeywordType(word, originalText, originalWord) {
    if (isStopword(word)) return KEYWORD_TYPES.STOPWORD;
    if (isTechnicalTerm(word, originalWord)) return KEYWORD_TYPES.TECHNICAL;
    if (isProperNoun(word, originalText) || isNumber(word) || isDateRelated(word)) {
        return KEYWORD_TYPES.ENTITY;
    }
    return KEYWORD_TYPES.COMMON;
}

/**
 * Extract keywords from text
 * @param {string} text - Text to extract keywords from
 * @param {Object} options - Extraction options
 * @param {number} options.maxKeywords - Maximum number of keywords
 * @param {boolean} options.includePhrases - Include 2-3 word phrases
 * @returns {Array<{word: string, importance: number, type: string}>} Extracted keywords
 */
export function extractKeywords(text, options = {}) {
    const {
        maxKeywords = KEYWORD_CONFIG.MAX_KEYWORDS,
        includePhrases = true
    } = options;

    if (!text || typeof text !== 'string') {
        return [];
    }

    const originalText = text;

    // Normalize text for processing
    const normalizedText = normalizeForKeywords(text);

    // Tokenize
    const words = normalizedText.split(/\s+/).filter(w => w.length >= KEYWORD_CONFIG.MIN_KEYWORD_LENGTH);

    if (words.length === 0) return [];

    // Calculate word frequency
    const wordFrequency = {};
    words.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });

    // Extract single-word keywords
    const keywords = [];
    const originalWords = originalText.split(/\s+/);

    words.forEach((word, index) => {
        // Skip stop words unless they're question words
        if (isStopword(word) && !QUESTION_WORDS.has(word)) {
            return;
        }

        // Skip very short or very long words
        if (word.length < KEYWORD_CONFIG.MIN_KEYWORD_LENGTH ||
            word.length > KEYWORD_CONFIG.MAX_KEYWORD_LENGTH) {
            return;
        }

        // Get original word for classification
        const originalWord = originalWords[index] || word;

        // Calculate importance
        const importance = calculateWordImportance(word, words, wordFrequency);

        // Skip low-importance words
        if (importance < KEYWORD_CONFIG.IMPORTANCE_THRESHOLD) {
            return;
        }

        // Classify keyword type
        const type = classifyKeywordType(word, originalText, originalWord);

        keywords.push({
            word,
            importance,
            type
        });
    });

    // Extract phrases (2-grams and 3-grams)
    if (includePhrases) {
        const bigrams = extractNGrams(words, 2);
        const trigrams = extractNGrams(words, 3);

        [...bigrams, ...trigrams].forEach(phrase => {
            // Calculate phrase importance (average of word importances)
            const phraseWords = phrase.split(' ');
            const avgImportance = phraseWords.reduce((sum, word) => {
                return sum + calculateWordImportance(word, words, wordFrequency);
            }, 0) / phraseWords.length;

            // Boost importance for phrases (they're more specific)
            const boostedImportance = Math.min(avgImportance * 1.5, 1.0);

            if (boostedImportance >= KEYWORD_CONFIG.IMPORTANCE_THRESHOLD) {
                keywords.push({
                    word: phrase,
                    importance: boostedImportance,
                    type: KEYWORD_TYPES.COMMON
                });
            }
        });
    }

    // Sort by importance (descending)
    keywords.sort((a, b) => b.importance - a.importance);

    // Deduplicate (keep highest importance)
    const seen = new Set();
    const uniqueKeywords = keywords.filter(kw => {
        if (seen.has(kw.word)) return false;
        seen.add(kw.word);
        return true;
    });

    // Limit to max keywords
    return uniqueKeywords.slice(0, maxKeywords);
}

/**
 * Extract keywords as simple array of strings (for backward compatibility)
 * @param {string} text - Text to extract keywords from
 * @returns {string[]} Array of keyword strings
 */
export function extractKeywordStrings(text) {
    const keywords = extractKeywords(text);
    return keywords.map(kw => kw.word);
}
