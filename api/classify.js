import { client, extractJsonPayload, getConversationText, CORE_AGENT_ID, setCorsHeaders } from './_mistral.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { description } = req.body || {};
  if (!description) {
    return res.status(400).json({ error: 'Description is required.' });
  }

  if (!client) {
    return res.status(500).json({ error: 'Mistral API key not configured on server.' });
  }

  try {
    const response = await client.agents.complete({
      agentId: CORE_AGENT_ID,
      messages: [
        {
          role: 'user',
          content: `Classify the following student activity: "${description}"
          
Return as a JSON object: { "type": "learning" | "practice" | "project", "skills": ["skill1", "skill2"] }`
        }
      ]
    });

    const content = getConversationText(response);
    let result;
    try {
      result = extractJsonPayload(content);
    } catch (e) {
      result = { type: 'learning', skills: [] };
    }

    if (!result.type || !['learning', 'practice', 'project'].includes(result.type)) {
      result.type = 'learning';
    }
    if (!result.skills) result.skills = [];

    return res.status(200).json(result);
  } catch (error) {
    console.error('Classify Error:', error);
    return res.status(500).json({ error: 'Failed to classify activity.', type: 'learning', skills: [] });
  }
}
