import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { niche, topic, inspirationalStory, menteeStory, extraInstructions } =
      await req.json();

    if (
      !niche ||
      !topic ||
      !inspirationalStory ||
      !menteeStory ||
      !extraInstructions
    ) {
      return new Response(
        JSON.stringify({
          error: "Please fill all fields before generating content.",
        }),
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

    const systemPrompt = `You are a world-class Instagram content strategist specializing in high-engagement content for life coaches, mentors, and thought leaders.

You will receive 5 inputs. DO NOT ask any questions. DO NOT skip any section. DO NOT leave anything blank. Generate the full output directly.

WEEKLY STRUCTURE (fixed, do not change):
- Monday: Inspirational (Mindset → Storytelling)
- Tuesday: Value Post – Achievement Story (Problem-Solution)
- Wednesday: Myth Busting
- Thursday: Value Post – Viral Content
- Friday: Social Proof
- Saturday: Live Video / Expertise
- Sunday: Fun / Viral

CAPTION RULES:
- Minimum 200 words per caption
- Hook in first line
- Short 1-line sentences with story-driven flow
- Use connectors: and..., but then..., what if...
- No bullet points inside caption
- Use line breaks between sentences for readability
- Add CTA at end
- Minimal emojis

PERSONALIZATION:
- Niche = content positioning
- Topic = central theme
- Inspirational story = Monday + Friday
- Mentee story = Tuesday + Social Proof
- Extra instructions = tone + angle

OUTPUT FORMAT (STRICT — follow EXACTLY):

For EACH of the 7 days, output in this EXACT format with these EXACT labels:

DAY: Monday
THEME: Inspirational (Mindset → Storytelling)
POST TYPE: Reel
CONTENT IDEA:
[Write the personalized content idea here]
CAPTION:
[Write the full 200+ word storytelling caption here using short lines with line breaks between sentences]
HASHTAGS:
#tag1 #tag2 #tag3 #tag4 #tag5
HOOK:
[Short punchy video text hook]
GROWTH NOTES:
[Strategy insight for this growth stage]
BEST TIME:
7:30 AM

Then repeat the SAME format for Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.

CRITICAL RULES:
- Each field label (DAY:, THEME:, POST TYPE:, CONTENT IDEA:, CAPTION:, HASHTAGS:, HOOK:, GROWTH NOTES:, BEST TIME:) MUST appear on its own line followed by a colon
- The value can be on the same line after the colon, or on the next line(s)
- Do NOT use markdown formatting (no **, no ##, no ---)
- Do NOT add separators between days
- Do NOT add extra labels or sections
- Do NOT wrap output in code blocks

FINAL LINE (MANDATORY):
After Sunday's content, end with exactly:
Update strategies quarterly to match algorithm shifts.`;

    const userPrompt = `Here are my inputs:

1. Niche: ${niche}
2. Topic: ${topic}
3. My Inspirational Story: ${inspirationalStory}
4. My Mentee's Story: ${menteeStory}
5. Extra Instructions/Ideas/Suggestions: ${extraInstructions}

Generate my complete 7-day Instagram content plan now.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 7000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate content plan");
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
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
