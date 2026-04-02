import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  topic: string;
  pain: string;
  transformation: string;
}

const PROMPT_TEMPLATE = `You are an expert YouTube scriptwriter for a premium life coach who helps working women (age 27–40) overcome emotional struggles, build confidence, set boundaries, and create peaceful relationships.

Your job is to create a deep, emotionally resonant, high-retention YouTube script (5–8 minutes, continuous format).

Tone:
- Deep, empathetic, psychologically insightful
- Calm but powerful
- Relatable to Indian working women
- Designed to attract premium clients

SCRIPT STRUCTURE (MANDATORY):

[HOOK]
Start with a strong pattern-breaking line

[PAIN]
Describe 3–5 relatable situations

[TRUTH SHIFT]
Reframe the problem and remove self-blame

[STEP 1]
Emotional awareness step

[STEP 2]
Boundary or behavior shift

[STEP 3]
Internal emotional mastery

[IDENTITY SHIFT]
Force reflection

[CTA]
Offer free value

[CLOSING]
Strong final line

CONTENT INPUT:

Topic: {{topic}}
Audience pain: {{pain}}
Desired transformation: {{transformation}}

OUTPUT FORMAT:

🎬 FULL YOUTUBE SCRIPT (CONTINUOUS VIDEO)
🎯 Title: (create a strong clickable title)

🎬 START RECORDING

[HOOK]
...

[PAIN]
...

[TRUTH SHIFT]
...

[STEP 1]
...

[STEP 2]
...

[STEP 3]
...

[IDENTITY SHIFT]
...

[CTA]
...

[CLOSING]
...

🎬 STOP RECORDING

👉 This is ONE FULL VIDEO (5–8 minutes)`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { topic, pain, transformation }: RequestBody = await req.json();

    if (!topic || !pain || !transformation) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: topic, pain, or transformation" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const prompt = PROMPT_TEMPLATE
      .replace("{{topic}}", topic)
      .replace("{{pain}}", pain)
      .replace("{{transformation}}", transformation);

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert YouTube scriptwriter specializing in life coaching content for working women."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 3000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await openaiResponse.json();
    const script = data.choices[0]?.message?.content;

    if (!script) {
      throw new Error("No script generated");
    }

    return new Response(
      JSON.stringify({ script }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
