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
  refinement?: string;
  currentGoal?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { dream, specific, measurable, achievable, relevant, timebound, refinement, currentGoal }: RequestBody = await req.json();

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

    let prompt: string;

    if (refinement && currentGoal) {
      prompt = `You are a SMART goal refinement coach.

Current SMART Goal:
"${currentGoal}"

User's Refinement Request:
"${refinement}"

Original Context:
Dream: ${dream}
Specific: ${specific}
Measurable: ${measurable || "Not provided"}
Achievable: ${achievable || "Not provided"}
Relevant: ${relevant || "Not provided"}
Time-bound: ${timebound}

Task:
Refine the SMART goal based on the user's feedback while maintaining the SMART framework.

Return ONLY the refined SMART goal statement in this format:
"I will [specific achievement] by [target date], measured by [measurable outcomes]."

Make it clear, inspiring, and action-oriented.`;
    } else {
      prompt = `You are a SMART goal creation coach.

User Inputs:
Dream: ${dream}
Specific: ${specific}
Measurable: ${measurable || "Not provided"}
Achievable: ${achievable || "Not provided"}
Relevant: ${relevant || "Not provided"}
Time-bound: ${timebound}

Task:
Create ONE clear SMART goal statement that combines all these elements.

Format:
"I will [specific achievement] by [target date], measured by [measurable outcomes]."

Requirements:
- Make it specific and concrete
- Include measurable indicators
- Make it inspiring and action-oriented
- Keep it to one powerful sentence
- Use the exact date provided

Return ONLY the SMART goal statement, nothing else.`;
    }

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
            content: "You are a professional SMART goal coach who creates clear, powerful, and actionable goal statements."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
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
    const smartGoal = openaiData.choices[0].message.content.trim();

    return new Response(
      JSON.stringify({ smartGoal }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-goal-draft function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
