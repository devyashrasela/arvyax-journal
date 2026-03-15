const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Pause execution for a specified duration.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Uses Groq (Llama 3.3 70B) to analyze the emotional content of journal text.
 * Automatically retries up to 3 times if the API rate-limits us.
 * Returns an object with emotion, keywords, and summary.
 */
async function analyzeEmotion(text, retries = 3) {
  const prompt = `You are an emotional intelligence analyst for a nature-therapy journaling app.

Analyze the following journal entry and return ONLY a valid JSON object (no markdown, no code fences) with exactly these keys:

- "emotion": a single dominant emotion word (e.g. "calm", "anxious", "joyful", "sad", "grateful", "peaceful", "energized", "reflective")
- "keywords": an array of 3-5 relevant keywords extracted from the text
- "summary": a one-sentence summary of the user's mental state during this session (max 30 words)

Journal entry:
"${text.replace(/"/g, '\\"')}"

Respond with ONLY the JSON object, nothing else.`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: "json_object" },
      });

      const response = chatCompletion.choices[0]?.message?.content?.trim() || "{}";

      // Strip markdown code fences if the model wraps the output
      let cleaned = response;
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }

      try {
        const parsed = JSON.parse(cleaned);
        return {
          emotion: parsed.emotion || "unknown",
          keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
          summary: parsed.summary || "",
        };
      } catch {
        return {
          emotion: "unknown",
          keywords: [],
          summary: response.slice(0, 200),
        };
      }
    } catch (err) {
      const isRateLimit = err.status === 429 || (err.message && err.message.includes("429"));

      if (isRateLimit && attempt < retries) {
        const waitMs = attempt * 10000;
        console.log(`Rate limited by Groq. Waiting ${(waitMs / 1000).toFixed(0)}s before retry (attempt ${attempt}/${retries})...`);
        await sleep(waitMs);
        continue;
      }

      throw err;
    }
  }
}

module.exports = { analyzeEmotion };
