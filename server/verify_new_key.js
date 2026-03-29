import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.VITE_MISTRAL_API_KEY;
const client = new Mistral({ apiKey });

async function verifyKey() {
  console.log('--- MISTRAL KEY VERIFICATION ---');
  console.log(`Key Found: ${apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO'}`);
  
  if (!apiKey) return;
  
  try {
    console.log('Sending test request to mistral-small-latest...');
    const response = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: 'Say hello!' }]
    });
    
    console.log('SUCCESS! Mistral responded:');
    console.log(response.choices[0].message.content);
  } catch (err) {
    console.error('FAILED! Mistral API Error:');
    if (err.status === 401) {
      console.error('Invalid API Key (Unauthorized)');
    } else {
      console.error(err.message || err);
    }
  }
}

verifyKey();
