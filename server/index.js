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
const CORE_AGENT_ID = 'ag_019d2f6ac8307330a96add21f7cc3608';
const RESOURCE_AGENT_ID = 'ag_019d3402a32c73748a7385af76bc0ae6';
const AGENT_VERSION = 1;
const RESOURCE_TYPES = ['video', 'book', 'website', 'practice', 'course', 'project'];
const RESOURCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// Global error handlers to catch hidden crashes
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const getConversationText = (response) => {
  const outputs = Array.isArray(response?.outputs) ? response.outputs : [];

  return outputs
    .map((output) => {
      const { content } = output || {};
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) {
        return content
          .map((part) => {
            if (typeof part === 'string') return part;
            if (typeof part?.text === 'string') return part.text;
            if (typeof part?.content === 'string') return part.content;
            return '';
          })
          .join('\n');
      }
      return typeof content === 'object' && content !== null ? JSON.stringify(content) : '';
    })
    .join('\n')
    .trim();
};

const extractJsonPayload = (rawContent) => {
  const cleaned = String(rawContent || '')
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();

  const candidates = [cleaned];
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);

  if (arrayMatch) candidates.push(arrayMatch[0]);
  if (objectMatch) candidates.push(objectMatch[0]);

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  throw new Error('Unable to parse JSON payload from Mistral response.');
};

const normalizeLevel = (value, fallback = 'Beginner') => (
  RESOURCE_LEVELS.includes(value) ? value : fallback
);

const normalizeResourceType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();

  if (normalized.includes('video') || normalized.includes('youtube')) return 'video';
  if (normalized.includes('book')) return 'book';
  if (normalized.includes('course')) return 'course';
  if (normalized.includes('project')) return 'project';
  if (normalized.includes('practice') || normalized.includes('problem') || normalized.includes('platform')) return 'practice';
  return 'website';
};

const normalizeRoadmap = (payload) => {
  const roadmap = payload && typeof payload === 'object' ? payload : {};
  return {
    todayGoal: roadmap.todayGoal || 'Review your current progress.',
    weekGoal: roadmap.weekGoal || 'Make progress on your learning goals.',
    weeks: Array.isArray(roadmap.weeks) ? roadmap.weeks : [],
  };
};

const normalizeChallenges = (payload) => {
  const challenges = payload && typeof payload === 'object' ? payload : {};
  return {
    daily: Array.isArray(challenges.daily) ? challenges.daily.slice(0, 2).map((challenge) => ({ ...challenge, xp_reward: 20 })) : [],
    weekly: Array.isArray(challenges.weekly) ? challenges.weekly.slice(0, 4).map((challenge) => ({ ...challenge, xp_reward: 50 })) : [],
  };
};

