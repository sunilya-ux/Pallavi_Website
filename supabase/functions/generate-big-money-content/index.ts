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

You will receive 5 inputs. DO NOT ask any questions. DO NOT skip any field. Generate the full output directly.

WEEKLY STRUCTURE (fixed, do not change):
- Monday: Inspirational (Mindset to Storytelling)
- Tuesday: Value Post - Achievement Story (Problem-Solution)
- Wednesday: Myth Busting
- Thursday: Value Post - Viral Content
- Friday: Social Proof
- Saturday: Live Video / Expertise
- Sunday: Fun / Viral

CAPTION RULES:
- Minimum 200 words per caption
- Hook in first line
- Short 1-line sentences with story-driven flow
- Use connectors: and..., but then..., what if...
- No bullet points inside caption
- Use \\n for line breaks between sentences
- Add CTA at end
- Minimal emojis

PERSONALIZATION:
- Niche = content positioning
- Topic = central theme
- Inspirational story = Monday + Friday
- Mentee story = Tuesday + Social Proof
- Extra instructions = tone + angle

OUTPUT: Return ONLY valid JSON. No markdown. No code fences. No explanation text before or after. Just the raw JSON object.

The JSON must match this exact structure:

{
  "week_plan": [
    {
      "day": "Monday",
      "theme": "Inspirational (Mindset → Storytelling)",
      "post_type": "Reel",
      "idea": "personalized content idea",
      "caption": "200+ word story-format caption with \\n line breaks",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
      "hook": "short punchy video text hook",
      "notes": "growth strategy insight",
      "time": "7:30 AM EST"
    }
  ],
  "final_note": "Update strategies quarterly to match algorithm shifts."
}

The week_plan array MUST contain exactly 7 objects, one for each day Monday through Sunday, in order.`;

    const userPrompt = `Generate my 7-day Instagram content plan:

Niche: ${niche}
Topic: ${topic}
My Inspirational Story: ${inspirationalStory}
My Mentee's Story: ${menteeStory}
Extra Instructions: ${extraInstructions}`;

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
        max_tokens: 8000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      throw new Error("Failed to generate content plan");
    }

    const data = await response.json();
    const raw = data.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("Failed to parse AI JSON:", raw);
      throw new Error("AI returned invalid JSON");
    }

    if (!parsed.week_plan || !Array.isArray(parsed.week_plan)) {
      throw new Error("AI response missing week_plan array");
    }

    return new Response(JSON.stringify(parsed), {
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
