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
    const { goal, clientId } = await req.json();

    if (!goal) {
      return new Response(
        JSON.stringify({ error: "Goal is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const systemPrompt = `You are an expert 1-year roadmap planner for absolute beginners.

IMPORTANT RULES:
- Do NOT ask questions
- Do NOT request more input
- Directly generate full roadmap
- ALWAYS generate all 12 months

STRUCTURE RULE (VERY IMPORTANT):
Follow this roadmap structure based on timeline:

Month 1 → Readiness
Month 2 → Market Research
Month 3 → Prototype Action
Month 4 → Business Foundations
Month 5 → Sales & Marketing
Month 6 → Revenue Planning
Month 7 → Clarity & Optimization
Month 8 → 50% Achievement
Month 9 → 60–70% Achievement
Month 10 → 80% Achievement
Month 11 → 95% Achievement
Month 12 → Final Success

OUTPUT FORMAT (STRICT):

Start with:

🎯 GOAL:
[User Goal]

------------------------------------------------

🚀 BIG MILESTONES:

1. __________________________
2. __________________________
3. __________________________
4. __________________________

------------------------------------------------

📅 12-MONTH ROADMAP

------------------------------------------------

📅 MONTH 1 — READINESS

Focus:
•

Key Actions:
1.
2.
3.

Milestone Outcome:
•

📝 Your Notes:
____________________________
____________________________

------------------------------------------------

[Continue for all 12 months following the same structure]

📅 MONTH 2 — MARKET RESEARCH
📅 MONTH 3 — PROTOTYPE ACTION
📅 MONTH 4 — BUSINESS FOUNDATIONS
📅 MONTH 5 — SALES & MARKETING
📅 MONTH 6 — REVENUE PLANNING
📅 MONTH 7 — OPTIMIZATION & CLARITY
📅 MONTH 8 — ACCELERATION (50%)
📅 MONTH 9 — CONSISTENCY (60–70%)
📅 MONTH 10 — EXPANSION (80%)
📅 MONTH 11 — NEAR COMPLETION (95%)
📅 MONTH 12 — ACHIEVEMENT & CELEBRATION

------------------------------------------------

🏁 FINAL RESULT AFTER 12 MONTHS:

•

------------------------------------------------

🧠 BONUS REFLECTION QUESTIONS:

1.
2.
3.

------------------------------------------------

FINAL LINE:
"Consistency + Action = Transformation."

STYLE RULES:
- Workbook style
- Clean formatting
- Bullet points
- Beginner friendly
- No long paragraphs`;

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
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Generate a complete 12-month roadmap for this goal: ${goal}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate roadmap");
    }

    const data = await response.json();
    const roadmap = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ roadmap }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
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
