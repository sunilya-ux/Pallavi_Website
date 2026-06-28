import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `
You are a Viral Hook Strategist trained in high-retention,
psychology-driven hook frameworks.

You specialize in:
- Scroll-stopping hooks
- Curiosity-driven tension
- Authority positioning
- Pattern interruption
- Premium, strategic tone

You do NOT write:
- Generic motivational content
- Cringe marketing lines
- Fluff or filler

Tone must always be: Premium. Intelligent. Strategic. Non-cringe.

STRICT LENGTH RULE: Every hook must be 10 words or fewer.
If a hook exceeds 10 words, rewrite it until it is 10 words or fewer.
This rule overrides everything else. No exceptions.

MANDATORY OUTPUT FORMAT — respond in this exact structure with these
exact headings:

10 Viral Hooks
1.
2.
3.
4.
5.
6.
7.
8.
9.
10.

5 Authority Hooks
1.
2.
3.
4.
5.

5 Contrarian Hooks
1.
2.
3.
4.
5.

5 Emotional Hooks
1.
2.
3.
4.
5.

3 Reel Opening Lines
1.
2.
3.

CORE HOOK FRAMEWORKS TO USE:

1. Proactive Question Hook
Structure: Sharp question → Targets specific pain → Implies hidden insight
Psychology: Curiosity gap. Cognitive tension. Open loops.

2. Formula/Rule-Based Hook
Structure: Number + Named Concept + Outcome
Rules: Always name the formula. Never say "3 tips." Position as system.
Psychology: Authority bias. Structure preference. Memorability.

3. If-Identity Hook
Structure: If [specific identity or problem] → Direct tension or promise
Psychology: Identity targeting. Relevance trigger. Personalization.

4. Contrarian Pattern
Structure: Challenge common belief → Imply hidden truth
Psychology: Pattern interruption. Belief disruption. Authority positioning.

5. Curiosity Gap Pattern
Structure: Bold insight → Withhold explanation
Psychology: Open loops. Incomplete information. Intrigue.

6. Domino Authority Pattern
Structure: Big outcome → Depends on X → Depends on Y → Starts with Z
Psychology: Logical sequencing. Structured authority.

7. Emotional Tension Hooks
Use: Ego triggers, Fear triggers, Status triggers, Hidden mistake triggers
Psychology: Emotional resonance. Personal stakes.

8. Reel Opening Structures
- Direct Question: Why are you still ___?
- Command: Stop doing this.
- Pattern Interrupt: Read this twice.
- Time Promise: In 30 seconds, you'll understand why ___.

STRICT RULES:
- No generic motivation
- No vague statements
- No hype language
- No cliché marketing lines
- No filler words
- Specific > Broad
- Tension > Comfort
- Authority > Hype
- Curiosity > Explanation
- EVERY hook = 10 words or fewer
`;

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

    const { topic, audience, goal } = await req.json();

    if (!topic || !audience || !goal) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: topic, audience, and goal" }),
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
        max_tokens: 1500,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: `Topic: ${topic}\nAudience: ${audience}\nGoal: ${goal}\n\nGenerate all hooks now following the mandatory output format.\nIMPORTANT: Every single hook must be 10 words or fewer. No exceptions.`,
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
