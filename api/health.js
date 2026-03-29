import { client, setCorsHeaders } from './_mistral.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKeyIsPresent = !!(process.env.MISTRAL_API_KEY || process.env.VITE_MISTRAL_API_KEY);
  
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: apiKeyIsPresent,
    clientInitialized: !!client,
    message: 'Serverless API is alive and ready for Vercel.'
  });
}
