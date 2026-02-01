/**
 * @file json-parser.js
 * @description JSON Q&A file parser
 * @module lib/parsers/json-parser
 * @requires lib/parsers/parser-interface
 * @requires lib/normalization/text-normalizer
 * @requires lib/normalization/keyword-extractor
 * @requires lib/normalization/question-classifier
 * @requires lib/utils/hash
 * @requires lib/utils/error-handler
 * @requires lib/utils/constants
 */

import { Parser } from './parser-interface.js';
import { normalizeForMatching } from '../normalization/text-normalizer.js';
import { extractKeywords } from '../normalization/keyword-extractor.js';
import { classifyQuestion } from '../normalization/question-classifier.js';
import { generateQuestionId } from '../utils/hash.js';
import { AppError } from '../utils/error-handler.js';
import { ERROR_CODES, PARSER_CONFIG } from '../utils/constants.js';

/**
 * JSON parser for Q&A files
 * Format: Array of objects [{question: "...", answer: "..."}]
 */
export class JsonParser extends Parser {
    /**
     * Parse JSON file content
     * @param {string} fileContent - Raw file content
     * @param {string} fileName - Source file name
     * @returns {Promise<{questions: Array, metadata: Object, errors: Array}>} Parse result
     */
    async parse(fileContent, fileName) {
        const errors = [];
        const questions = [];
        let rawData;

        try {
            rawData = JSON.parse(fileContent);
        } catch (error) {
            throw new AppError(
                ERROR_CODES.FILE_INVALID_FORMAT,
                'Invalid JSON format',
                { originalError: error.message }
            );
        }

        if (!Array.isArray(rawData)) {
            throw new AppError(
                ERROR_CODES.FILE_INVALID_FORMAT,
                'JSON root must be an array of objects'
            );
        }

        try {
            // Process each item
            for (let i = 0; i < rawData.length; i++) {
                const item = rawData[i];
                const lineNumber = i + 1; // logical index

                // Validate item
                if (!item.question || typeof item.question !== 'string' || !item.answer || typeof item.answer !== 'string') {
                    errors.push({
                        line: lineNumber,
                        type: 'invalid_item',
                        message: 'Item missing required "question" or "answer" string fields',
                        question: item.question ? item.question.toString().substring(0, 50) : 'unknown'
                    });
                    continue;
                }

                // Clean content
                const questionText = item.question.trim();
                const answerText = item.answer.trim();

                if (!questionText || !answerText) {
                    continue; // Skip empty
                }

                try {
                    const questionObj = await this.buildQuestionObject(
                        questionText,
                        answerText,
                        lineNumber,
                        fileName
                    );
                    questions.push(questionObj);
                } catch (error) {
                    errors.push({
                        line: lineNumber,
                        type: 'parse_error',
                        message: error.message,
                        question: questionText.substring(0, 100)
                    });
                }
            }

            // Generate metadata
            const metadata = {
                fileName,
                totalQuestions: questions.length,
                totalErrors: errors.length,
                timestamp: Date.now(),
                fileSize: fileContent.length,
                format: 'json'
            };

            return { questions, metadata, errors };

        } catch (error) {
            throw new AppError(
                ERROR_CODES.UNKNOWN_ERROR,
                'Failed to process JSON content',
                { originalError: error.message }
            );
        }
    }

    /**
     * Build structured question object (reused logic)
     * @param {string} question - Question text
     * @param {string} answer - Answer text
     * @param {number} lineNumber - Line number
     * @param {string} fileName - Source file name
     * @returns {Promise<Object>} Structured question object
     */
    async buildQuestionObject(question, answer, lineNumber, fileName) {
        // Reuse the logic from TXT parser concepts or duplicate minimal logic here
        // Ideally checking against the same strict rules

        const normalizedQuestion = normalizeForMatching(question);
        const keywords = extractKeywords(question);
        const { type: questionType, confidence: questionTypeConfidence } = classifyQuestion(question);
        const id = await generateQuestionId(normalizedQuestion, lineNumber, fileName);

        const hasNumbers = /\d/.test(question);
        const hasDates = /\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/i.test(question);

        return {
            id,
            original: {
                question,
                answer,
                lineNumber,
                fileName
            },
            processed: {
                normalizedQuestion,
                keywords,
                questionType,
                questionTypeConfidence,
                characterCount: question.length,
                wordCount: question.split(/\s+/).length,
                hasNumbers,
                hasDates
            },
            metadata: {
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
        };
    }

    /**
     * Validate file format
     * @param {string} fileContent - Raw file content
     * @returns {Promise<{valid: boolean, errors: Array}>} Validation result
     */
    async validate(fileContent) {
        try {
            const rawData = JSON.parse(fileContent);
            if (!Array.isArray(rawData)) {
                return {
                    valid: false,
                    errors: [{
                        line: 0,
                        type: 'validation_error',
                        message: 'JSON root must be an array of objects'
                    }]
                };
            }
            return { valid: true, errors: [] };
        } catch (error) {
            return {
                valid: false,
                errors: [{
                    line: 0,
                    type: 'validation_error',
                    message: 'Invalid JSON syntax: ' + error.message
                }]
            };
        }
    }

    /**
     * Get supported file extensions
     * @returns {string[]} Array of extensions
     */
    getSupportedExtensions() {
        return ['json'];
    }
}

// Export singleton instance
export const jsonParser = new JsonParser();
