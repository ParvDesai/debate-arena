const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

async function scoreArgument(topic, side, text, priorArguments = []) {
    const context = priorArguments.length > 0
        ? `\n\nPrior arguments in this debate:\n${priorArguments.map((a, i) => `Turn ${i + 1} (${a.side}): ${a.text}`).join('\n')}`
        : '';

    const prompt = `You are an expert debate judge. Score the following debate argument on three criteria, each from 0 to 10:
- Coherence: How clear, well-structured, and logically flowing is the argument?
- Evidence: How well does the argument use facts, examples, or data to support its claims?
- Logic: How sound is the reasoning? Are there logical fallacies?

Debate Topic: "${topic}"
Side: ${side === 'for' ? 'FOR (supporting)' : 'AGAINST (opposing)'}
${context}

Argument to score:
"${text}"

Respond ONLY with valid JSON in this exact format, no markdown:
{"coherence": <number>, "evidence": <number>, "logic": <number>, "feedback": "<one sentence of constructive feedback>"}`;

    try {
        const result = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 200,
            response_format: { type: 'json_object' },
        });

        const responseText = result.choices[0]?.message?.content?.trim();
        const parsed = JSON.parse(responseText);

        return {
            coherence: Math.min(10, Math.max(0, Math.round(parsed.coherence))),
            evidence: Math.min(10, Math.max(0, Math.round(parsed.evidence))),
            logic: Math.min(10, Math.max(0, Math.round(parsed.logic))),
            total: Math.min(10, Math.max(0, Math.round(parsed.coherence))) +
                Math.min(10, Math.max(0, Math.round(parsed.evidence))) +
                Math.min(10, Math.max(0, Math.round(parsed.logic))),
            feedback: parsed.feedback || 'No feedback available.'
        };
    } catch (err) {
        console.error('AI scoring error:', err.message);
        return {
            coherence: 5, evidence: 5, logic: 5, total: 15,
            feedback: 'AI scoring temporarily unavailable. Default scores applied.'
        };
    }
}

async function generateCounterArgument(topic, side, priorArguments = []) {
    const aiSide = side === 'for' ? 'AGAINST' : 'FOR';
    const context = priorArguments.map((a, i) => `Turn ${i + 1} (${a.side}): ${a.text}`).join('\n');

    const prompt = `You are a skilled debater. You are debating ${aiSide} the topic: "${topic}".

Here are the arguments so far:
${context}

Write a compelling counter-argument for the ${aiSide} side. Be persuasive, use evidence and logical reasoning. Keep it under 200 words. Respond with ONLY the argument text, no labels or prefixes.`;

    try {
        const result = await groq.chat.completions.create({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 300,
        });

        return result.choices[0]?.message?.content?.trim() || 'The opposing perspective deserves careful consideration.';
    } catch (err) {
        console.error('AI counter-argument error:', err.message);
        return `While the opposing side makes some interesting points, the evidence clearly shows that a more nuanced perspective is needed. The fundamental issue at hand requires careful consideration of multiple factors that have been overlooked in the previous arguments.`;
    }
}

module.exports = { scoreArgument, generateCounterArgument };
