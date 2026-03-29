import { client, extractJsonPayload, getConversationText, CORE_AGENT_ID, normalizeRoadmap, setCorsHeaders } from './_mistral.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { goal, skills } = req.body || {};
  if (!goal) {
    return res.status(400).json({ error: 'Goal is required.' });
  }

  if (!client) {
    return res.status(500).json({ error: 'Mistral API key not configured on server.' });
  }

  const skillsSummary = Array.isArray(skills)
    ? skills.map(s => `${s.name} (${s.level})`).join(', ')
    : 'No specific skills yet';

  try {
    const response = await client.agents.complete({
      agentId: CORE_AGENT_ID,
      messages: [
        {
          role: 'user',
          content: `Generate a personalized 8-week learning roadmap for Goal: "${goal}" and Skills: ${skillsSummary}.
          
Return as JSON object:
{
  "todayGoal": "Task for today",
  "weekGoal": "Goal for week",
  "weeks": [
    {
      "week": 1,
      "title": "Week 1",
      "focus": "Focus",
      "tasks": ["Task 1", "Task 2"]
    }
  ]
}`
        }
      ]
    });

    const content = getConversationText(response);
    let result;
    try {
      result = normalizeRoadmap(extractJsonPayload(content));
    } catch (e) {
      console.error('JSON Parse Error:', e, 'Content:', content);
      return res.status(500).json({ error: 'Failed to generate roadmap.' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Roadmap Gen Error:', error);
    return res.status(500).json({ error: 'Failed to generate roadmap.' });
  }
}
