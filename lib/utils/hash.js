/**
 * @file hash.js
 * @description Deterministic hashing utilities for generating unique IDs
 * @module lib/utils/hash
 */

/**
 * Generate SHA-256 hash of a string (using Web Crypto API)
 * @param {string} text - Text to hash
 * @returns {Promise<string>} Hex-encoded hash (64 characters)
 */
export async function sha256(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

/**
 * Generate deterministic ID for a question
 * @param {string} normalizedQuestion - Normalized question text
 * @param {number} lineNumber - Line number in source file
 * @param {string} fileName - Source file name
 * @returns {Promise<string>} Unique question ID
 */
export async function generateQuestionId(normalizedQuestion, lineNumber, fileName) {
    const composite = `${normalizedQuestion}|${lineNumber}|${fileName}`;
    return await sha256(composite);
}

/**
 * Generate hash for cache key
 * @param {string} query - Query string
 * @returns {Promise<string>} Cache key hash
 */
export async function generateCacheKey(query) {
    return await sha256(query);
}

/**
 * Simple fast hash for non-cryptographic purposes (e.g., quick lookups)
 * Based on DJB2 algorithm
 * @param {string} str - String to hash
 * @returns {number} 32-bit hash
 */
export function fastHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i); // hash * 33 + c
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}
