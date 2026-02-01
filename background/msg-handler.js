/**
 * @file message-handler.js
 * @description Message routing and handling
 * @module background/message-handler
 * @requires background/state-manager
 * @requires lib/matching/matching-engine
 * @requires lib/parsers/txt-parser
 * @requires lib/utils/constants
 * @requires lib/utils/error-handler
 */

import { stateManager } from './state-manager.js';
import { matchingEngine } from '../lib/matching/matching-engine.js';
import { txtParser } from '../lib/parsers/txt-parser.js';
import { jsonParser } from '../lib/parsers/json-parser.js';
import { MESSAGE_TYPES } from '../lib/utils/constants.js';
import { handleError } from '../lib/utils/error-handler.js';

/**
 * Handle incoming messages
 * @param {Object} message - Message object
 * @param {Object} sender - Sender information
 * @param {Function} sendResponse - Response callback
 * @returns {boolean} True if async response
 */
export function handleMessage(message, sender, sendResponse) {
    const { type, payload, requestId } = message;

    console.log(`[MessageHandler] Received message: ${type}`, payload);

    // Route to appropriate handler
    switch (type) {
        case MESSAGE_TYPES.QUERY_ANSWER:
            handleQueryAnswer(payload, requestId).then(sendResponse);
            return true; // Async response

        case MESSAGE_TYPES.UPLOAD_FILE:
            handleUploadFile(payload, requestId).then(sendResponse);
            return true; // Async response

        case MESSAGE_TYPES.GET_STATS:
            handleGetStats(requestId).then(sendResponse);
            return true; // Async response

        case MESSAGE_TYPES.GET_SETTINGS:
            handleGetSettings(requestId).then(sendResponse);
            return true; // Async response

        case MESSAGE_TYPES.UPDATE_SETTINGS:
            handleUpdateSettings(payload, requestId).then(sendResponse);
            return true; // Async response

        case MESSAGE_TYPES.CLEAR_DATA:
            handleClearData(requestId).then(sendResponse);
            return true; // Async response

        case MESSAGE_TYPES.EXPORT_DATA:
            handleExportData(requestId).then(sendResponse);
            return true; // Async response

        default:
            sendResponse({
                type: MESSAGE_TYPES.ERROR,
                error: { message: `Unknown message type: ${type}` },
                requestId
            });
            return false;
    }
}

/**
 * Handle query answer request
 * @param {Object} payload - Query payload
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Response
 */
async function handleQueryAnswer(payload, requestId) {
    console.log('[MessageHandler] handleQueryAnswer started', { requestId, query: payload.query });
    try {
        const { query, settings } = payload;
        const result = await matchingEngine.findAnswer(query, settings);

        console.log('[MessageHandler] Got result from matching engine', { success: result.success });

        return {
            type: MESSAGE_TYPES.RESPONSE,
            payload: result,
            requestId
        };
    } catch (error) {
        console.error('[MessageHandler] handleQueryAnswer error', error);
        return {
            type: MESSAGE_TYPES.ERROR,
            error: handleError(error, 'handleQueryAnswer'),
            requestId
        };
    }
}

/**
 * Handle file upload request
 * @param {Object} payload - Upload payload
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Response
 */
async function handleUploadFile(payload, requestId) {
    try {
        const { fileContent, fileName } = payload;

        let parser;
        if (fileName.toLowerCase().endsWith('.json')) {
            parser = jsonParser;
        } else {
            parser = txtParser;
        }

        // Parse content
        const { questions, metadata, errors } = await parser.parse(fileContent, fileName);

        // Clear existing data
        await stateManager.getDBManager().clearAllQuestions();

        // Add questions to database
        const addResult = await stateManager.getDBManager().addQuestions(questions);

        // Update metadata
        await stateManager.getDBManager().updateMetadata('import_info', {
            fileName,
            timestamp: Date.now(),
            totalQuestions: questions.length,
            errors: errors
        });

        // Clear cache (new data loaded)
        stateManager.getCache().clear();

        const response = {
            type: MESSAGE_TYPES.RESPONSE,
            payload: {
                success: true,
                totalQuestions: addResult.count,
                errors: errors,
                metadata: metadata
            },
            requestId
        };

        // Persist result for popup persistence (fix for popup closing)
        await chrome.storage.local.set({
            uploadResult: {
                success: true,
                message: `Successfully loaded ${addResult.count} questions!`,
                timestamp: Date.now()
            }
        });

        return response;
    } catch (error) {
        return {
            type: MESSAGE_TYPES.ERROR,
            error: handleError(error, 'handleUploadFile'),
            requestId
        };
    }
}

/**
 * Handle get stats request
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Response
 */
async function handleGetStats(requestId) {
    try {
        const stats = await stateManager.getDBManager().getStats();
        const cacheStats = stateManager.getCache().getStats();

        return {
            type: MESSAGE_TYPES.RESPONSE,
            payload: {
                ...stats,
                cache: cacheStats
            },
            requestId
        };
    } catch (error) {
        return {
            type: MESSAGE_TYPES.ERROR,
            error: handleError(error, 'handleGetStats'),
            requestId
        };
    }
}

/**
 * Handle get settings request
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Response
 */
async function handleGetSettings(requestId) {
    try {
        const settings = stateManager.getSettings();

        return {
            type: MESSAGE_TYPES.RESPONSE,
            payload: settings,
            requestId
        };
    } catch (error) {
        return {
            type: MESSAGE_TYPES.ERROR,
            error: handleError(error, 'handleGetSettings'),
            requestId
        };
    }
}

/**
 * Handle update settings request
 * @param {Object} payload - Settings payload
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Response
 */
async function handleUpdateSettings(payload, requestId) {
    try {
        await stateManager.updateSettings(payload);

        return {
            type: MESSAGE_TYPES.RESPONSE,
            payload: { success: true },
            requestId
        };
    } catch (error) {
        return {
            type: MESSAGE_TYPES.ERROR,
            error: handleError(error, 'handleUpdateSettings'),
            requestId
        };
    }
}

/**
 * Handle clear data request
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Response
 */
async function handleClearData(requestId) {
    try {
        await stateManager.clearAll();

        return {
            type: MESSAGE_TYPES.RESPONSE,
            payload: { success: true },
            requestId
        };
    } catch (error) {
        return {
            type: MESSAGE_TYPES.ERROR,
            error: handleError(error, 'handleClearData'),
            requestId
        };
    }
}

/**
 * Handle export data request
 * @param {string} requestId - Request ID
 * @returns {Promise<Object>} Response
 */
async function handleExportData(requestId) {
    try {
        const data = await stateManager.getDBManager().exportData();

        return {
            type: MESSAGE_TYPES.RESPONSE,
            payload: data,
            requestId
        };
    } catch (error) {
        return {
            type: MESSAGE_TYPES.ERROR,
            error: handleError(error, 'handleExportData'),
            requestId
        };
    }
}
