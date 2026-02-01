/**
 * @file text-normalizer.js
 * @description Multi-stage text normalization pipeline
 * @module lib/normalization/text-normalizer
 * @requires lib/utils/string-utils
 */

/**
 * Stage 1: Character normalization
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeCharacters(text) {
    // Unicode normalization (NFKC - compatibility composition)
    text = text.normalize('NFKC');

    // Smart quotes to straight quotes
    text = text.replace(/[\u2018\u2019]/g, "'");  // ' '
    text = text.replace(/[\u201C\u201D]/g, '"');  // " "

    // Em/en dashes to hyphens
    text = text.replace(/[\u2013\u2014]/g, '-');  // – —

    // Ellipsis
    text = text.replace(/\u2026/g, '...');  // …

    // Various whitespace to regular space
    text = text.replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, ' ');

    // Remove zero-width characters
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');

    return text;
}

/**
 * Stage 2: Punctuation handling
 * @param {string} text - Text to process
 * @param {Object} options - Normalization options
 * @returns {string} Processed text
 */
function normalizePunctuation(text, options = {}) {
    const { preserveQuestionMarks = false } = options;

    // Remove most punctuation except hyphens in compound words and apostrophes
    // Keep: hyphen (in middle of words), apostrophe (for contractions)
    // Remove: periods, commas, semicolons, colons, exclamation marks, etc.

    // Remove trailing/leading punctuation
    text = text.replace(/^[^\w\s]+|[^\w\s]+$/g, '');

    // Remove periods, commas, semicolons, colons
    text = text.replace(/[.,;:]/g, ' ');

    // Handle question marks
    if (!preserveQuestionMarks) {
        text = text.replace(/[?!]/g, ' ');
    }

    // Remove quotes
    text = text.replace(/["'`]/g, '');

    // Remove parentheses, brackets, braces
    text = text.replace(/[(){}\[\]]/g, ' ');

    // Remove special symbols but preserve @ # $ % for technical terms
    text = text.replace(/[<>|\\\/~^*+=_]/g, ' ');

    // Normalize hyphens: keep only if between word characters
    text = text.replace(/(\s)-+(\s)/g, ' '); // Remove hyphens with spaces
    text = text.replace(/(\s)-+/g, ' '); // Remove leading hyphens
    text = text.replace(/-+(\s)/g, ' '); // Remove trailing hyphens

    return text;
}

/**
 * Stage 3: Text transformation
 * @param {string} text - Text to transform
 * @param {Object} options - Transformation options
 * @returns {string} Transformed text
 */
function transformText(text, options = {}) {
    const {
        lowercase = true,
        expandContractions = true,
        normalizeNumbers = false
    } = options;

    // Expand common contractions
    if (expandContractions) {
        const contractions = {
            "don't": "do not",
            "doesn't": "does not",
            "didn't": "did not",
            "won't": "will not",
            "wouldn't": "would not",
            "can't": "cannot",
            "couldn't": "could not",
            "shouldn't": "should not",
            "isn't": "is not",
            "aren't": "are not",
            "wasn't": "was not",
            "weren't": "were not",
            "haven't": "have not",
            "hasn't": "has not",
            "hadn't": "had not",
            "i'm": "i am",
            "you're": "you are",
            "he's": "he is",
            "she's": "she is",
            "it's": "it is",
            "we're": "we are",
            "they're": "they are",
            "i've": "i have",
            "you've": "you have",
            "we've": "we have",
            "they've": "they have",
            "i'll": "i will",
            "you'll": "you will",
            "he'll": "he will",
            "she'll": "she will",
            "we'll": "we will",
            "they'll": "they will",
            "i'd": "i would",
            "you'd": "you would",
            "he'd": "he would",
            "she'd": "she would",
            "we'd": "we would",
            "they'd": "they would"
        };

        // Case-insensitive replacement
        Object.entries(contractions).forEach(([contraction, expansion]) => {
            const regex = new RegExp('\\b' + contraction + '\\b', 'gi');
            text = text.replace(regex, expansion);
        });
    }

    // Normalize numbers (optional - may lose precision)
    if (normalizeNumbers) {
        const numberWords = {
            'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
            'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
            'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
            'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
            'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
            'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
            'eighty': '80', 'ninety': '90', 'hundred': '100', 'thousand': '1000'
        };

        Object.entries(numberWords).forEach(([word, digit]) => {
            const regex = new RegExp('\\b' + word + '\\b', 'gi');
            text = text.replace(regex, digit);
        });
    }

    // Lowercase
    if (lowercase) {
        text = text.toLowerCase();
    }

    return text;
}

/**
 * Stage 4: Structural normalization
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeStructure(text) {
    // Collapse multiple whitespace to single space
    text = text.replace(/\s+/g, ' ');

    // Trim leading and trailing whitespace
    text = text.trim();

    return text;
}

/**
 * Complete normalization pipeline
 * @param {string} text - Text to normalize
 * @param {Object} options - Normalization options
 * @param {boolean} options.lowercase - Convert to lowercase (default: true)
 * @param {boolean} options.expandContractions - Expand contractions (default: true)
 * @param {boolean} options.normalizeNumbers - Convert number words to digits (default: false)
 * @param {boolean} options.preserveQuestionMarks - Keep question marks (default: false)
 * @returns {string} Fully normalized text
 */
export function normalize(text, options = {}) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    // Stage 1: Character normalization
    text = normalizeCharacters(text);

    // Stage 2: Punctuation handling
    text = normalizePunctuation(text, options);

    // Stage 3: Text transformation
    text = transformText(text, options);

    // Stage 4: Structural normalization
    text = normalizeStructure(text);

    return text;
}

/**
 * Normalize for exact matching (aggressive)
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeForMatching(text) {
    return normalize(text, {
        lowercase: true,
        expandContractions: true,
        normalizeNumbers: false, // Keep numbers as-is for precision
        preserveQuestionMarks: false
    });
}

/**
 * Normalize for keyword extraction (preserve more structure)
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export function normalizeForKeywords(text) {
    return normalize(text, {
        lowercase: true,
        expandContractions: false, // Keep contractions for keyword extraction
        normalizeNumbers: false,
        preserveQuestionMarks: false
    });
}
