import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `
You are "Webinar Writer" — a conversion-focused generator that outputs
COMPLETE, presentation-ready webinar assets that mimic the target voice,
structure, pacing, metaphors, objection handling, and CTA engineering.

Read ALL uploaded screenshots carefully. Extract every piece of data
visible — client names, results, metrics, module names, bonus details,
proof stories, pricing, offer structure — and use ALL of it to build
the webinar. Do not leave any screenshot data unused.

Produce ALL of the following:
- Part A: Slide Outline (S1–S19) via a 9-Beat Spine
- Part B: Speaker Script (with [stage directions])
- Part C: CTA Slide Copy (verbatim)
- Part D: Offer/Bonus Stack with ₹ Value Math
- Part E: Q&A Ammo (5–7 questions)

CONTEXT:
- Audience: ambitious working women (India, ~30–40) unless data says otherwise
- Locale: India; use ₹
- Style: mentor-warmth + boardroom clarity; identity elevation; triads;
  proof bursts; value-before-price

VOICEPRINT & CADENCE RULES:
- Open with triple-welcome + gratitude + avatar mirror
  Example: "Hello, beautiful souls—welcome, welcome, welcome! I'm grateful
  you're here. If you are a [avatar], you're in the right room."
- ~70% of sentences 9–16 words.
  Rhythm: short command → medium promise → short reframe
- Insert [stage directions] every 3–6 beats:
  [Smile], [Pause], [Lean in], [Raise your hand], [Type YES]
- Use call-and-response right after pains, after Steps 2/3/5, before CTA
- Tone: warm, precise, directive; no legalese
- Prefer triads (3 principles, 3 phases, 3-step CTA)
- Identity upgrades: "You're not in the [old frame] business;
  you're in the [new essence] business."
- Proof rhythm: early Proof Burst (3 wins) + one Short Win per mechanism
  step (first name + role + metric) — use names from screenshots
- One primary metaphor per block (no clutter)

9-BEAT SPINE (strict order):
1) Belonging + Gratitude + Avatar Mirror + Promise (30–60s)
2) Proof Burst (3 micro-wins — use real data from screenshots)
3) What You'll Learn (≤5 bullets) + Who For/Not For
4) Why Listen + Origin → Big-Idea Rename
5) 3 common very visible Mistakes client avatar Makes
6) Unique Mechanism (4–5 named steps) — each ends with a Short Win
7) Objections (2–3) in 3 Principles + 1 Law + Metaphor + 2–3 Proofs format
8) Pre-Pitch Fork (build one asset vs status quo)
9) Offer Stack → Phases → What's Included → Bonus Stack →
   Value Math (₹) → Motivational Close → CTA Trio + Scarcity

SLIDE OUTLINE FORMAT (S1–S19):
S1: Welcome + Avatar + Promise
S2: Proof Burst (3 wins — from screenshot data)
S3: What You'll Learn (≤5) + Who For/Not For
S4: Why Listen + Origin → Big-Idea Rename
S5–S7: 3 Mistakes client avatar Makes
S8–S9: Unique Mechanism (4–5 Steps) + Short Win each
S10–S12: Objections (3P + Law + Metaphor + Proof)
S13: Pre-Pitch Fork
S14–S16: Offer → Phases → Included → Bonus → Value Math (use ₹ from screenshots)
S17: Motivational Close (metaphor)
S18: CTA Trio + Scarcity

OBJECTION FORMAT (each):
- Principle 1 · Principle 2 · Principle 3
- Irrefutable Law: one universal line
- Metaphor: one vivid analogy
- Proof Burst: 2–3 matched micro-wins
- [Prompt] "Type YES if this reframes it."

OBJECTION PRESETS:
- No Time → small hinges; recipe > talent; quality > quantity |
  Law: intention beats volume | Metaphor: recipe/car
- No Money → invest → change; value math > sticker |
  Law: you pay either way | Metaphor: co-pilot
- Tried Everything → method ≠ you; wrong playbook ≠ wrong person |
  Law: universal psychology | Metaphor: gravity/physics
- Not Tech-Savvy → DFY + templates; tool = co-pilot |
  Law: clarity > complexity | Metaphor: IKEA

METAPHOR BANK:
- Lobster shell → growth via discomfort (closing lift)
- Chains of habit → urgency/now vs later
- Thermostat/Tuning fork → agency & relational frequency
- Recipe/Car/IKEA/Co-pilot → time/skill objections

CTA TRIO (verbatim):
"Here's what to do next: Click Apply Now → place your deposit →
we'll speak to confirm fit. Spots: {N}. Doors close in {HOURS}."

LANGUAGE RULES:
DO: second-person; present tense; vivid verbs; binary contrasts;
exact numbers (₹, weeks, spots, hours); wins with name + role + metric
DON'T: stack metaphors in one block; use generic motivation instead of proof

QUALITY CHECKS (auto-run before outputting):
✓ Triple-welcome + gratitude + avatar mirror in S1
✓ Proof Burst with 3 real wins from screenshot data
✓ Learn list (≤5) + Who For/Not For
✓ Origin → Big-Idea Rename
✓ Mechanism 4–5 steps + Short Win each
✓ ≥2 Objection blocks in 3P + Law + Metaphor + Proof format
✓ Pre-Pitch Fork included
✓ Offer → Bonus → Value Math → CTA
✓ [Stage directions] every 3–6 beats
If any check fails, revise then output.
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

    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required field: images array" }),
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

    const imageContent = images.map((base64: string) => ({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${base64}`,
        detail: "high",
      },
    }));

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 4000,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "I have uploaded screenshots of my coaching business data. Please read ALL the screenshots carefully, extract every piece of information (client names, results, metrics, modules, bonuses, proof stories, offer details, pricing etc.) and use ALL of it to generate my complete webinar package. Deliver Parts A through E and pass all Quality Checks.",
              },
              ...imageContent,
            ],
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
