const fetch = require('node-fetch');

const URL = 'http://localhost:3000/api/query';

async function testPrompt(name, inputs) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`Input: "${inputs.replace(/\n/g, '\\n')}"`);

    try {
        const response = await fetch(URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Extension-Key': 'test' },
            body: JSON.stringify({ inputs, parameters: { max_new_tokens: 60, do_sample: false } })
        });
        const data = await response.json();
        const out = Array.isArray(data) ? (data[0].summary_text || data[0].generated_text) : data.generated_text;
        console.log(`Output: "${out}"`);
    } catch (e) { console.error(e.message); }
}

async function run() {
    // Few-Shot Prompting
    const prompt = `Question: What is the capital of France?
Answer: The capital of France is Paris.

Question: Who wrote Romeo and Juliet?
Answer: William Shakespeare wrote the play.

Question: What is the color of an apple?
Answer:`;

    await testPrompt('Few-Shot', prompt);
}
run();
