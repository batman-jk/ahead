import { client, extractJsonPayload, getConversationText, RESOURCE_AGENT_ID, normalizeLevel, normalizeResources, RESOURCE_TYPES, setCorsHeaders } from './_mistral.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    goal,
    skill,
    level = 'Beginner',
    resource_types = 'all',
    completed_skills = [],
  } = req.body || {};

  if (!skill) {
    return res.status(400).json({ error: 'A skill or roadmap node is required.' });
  }

  if (!client) {
    return res.status(500).json({ error: 'Mistral API key not configured on server.' });
  }

  const normalizedLevel = normalizeLevel(level);
  const normalizedTypes = resource_types === 'all'
    ? RESOURCE_TYPES
    : Array.isArray(resource_types)
      ? resource_types
      : RESOURCE_TYPES;

  try {
    const response = await client.agents.complete({
      agentId: RESOURCE_AGENT_ID,
      messages: [
        {
          role: 'user',
          content: `Generate 6 high-quality resources for Skill: "${skill}" [${normalizedLevel}]. 
          Goal: "${goal ||'General Growth'}". 
          Prefer types: ${JSON.stringify(normalizedTypes)}.
          Avoid repeating: ${JSON.stringify(completed_skills)}.
          
Return JSON array of items with: { title, type, provider, description, whyItFits, level, timeEstimate, cost, tags, url }`
        }
      ]
    });

    const content = getConversationText(response);
    const resources = normalizeResources(extractJsonPayload(content), skill.trim(), normalizedLevel);
    
    return res.status(200).json(resources);
  } catch (error) {
    console.error('Resources Gen Error:', error);
    return res.status(500).json({ error: 'Failed' });
  }
}
