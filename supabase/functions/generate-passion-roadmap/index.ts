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

• Target Outcome: __________________
• Current Level: __________________
• Income Goal: __________________
• Why this matters: __________________

------------------------------------------------

📅 MONTH 1 — READINESS (JANUARY STYLE)

Focus:
• Business vision ready
• Strategy ready
• Research complete

Action Steps:
✔ Identify your passion clearly
✔ Learn basics of [passion]
✔ Join learning resources

------------------------------------------------

📅 MONTH 2 — MARKET RESEARCH

Focus:
• Understanding market demand
• Identifying target audience

Action Steps:
✔ Draft prototype idea
✔ Identify target audience
✔ Research demand & competition

------------------------------------------------

📅 MONTH 3 — PROTOTYPE ACTION

Focus:
• First execution
• Learning from mistakes

Action Steps:
✔ Execute first version
✔ Track learnings
✔ Note strengths & weaknesses

------------------------------------------------

📅 MONTH 4 — BUSINESS FOUNDATION

Focus:
• System improvement
• Goal setting

Action Steps:
✔ Improve system/process
✔ Set realistic income goals
✔ Create small actionable tasks

------------------------------------------------

📅 MONTH 5 — SALES & MARKETING

Focus:
• Building presence
• Revenue tracking

Action Steps:
✔ Build presence (online/offline)
✔ Work on USP
✔ Track revenue

------------------------------------------------

📅 MONTH 6 — REVENUE GOALS

Focus:
• Defining milestones
• Planning ahead

Action Steps:
✔ Define revenue milestones
✔ Plan next 6 months
✔ Add contingency plan

------------------------------------------------

📅 MONTH 7 — MILESTONE

Focus:
• Re-evaluation
• Clarity improvement

Action Steps:
✔ Re-evaluate goals
✔ Improve clarity

------------------------------------------------

📅 MONTH 8 — SCALE EXECUTION

Focus:
• Alignment with goals
• Progress achievement

Action Steps:
✔ Align activities with goals
✔ Achieve 50% progress

------------------------------------------------

📅 MONTH 9 — PERFORMANCE CHECK

Focus:
• Optimization
• Goal achievement

Action Steps:
✔ Achieve 60–70% goals
✔ Optimize strategy

------------------------------------------------

📅 MONTH 10 — GROWTH PUSH

Focus:
• Revenue acceleration

Action Steps:
✔ Target 80% revenue goals

------------------------------------------------

📅 MONTH 11 — NEAR COMPLETION

Focus:
• Final push

Action Steps:
✔ Achieve 95% goals

------------------------------------------------

📅 MONTH 12 — SUCCESS & CELEBRATION

Focus:
• Results enjoyment
• Reflection

Action Steps:
✔ Enjoy results
✔ Reflect and reset

------------------------------------------------

PERSONALIZATION RULE (MANDATORY):

Adapt roadmap based on passion:

- Bodybuilding → gym, diet, workouts
- Freelancing → clients, skills, portfolio
- Content → content, audience, growth
- Job → resume, interviews, skills

Replace ALL generic terms with passion-specific terms.

------------------------------------------------

STYLE RULES:

- Workbook style
- Bullet points only
- Clean layout
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
