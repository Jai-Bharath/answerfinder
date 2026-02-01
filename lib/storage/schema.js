/**
 * @file schema.js
 * @description IndexedDB schema definitions
 * @module lib/storage/schema
 * @requires lib/utils/constants
 */

import { STORES, INDEXES, DB_VERSION, SCHEMA_VERSION } from '../utils/constants.js';

/**
 * Database schema definition
 */
export const SCHEMA = {
    version: DB_VERSION,
    schemaVersion: SCHEMA_VERSION,

    stores: {
        [STORES.QUESTIONS]: {
            keyPath: 'id',
            autoIncrement: false,
            indexes: [
                {
                    name: INDEXES.NORMALIZED_QUESTION,
                    keyPath: 'processed.normalizedQuestion',
                    unique: false,
                    multiEntry: false
                },
                {
                    name: INDEXES.KEYWORDS,
                    keyPath: 'processed.keywords',
                    unique: false,
                    multiEntry: true, // Allow searching by individual keywords
                    extractKey: (obj) => obj.processed.keywords.map(kw => kw.word)
                },
                {
                    name: INDEXES.QUESTION_TYPE,
                    keyPath: 'processed.questionType',
                    unique: false,
                    multiEntry: false
                },
                {
                    name: INDEXES.FILE_NAME,
                    keyPath: 'original.fileName',
                    unique: false,
                    multiEntry: false
                }
            ]
        },

        [STORES.METADATA]: {
            keyPath: 'key',
            autoIncrement: false,
            indexes: []
        },

        [STORES.QUERY_CACHE]: {
            keyPath: 'queryHash',
            autoIncrement: false,
            indexes: [
                {
                    name: 'timestamp',
                    keyPath: 'timestamp',
                    unique: false,
                    multiEntry: false
                }
            ]
        },

        [STORES.SETTINGS]: {
            keyPath: 'key',
            autoIncrement: false,
            indexes: []
        }
    }
};

/**
 * Create object stores and indexes
 * @param {IDBDatabase} db - Database instance
 * @param {IDBTransaction} transaction - Upgrade transaction
 */
export function createStores(db, transaction) {
    for (const [storeName, storeConfig] of Object.entries(SCHEMA.stores)) {
        // Create object store if it doesn't exist
        let objectStore;
        if (!db.objectStoreNames.contains(storeName)) {
            objectStore = db.createObjectStore(storeName, {
                keyPath: storeConfig.keyPath,
                autoIncrement: storeConfig.autoIncrement
            });
        } else {
            objectStore = transaction.objectStore(storeName);
        }

        // Create indexes
        for (const indexConfig of storeConfig.indexes) {
            if (!objectStore.indexNames.contains(indexConfig.name)) {
                objectStore.createIndex(indexConfig.name, indexConfig.keyPath, {
                    unique: indexConfig.unique,
                    multiEntry: indexConfig.multiEntry
                });
            }
        }
    }
}

/**
 * Question object schema (for reference/validation)
 */
export const QuestionSchema = {
    id: 'string',                    // SHA-256 hash
    original: {
        question: 'string',
        answer: 'string',
        lineNumber: 'number',
        fileName: 'string'
    },
    processed: {
        normalizedQuestion: 'string',
        keywords: [
            {
                word: 'string',
                importance: 'number',
                type: 'string'
            }
        ],
        questionType: 'string',
        questionTypeConfidence: 'number',
        characterCount: 'number',
        wordCount: 'number',
        hasNumbers: 'boolean',
        hasDates: 'boolean'
    },
    metadata: {
        createdAt: 'number',
        updatedAt: 'number'
    }
};
