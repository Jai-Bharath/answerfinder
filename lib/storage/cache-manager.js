/**
 * @file cache-manager.js
 * @description LRU cache for recent query results
 * @module lib/storage/cache-manager
 * @requires lib/utils/constants
 */

import { CACHE_CONFIG } from '../utils/constants.js';

/**
 * LRU (Least Recently Used) Cache implementation
 */
export class LRUCache {
    constructor(maxSize = CACHE_CONFIG.MAX_SIZE, ttl = CACHE_CONFIG.TTL_MS) {
        this.maxSize = maxSize;
        this.ttl = ttl;
        this.cache = new Map();
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any|null} Cached value or null if not found/expired
     */
    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        const entry = this.cache.get(key);

        // Check if expired
        if (Date.now() - entry.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value;
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     */
    set(key, value) {
        // Remove if already exists (to update position)
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        // Add new entry
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    /**
     * Check if key exists in cache
     * @param {string} key - Cache key
     * @returns {boolean} True if exists and not expired
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Get cache size
     * @returns {number} Number of entries
     */
    size() {
        return this.cache.size;
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            utilizationPercent: (this.cache.size / this.maxSize) * 100
        };
    }
}

// Export singleton instance
export const queryCache = new LRUCache();
