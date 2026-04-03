import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChannelDescriptionRequest {
  name: string;
  audience: string;
  challenges: string;
  result: string;
  experience: string;
  topics: string;
  website: string;
  email: string;
  social: string;
  message: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const body: ChannelDescriptionRequest = await req.json();

    const prompt = `You are a YouTube Channel Description Generator.

Your job is to create a clear, engaging, and original YouTube channel description based only on the user's inputs.

User details:

Name: ${body.name}
Audience: ${body.audience}
Challenges: ${body.challenges}
Transformation: ${body.result}
Experience: ${body.experience || 'Not provided'}
Topics: ${body.topics || 'Not provided'}
Website: ${body.website || 'Not provided'}
Email: ${body.email || 'Not provided'}
Social links: ${body.social || 'Not provided'}
Personal message: ${body.message || 'Not provided'}

Instructions:

- Write a completely original description
- Start with an engaging opening based on audience struggles
- Introduce the creator naturally
- Explain the transformation/value provided
- Describe what the channel covers
- Include key content themes
- Add a natural subscribe/follow invitation
- Include contact details and links
- End with the personal message

Tone:
- Human, natural, engaging
- No generic motivational lines
- No templates or repeated phrases

Create the YouTube channel description now:`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert at creating engaging, personalized YouTube channel descriptions that connect with audiences and clearly communicate value."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    const description = openaiData.choices[0]?.message?.content?.trim() || "";

    return new Response(
      JSON.stringify({ description }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
