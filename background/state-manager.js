/**
 * @file state-manager.js
 * @description Background script state management
 * @module background/state-manager
 * @requires lib/storage/indexeddb-manager
 * @requires lib/storage/cache-manager
 * @requires lib/utils/constants
 */

import { dbManager } from '../lib/storage/indexeddb-manager.js';
import { queryCache } from '../lib/storage/cache-manager.js';
import { DEFAULT_SETTINGS } from '../lib/utils/constants.js';

/**
 * State manager for background script
 */
class StateManager {
    constructor() {
        this.dbManager = dbManager;
        this.cache = queryCache;
        this.settings = { ...DEFAULT_SETTINGS };
        this.initialized = false;
    }

    /**
     * Initialize state manager
     */
    async init() {
        if (this.initialized) return;

        // Initialize database
        await this.dbManager.initDatabase();

        // Load settings from chrome.storage
        await this.loadSettings();

        this.initialized = true;
        console.log('[StateManager] Initialized');
    }

    /**
     * Get database manager
     * @returns {Object} Database manager instance
     */
    getDBManager() {
        return this.dbManager;
    }

    /**
     * Get cache
     * @returns {Object} Cache instance
     */
    getCache() {
        return this.cache;
    }

    /**
     * Get settings
     * @returns {Object} Current settings
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Update settings
     * @param {Object} newSettings - New settings to merge
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };

        // Save to chrome.storage
        await chrome.storage.sync.set({ settings: this.settings });

        console.log('[StateManager] Settings updated', this.settings);
    }

    /**
     * Load settings from chrome.storage
     */
    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get('settings');
            if (result.settings) {
                this.settings = { ...DEFAULT_SETTINGS, ...result.settings };
                console.log('[StateManager] Settings loaded', this.settings);
            }
        } catch (error) {
            console.error('[StateManager] Failed to load settings', error);
        }
    }

    /**
     * Clear all data
     */
    async clearAll() {
        await this.dbManager.clearAllQuestions();
        this.cache.clear();
        console.log('[StateManager] All data cleared');
    }
}

// Export singleton instance
export const stateManager = new StateManager();
