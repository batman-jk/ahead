import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.MISTRAL_API_KEY || process.env.VITE_MISTRAL_API_KEY;
const client = new Mistral({ apiKey });
const RESOURCE_AGENT_ID = 'ag_019d3402a32c73748a7385af76bc0ae6';

async function testResourceAgent() {
  console.log('Testing Resource Agent directly...');
  try {
    const response = await client.agents.complete({
      agentId: RESOURCE_AGENT_ID,
      messages: [{ role: 'user', content: 'Suggest resources for React Beginner' }]
    });
    
    console.log('SUCCESS!');
    console.log('Content:', response.choices[0].message.content);
  } catch (err) {
    console.error('FAILED!');
    console.error(err);
  }
}

testResourceAgent();
