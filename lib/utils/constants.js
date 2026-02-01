/**
 * @file constants.js
 * @description Application-wide constants and configuration
 * @module lib/utils/constants
 */

// Schema and versioning
export const SCHEMA_VERSION = '1.0.0';
export const DB_NAME = 'AnswerFinderDB';
export const DB_VERSION = 1;

// Message types for extension communication
export const MESSAGE_TYPES = {
    // Query operations
    QUERY_ANSWER: 'QUERY_ANSWER',

    // File operations
    UPLOAD_FILE: 'UPLOAD_FILE',
    CLEAR_DATA: 'CLEAR_DATA',
    EXPORT_DATA: 'EXPORT_DATA',

    // Statistics and metadata
    GET_STATS: 'GET_STATS',
    GET_METADATA: 'GET_METADATA',

    // Settings
    UPDATE_SETTINGS: 'UPDATE_SETTINGS',
    GET_SETTINGS: 'GET_SETTINGS',

    // Responses
    RESPONSE: 'RESPONSE',
    ERROR: 'ERROR'
};

// IndexedDB object store names
export const STORES = {
    QUESTIONS: 'questions',
    METADATA: 'metadata',
    QUERY_CACHE: 'queryCache',
    SETTINGS: 'settings'
};

// Index names
export const INDEXES = {
    NORMALIZED_QUESTION: 'normalizedQuestion',
    KEYWORDS: 'keywords',
    QUESTION_TYPE: 'questionType',
    FILE_NAME: 'fileName'
};

// Question types
export const QUESTION_TYPES = {
    MCQ: 'mcq',
    TRUE_FALSE: 'true_false',
    FILL_BLANK: 'fill_blank',
    SHORT_ANSWER: 'short_answer',
    ESSAY: 'essay',
    UNKNOWN: 'unknown'
};

// Match types
export const MATCH_TYPES = {
    EXACT: 'exact',
    KEYWORD: 'keyword',
    FUZZY: 'fuzzy',
    PARTIAL: 'partial',
    AI: 'ai',
    NONE: null
};

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
    EXACT: 1.0,
    HIGH: 0.85,
    MEDIUM: 0.60,
    LOW: 0.30,
    REJECT: 0.0
};

// Matching configuration
export const MATCHING_CONFIG = {
    // Tier 2: Keyword matching
    KEYWORD_MIN_OVERLAP: 0.75,
    KEYWORD_MIN_CONFIDENCE: 0.75,
    KEYWORD_MAX_CONFIDENCE: 0.95,

    // Tier 3: Fuzzy matching
    FUZZY_MIN_SIMILARITY: 0.85,
    FUZZY_MIN_CONFIDENCE: 0.60,
    FUZZY_MAX_CONFIDENCE: 0.80,
    FUZZY_MAX_CANDIDATES: 50,

    // Tier 4: Partial matching
    PARTIAL_MIN_SCORE: 0.50,
    PARTIAL_MIN_CONFIDENCE: 0.30,
    PARTIAL_MAX_CONFIDENCE: 0.60,

    // General
    MAX_QUERY_LENGTH: 500,
    MIN_QUERY_LENGTH: 3
};

// Cache configuration
export const CACHE_CONFIG = {
    MAX_SIZE: 100,
    TTL_MS: 3600000 // 1 hour
};

// File parsing configuration
export const PARSER_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    BATCH_SIZE: 100, // Questions per IndexedDB transaction
    MAX_QUESTION_LENGTH: 5000,
    MAX_ANSWER_LENGTH: 50000,
    MIN_QUESTION_LENGTH: 3,
    MIN_ANSWER_LENGTH: 1
};

// Keyword extraction configuration
export const KEYWORD_CONFIG = {
    MAX_KEYWORDS: 50,
    MIN_KEYWORD_LENGTH: 3,
    MAX_KEYWORD_LENGTH: 50,
    IMPORTANCE_THRESHOLD: 0.1
};

// Performance targets (ms)
export const PERFORMANCE_TARGETS = {
    PARSE_PER_1000: 1000,
    QUERY_MATCH: 100,
    DB_WRITE: 500,
    DB_READ: 50,
    UI_RENDER: 16
};

// Error codes
export const ERROR_CODES = {
    // File errors
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    FILE_INVALID_FORMAT: 'FILE_INVALID_FORMAT',
    FILE_ENCODING_ERROR: 'FILE_ENCODING_ERROR',

    // Storage errors
    DB_QUOTA_EXCEEDED: 'DB_QUOTA_EXCEEDED',
    DB_UNAVAILABLE: 'DB_UNAVAILABLE',
    DB_TRANSACTION_FAILED: 'DB_TRANSACTION_FAILED',
    DB_CORRUPTED: 'DB_CORRUPTED',

    // Query errors
    QUERY_EMPTY: 'QUERY_EMPTY',
    QUERY_TOO_LONG: 'QUERY_TOO_LONG',
    NO_DATA_LOADED: 'NO_DATA_LOADED',

    // General errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    TIMEOUT: 'TIMEOUT'
};

// UI configuration
export const UI_CONFIG = {
    OVERLAY_FADE_DURATION: 200,
    OVERLAY_MAX_WIDTH: 500,
    OVERLAY_OFFSET: 10
};

// Default settings
export const DEFAULT_SETTINGS = {
    minConfidence: 0.5,
    fuzzyMatchingEnabled: true,
    partialMatchingEnabled: true,
    showMatchedQuestion: true,
    aiEnabled: false,
    theme: 'auto'
};

// Entity types for extraction
export const ENTITY_TYPES = {
    PERSON: 'person',
    PLACE: 'place',
    ORGANIZATION: 'organization',
    DATE: 'date',
    NUMBER: 'number',
    TECHNICAL_TERM: 'technical_term'
};

// Keyword types
export const KEYWORD_TYPES = {
    ENTITY: 'entity',
    TECHNICAL: 'technical',
    COMMON: 'common',
    STOPWORD: 'stopword'
};
