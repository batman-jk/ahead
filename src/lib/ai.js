let activeController = null;
let activeResourceController = null;
let lastRequestTime = 0;
const CACHE_PREFIX = 'ahead_ai_cache_';
const RESOURCE_CACHE_PREFIX = 'ahead_resource_cache_';
const THROTTLE_MS = 2000;

const hashString = (value) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

export const abortActiveClassification = () => {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
};

export const abortActiveResourceSuggestions = () => {
  if (activeResourceController) {
    activeResourceController.abort();
    activeResourceController = null;
  }
};

export const classifyActivityType = async (description) => {
  if (!description.trim()) return null;

  // 1. Check Cache
  const cacheKey = CACHE_PREFIX + btoa(description.trim().substring(0, 50));
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      console.log('AI result served from cache');
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }

  // 2. Throttle
  const now = Date.now();
  if (now - lastRequestTime < THROTTLE_MS) {
    console.warn('AI request throttled');
    return null;
  }
  lastRequestTime = now;

  // Abort any previous pending request
  abortActiveClassification();

  try {
    activeController = new AbortController();
    const timeoutId = setTimeout(() => {
      if (activeController) activeController.abort();
    }, 20000); // 20s timeout

    console.log('[AI Debug] Fetching from: /api/classify (via Vite proxy)');
    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
      signal: activeController.signal
    });
    
    clearTimeout(timeoutId);
    activeController = null;

    if (!response.ok) throw new Error(`Backend failed with status: ${response.status}`);

    const result = await response.json();
    console.log('AI classification successful:', result);
    
    // 3. Update Cache
    localStorage.setItem(cacheKey, JSON.stringify(result));
    
    return result;
  } catch (error) {
    activeController = null;
    if (error.name === 'AbortError') {
      console.error('AI classification aborted or timed out');
    } else {
      console.error('Frontend AI Error:', error);
    }
    return null;
  }
};

export const generateChallenges = async (goal, skills) => {
  try {
    const response = await fetch('/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, skills })
    });
    
    if (!response.ok) throw new Error(`Backend failed with status: ${response.status}`);
    
    return await response.json();
  } catch (error) {
    console.error('Frontend AI Challenge Gen Error:', error);
    return null;
  }
};

export const generateResourceSuggestions = async (payload) => {
  const normalizedPayload = {
    goal: payload?.goal?.trim() || 'General technical growth',
    skill: payload?.skill?.trim() || '',
    level: payload?.level || 'Beginner',
    resource_types: Array.isArray(payload?.resource_types) && payload.resource_types.length > 0
      ? [...new Set(payload.resource_types.map((type) => String(type).trim().toLowerCase()).filter(Boolean))].sort()
      : 'all',
    completed_skills: Array.isArray(payload?.completed_skills)
      ? [...new Set(payload.completed_skills.map((skill) => String(skill).trim()).filter(Boolean))].sort()
      : [],
  };

  if (!normalizedPayload.skill) return [];

  const cacheKey = `${RESOURCE_CACHE_PREFIX}${hashString(JSON.stringify(normalizedPayload))}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem(cacheKey);
    }
  }

  abortActiveResourceSuggestions();

  try {
    activeResourceController = new AbortController();
    const timeoutId = setTimeout(() => {
      if (activeResourceController) activeResourceController.abort();
    }, 30000);

    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedPayload),
      signal: activeResourceController.signal,
    });

    clearTimeout(timeoutId);
    activeResourceController = null;

    if (!response.ok) {
      throw new Error(`Backend failed with status: ${response.status}`);
    }

    const result = await response.json();
    const resources = Array.isArray(result) ? result : [];
    localStorage.setItem(cacheKey, JSON.stringify(resources));
    return resources;
  } catch (error) {
    activeResourceController = null;
    if (error.name === 'AbortError') throw error;
    console.error('Frontend AI Resource Suggestion Error:', error);
    throw error;
  }
};
