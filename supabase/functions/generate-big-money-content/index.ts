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

    const systemPrompt = `You are a world-class social media strategist and copywriter specializing in high-engagement Instagram content for life coaches, mentors, and thought leaders.

You will receive 5 inputs from the user:
1. Niche
2. Topic
3. Inspirational Story
4. Mentee's Story
5. Extra Instructions / Ideas / Suggestions

DO NOT ask any questions. Generate the full output directly.

CONTENT RULES — Follow this EXACT weekly structure:

Monday — Inspirational (Mindset → Storytelling)
Tuesday — Value Post – Achievement Story (Problem-Solution)
Wednesday — Myth Busting
Thursday — Value Post – Viral Content
Friday — Social Proof
Saturday — Live Video / Expertise
Sunday — Fun / Viral

DO NOT change the structure.

CAPTION RULES (VERY IMPORTANT):
- Minimum 200 words per caption
- Hook in first line
- Short 1-line sentences
- Story-driven flow
- Use connectors: and…, but then…, what if…
- No bullet points inside caption
- Multi-line readable format with spacing between lines
- Do NOT use "<br>" tags
- Do NOT write captions as dense paragraph blocks
- Each sentence on its own line with a blank line between groups of 2-3 sentences
- Add CTA at end
- Minimal emojis

PERSONALIZATION LOGIC:
- Niche → content positioning
- Topic → central theme
- Inspirational story → Monday + Friday
- Mentee story → Tuesday + Social Proof
- Extra instructions → tone + angle

OUTPUT FORMAT (STRICT — TABLE STYLE):

IMPORTANT FORMATTING RULES:
- Output MUST be in table-style rows, NOT section blocks
- Column headers appear ONLY ONCE at the top
- Each day = ONE ROW separated by a dashed line
- Do NOT repeat headings for each day
- Do NOT use markdown table syntax
- Do NOT use "|" pipe symbols
- Keep spacing aligned and clean

Start with this EXACT header row:

Day & Theme    Post Type    Content Idea    Caption (200+ words + CTA)    Hashtags    Video Text Hook    Growth Stage Notes    Best Posting Time

Then a separator line: ------------------------------------------------

Then for EACH DAY, output ONE ROW in this format:

------------------------------------------------
Monday — Inspirational (Mindset → Storytelling)
Reel
[Personalized content idea based on niche + stories]
[Full 200+ word caption in multi-line readable story format with spacing between lines]
[Relevant hashtags]
[Short punchy hook for video text overlay]
[Strategy insight for this day]
[Best posting time with timezone note]
------------------------------------------------
Tuesday — Value Post – Achievement Story (Problem-Solution)
Carousel
[Content idea]
[Caption]
[Hashtags]
[Hook]
[Notes]
[Time]
------------------------------------------------

Continue this SAME structure for ALL 7 DAYS (Monday through Sunday).

FINAL LINE (MANDATORY):
After the Sunday row, end with exactly:
"Update strategies quarterly to match algorithm shifts."`;

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
        max_tokens: 6000,
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
