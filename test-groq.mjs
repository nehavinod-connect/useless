import Groq from 'groq-sdk';
import { readFileSync } from 'fs';

// Manually load .env (dotenv not installed)
const env = readFileSync('.env', 'utf-8');
const keyMatch = env.match(/VITE_GROQ_API_KEY=(.+)/);
const apiKey = keyMatch?.[1]?.trim().replace(/\r/g, '');

if (!apiKey || apiKey === 'your_groq_api_key_here') {
  console.error('\n❌ ERROR: No real API key found in .env');
  console.error('   Open .env and replace "your_groq_api_key_here" with your key from https://console.groq.com\n');
  process.exit(1);
}

console.log('✅ Key found:', apiKey.slice(0, 8) + '...' + apiKey.slice(-4));
console.log('🔄 Sending test prompt to llama-3.3-70b-versatile...\n');

const client = new Groq({ apiKey });

const res = await client.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [
    { role: 'system', content: 'You are the Overthink-o-Meter. Return ONLY a JSON array of 2 short funny overthinking strings.' },
    { role: 'user', content: 'Situation: "they replied with just ok"\n\nMild spiral mode: 2 short lines.' }
  ],
  temperature: 0.9,
  max_tokens: 200,
});

const content = res.choices[0].message.content;
console.log('✅ Model responded successfully!\n');
console.log('📦 Raw response:');
console.log(content);
console.log('\n📋 Parsed:');
try {
  const parsed = JSON.parse(content);
  parsed.forEach((line, i) => console.log(  [] ));
} catch {
  console.log('  (Could not parse as JSON — raw text above is the response)');
}
console.log('\n🎉 Groq connection is working!');
