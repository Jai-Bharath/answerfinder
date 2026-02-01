/**
 * @file prompt-builder.js
 * @description Constructs adaptive prompts for LLM based on input type
 * @module lib/ai/prompt-builder
 */

const PROMPT_TEMPLATES = {
    SINGLE_WORD: (text) => `
Define: "${text}"

Constraints:
- Keep it very short (max 2 sentences).

Answer format:
Answer: [Concise Definition]
Reasoning: [Brief Context]
`,

    PHRASE: (text) => `
Explain: "${text}"

Constraints:
- Max 3 lines total.
- Be direct.

Answer format:
Answer: [Concise Explanation]
Reasoning: [Key Characteristics]
`,

    QUESTION: (text) => `
Question: "${text}"

Constraints:
- Provide a direct, short answer (max 2 sentences).
- Reasoning should be 1-2 bullet points.
- STRICT LIMIT: Total output must be under 4 lines.

Answer format:
Answer: [Direct Answer]
Reasoning: [Brief Justification]
`,

    MCQ: (text) => `
Question: ${text}

Task: Pick the correct option.

Constraints:
- Answer must be just the option.
- Reasoning must be very brief.

Answer format:
Answer: [Correct Option]
Reasoning: [Why it's correct]
`,

    DEFAULT: (text) => `
Input: "${text}"

Constraints:
- strict limit: 4 lines max.
- Be direct and concise.

Answer format:
Answer: [Concise Answer]
Reasoning: [Brief Context]
`
};

/**
 * Classify the type of text selection
 * @param {string} text - User selected text
 * @returns {string} One of: 'SINGLE_WORD', 'MCQ', 'QUESTION', 'PHRASE', 'DEFAULT'
 */
export function classifySelection(text) {
    if (!text) return 'DEFAULT';

    const normalized = text.trim();
    const words = normalized.split(/\s+/);

    // Single word
    if (words.length === 1) {
        return 'SINGLE_WORD';
    }

    // MCQ detection (A) Option ... B) Option ...)
    if (/\b[A-Da-d]\)[^A-Da-d]*\b[A-Da-d]\)/.test(normalized) ||
        /\b[A-Da-d]\.[^A-Da-d]*\b[A-Da-d]\./.test(normalized)) {
        return 'MCQ';
    }

    // Question detection (starts with wh-word or ends with ?)
    if (/^[Ww]hat|[Ww]ho|[Ww]here|[Ww]hen|[Ww]hy|[Hh]ow|[Ww]hich|[Ii]s|[Aa]re|[Dd]o|[Dd]oes|[Cc]an/.test(normalized) ||
        normalized.endsWith('?')) {
        return 'QUESTION';
    }

    // Short phrase
    if (words.length <= 5) {
        return 'PHRASE';
    }

    return 'DEFAULT';
}

/**
 * Build the prompt for the AI
 * @param {string} text - User selection
 * @returns {string} Formatted prompt
 */
export function buildPrompt(text) {
    const type = classifySelection(text);
    const template = PROMPT_TEMPLATES[type] || PROMPT_TEMPLATES.DEFAULT;
    return template(text);
}

/**
 * Parse the AI response into structured data
 * @param {string} rawResponse - Text response from AI
 * @returns {Object} { answer, reasoning }
 */
export function parseAIResponse(rawResponse) {
    if (!rawResponse) return { answer: '', reasoning: '' };

    // Try to match "Answer: ... Reasoning: ..." pattern (GPT usually follows this well)
    const answerMatch = rawResponse.match(/Answer:\s*([\s\S]+?)(?=\n?Reasoning:|$)/i);
    const reasoningMatch = rawResponse.match(/Reasoning:\s*([\s\S]+)/i);

    if (answerMatch) {
        return {
            answer: answerMatch[1].trim(),
            reasoning: reasoningMatch ? reasoningMatch[1].trim() : ''
        };
    }

    // Fallback: If OpenAI returns just text without labels
    return {
        answer: rawResponse.trim(),
        reasoning: ''
    };
}
