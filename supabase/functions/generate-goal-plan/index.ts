import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  dream: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timebound: string;
  smartGoal: string;
  emotionalCheck: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { dream, specific, measurable, achievable, relevant, timebound, smartGoal, emotionalCheck }: RequestBody = await req.json();

    if (!dream || !specific || !timebound || !smartGoal) {
      return new Response(
        JSON.stringify({ error: "Required fields are missing" }),
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

    const targetDate = new Date(timebound);
    const today = new Date();
    const daysUntilTarget = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const monthsUntilTarget = Math.ceil(daysUntilTarget / 30);

    const prompt = `You are a SMART Goal execution coach.

SMART Goal:
"${smartGoal}"

Context:
Dream: ${dream}
Specific: ${specific}
Measurable: ${measurable || "Not provided"}
Achievable: ${achievable || "Not provided"}
Relevant: ${relevant || "Not provided"}
Time-bound: ${timebound} (${daysUntilTarget} days from now, approximately ${monthsUntilTarget} months)
Emotional Response: ${emotionalCheck}

------------------------------------------------
TASK
------------------------------------------------

Generate a complete execution plan with the following sections:

------------------------------------------------
1. YOUR SMART GOAL
------------------------------------------------

Display the SMART goal prominently.

------------------------------------------------
2. EMOTIONAL ALIGNMENT
------------------------------------------------

Briefly (2-3 sentences):
- Acknowledge their emotional response
- Encourage the "nervous + excited" state as a sign of growth
- Validate that discomfort is part of transformation

------------------------------------------------
3. MICRO ACTIONS (5-7 actions)
------------------------------------------------

List 5-7 tiny, immediate actions that:
- Take only 2-5 minutes each
- Build instant momentum
- Are personalized to this specific goal
- Can be done TODAY

Format:
• [Action description]

------------------------------------------------
4. 15-DAY CHECKPOINTS
------------------------------------------------

Generate checkpoints every 15 days until the target date.

For each checkpoint:

**Day [X] Checkpoint:**
• What to complete: [specific task or milestone]
• What to measure: [metric or indicator]
• Reflection question: [thoughtful question to assess progress]

------------------------------------------------
5. MILESTONES
------------------------------------------------

${monthsUntilTarget <= 3 ? 'Generate monthly milestones' :
  monthsUntilTarget <= 6 ? 'Generate monthly milestones plus a midpoint milestone' :
  'Generate quarterly milestones'}

For each milestone:

• **[Timeframe] Milestone**: [Clear outcome description]
  - Indicator: [What shows you've reached this point]
  - Success marker: [Specific evidence of achievement]

------------------------------------------------
STYLE REQUIREMENTS
------------------------------------------------

- Use clear headings with dashes or asterisks
- Bullet points for lists
- Simple, conversational language (coaching tone)
- Direct and actionable
- Motivational but grounded (no excessive fluff)
- Avoid corporate jargon
- Encouraging without being preachy

Generate the complete goal execution plan now:`;

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
            content: "You are a professional goal execution coach who creates clear, actionable, and motivating goal plans with concrete steps."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate goal plan" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ content }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-goal-plan function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
