import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Mistral } from '@mistralai/mistralai';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.VITE_MISTRAL_API_KEY;
const client = apiKey ? new Mistral({ apiKey }) : null;

app.post('/api/classify', async (req, res) => {
  const { description } = req.body;

  if (!client) {
    return res.status(500).json({ error: 'Mistral API key not configured on server.' });
  }

  if (!description) {
    return res.status(400).json({ error: 'Description is required.' });
  }

  try {
    const response = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'user',
          content: `Classify the following student activity into exactly one of three categories: "learning", "practice", or "project".
          Also extract any relevant technical skills (e.g. React, Python, DSA, API). 
          Return the output as a JSON object with two fields: "type" (one of the three strings exactly) and "skills" (an array of strings).
          
          Activity: "${description}"`
        }
      ],
      responseFormat: { type: 'json_object' }
    });

    let result;
    try {
      result = JSON.parse(response.choices[0].message.content);
    } catch (e) {
      console.error('JSON Parse Error:', e);
      result = { type: 'learning', skills: [] };
    }

    // Fallback if type is missing or invalid
    if (!result.type || !['learning', 'practice', 'project'].includes(result.type)) {
      result.type = 'learning';
    }
    
    if (!result.skills) result.skills = [];

    res.json(result);
  } catch (error) {
    console.error('Mistral Backend Error:', error);
    res.status(500).json({ error: 'Failed to classify activity.', type: 'learning', skills: [] });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI Proxy Server running on port ${PORT}`);
});