const normalizeResources = (payload, skill, fallbackLevel) => {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.resources)
      ? payload.resources
      : [];

  return items
    .map((resource, index) => {
      if (!resource || typeof resource !== 'object') return null;

      const title = String(resource.title || resource.name || resource.resource || '').trim();
      if (!title) return null;

      const type = normalizeResourceType(resource.type || resource.resource_type || resource.category);
      const level = normalizeLevel(resource.level || resource.difficulty, fallbackLevel);
      const description = String(resource.description || resource.summary || resource.notes || '').trim();
      const whyItFits = String(resource.whyItFits || resource.why_it_fits || resource.reason || '').trim();
      const provider = String(resource.provider || resource.platform || resource.author || '').trim();
      const timeEstimate = String(resource.timeEstimate || resource.time_estimate || resource.duration || '').trim();
      const cost = String(resource.cost || resource.pricing || '').trim();
      const url = typeof resource.url === 'string' && resource.url.startsWith('http') ? resource.url : null;
      const tags = Array.isArray(resource.tags)
        ? resource.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 6)
        : [];

      return {
        id: `${type}-${index}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
        title,
        type,
        description,
        whyItFits,
        provider,
        url,
        level,
        timeEstimate,
        cost,
        tags,
        skill,
      };
    })
    .filter(Boolean);
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('[AI Proxy] Health check hit!');
  res.json({ status: 'ok', agentId: CORE_AGENT_ID, resourceAgentId: RESOURCE_AGENT_ID, timestamp: new Date().toISOString() });
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
      agentId: CORE_AGENT_ID,
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

    const content = getConversationText(response);
    console.log('[AI Proxy] AI Response received successfully');
    
    let result;
    try {
      result = extractJsonPayload(content);
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
      agentId: CORE_AGENT_ID,
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

    const content = getConversationText(response);
    
    let result;
    try {
      result = normalizeRoadmap(extractJsonPayload(content));
    } catch (e) {
      console.error('Roadmap JSON Parse Error:', e, 'Content:', content);
      return res.status(500).json({ error: 'Failed to parse roadmap.' });
    }

    res.json(result);
  } catch (error) {
    console.error('Roadmap Agent Error:', error);
    res.status(500).json({ error: 'Failed to generate roadmap.' });
  }
});
// Challenges generation endpoint
app.post('/api/challenges', async (req, res) => {
  const { goal, skills } = req.body;
  console.log(`[AI Proxy] Generating Challenges (Agent) for: ${goal}`);

  if (!client) {
    return res.status(500).json({ error: 'Mistral API key not configured on server.' });
  }

  const skillsSummary = skills && skills.length > 0
    ? skills.map(s => s.name || s).join(', ')
    : 'No specific skills yet';

  try {
    const response = await client.beta.conversations.start({
      agentId: CORE_AGENT_ID,
      agentVersion: AGENT_VERSION,
      inputs: [
        {
          role: 'user',
          content: `Generate 2 daily challenges and 4 weekly challenges for a student with Goal: "${goal}" and Skills: "${skillsSummary}".
          
The daily challenges should be small, actionable tasks that can be completed in under an hour.
The weekly challenges should be larger milestone-style tasks.

Return your response ONLY as a JSON object with this exact structure:
{
  "daily": [
    { "title": "...", "description": "...", "xp_reward": 20 }
  ],
  "weekly": [
    { "title": "...", "description": "...", "xp_reward": 50 }
  ]
}

Ensure there are exactly 2 items in the daily array and 4 items in the weekly array.`
        }
      ],
    });

    const content = getConversationText(response);
    
    let result;
    try {
      result = normalizeChallenges(extractJsonPayload(content));
    } catch (e) {
      console.error('Challenges JSON Parse Error:', e, 'Content:', content);
      return res.status(500).json({ error: 'Failed to parse generated challenges.' });
    }

    res.json(result);
  } catch (error) {
    console.error('Challenges Agent Error:', error);
    res.status(500).json({ error: 'Failed to generate challenges.' });
  }
});

app.post('/api/resources', async (req, res) => {
  const {
    goal,
    skill,
    level = 'Beginner',
    resource_types = 'all',
    completed_skills = [],
  } = req.body || {};

  if (!client) {
    return res.status(500).json({ error: 'Mistral API key not configured on server.' });
  }

  if (!skill || typeof skill !== 'string') {
    return res.status(400).json({ error: 'A skill or roadmap node is required.' });
  }

  const normalizedLevel = normalizeLevel(level);
  const normalizedTypes = resource_types === 'all'
    ? RESOURCE_TYPES
    : Array.isArray(resource_types)
      ? [...new Set(resource_types.map((type) => normalizeResourceType(type)))]
      : RESOURCE_TYPES;
  const normalizedCompletedSkills = Array.isArray(completed_skills)
    ? [...new Set(completed_skills.map((item) => String(item).trim()).filter(Boolean))].slice(0, 20)
    : [];

  console.log(`[AI Proxy] Generating Resources (Agent) for: ${skill} [${normalizedLevel}]`);

  try {
    const response = await client.beta.conversations.start({
      agentId: RESOURCE_AGENT_ID,
      agentVersion: AGENT_VERSION,
      inputs: [
        {
          role: 'user',
          content: `You are a dedicated learning resource curator for a student platform.

Return ONLY a JSON array. Do not wrap it in markdown, commentary, or extra keys.

Generate 6 to 8 high-quality, non-redundant resources tailored to this student context:
- Goal: "${goal || 'General technical growth'}"
- Current skill or roadmap node: "${skill}"
- Level: "${normalizedLevel}"
- Preferred resource types: ${JSON.stringify(normalizedTypes)}
- Completed skills to avoid repeating basics: ${JSON.stringify(normalizedCompletedSkills)}

Each item in the JSON array must follow this shape:
{
  "title": "Resource title",
  "type": "video | book | website | practice | course | project",
  "provider": "Creator, platform, or author",
  "description": "1-2 sentence summary of what the learner gets",
  "whyItFits": "Why this is a strong next step for this learner",
  "level": "Beginner | Intermediate | Advanced",
  "timeEstimate": "Short estimate like 45 min, 3 hours, 2 weeks",
  "cost": "Free | Paid | Freemium",
  "tags": ["tag1", "tag2"],
  "url": "https://..."
}

Rules:
- Prefer concrete resources learners can open immediately.
- Include at least one hands-on resource when relevant.
- For project ideas, the url may be an empty string if no link is needed.
- Avoid duplicate fundamentals already covered by completed skills.
- Keep descriptions concise and practical.`
        }
      ],
    });

    const content = getConversationText(response);
    const resources = normalizeResources(extractJsonPayload(content), skill.trim(), normalizedLevel);
    res.json(resources);
  } catch (error) {
    console.error('Resources Agent Error:', error);
    res.status(500).json({ error: 'Failed to generate resource suggestions.' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`AI Proxy Server (Agentic) running on port ${PORT}`);
});
