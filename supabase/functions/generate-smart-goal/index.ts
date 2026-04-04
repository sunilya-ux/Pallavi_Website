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
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { dream, specific, measurable, achievable, relevant, timebound }: RequestBody = await req.json();

    if (!dream || !specific || !timebound) {
      return new Response(
        JSON.stringify({ error: "Dream, Specific, and Time-bound fields are required" }),
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

    const prompt = `You are a SMART Goal Generator & Refinement Coach.

User Inputs:

Dream: ${dream}
Specific: ${specific}
Measurable: ${measurable || "Not provided"}
Achievable: ${achievable || "Not provided"}
Relevant: ${relevant || "Not provided"}
Time-bound: ${timebound} (${daysUntilTarget} days from now, approximately ${monthsUntilTarget} months)

------------------------------------------------
TASK
------------------------------------------------

Generate the following sections in a clear, structured format:

------------------------------------------------
1. SMART GOAL
------------------------------------------------

Create one clear, powerful sentence combining all SMART elements.

Format:
"I will [specific achievement] by [target date], measured by [measurable outcomes]."

Make it inspiring and action-oriented.

------------------------------------------------
2. EMOTIONAL ALIGNMENT
------------------------------------------------

Explain briefly (2-3 sentences):

- How pursuing this goal may feel emotionally
- Encourage the "nervous + excited" state as a sign of meaningful growth
- Validate that discomfort is part of transformation

------------------------------------------------
3. MICRO ACTIONS (5-7 actions)
------------------------------------------------

List 5-7 tiny actions that:
- Each takes 2-5 minutes to complete
- Build immediate momentum
- Are personalized to this specific goal
- Can be done TODAY

Format each as:
• [Action description]

------------------------------------------------
4. 15-DAY CHECKPOINTS
------------------------------------------------

Generate checkpoints every 15 days until the target date.

For each checkpoint, include:

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

For each milestone, include:
• **[Timeframe] Milestone**: [Clear outcome description]
  - Indicator: [What shows you've reached this point]
  - Success marker: [Specific evidence of achievement]

------------------------------------------------
6. FINAL MESSAGE
------------------------------------------------

End with an encouraging, actionable message:

"Your goal is now clear, actionable, and structured. You have the framework — now it's time to take that first micro-action.

Would you like help tracking this weekly?"

------------------------------------------------
STYLE REQUIREMENTS
------------------------------------------------

- Use clear headings with dashes or asterisks
- Bullet points for lists
- Simple, conversational language
- Motivational but grounded (no excessive fluff)
- Direct and actionable
- Avoid corporate jargon
- Be encouraging without being preachy

Generate the complete SMART goal plan now:`;

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
            content: "You are a professional SMART goal coach who creates clear, actionable, and motivating goal plans."
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
        JSON.stringify({ error: "Failed to generate SMART goal" }),
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
    console.error("Error in generate-smart-goal function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
