/**
 * Parse transcript using AI to extract report data
 * POST /api/admin/parse-transcript
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Transcript text is required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY?.trim();

    if (!apiKey) {
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

    // Use Claude to parse the transcript
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://scrum-of-scrums.vercel.app',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'system',
            content: `You are an expert at parsing Scrum of Scrums meeting transcripts into structured data.

Extract the following information for EACH team mentioned in the transcript:
- Team name
- Team lead name
- Accomplishments (what they completed last period) - group by status/section like "Ready for UAT", "UAT Pass", "In Production"
- Goals (what they're working on this period) - group by status/section like "In Progress", "In QA", "Ready for UAT"
- Blockers (any issues blocking progress)
- Risks (potential problems and their mitigations)

For accomplishments and goals, try to identify ticket/issue IDs (usually numbers like "89536" or "AB-1234").

Return your response as a JSON object with this EXACT structure:
{
  "teams": [
    {
      "teamName": "Team Name",
      "teamLead": "Lead Name",
      "accomplishments": [
        {
          "section": "Ready for UAT",
          "description": "Completed feature X",
          "ticketId": "12345"
        }
      ],
      "goals": [
        {
          "section": "In Progress",
          "description": "Working on feature Y",
          "ticketId": "67890"
        }
      ],
      "blockers": [
        {
          "description": "Waiting for API keys from security team",
          "ticketId": null
        }
      ],
      "risks": [
        {
          "description": "Database migration may cause downtime",
          "severity": "high"
        }
      ]
    }
  ]
}

Important:
- Return ONLY the JSON object, no markdown formatting
- Use null for missing ticket IDs
- Section names should be descriptive (e.g., "Ready for UAT", "In QA", "In Production")
- Severity for risks should be "low", "medium", or "high"
- If no items exist for a category, use an empty array []`
          },
          {
            role: 'user',
            content: `Parse this Scrum of Scrums transcript and extract all team updates:\n\n${transcript}`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter error:', errorData);
      return res.status(500).json({
        error: `AI parsing failed: ${errorData.error?.message || response.statusText}`
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Parse the JSON response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse;
      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      return res.status(500).json({
        error: 'Failed to parse AI response. The transcript might be in an unexpected format.'
      });
    }

    // Validate the structure
    if (!parsedData.teams || !Array.isArray(parsedData.teams)) {
      return res.status(500).json({
        error: 'Invalid response structure from AI'
      });
    }

    res.status(200).json(parsedData);

  } catch (error) {
    console.error('Parse transcript error:', error);
    res.status(500).json({ error: error.message });
  }
}
