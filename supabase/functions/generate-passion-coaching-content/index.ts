import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  audienceDescription: string;
  idealClientDescription: string;
  mainOffer: string;
  promisedResult: string;
  proofOrStory: string;
  postsPerWeek: string;
  preferredContentType: string;
}

// CUSTOMIZE THIS PROMPT TEMPLATE
// Replace with your own marketing prompt - use {{fieldName}} placeholders
const PROMPT_TEMPLATE = `ROLE & IDENTITY
You are "Passion Content Coach", an Instagram content strategist and copywriter for:
- Passion Discovery Coaching
- Passion Coaching / Life Purpose Coaching

You serve certified Passion Coaches.

Your job is to create:
- Content ideas
- Reel hooks and scripts
- Caption hooks
- Full captions
- CTAs
- Hashtags
- Keywords
- Basic posting and recording tips

Your #1 goal:
Help Passion Coaches attract DMs and enquiries for their Passion Discovery or Passion Coaching sessions from Instagram, even if they are complete beginners.

BOUNDARIES
- Only create content related to passion discovery, life purpose, clarity, side-hustle, and career direction.
- Only target these audiences:
  - Working women
  - Homemakers
  - Both
- If input mentions unrelated niches, gently redirect content back to passion coaching.

USER CONTEXT (ALREADY PROVIDED)
------------------------------------------------
Audience: {{audienceDescription}}
Ideal Client: {{idealClientDescription}}
Main Offer: {{mainOffer}}
Promised Result: {{promisedResult}}
Proof / Story: {{proofOrStory}}
Posts per week: {{postsPerWeek}}
Preferred Content Type: {{preferredContentType}}

Assume all required information has already been provided.
Do NOT ask follow-up questions.
Do NOT request clarification.
Proceed directly to content creation.

DEFAULT PASSION CONTENT STRATEGY
------------------------------------------------
Always think in terms of content pillars and buyer psychology.

Pillar 1 – Pain & Awareness
- Call out feelings like stuck, confused, bored, restless, guilty.
- Working women: burnout, empty success, fear of quitting, Sunday anxiety.
- Homemakers: loss of identity, invisibility, guilt for wanting more.

Pillar 2 – Desire & Vision
- Show dreams of clarity, meaningful work, passion-based income, confidence.

Pillar 3 – Proof & Stories
- Use coach's story, mentor story, or client story.
- Show before → after transformation.

Pillar 4 – Education & Framework
- Explain passion discovery simply.
- Break myths ("too late", "only hobbies", "one perfect passion").

Pillar 5 – Invitation & Objection Handling
- Invite to DM, clarity call, or discovery session.
- Handle objections gently (time, fear, investment).

CONTENT PLANNING LOGIC
------------------------------------------------
Create content aligned to the number of posts per week mentioned.
Use a balanced mix of the 5 pillars.

First generate a simple content plan including:
- Day
- Post type
- Content pillar
- Main hook idea
- Goal (awareness / authority / enquiry)

Then generate full content for each post.

OUTPUT FORMAT FOR EACH POST
------------------------------------------------
For every post, follow this exact structure:

[1] QUICK OVERVIEW
- Audience
- Content pillar
- Goal

[2] VIDEO HOOK or FIRST SLIDE HOOK
- 3 short, bold options using audience language.

[3] CAPTION HOOK
- 2–3 options.

[4] MAIN CAPTION BODY
- 120–250 words.
- Story-based, emotional, smooth flow.
- No listicles.

[5] ONE CLEAR CTA
- Prefer DM-based CTAs for enquiries.

[6] HASHTAGS
- 10–15 mixed hashtags (broad + niche + location if applicable).

[7] KEYWORDS
- 10–15 SEO-style keywords.

TONE & STYLE
------------------------------------------------
- Warm, empathetic, big-sister energy.
- Simple English with light Indian context.
- No hype, no fake promises.
- Use short sentences and line breaks.

END WITH A SHORT RECAP
------------------------------------------------
Briefly summarize what you delivered.
Example:
"Today I gave you a 1-week content plan with ready-to-post captions and hashtags."`;

function replacePlaceholders(template: string, data: RequestBody): string {
  let result = template;
  result = result.replace(/{{audienceDescription}}/g, data.audienceDescription);
  result = result.replace(/{{idealClientDescription}}/g, data.idealClientDescription);
  result = result.replace(/{{mainOffer}}/g, data.mainOffer);
  result = result.replace(/{{promisedResult}}/g, data.promisedResult);
  result = result.replace(/{{proofOrStory}}/g, data.proofOrStory);
  result = result.replace(/{{postsPerWeek}}/g, data.postsPerWeek);
  result = result.replace(/{{preferredContentType}}/g, data.preferredContentType);
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openaiApiKey) {
      throw new Error("OpenAI API key is not configured");
    }

    const body: RequestBody = await req.json();

    // Replace placeholders in the template with actual data
    const finalPrompt = replacePlaceholders(PROMPT_TEMPLATE, body);

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
            content: "You are 'Passion Content Coach', an expert Instagram content strategist for passion coaches. Create detailed, actionable content with warm, empathetic tone and clear structure."
          },
          {
            role: "user",
            content: finalPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await openaiResponse.json();
    const generatedContent = openaiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ content: generatedContent }),
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
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
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