/**
 * @file parser-interface.js
 * @description Abstract parser interface for all file formats
 * @module lib/parsers/parser-interface
 */

/**
 * Abstract Parser class
 * All parsers should extend this class
 */
export class Parser {
    /**
     * Parse file content
     * @param {string} fileContent - Raw file content
     * @param {string} fileName - Source file name
     * @returns {Promise<{questions: Array, metadata: Object, errors: Array}>} Parse result
     * @abstract
     */
    async parse(fileContent, fileName) {
        throw new Error('Parser.parse() must be implemented by subclass');
    }

    /**
     * Validate file format
     * @param {string} fileContent - Raw file content
     * @returns {Promise<{valid: boolean, errors: Array}>} Validation result
     * @abstract
     */
    async validate(fileContent) {
        throw new Error('Parser.validate() must be implemented by subclass');
    }

    /**
     * Get supported file extensions
     * @returns {string[]} Array of extensions (e.g., ['txt', 'csv'])
     * @abstract
     */
    getSupportedExtensions() {
        throw new Error('Parser.getSupportedExtensions() must be implemented by subclass');
    }
}
