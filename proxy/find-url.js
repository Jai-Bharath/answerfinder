const fetch = require('node-fetch');
require('dotenv').config();

const key = process.env.HF_API_KEY;
const models = [
    'bigscience/bloom-560m',
    'openai-community/gpt2-medium',
    'openai-community/gpt2-large',
    'facebook/bart-large-cnn' // Fallback
];
const bases = [
    'https://router.huggingface.co/hf-inference/models/'
];

async function check() {
    console.log('Checking with key:', key ? 'Present' : 'Missing');
    for (const base of bases) {
        for (const model of models) {
            const url = base + model;
            console.log('Testing:', url);
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${key}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ inputs: 'Hello world' })
                });
                console.log(`Status: ${res.status}`);
                if (res.ok) {
                    console.log('FOUND WORKING URL:', url);
                    return;
                }
                const txt = await res.text();
            } catch (e) {
                console.log('Network error', e.message);
            }
        }
    }
}
check();
