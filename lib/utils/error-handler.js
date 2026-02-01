/**
 * @file error-handler.js
 * @description Centralized error handling and user-friendly error messages
 * @module lib/utils/error-handler
 * @requires lib/utils/constants
 */

import { ERROR_CODES } from './constants.js';

/**
 * Error class for application-specific errors
 */
export class AppError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.details = details;
        this.timestamp = Date.now();
    }
}

/**
 * Get user-friendly error message from error code
 * @param {string} code - Error code from ERROR_CODES
 * @param {Object} details - Additional error details
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(code, details = {}) {
    const messages = {
        [ERROR_CODES.FILE_TOO_LARGE]: `File is too large (${details.size}MB). Maximum size is ${details.maxSize}MB.`,
        [ERROR_CODES.FILE_INVALID_FORMAT]: `Invalid file format. ${details.reason || 'Please check the file structure.'}`,
        [ERROR_CODES.FILE_ENCODING_ERROR]: 'File encoding error. Please ensure the file is UTF-8 encoded.',

        [ERROR_CODES.DB_QUOTA_EXCEEDED]: 'Storage quota exceeded. Please clear old data or free up browser storage.',
        [ERROR_CODES.DB_UNAVAILABLE]: 'Database unavailable. Please reload the extension.',
        [ERROR_CODES.DB_TRANSACTION_FAILED]: 'Database operation failed. Please try again.',
        [ERROR_CODES.DB_CORRUPTED]: 'Database corrupted. Please clear data and re-upload your file.',

        [ERROR_CODES.QUERY_EMPTY]: 'Please select some text to search.',
        [ERROR_CODES.QUERY_TOO_LONG]: `Selected text is too long (${details.length} characters). Maximum is ${details.maxLength}.`,
        [ERROR_CODES.NO_DATA_LOADED]: 'No answer data loaded. Please upload a Q&A file first.',

        [ERROR_CODES.TIMEOUT]: 'Operation timed out. Please try again.',
        [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
    };

    return messages[code] || messages[ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * Log error to console with context
 * @param {Error|AppError} error - Error object
 * @param {string} context - Context where error occurred
 * @param {Object} additionalData - Additional debugging data
 */
export function logError(error, context = 'Unknown', additionalData = {}) {
    const errorInfo = {
        context,
        timestamp: new Date().toISOString(),
        error: {
            name: error.name,
            message: error.message,
            code: error.code || 'N/A',
            stack: error.stack
        },
        ...additionalData
    };

    console.error('[AnswerFinder Error] Message:', error.message || error); // Clean log for user
    console.error('[AnswerFinder Error] Details:', errorInfo);

    // In production, could send to error tracking service
    // trackError(errorInfo);
}

/**
 * Handle error and return standardized error response
 * @param {Error|AppError} error - Error object
 * @param {string} context - Context where error occurred
 * @returns {Object} Standardized error response
 */
export function handleError(error, context = 'Unknown') {
    logError(error, context);

    if (error instanceof AppError) {
        return {
            success: false,
            error: {
                code: error.code,
                message: getUserFriendlyMessage(error.code, error.details),
                details: error.details
            }
        };
    }

    // Handle standard JavaScript errors
    return {
        success: false,
        error: {
            code: ERROR_CODES.UNKNOWN_ERROR,
            message: getUserFriendlyMessage(ERROR_CODES.UNKNOWN_ERROR),
            details: { originalMessage: error.message }
        }
    };
}

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, context) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            return handleError(error, context);
        }
    };
}

/**
 * Validate and throw error if condition fails
 * @param {boolean} condition - Condition to check
 * @param {string} errorCode - Error code to throw
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @throws {AppError}
 */
export function assert(condition, errorCode, message, details = {}) {
    if (!condition) {
        throw new AppError(errorCode, message, details);
    }
}
