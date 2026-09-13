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

// ─────────────────────────────────────────────────────────────────────────────
// DELUSION METER
// ─────────────────────────────────────────────────────────────────────────────

const DELUSION_LOCAL_FALLBACKS = [
  {
    score: 74,
    level: "Advanced Overthinker",
    analysis:
      "Based on our highly sophisticated algorithm (vibes + intuition + a coin flip), you are indeed overthinking this at a professional level. There is a 74% chance this ends with you reviewing old messages at 2am. There is also a non-zero chance the other person is ALSO overthinking it and you're both spiralling in parallel. Which would honestly be romantic.",
    worstCases: [
      "They've been quietly judging you for months and this confirmed it.",
      "Everyone already knows. They've been discussing it since last Tuesday.",
      "There's a group chat. You're not in it. This is the primary topic.",
      "They accidentally opened your profile 17 times and are mortified.",
      "They are already telling their grandchildren about you.",
    ],
  },
  {
    score: 88,
    level: "CEO OF DELULU INDUSTRIES",
    analysis:
      "Our systems have detected MAXIMUM DELULU activity. The situation you described has approximately zero reasons to spiral — and yet here we are, together, measuring it scientifically. Your ability to find hidden meaning in objectively mundane events is, genuinely, impressive. A gift, even. A cursed one.",
    worstCases: [
      "They're planning an elaborate exit strategy and you're the last to know.",
      "The universe is testing you specifically. You failed. Repeatedly.",
      "Their phone autocorrected something important and you missed the real meaning.",
      "They saw your profile at 3am and are now also lying awake overthinking.",
      "This becomes a cautionary tale they share with their therapist for years.",
    ],
  },
  {
    score: 55,
    level: "Suspiciously Delulu",
    analysis:
      "Somewhere between 'this is fine' and 'I need to build a corkboard', you've landed firmly in Suspiciously Delulu territory. Our instruments detect elevated pattern-recognition activity and a troubling desire to find hidden meanings in things that are probably just... things. Still, your instincts are sometimes right, which is why you can't stop.",
    worstCases: [
      "They mentioned this to exactly one person who told exactly three others.",
      "There's an inside joke now. About you. You don't know it yet.",
      "Someone screenshotted something and you don't know which message.",
      "They've been slightly weird since last Wednesday and you're just noticing.",
      "The read receipt was intentional. All of them. Every single one.",
    ],
  },
];

/**
 * Sends a situation to the Delusion Meter AI and returns a scored analysis.
 * Always returns a valid object — falls back to local data if Groq fails.
 * @param {string} situation  - What the user typed
 * @returns {Promise<{ score: number, level: string, analysis: string, worstCases: string[], isFallback?: boolean }>}
 */
export async function generateDelusionAnalysis(situation) {
  const systemPrompt = `You are the Delusion Meter — a satirical AI that measures how dramatically someone is overthinking a situation. Be funny, exaggerated, and deeply Gen-Z. Your tone is like a dramatic best friend who is also, somehow, a scientist.

Return ONLY valid JSON with EXACTLY this structure (no markdown, no explanation):
{
  "score": <integer 0-100>,
  "level": "<exactly one of: Totally Normal | Minor Delulu | Suspiciously Delulu | Advanced Overthinker | CEO OF DELULU INDUSTRIES>",
  "analysis": "<2-4 funny, slightly unhinged sentences interpreting the situation. Exaggerated humour. Do NOT claim to know the other person's true intentions with certainty. Keep it clearly satirical.>",
  "worstCases": ["<scenario 1>", "<scenario 2>", "<scenario 3>", "<scenario 4>", "<scenario 5>"]
}`;

  const userPrompt = `The user's situation: "${situation}"\n\nMeasure their delusion level. Be dramatically entertaining. Remember: the funnier and more absurd, the better.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.95,
      max_tokens: 700,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";

    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();

    const parsed = JSON.parse(cleaned);

    // Validate the structure
    if (
      typeof parsed.score === "number" &&
      typeof parsed.level === "string" &&
      typeof parsed.analysis === "string" &&
      Array.isArray(parsed.worstCases) &&
      parsed.worstCases.length >= 3
    ) {
      return {
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        level: parsed.level,
        analysis: parsed.analysis,
        worstCases: parsed.worstCases.slice(0, 5),
      };
    }

    throw new Error("Invalid structure");
  } catch {
    // Return a random local fallback — app never crashes during demo
    const fallback = DELUSION_LOCAL_FALLBACKS[
      Math.floor(Math.random() * DELUSION_LOCAL_FALLBACKS.length)
    ];
    return { ...fallback, isFallback: true };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// CONSPIRACY BUILDER
// ─────────────────────────────────────────────────────────────────────────────

const CONSPIRACY_FALLBACKS = [
  "According to an ancient village proverb, this means the sender is consulting the council to plan your downfall.",
  "Grandma says if someone does this, they are collecting evidence for the secret society.",
  "The stars indicate your situation has entered a diplomatic negotiation with the shadow government.",
  "Local gossip suggests they started a reply, deleted it, and began a new life under a false identity.",
  "Mercury may be buffering. They are communicating with aliens. Please try again after emotionally recovering.",
];

/**
 * Given a situation and clues, generates a ridiculous conspiracy theory.
 * @param {string} situation
 * @param {string[]} clues
 * @returns {Promise<string>}
 */
export async function generateConspiracyTheory(situation, clues) {
  const systemPrompt = `You are the Overthink-o-Meter, a satirical AI.
The user will provide a situation and a list of ridiculous clues. You must generate ONE completely fictional, absurd, and dramatic conspiracy theory connecting the situation and ALL the clues.
Mix elements like secret societies, FBI, aliens, ancient prophecies, timelines, and corkboards.
Tone: witty, sarcastic, Gen-Z, unhinged conspiracy theorist.
IMPORTANT RULES:
1. The theory MUST be fictional and absurd.
2. Incorporate all the provided clues logically (in a crazy way).
3. Keep it to a single paragraph, 3-5 sentences.

RETURN EXACTLY this JSON structure and nothing else (no markdown):
{
  "theory": "Your generated theory here..."
}`;

  const userPrompt = `Situation: "${situation}"\nClues: ${clues.join(", ")}\n\nGenerate the conspiracy theory.`;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.95,
      max_tokens: 500,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "";
    const cleaned = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    const parsed = JSON.parse(cleaned);

    if (parsed && typeof parsed.theory === "string") {
      return parsed.theory;
    }
    
    throw new Error("Invalid structure");
  } catch {
    // Fallback
    const shuffled = [...CONSPIRACY_FALLBACKS].sort(() => 0.5 - Math.random());
    return shuffled[0] + " (Also, " + clues.join(" and ") + " are involved somehow).";
  }
}
