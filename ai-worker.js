// PayPe AI Builder Worker
// Deploy this as a NEW Cloudflare Worker named: paype-ai

export default {
  async fetch(request, env) {

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST only' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { prompt, buildType, userPhone } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build system prompt based on type
    const systemPrompts = {
      fullstack: `You are an expert full stack web developer. Build complete, production-ready web applications.
Always respond with a single complete HTML file that includes all CSS and JavaScript inline.
The app must be fully functional, beautiful, and mobile-responsive.
Use modern design with gradients, animations, and professional UI.
Include all features the user asks for. No placeholders - everything must work.`,

      mobile: `You are an expert mobile app developer. Create mobile-first web apps that look and feel like native mobile apps.
Always respond with a single complete HTML file optimized for mobile screens (max-width 390px).
Include touch-friendly UI, smooth animations, and native-like components.`,

      landing: `You are an expert landing page designer. Create stunning, conversion-optimized landing pages.
Always respond with a single complete HTML file with beautiful hero sections, features, pricing, and CTA.
Use modern design trends, smooth scroll animations, and professional typography.`,

      ecommerce: `You are an expert e-commerce developer. Build complete online store pages.
Always respond with a single complete HTML file with product listings, cart functionality, and checkout flow.
Include product cards, filters, and a beautiful shopping experience.`
    };

    const systemPrompt = systemPrompts[buildType] || systemPrompts.fullstack;

    try {
      // Call Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY, // Stored in Worker environment variable
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Build this for me: ${prompt}\n\nRespond with ONLY the complete HTML code. No explanation needed.`
            }
          ]
        })
      });

      const data = await response.json();

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const generatedCode = data.content[0].text;

      // Deduct 1 credit from user (via KV or Firestore call)
      // For now just return the code
      return new Response(JSON.stringify({
        success: true,
        code: generatedCode,
        tokens_used: data.usage?.output_tokens || 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ error: 'AI request failed: ' + error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
