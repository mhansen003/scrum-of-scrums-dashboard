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

    const apiKey = process.env.OPENROUTER_API_KEY;

    // Debug logging
    console.log('=== OpenRouter Request Debug ===');
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length);
    console.log('API Key prefix:', apiKey?.substring(0, 15));
    console.log('API Key suffix:', apiKey?.substring(apiKey.length - 10));
    console.log('Model:', model);
    console.log('Messages count:', messages?.length);

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    const requestBody = {
      model,
      messages,
    };

    const requestHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://scrum-of-scrums.vercel.app',
      'X-Title': 'Scrum of Scrums Dashboard',
    };

    console.log('Request headers:', Object.keys(requestHeaders));
    console.log('Request body model:', requestBody.model);

    // Use fetch() directly like the working pipeline-intel project
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });

    console.log('OpenRouter response status:', response.status);
    console.log('OpenRouter response ok:', response.ok);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter error response:', JSON.stringify(errorData));
      return res.status(500).json({
        error: `OpenRouter API error: ${errorData.error?.message || errorData.error || response.statusText}`
      });
    }

    const data = await response.json();
    console.log('OpenRouter success! Response has choices:', !!data.choices);
    res.status(200).json(data);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
