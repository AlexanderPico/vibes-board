/**
 * Netlify Function – proxy to Groq
 * Reads { keywords: string[], tone: string } in request body,
 * returns { quote: string }.
 */
export const handler = async (event) => {
  try {
    // Parse the request body
    const payload = JSON.parse(event.body);
    
    // Call Groq
    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify(payload)
      }
    ).then((r) => r.json());

    const quote = groqRes.choices?.[0]?.message?.content?.trim() || '';

    return {
      statusCode: 200,
      body: JSON.stringify({ quote })
    };
  } catch (err) {
    console.error('Groq proxy error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Quote generation failed.' })
    };
  }
}; 