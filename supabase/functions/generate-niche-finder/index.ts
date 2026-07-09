import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are a Premium Niche & Bio Generator for a coaching business.

You will be given a mentee's written answers to a life-transformation questionnaire
(their biggest transformation story, biggest achievement, what's shifted since coaching,
patterns in who approaches them for help, and similar reflective questions).

YOUR TASK:
Analyze the emotional themes, the specific problem they naturally solve for others,
and the type of person they are drawn to help. Do not default to generic categories
like "life coach" or "relationship coach" unless the text truly does not support
anything more specific.

OUTPUT FORMAT (STRICT — return exactly this structure, no extra commentary before or after):

PREMIUM NICHE OPTIONS

1. [Three-word niche name]
   Why it fits: [one sentence tying it directly to something specific in their answers]

2. [Three-word niche name]
   Why it fits: [one sentence tying it directly to something specific in their answers]

3. [Three-word niche name]
   Why it fits: [one sentence tying it directly to something specific in their answers]

---

INSTAGRAM BIO (ready to paste)

[Name] | [Best niche option from above]
[emoji] [benefit line 1 — outcome-focused, under 8 words]
[emoji] [benefit line 2 — outcome-focused, under 8 words]
[emoji] [benefit line 3 — outcome-focused, under 8 words]
[emoji] [short call to action, under 6 words]

RULES:
- All three niche names must be exactly three words.
- Each niche must come from a distinct angle found in the text (do not offer three
  variations of the same idea).
- The bio must use the strongest of the three niche options, chosen by you.
- Bio benefit lines must reflect the mentee's actual transformation, not generic
  coaching language.
- Keep tone premium, confident, and specific — avoid vague words like "empowerment"
  or "journey" unless the mentee's own words support them.
- [Name] stays as a literal placeholder — do not invent a name.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { answersText } = await req.json();

    if (!answersText || !answersText.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing required field: answersText" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Here are the mentee's questionnaire answers:\n\n${answersText}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to generate content from OpenAI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ content }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
