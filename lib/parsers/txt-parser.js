/**
 * @file txt-parser.js
 * @description Plain text Q&A file parser
 * @module lib/parsers/txt-parser
 * @requires lib/parsers/parser-interface
 * @requires lib/parsers/validation
 * @requires lib/normalization/text-normalizer
 * @requires lib/normalization/keyword-extractor
 * @requires lib/normalization/question-classifier
 * @requires lib/utils/hash
 * @requires lib/utils/error-handler
 * @requires lib/utils/constants
 */

import { Parser } from './parser-interface.js';
import { validateEncoding, removeBOM, normalizeLineEndings } from './validation.js';
import { normalizeForMatching } from '../normalization/text-normalizer.js';
import { extractKeywords } from '../normalization/keyword-extractor.js';
import { classifyQuestion } from '../normalization/question-classifier.js';
import { generateQuestionId } from '../utils/hash.js';
import { AppError } from '../utils/error-handler.js';
import { ERROR_CODES, PARSER_CONFIG } from '../utils/constants.js';

/**
 * Plain text parser for Q&A files
 * Format: Question\nAnswer\n\nQuestion\nAnswer\n\n...
 */
export class TxtParser extends Parser {
    /**
     * Parse TXT file content
     * @param {string} fileContent - Raw file content
     * @param {string} fileName - Source file name
     * @returns {Promise<{questions: Array, metadata: Object, errors: Array}>} Parse result
     */
    async parse(fileContent, fileName) {
        const errors = [];
        const questions = [];

        try {
            // Stage 1: Validation and preprocessing
            const preprocessed = this.preprocess(fileContent);

            // Stage 2: Split into lines
            const lines = preprocessed.split('\n');

            // Stage 3: Validate structure
            const structureValidation = this.validateStructure(lines);
            if (!structureValidation.valid) {
                errors.push(...structureValidation.errors);
            }

            // Stage 4: Parse question-answer pairs
            const pairs = this.extractQuestionAnswerPairs(lines);

            // Stage 5: Build structured objects
            for (const pair of pairs) {
                try {
                    const questionObj = await this.buildQuestionObject(
                        pair.question,
                        pair.answer,
                        pair.lineNumber,
                        fileName
                    );
                    questions.push(questionObj);
                } catch (error) {
                    errors.push({
                        line: pair.lineNumber,
                        type: 'parse_error',
                        message: error.message,
                        question: pair.question.substring(0, 100)
                    });
                }
            }

            // Stage 6: Generate metadata
            const metadata = {
                fileName,
                totalQuestions: questions.length,
                totalErrors: errors.length,
                timestamp: Date.now(),
                fileSize: fileContent.length
            };

            return { questions, metadata, errors };

        } catch (error) {
            throw new AppError(
                ERROR_CODES.FILE_INVALID_FORMAT,
                'Failed to parse file',
                { originalError: error.message }
            );
        }
    }

    /**
     * Preprocess file content
     * @param {string} content - Raw content
     * @returns {string} Preprocessed content
     */
    preprocess(content) {
        // Remove BOM
        content = removeBOM(content);

        // Validate encoding
        if (!validateEncoding(content)) {
            throw new AppError(
                ERROR_CODES.FILE_ENCODING_ERROR,
                'Invalid file encoding. Please use UTF-8.'
            );
        }

        // Normalize line endings
        content = normalizeLineEndings(content);

        return content;
    }

    /**
     * Validate file structure
     * @param {string[]} lines - Array of lines
     * @returns {{valid: boolean, errors: Array}} Validation result
     */
    validateStructure(lines) {
        const errors = [];

        // Check if file is empty
        if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
            errors.push({
                line: 0,
                type: 'empty_file',
                message: 'File is empty'
            });
            return { valid: false, errors };
        }

        // Check if line count makes sense (should be multiple of 3: Q, A, blank)
        // But be tolerant of missing final blank line
        const nonEmptyLines = lines.filter(line => line.trim() !== '').length;
        if (nonEmptyLines % 2 !== 0) {
            errors.push({
                line: 0,
                type: 'structure_warning',
                message: `File has ${nonEmptyLines} non-empty lines. Expected pairs of questions and answers.`
            });
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Extract question-answer pairs from lines
     * @param {string[]} lines - Array of lines
     * @returns {Array<{question: string, answer: string, lineNumber: number}>} Pairs
     */
    extractQuestionAnswerPairs(lines) {
        const pairs = [];
        let i = 0;

        while (i < lines.length) {
            // Skip empty lines
            while (i < lines.length && lines[i].trim() === '') {
                i++;
            }

            if (i >= lines.length) break;

            // Get question (current line)
            const questionLine = i + 1; // 1-indexed for user display
            const question = lines[i].trim();
            i++;

            // Skip empty lines between question and answer (tolerant parsing)
            while (i < lines.length && lines[i].trim() === '') {
                i++;
            }

            if (i >= lines.length) {
                // Question without answer
                console.warn(`Question at line ${questionLine} has no answer`);
                break;
            }

            // Get answer (current line)
            const answer = lines[i].trim();
            i++;

            // Validate pair
            if (question.length === 0) {
                console.warn(`Empty question at line ${questionLine}`);
                continue;
            }

            if (answer.length === 0) {
                console.warn(`Empty answer for question at line ${questionLine}`);
                continue;
            }

            // Check length constraints
            if (question.length < PARSER_CONFIG.MIN_QUESTION_LENGTH) {
                console.warn(`Question at line ${questionLine} is too short (${question.length} chars)`);
                continue;
            }

            if (question.length > PARSER_CONFIG.MAX_QUESTION_LENGTH) {
                console.warn(`Question at line ${questionLine} is too long (${question.length} chars), truncating`);
            }

            if (answer.length > PARSER_CONFIG.MAX_ANSWER_LENGTH) {
                console.warn(`Answer at line ${questionLine} is too long (${answer.length} chars), truncating`);
            }

            pairs.push({
                question: question.substring(0, PARSER_CONFIG.MAX_QUESTION_LENGTH),
                answer: answer.substring(0, PARSER_CONFIG.MAX_ANSWER_LENGTH),
                lineNumber: questionLine
            });
        }

        return pairs;
    }

    /**
     * Build structured question object
     * @param {string} question - Question text
     * @param {string} answer - Answer text
     * @param {number} lineNumber - Line number in file
     * @param {string} fileName - Source file name
     * @returns {Promise<Object>} Structured question object
     */
    async buildQuestionObject(question, answer, lineNumber, fileName) {
        // Normalize question for matching
        const normalizedQuestion = normalizeForMatching(question);

        // Extract keywords
        const keywords = extractKeywords(question);

        // Classify question type
        const { type: questionType, confidence: questionTypeConfidence } = classifyQuestion(question);

        // Generate unique ID
        const id = await generateQuestionId(normalizedQuestion, lineNumber, fileName);

        // Detect features
        const hasNumbers = /\d/.test(question);
        const hasDates = /\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/i.test(question);

        // Build object
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
            const preprocessed = this.preprocess(fileContent);
            const lines = preprocessed.split('\n');
            return this.validateStructure(lines);
        } catch (error) {
            return {
                valid: false,
                errors: [{
                    line: 0,
                    type: 'validation_error',
                    message: error.message
                }]
            };
        }
    }

    /**
     * Get supported file extensions
     * @returns {string[]} Array of extensions
     */
    getSupportedExtensions() {
        return ['txt'];
    }
}

// Export singleton instance
export const txtParser = new TxtParser();
