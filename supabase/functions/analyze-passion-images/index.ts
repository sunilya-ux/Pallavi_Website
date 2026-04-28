import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ImageData {
  base64: string;
  mimeType: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { images }: { images: ImageData[] } = await req.json();

    if (!images || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "Please upload at least one image." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (images.length > 10) {
      return new Response(
        JSON.stringify({ error: "Maximum 10 images allowed." }),
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

    const systemPrompt = `You are an expert Passion Discovery Analyzer.

You analyze handwritten notes, thoughts, and answers from uploaded images.

Your goal is to:
- Identify personality patterns
- Discover true passion
- Suggest monetizable career paths

INPUT HANDLING:
- User has uploaded images (handwritten notes or screenshots)
- Extract meaning (not exact words)
- Understand intent, emotions, patterns

OUTPUT FORMAT (STRICT):
Return CLEAN SECTION FORMAT. Use the EXACT section headers below with the emoji prefixes shown. DO NOT use JSON. DO NOT use tables. DO NOT skip any section. DO NOT leave any section empty.

PASSION ANALYSIS REPORT

---

CORE PERSONALITY TRAITS IDENTIFIED

- Trait 1 -> explanation
- Trait 2 -> explanation
- Trait 3 -> explanation
- Trait 4 -> explanation
- Trait 5 -> explanation

---

YOUR TRUE PASSION

[1-line powerful identity statement]

Explain in 2-3 lines why this is their real passion.

---

CAREER OPTIONS WITH RATINGS

For EACH career option, follow this EXACT format:

### 1. [Career Name] — X/10

Why this fits:
- point
- point

Personality Traits Used:
- trait
- trait
- trait

How to Monetize:

Freelancing:
- option
- option

Content Creator:
- niche
- content ideas

Job Roles:
- roles

Coaching:
- niche

(Repeat SAME format for all 4-5 career options. Number them 1 through 5. Each option MUST have ALL subsections: Why this fits, Personality Traits Used, and all four How to Monetize categories.)

---

BEST CAREER PATH (Recommended)

[Final recommendation]

Why:
- reason
- reason

---

SIMPLE MONETIZATION ROADMAP

Step 1 (0-30 days):
- action

Step 2 (30-60 days):
- action

Step 3 (2-3 months):
- action

Step 4 (3-6 months):
- action

---

YOUR UNIQUE ADVANTAGE

Explain what makes this person different.

---

REALITY CHECK

- challenge
- challenge
- expectation

---

FINAL INSIGHT

Write emotional + powerful closing.

---

DISCLAIMER

This is based on analysis of provided inputs.
User can choose or modify based on alignment.

CRITICAL RULES:
- DO NOT leave any section empty
- DO NOT summarize too much
- Keep it human, insightful, and practical
- Make it feel like a premium coaching report
- Keep formatting clean for UI display
- Use line breaks between sentences for readability
- Each career option MUST start with ### followed by the number, name, and rating (e.g. ### 1. Career Name — 8/10)
- Each career option MUST have ALL subsections: Why this fits, Personality Traits Used, Freelancing, Content Creator, Job Roles, Coaching
- Number career options sequentially from 1 to 5`;

    const imageContents = images.map((img) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:${img.mimeType};base64,${img.base64}`,
        detail: "high" as const,
      },
    }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze these handwritten notes / screenshots and generate a complete Passion Analysis Report. Extract meaning, emotions, and patterns from the images.",
              },
              ...imageContents,
            ],
          },
        ],
        temperature: 0.7,
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error("Failed to analyze images");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
