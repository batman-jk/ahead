import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.VITE_MISTRAL_API_KEY;
const client = new Mistral({ apiKey });

async function testAgent() {
  console.log('Testing Mistral Agent with chat.complete...');
  try {
    const response = await client.chat.complete({
      model: 'ag_019d2f6ac8307330a96add21f7cc3608',
      messages: [{ role: 'user', content: 'test' }],
      maxTokens: 10
    });
    console.log('SUCCESS!');
    console.log(JSON.stringify(response, null, 2));
  } catch (err) {
    console.error('FAILED!');
    console.error(err);
  }
}

testAgent();
