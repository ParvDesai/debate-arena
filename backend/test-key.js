require('dotenv').config();
const Groq = require('groq-sdk');

async function test() {
    const key = process.env.GROQ_API_KEY;
    console.log('Groq key loaded:', key ? `${key.substring(0, 10)}...` : 'MISSING');
    
    const groq = new Groq({ apiKey: key });
    const prompt = `You are a skilled debater. You are debating AGAINST the topic: "Social media is beneficial".

Here are the arguments so far:
Turn 1 (for): Social media connects people all over the world.

Write a compelling counter-argument for the AGAINST side. Be persuasive, use evidence and logical reasoning. Keep it under 200 words. Respond with ONLY the argument text, no labels or prefixes.`;

    try {
        const result = await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [{ role: 'user', content: 'Say hello in exactly 3 words' }],
            max_tokens: 20,
        });
        console.log('✅ SUCCESS:', result.choices[0].message.content);
    } catch (err) {
        console.log('❌ FAILED:', err.message);
    }
}
test();
