import OpenAI from 'openai';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model = 'openai/gpt-3.5-turbo' } = req.body;

    // Initialize OpenRouter client using OpenAI SDK
    const openRouter = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://scrum-of-scrums.vercel.app',
        'X-Title': 'Scrum of Scrums Dashboard',
      },
    });

    const response = await openRouter.chat.completions.create({
      model,
      messages,
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
