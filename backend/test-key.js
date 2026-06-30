require('dotenv').config();
const Groq = require('groq-sdk');

async function test() {
    const key = process.env.GROQ_API_KEY;
    console.log('Groq key loaded:', key ? `${key.substring(0, 10)}...` : 'MISSING');
    
    const groq = new Groq({ apiKey: key });
    try {
        const result = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say hello in exactly 3 words' }],
            max_tokens: 20,
        });
        console.log('✅ SUCCESS:', result.choices[0].message.content);
    } catch (err) {
        console.log('❌ FAILED:', err.message);
    }
}
test();
