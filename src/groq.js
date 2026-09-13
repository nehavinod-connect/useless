import Groq from "groq-sdk";

const client = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const MODEL = "openai/gpt-oss-120b";

/**
 * Given a situation and a spiral tier, returns 2–3 lines of overthinking text.
 * @param {string} situation  - What the user typed
 * @param {"mild"|"main"|"unhinged"|"conspiracy"} tier - Spiral tier label
 * @returns {Promise<string[]>} Array of overthinking lines
 */
export async function generateOverthinkLines(situation, tier) {
  const tierPrompts = {
    mild: `You are in "mild spiral" mode. Write 2 SHORT, funny observations about the situation that are mildly overthought but still somewhat rational. Start with some reassurance but then add a tiny doubt. Keep each line under 100 words. Tone: lightly anxious, self-aware humor.`,
    main: `You are in "main character spiral" mode. Write 3 SHORT overthought lines about the situation. Start finding hidden meaning in small details, question everything, and suggest doing some amateur detective work (like reading old messages for tone shifts). Tone: dramatic, slightly unhinged, Gen-Z energy.`,
    unhinged: `You are in "unhinged tier" mode. Write 3 SHORT completely chaotic, catastrophizing lines about the situation. Assume the absolute worst, suggest extreme reactions, make it feel like a movie plot. Tone: fully unhinged, dramatic, funny.`,
    conspiracy: `You are in "conspiracy tier" mode. Write 3 SHORT lines connecting the situation to a massive conspiracy involving multiple people and cosmic forces. Reference corkboards, timelines, Mercury in retrograde. Everyone is in on it. Tone: unhinged conspiracy theorist, darkly comic.`,
  };

  const systemPrompt = `You are the Overthink-o-Meter, a satirical AI that helps people catastrophically overthink normal situations. You are funny, dramatic, and deeply relatable to anxious overthinkers. IMPORTANT: Return ONLY a JSON array of strings (2-3 items). Each string is one overthinking thought. No markdown, no explanation, just the JSON array. Example: ["thought 1", "thought 2", "thought 3"]`;

  const userPrompt = `Situation: "${situation}"\n\n${tierPrompts[tier]}`;

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.9,
    max_tokens: 600,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "[]";

  // Parse the JSON array from the response
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Fallback: split by newlines if model didn't return valid JSON
    return raw
      .split("\n")
      .map((l) => l.replace(/^[\d\.\-\*"]+\s?/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
  }

  return [raw];
}
