import { Mistral } from '@mistralai/mistralai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.MISTRAL_API_KEY || process.env.VITE_MISTRAL_API_KEY;
const client = new Mistral({ apiKey });
const CORE_AGENT_ID = 'ag_019d2f6ac8307330a96add21f7cc3608';

async function testAgentDirectly() {
  console.log('Testing Core Agent directly via SDK...');
  try {
    const response = await client.agents.complete({
      agentId: CORE_AGENT_ID,
      messages: [{ role: 'user', content: 'Classify: learned react' }]
    });
    
    console.log('SUCCESS!');
    console.log('Content:', response.choices[0].message.content);
  } catch (err) {
    console.error('FAILED!');
    console.error(err);
  }
}

testAgentDirectly();
