require('dotenv').config();
const fetch = require('node-fetch');

const HF_API_KEY = process.env.HF_API_KEY;
const HF_API_URL = 'https://router.huggingface.co/models/google/flan-t5-xl';

async function testKey() {
    if (!HF_API_KEY) {
        console.error('❌ Error: HF_API_KEY is missing in .env file');
        return;
    }

    console.log('Testing API Key with model:', HF_API_URL);

    try {
        const response = await fetch(HF_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: 'What is the capital of France?'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success! API Key is valid.');
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            console.error('❌ API Request Failed!');
            console.error('Status:', response.status);
            console.error('Message:', await response.text());
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

testKey();
