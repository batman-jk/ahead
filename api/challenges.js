import { client, extractJsonPayload, getConversationText, CORE_AGENT_ID, normalizeChallenges, setCorsHeaders } from './_mistral.js';

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
    ? skills.map(s => s.name || s).join(', ')
    : 'No specific skills yet';

  try {
    const response = await client.agents.complete({
      agentId: CORE_AGENT_ID,
      messages: [
        {
          role: 'user',
          content: `Generate 2 daily challenges and 4 weekly challenges for Goal: "${goal}" and Skills: "${skillsSummary}".
          
Return as JSON object:
{
  "daily": [
    { "title": "...", "description": "...", "xp_reward": 20 }
  ],
  "weekly": [
    { "title": "...", "description": "...", "xp_reward": 50 }
  ]
}`
        }
      ]
    });

    const content = getConversationText(response);
    let result;
    try {
      result = normalizeChallenges(extractJsonPayload(content));
    } catch (e) {
      console.error('JSON Parse Error:', e, 'Content:', content);
      return res.status(500).json({ error: 'Failed' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Challenge Gen Error:', error);
    return res.status(500).json({ error: 'Failed to generate challenges.' });
  }
}
