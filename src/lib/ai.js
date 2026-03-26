//AI classification helper that calls our backend proxy
// Includes caching and rate limiting for optimal UX
let lastRequestTime = 0;
const CACHE_PREFIX = 'ahead_ai_cache_';
const THROTTLE_MS = 2000;

export const classifyActivityType = async (description) => {
  if (!description.trim()) return null;

  // 1. Check Cache
  const cacheKey = CACHE_PREFIX + btoa(description.trim().substring(0, 50));
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      console.log('AI result served from cache');
      return JSON.parse(cached);
    } catch (e) {
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

  try {
    const response = await fetch('http://localhost:3001/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });

    if (!response.ok) throw new Error('Backend failed');

    const result = await response.json();
    
    // 3. Update Cache
    localStorage.setItem(cacheKey, JSON.stringify(result));
    
    return result;
  } catch (error) {
    console.error('Frontend AI Error:', error);
    // Robust fallback
    return { type: 'learning', skills: [], error: true };
  }
};


