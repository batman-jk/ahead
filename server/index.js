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

// Global error handlers to catch hidden crashes
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const AGENT_ID = 'ag_019d2f6ac8307330a96add21f7cc3608';
const AGENT_VERSION = 1;

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('[AI Proxy] Health check hit!');
  res.json({ status: 'ok', agentId: AGENT_ID, timestamp: new Date().toISOString() });
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[AI Proxy] ${req.method} ${req.url}`);
  next();
});

// Activity classification endpoint
app.post('/api/classify', async (req, res) => {
  const { description } = req.body;
  console.log(`[AI Proxy] Classifying (Agent): "${description.substring(0, 50)}..."`);

  if (!client) {
    console.error('[AI Proxy] Mistral client not initialized.');
    return res.status(500).json({ error: 'Mistral API key not configured on server.' });
  }

  try {
    const response = await client.beta.conversations.start({
      agentId: AGENT_ID,
      agentVersion: AGENT_VERSION,
      inputs: [
        {
          role: 'user',
          content: `Classify the following student activity into exactly one of three categories: "learning", "practice", or "project".
          Also extract any relevant technical skills (e.g. React, Python, DSA, API). 
          Return the output as a JSON object with two fields: "type" (one of the three strings exactly) and "skills" (an array of strings).
          
          Activity: "${description}"`
        }
      ],
    });

    // Correct path for Beta Conversations API
    const content = response.outputs?.[0]?.content || '';
    console.log('[AI Proxy] AI Response received successfully');
    
    let result;
    try {
      // Find the first { and last } to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON Parse Error:', e, 'Content:', content);
      result = { type: 'learning', skills: [] };
    }

    if (!result.type || !['learning', 'practice', 'project'].includes(result.type)) {
      result.type = 'learning';
    }
    
    if (!result.skills) result.skills = [];

    res.json(result);
  } catch (error) {
    console.error('Mistral Agent Error:', error);
    res.status(500).json({ error: 'Failed to classify activity.', type: 'learning', skills: [] });
  }
});

// Roadmap generation endpoint
app.post('/api/roadmap', async (req, res) => {
  const { goal, skills } = req.body;
  console.log(`[AI Proxy] Generating Roadmap (Agent) for: ${goal}`);

  if (!client) {
    return res.status(500).json({ error: 'Mistral API key not configured on server.' });
  }

  const skillsSummary = skills && skills.length > 0
    ? skills.map(s => `${s.name} (${s.level})`).join(', ')
    : 'No specific skills yet';

  try {
    const response = await client.beta.conversations.start({
      agentId: AGENT_ID,
      agentVersion: AGENT_VERSION,
      inputs: [
        {
          role: 'user',
          content: `Generate a personalized 8-week learning roadmap for a student with Goal: "${goal}" and Skills: ${skillsSummary}.
          
Return your response as a JSON object with this exact structure:
{
  "todayGoal": "A specific task for today",
  "weekGoal": "Main objective for this week",
  "weeks": [
    {
      "week": 1,
      "title": "Week title",
      "focus": "Brief focus area",
      "tasks": ["Task 1", "Task 2"]
    }
  ]
}`
        }
      ],
    });

    const content = response.outputs?.[0]?.content || '';
    
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      result = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Roadmap JSON Parse Error:', e, 'Content:', content);
      return res.status(500).json({ error: 'Failed to parse roadmap.' });
    }

    if (!result.weeks || !Array.isArray(result.weeks)) result.weeks = [];
    if (!result.todayGoal) result.todayGoal = 'Review your current progress.';
    if (!result.weekGoal) result.weekGoal = 'Make progress on your learning goals.';

    res.json(result);
  } catch (error) {
    console.error('Roadmap Agent Error:', error);
    res.status(500).json({ error: 'Failed to generate roadmap.' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`AI Proxy Server (Agentic) running on port ${PORT}`);
});
