/**
 * @file stopwords.js
 * @description Stop word lists and filtering utilities
 * @module lib/normalization/stopwords
 */

// Comprehensive English stop words list
export const ENGLISH_STOPWORDS = new Set([
    // Articles
    'a', 'an', 'the',

    // Pronouns
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'their', 'theirs',
    'me', 'him', 'her', 'us', 'my', 'your', 'his', 'its', 'our',
    'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
    'this', 'that', 'these', 'those',

    // Prepositions
    'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'as',
    'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'over', 'of', 'off', 'up', 'down', 'out',

    // Conjunctions
    'and', 'or', 'but', 'nor', 'so', 'yet', 'if', 'because', 'while',
    'although', 'though', 'unless', 'since', 'until', 'when', 'where',

    // Auxiliary verbs
    'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'having',
    'do', 'does', 'did', 'doing',
    'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'can', 'could',

    // Common verbs (often not meaningful in questions)
    'get', 'got', 'getting',
    'make', 'made', 'making',
    'go', 'went', 'going', 'gone',
    'come', 'came', 'coming',
    'take', 'took', 'taken', 'taking',
    'see', 'saw', 'seen', 'seeing',
    'know', 'knew', 'known', 'knowing',
    'think', 'thought', 'thinking',
    'say', 'said', 'saying',
    'tell', 'told', 'telling',
    'give', 'gave', 'given', 'giving',
    'find', 'found', 'finding',
    'use', 'used', 'using',
    'want', 'wanted', 'wanting',
    'work', 'worked', 'working',
    'call', 'called', 'calling',
    'try', 'tried', 'trying',
    'ask', 'asked', 'asking',
    'need', 'needed', 'needing',
    'feel', 'felt', 'feeling',
    'become', 'became', 'becoming',
    'leave', 'left', 'leaving',
    'put', 'putting',

    // Other common words
    'not', 'no', 'yes',
    'all', 'any', 'some', 'many', 'much', 'more', 'most', 'few', 'less', 'least',
    'each', 'every', 'both', 'either', 'neither', 'other', 'another',
    'such', 'same', 'different',
    'very', 'too', 'quite', 'rather', 'just', 'only', 'even', 'also', 'still',
    'here', 'there', 'now', 'then', 'today', 'tomorrow', 'yesterday',
    'always', 'never', 'sometimes', 'often', 'usually', 'seldom',
    'again', 'back', 'away', 'around',
    'than', 'then', 'once', 'twice',
    'one', 'two', 'first', 'second', 'last', 'next',
    'new', 'old', 'good', 'bad', 'big', 'small', 'long', 'short',
    'high', 'low', 'right', 'left', 'near', 'far',
    'well', 'better', 'best', 'worse', 'worst',
    'own', 'same', 'sure', 'certain',
    'however', 'therefore', 'thus', 'hence', 'moreover', 'furthermore',
    'etc', 'ie', 'eg', 'vs', 'via'
]);

// Question words (keep these - they're important for question structure)
export const QUESTION_WORDS = new Set([
    'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how'
]);

// Important qualifiers (keep these)
export const IMPORTANT_QUALIFIERS = new Set([
    'not', 'never', 'always', 'only', 'must', 'should', 'can', 'cannot',
    'true', 'false', 'correct', 'incorrect', 'right', 'wrong'
]);

/**
 * Check if a word is a stop word
 * @param {string} word - Word to check (should be lowercase)
 * @returns {boolean} True if stop word
 */
export function isStopword(word) {
    // Keep question words and important qualifiers
    if (QUESTION_WORDS.has(word) || IMPORTANT_QUALIFIERS.has(word)) {
        return false;
    }
    return ENGLISH_STOPWORDS.has(word);
}

/**
 * Filter stop words from array of words
 * @param {string[]} words - Array of words
 * @returns {string[]} Filtered array
 */
export function filterStopwords(words) {
    return words.filter(word => !isStopword(word.toLowerCase()));
}

/**
 * Get stop word ratio in text
 * @param {string} text - Text to analyze
 * @returns {number} Ratio of stop words (0-1)
 */
export function getStopwordRatio(text) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return 0;

    const stopwordCount = words.filter(word => ENGLISH_STOPWORDS.has(word)).length;
    return stopwordCount / words.length;
}
