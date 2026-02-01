/**
 * @file indexeddb-manager.js
 * @description Complete IndexedDB operations manager
 * @module lib/storage/indexeddb-manager
 * @requires lib/storage/schema
 * @requires lib/utils/error-handler
 * @requires lib/utils/constants
 */

import { SCHEMA, createStores } from './schema.js';
import { AppError, logError } from '../utils/error-handler.js';
import { DB_NAME, DB_VERSION, STORES, INDEXES, ERROR_CODES, PARSER_CONFIG } from '../utils/constants.js';

/**
 * IndexedDB Manager class
 */
class IndexedDBManager {
    constructor() {
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Initialize database connection
     * @returns {Promise<IDBDatabase>} Database instance
     */
    async initDatabase() {
        if (this.isInitialized && this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                const error = new AppError(
                    ERROR_CODES.DB_UNAVAILABLE,
                    'Failed to open database',
                    { error: request.error }
                );
                logError(error, 'IndexedDBManager.initDatabase');
                reject(error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.isInitialized = true;
                console.log('[IndexedDB] Database initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                console.log(`[IndexedDB] Upgrading database from version ${event.oldVersion} to ${event.newVersion}`);
                const db = event.target.result;
                const transaction = event.target.transaction;

                try {
                    createStores(db, transaction);
                    console.log('[IndexedDB] Database schema created successfully');
                } catch (error) {
                    logError(error, 'IndexedDBManager.onupgradeneeded');
                    reject(error);
                }
            };
        });
    }

    /**
     * Add questions in batch
     * @param {Array} questions - Array of question objects
     * @returns {Promise<{success: boolean, count: number}>} Result
     */
    async addQuestions(questions) {
        await this.initDatabase();

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new AppError(
                ERROR_CODES.UNKNOWN_ERROR,
                'Invalid questions array',
                { questionsType: typeof questions }
            );
        }

        const batchSize = PARSER_CONFIG.BATCH_SIZE;
        let totalAdded = 0;

        // Process in batches to avoid transaction timeouts
        for (let i = 0; i < questions.length; i += batchSize) {
            const batch = questions.slice(i, i + batchSize);

            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([STORES.QUESTIONS], 'readwrite');
                const store = transaction.objectStore(STORES.QUESTIONS);

                transaction.oncomplete = () => {
                    totalAdded += batch.length;
                    resolve();
                };

                transaction.onerror = () => {
                    const error = new AppError(
                        ERROR_CODES.DB_TRANSACTION_FAILED,
                        'Failed to add questions batch',
                        { batchIndex: i, error: transaction.error }
                    );
                    logError(error, 'IndexedDBManager.addQuestions');
                    reject(error);
                };

                // Add each question in batch
                for (const question of batch) {
                    store.add(question);
                }
            });
        }

        console.log(`[IndexedDB] Added ${totalAdded} questions successfully`);
        return { success: true, count: totalAdded };
    }

    /**
     * Get question by ID
     * @param {string} id - Question ID
     * @returns {Promise<Object|null>} Question object or null
     */
    async getQuestionById(id) {
        await this.initDatabase();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.QUESTIONS], 'readonly');
            const store = transaction.objectStore(STORES.QUESTIONS);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => {
                logError(request.error, 'IndexedDBManager.getQuestionById');
                reject(request.error);
            };
        });
    }

    /**
     * Get question by normalized text (exact match)
     * @param {string} normalizedText - Normalized question text
     * @returns {Promise<Object|null>} Question object or null
     */
    async getQuestionByNormalizedText(normalizedText) {
        await this.initDatabase();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.QUESTIONS], 'readonly');
            const store = transaction.objectStore(STORES.QUESTIONS);
            const index = store.index(INDEXES.NORMALIZED_QUESTION);
            const request = index.get(normalizedText);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => {
                logError(request.error, 'IndexedDBManager.getQuestionByNormalizedText');
                reject(request.error);
            };
        });
    }

    /**
     * Get questions by keyword
     * @param {string} keyword - Keyword to search
     * @returns {Promise<Array>} Array of matching questions
     */
    async getQuestionsByKeyword(keyword) {
        await this.initDatabase();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.QUESTIONS], 'readonly');
            const store = transaction.objectStore(STORES.QUESTIONS);
            const index = store.index(INDEXES.KEYWORDS);
            const request = index.getAll(keyword);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => {
                logError(request.error, 'IndexedDBManager.getQuestionsByKeyword');
                reject(request.error);
            };
        });
    }

    /**
     * Get questions by multiple keywords
     * @param {string[]} keywords - Array of keywords
     * @returns {Promise<Array>} Array of matching questions (deduplicated)
     */
    async getQuestionsByKeywords(keywords) {
        await this.initDatabase();

        const questionMap = new Map();

        for (const keyword of keywords) {
            const questions = await this.getQuestionsByKeyword(keyword);
            for (const question of questions) {
                questionMap.set(question.id, question);
            }
        }

        return Array.from(questionMap.values());
    }

    /**
     * Get all questions
     * @returns {Promise<Array>} Array of all questions
     */
    async getAllQuestions() {
        await this.initDatabase();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.QUESTIONS], 'readonly');
            const store = transaction.objectStore(STORES.QUESTIONS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => {
                logError(request.error, 'IndexedDBManager.getAllQuestions');
                reject(request.error);
            };
        });
    }

    /**
     * Clear all questions
     * @returns {Promise<{success: boolean}>} Result
     */
    async clearAllQuestions() {
        await this.initDatabase();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.QUESTIONS], 'readwrite');
            const store = transaction.objectStore(STORES.QUESTIONS);
            const request = store.clear();

            transaction.oncomplete = () => {
                console.log('[IndexedDB] All questions cleared');
                resolve({ success: true });
            };

            transaction.onerror = () => {
                const error = new AppError(
                    ERROR_CODES.DB_TRANSACTION_FAILED,
                    'Failed to clear questions',
                    { error: transaction.error }
                );
                logError(error, 'IndexedDBManager.clearAllQuestions');
                reject(error);
            };
        });
    }

    /**
     * Get metadata
     * @param {string} key - Metadata key
     * @returns {Promise<any>} Metadata value
     */
    async getMetadata(key) {
        await this.initDatabase();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.METADATA], 'readonly');
            const store = transaction.objectStore(STORES.METADATA);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result?.value || null);
            request.onerror = () => {
                logError(request.error, 'IndexedDBManager.getMetadata');
                reject(request.error);
            };
        });
    }

    /**
     * Update metadata
     * @param {string} key - Metadata key
     * @param {any} value - Metadata value
     * @returns {Promise<{success: boolean}>} Result
     */
    async updateMetadata(key, value) {
        await this.initDatabase();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORES.METADATA], 'readwrite');
            const store = transaction.objectStore(STORES.METADATA);
            const request = store.put({ key, value, updatedAt: Date.now() });

            transaction.oncomplete = () => resolve({ success: true });
            transaction.onerror = () => {
                logError(transaction.error, 'IndexedDBManager.updateMetadata');
                reject(transaction.error);
            };
        });
    }

    /**
     * Get database statistics
     * @returns {Promise<Object>} Statistics object
     */
    async getStats() {
        await this.initDatabase();

        const [totalQuestions, metadata] = await Promise.all([
            this.getAllQuestions().then(q => q.length),
            this.getMetadata('import_info')
        ]);

        return {
            totalQuestions,
            lastImport: metadata?.timestamp || null,
            fileName: metadata?.fileName || null,
            schemaVersion: SCHEMA.schemaVersion
        };
    }

    /**
     * Export all data as JSON
     * @returns {Promise<Object>} Complete database export
     */
    async exportData() {
        await this.initDatabase();

        const [questions, metadata] = await Promise.all([
            this.getAllQuestions(),
            this.getMetadata('import_info')
        ]);

        return {
            version: SCHEMA.schemaVersion,
            exportedAt: Date.now(),
            metadata,
            questions
        };
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            console.log('[IndexedDB] Database connection closed');
        }
    }
}

// Export singleton instance
export const dbManager = new IndexedDBManager();
