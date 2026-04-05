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
    const { passion } = await req.json();

    if (!passion || typeof passion !== 'string' || !passion.trim()) {
      return new Response(
        JSON.stringify({ error: "Passion is required" }),
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

    const systemPrompt = `You are an expert 1-year roadmap planner.

User gives you ONLY a PASSION, and you create a timeline-based 12-month roadmap.

OUTPUT FORMAT (STRICT — FOLLOW EXACTLY):

Start with:

"Here's your 1-Year [PASSION] Roadmap (Beginner to Transformation) designed like a workbook — simple, actionable, and powerful."

------------------------------------------------

🎯 YOUR GOAL

📝 Fill This:

• Target Outcome:
  __________________________

• Current Level:
  __________________________

• Income Goal:
  __________________________

• Why this matters:
  __________________________

------------------------------------------------

📅 MONTH 1 — READINESS (JANUARY STYLE)

Focus:
• Vision clarity
• Strategy readiness
• Research completed

Action Steps:
✔ Understand basics of [passion]
✔ Identify your direction
✔ Join learning resources

------------------------------------------------

📅 MONTH 2 — MARKET RESEARCH

Action Steps:
✔ Identify target audience
✔ Study demand & competition
✔ Define opportunity

📝 Fill This:

• Target Audience:
  __________________________

• Market Gap:
  __________________________

------------------------------------------------

📅 MONTH 3 — PROTOTYPE ACTION

Action Steps:
✔ Start first execution
✔ Track learnings
✔ Identify strengths & weaknesses

------------------------------------------------

📅 MONTH 4 — FOUNDATION

Action Steps:
✔ Improve process/system
✔ Set realistic goals
✔ Create small tasks

------------------------------------------------

📅 MONTH 5 — SALES & VISIBILITY

Action Steps:
✔ Build online/offline presence
✔ Work on USP
✔ Track initial results

------------------------------------------------

📅 MONTH 6 — REVENUE SETUP

Action Steps:
✔ Define income milestones
✔ Plan next phase
✔ Add contingency

------------------------------------------------

📅 MONTH 7 — CLARITY MILESTONE

Action Steps:
✔ Refine goals
✔ Improve direction

------------------------------------------------

📅 MONTH 8 — SCALE PHASE

Action Steps:
✔ Align execution with goals
✔ Reach 50% progress

------------------------------------------------

📅 MONTH 9 — OPTIMIZATION

Action Steps:
✔ Improve performance
✔ Reach 60–70% progress

------------------------------------------------

📅 MONTH 10 — GROWTH PUSH

Action Steps:
✔ Target 80% results

------------------------------------------------

📅 MONTH 11 — NEAR COMPLETION

Action Steps:
✔ Target 95% completion

------------------------------------------------

📅 MONTH 12 — SUCCESS & REFLECTION

Action Steps:
✔ Celebrate progress
✔ Reflect and plan next level

------------------------------------------------

PERSONALIZATION RULE (MANDATORY):

Adapt roadmap based on passion:

- Bodybuilding → workouts, diet, gym
- Freelancing → clients, skills, portfolio
- Content Creation → audience, consistency
- Job → resume, interviews, skills

Replace ALL generic terms with passion-specific terms throughout the entire roadmap.

------------------------------------------------

STYLE RULES:

- Workbook style
- Bullet points
- Clean spacing
- No long paragraphs

------------------------------------------------

ENDING:

"Stay consistent. This roadmap works if you do."`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a 1-year roadmap for: ${passion.trim()}` }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(errorData.error?.message || "OpenAI API request failed");
    }

    const openaiData = await openaiResponse.json();
    const roadmap = openaiData.choices[0]?.message?.content?.trim();

    if (!roadmap) {
      throw new Error("No roadmap generated");
    }

    return new Response(
      JSON.stringify({ roadmap }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
