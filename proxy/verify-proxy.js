const fetch = require('node-fetch');

async function testProxy() {
    const url = 'http://localhost:3000/api/query';
    const question = 'Who is virat kohli';

    // Simulate the NEW Concise prompt builder
    const prompt = `
Question: "${question}"

Constraints:
- Provide a direct, short answer (max 2 sentences).
- Reasoning should be 1-2 bullet points.
- STRICT LIMIT: Total output must be under 4 lines.

Answer format:
Answer: [Direct Answer]
Reasoning: [Brief Justification]
`;

    console.log(`Sending query to ${url}...`);
    console.log('--- Prompt ---');
    console.log(prompt);
    console.log('--------------');

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Extension-Key': 'test-user'
            },
            body: JSON.stringify({
                inputs: prompt
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('\n✅ Proxy Response Success!');
            console.log('---------------------------------------------------');
            const output = data.generated_text;
            console.log(output);
            console.log('---------------------------------------------------');
        } else {
            console.error('❌ Proxy Request Failed!');
            console.error('Status:', response.status);
            console.error('Message:', await response.text());
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

testProxy();
