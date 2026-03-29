import { Mistral } from '@mistralai/mistralai';

// Initialize Mistral Client
const apiKey = process.env.MISTRAL_API_KEY || process.env.VITE_MISTRAL_API_KEY;
export const client = apiKey ? new Mistral({ apiKey }) : null;

export const CORE_AGENT_ID = 'ag_019d2f6ac8307330a96add21f7cc3608';
export const RESOURCE_AGENT_ID = 'ag_019d3402a32c73748a7385af76bc0ae6';

export const RESOURCE_TYPES = ['video', 'book', 'website', 'practice', 'course', 'project'];
export const RESOURCE_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export const getConversationText = (response) => {
  return response?.choices?.[0]?.message?.content || '';
};

export const extractJsonPayload = (rawContent) => {
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

export const normalizeLevel = (value, fallback = 'Beginner') => (
  RESOURCE_LEVELS.includes(value) ? value : fallback
);

export const normalizeResourceType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized.includes('video') || normalized.includes('youtube')) return 'video';
  if (normalized.includes('book')) return 'book';
  if (normalized.includes('course')) return 'course';
  if (normalized.includes('project')) return 'project';
  if (normalized.includes('practice') || normalized.includes('problem') || normalized.includes('platform')) return 'practice';
  return 'website';
};

export const normalizeRoadmap = (payload) => {
  const roadmap = payload && typeof payload === 'object' ? payload : {};
  return {
    todayGoal: roadmap.todayGoal || 'Review your current progress.',
    weekGoal: roadmap.weekGoal || 'Make progress on your learning goals.',
    weeks: Array.isArray(roadmap.weeks) ? roadmap.weeks : [],
  };
};

export const normalizeChallenges = (payload) => {
  const challenges = payload && typeof payload === 'object' ? payload : {};
  return {
    daily: Array.isArray(challenges.daily) ? challenges.daily.slice(0, 2).map((c) => ({ ...c, xp_reward: 20 })) : [],
    weekly: Array.isArray(challenges.weekly) ? challenges.weekly.slice(0, 4).map((c) => ({ ...c, xp_reward: 50 })) : [],
  };
};

export const normalizeResources = (payload, skill, fallbackLevel) => {
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
      const tags = Array.isArray(resource.tags) ? resource.tags.map(t => String(t).trim()).filter(Boolean).slice(0, 6) : [];

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

// CORS Helper for individual functions
export const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
};
