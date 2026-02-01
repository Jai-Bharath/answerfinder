/**
 * @file validation.js
 * @description File validation utilities
 * @module lib/parsers/validation
 * @requires lib/utils/error-handler
 * @requires lib/utils/constants
 */

import { AppError } from '../utils/error-handler.js';
import { ERROR_CODES, PARSER_CONFIG } from '../utils/constants.js';

/**
 * Validate file size
 * @param {File|number} file - File object or size in bytes
 * @param {number} maxSize - Maximum size in bytes
 * @throws {AppError} If file is too large
 */
export function validateFileSize(file, maxSize = PARSER_CONFIG.MAX_FILE_SIZE) {
    const size = typeof file === 'number' ? file : file.size;

    if (size > maxSize) {
        throw new AppError(
            ERROR_CODES.FILE_TOO_LARGE,
            'File is too large',
            {
                size: (size / (1024 * 1024)).toFixed(2),
                maxSize: (maxSize / (1024 * 1024)).toFixed(2)
            }
        );
    }
}

/**
 * Validate UTF-8 encoding
 * @param {string} content - File content
 * @returns {boolean} True if valid UTF-8
 */
export function validateEncoding(content) {
    try {
        // Try to encode and decode
        const encoder = new TextEncoder();
        const decoder = new TextDecoder('utf-8', { fatal: true });
        const encoded = encoder.encode(content);
        decoder.decode(encoded);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Remove BOM (Byte Order Mark) if present
 * @param {string} content - File content
 * @returns {string} Content without BOM
 */
export function removeBOM(content) {
    if (content.charCodeAt(0) === 0xFEFF) {
        return content.slice(1);
    }
    return content;
}

/**
 * Detect line ending type
 * @param {string} content - File content
 * @returns {string} Line ending type ('\r\n', '\n', or '\r')
 */
export function detectLineEnding(content) {
    if (content.includes('\r\n')) return '\r\n';
    if (content.includes('\n')) return '\n';
    if (content.includes('\r')) return '\r';
    return '\n'; // default
}

/**
 * Normalize line endings to \n
 * @param {string} content - File content
 * @returns {string} Content with normalized line endings
 */
export function normalizeLineEndings(content) {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}
