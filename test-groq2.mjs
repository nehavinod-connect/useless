import Groq from "groq-sdk";
import { readFileSync } from "fs";

const env = readFileSync(".env", "utf-8");
const key = env.match(/VITE_GROQ_API_KEY=(.+)/)?.[1]?.trim();

console.log("Key found:", key.slice(0, 8) + "..." + key.slice(-4));
console.log("Sending test to openai/gpt-oss-120b...\n");

const client = new Groq({ apiKey: key });

const res = await client.chat.completions.create({
  model: "openai/gpt-oss-120b",
  messages: [
    {
      role: "system",
      content: "You are the Overthink-o-Meter. Return ONLY a JSON array of 2 short funny overthinking strings. No markdown.",
    },
    {
      role: "user",
      content: 'Situation: "they replied with just ok". Mild spiral mode: 2 short lines.',
    },
  ],
  temperature: 0.9,
  max_tokens: 200,
});

const content = res.choices[0].message.content;
console.log("Model responded!\n");
console.log("Raw:", content);
console.log("\nParsed:");
try {
  JSON.parse(content).forEach((l, i) => console.log("  [" + (i + 1) + "]", l));
} catch {
  console.log("  (raw text shown above)");
}
console.log("\nGroq connection is WORKING!");
