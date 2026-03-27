let activeController = null;
let lastRequestTime = 0;
const CACHE_PREFIX = 'ahead_ai_cache_';
const THROTTLE_MS = 2000;

export const abortActiveClassification = () => {
  if (activeController) {
    activeController.abort();
    activeController = null;
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
