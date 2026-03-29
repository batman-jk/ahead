import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.VITE_MISTRAL_API_KEY;
const client = new Mistral({ apiKey });
const CORE_AGENT_ID = 'ag_019d2f6ac8307330a96add21f7cc3608';

async function testChatAgent() {
  console.log('Testing Mistral Agent with chat.complete (Agent ID as model)...');
  try {
    const response = await client.chat.complete({
      model: CORE_AGENT_ID,
      messages: [{ role: 'user', content: 'Classify this: "made a flutter project". Return JSON.' }],
      responseFormat: { type: 'json_object' }
    });
    console.log('SUCCESS!');
    console.log('Content:', response.choices[0].message.content);
  } catch (err) {
    console.error('FAILED!');
    console.error(err);
  }
}

testChatAgent();
