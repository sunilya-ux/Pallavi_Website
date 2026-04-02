import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { topic, pain, result } = await req.json();

    if (!topic || !pain || !result) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: topic, pain, and result" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const prompt = `You are an expert YouTube scriptwriter for a premium life coach who helps working women (age 27–40) overcome emotional struggles, build confidence, set boundaries, and create peaceful relationships.

Your job is to create a deep, emotionally resonant, high-retention YouTube script (5–8 minutes, continuous format).

Tone:
- Deep, empathetic
- Calm but powerful
- Indian context
- No hype

SCRIPT STRUCTURE:

[HOOK]
[PAIN]
[TRUTH SHIFT]
[STEP 1]
[STEP 2]
[STEP 3]
[IDENTITY SHIFT]
[CTA]
[CLOSING]

Topic: ${topic}
Audience pain: ${pain}
Desired transformation: ${result}

OUTPUT:

🎬 FULL YOUTUBE SCRIPT
🎯 Title:

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

🎬 STOP RECORDING`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: "You are an expert YouTube scriptwriter specializing in creating deep, emotionally resonant scripts for life coaches targeting working women in India. Your scripts are designed for 5-8 minute videos with high retention and emotional impact.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate content from OpenAI" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ content }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
