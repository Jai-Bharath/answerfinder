/**
 * @file string-utils.js
 * @description String manipulation and similarity algorithms
 * @module lib/utils/string-utils
 */

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
export function levenshteinDistance(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create 2D array
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    // Initialize first column and row
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[len1][len2];
}

/**
 * Calculate normalized Levenshtein similarity (0-1)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
export function levenshteinSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
}

/**
 * Calculate Jaro-Winkler similarity
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (0-1)
 */
export function jaroWinklerSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    // Jaro similarity
    const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < str1.length; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, str2.length);

        for (let j = start; j < end; j++) {
            if (str2Matches[j] || str1[i] !== str2[j]) continue;
            str1Matches[i] = true;
            str2Matches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0.0;

    // Find transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
        if (!str1Matches[i]) continue;
        while (!str2Matches[k]) k++;
        if (str1[i] !== str2[k]) transpositions++;
        k++;
    }

    const jaro = (
        matches / str1.length +
        matches / str2.length +
        (matches - transpositions / 2) / matches
    ) / 3;

    // Winkler modification
    let prefixLength = 0;
    for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
        if (str1[i] === str2[i]) prefixLength++;
        else break;
    }

    return jaro + (prefixLength * 0.1 * (1 - jaro));
}

/**
 * Calculate Jaccard similarity between two sets
 * @param {Set} set1 - First set
 * @param {Set} set2 - Second set
 * @returns {number} Similarity score (0-1)
 */
export function jaccardSimilarity(set1, set2) {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    if (union.size === 0) return 0.0;
    return intersection.size / union.size;
}

/**
 * Check if one string is a substring of another
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {boolean} True if either is substring of the other
 */
export function isSubstring(str1, str2) {
    return str1.includes(str2) || str2.includes(str1);
}

/**
 * Calculate substring containment score
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Containment score (0-1)
 */
export function substringScore(str1, str2) {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const shorter = str1.length < str2.length ? str1 : str2;
    const longer = str1.length < str2.length ? str2 : str1;

    if (longer.includes(shorter)) {
        return shorter.length / longer.length;
    }

    return 0.0;
}

/**
 * Tokenize string into words
 * @param {string} text - Text to tokenize
 * @returns {string[]} Array of words
 */
export function tokenize(text) {
    return text.toLowerCase().split(/\s+/).filter(word => word.length > 0);
}

/**
 * Calculate word position similarity
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Position similarity score (0-1)
 */
export function wordPositionSimilarity(str1, str2) {
    const words1 = tokenize(str1);
    const words2 = tokenize(str2);

    if (words1.length === 0 || words2.length === 0) return 0.0;

    let positionScore = 0;
    const maxLength = Math.max(words1.length, words2.length);

    for (let i = 0; i < Math.min(words1.length, words2.length); i++) {
        if (words1[i] === words2[i]) {
            positionScore += 1;
        }
    }

    return positionScore / maxLength;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Truncate string to maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export function truncate(text, maxLength, suffix = '...') {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}
