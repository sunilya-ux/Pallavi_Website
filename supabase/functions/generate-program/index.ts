import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProgramInput {
  niche: string;
  who: string;
  struggle: string;
  result: string;
}

const systemPrompt = `You are an expert premium coaching-offer designer. Create a complete, sales-ready coaching program offer for this coach.

INTERNAL THINKING (do NOT include in the output): first work out 4 steps the audience must take to reach the result; for each step think through their Doubts, Issues, Pains, Irritations, Challenges, Troubles and Obstacles (DIPICTO); turn these into concrete "How to…" questions; then use the most powerful ones to shape the 4 steps below.

FORMAT RULE (very important): NEVER mention the program format anywhere — no duration (weeks/months/days), no number of sessions, no "1:1", "private", "group", "live", "online" or "offline". The coach will decide the format herself.

OUTPUT, written in warm, confident, simple English that the audience would use, specific to this niche (no generic coaching jargon like "unlock your potential", "journey", "empower"):
1. program_name — short, memorable, ends with ™ (e.g. "The Money Expansion Method™").
2. tagline — one punchy line (e.g. "Break Through Your Money Ceiling. Own Your Value. Build a Business That Earns More.").
3. subtitle — one sentence: "A Coaching Experience for [audience] Ready to [result]…" (no duration or format).
4. core_promise — 1–2 sentences: "Move from [current pain] to [desired result]…".
5. designed_for — exactly 6 bullets describing who this program is for (their situation, struggles, ambitions).
6. steps — exactly 4 steps, each with:
   - label: 2–4 word UPPERCASE theme (e.g. "BREAK THE CEILING", "OWN YOUR VALUE").
   - title: a long, exciting, result-oriented title ending with ™ that paints a picture, may include a number or rupee figure where it fits (e.g. "Break Free from Your ₹3L–₹5L Income Ceiling & Unlock Your Next Level of Money™", "Charge Premium Prices, Attract Aligned Clients & Get Paid What You're Truly Worth™").
   - intro: 1–2 sentences starting with "Stop …" then what they will start doing.
   - imagine: 5–6 bullets completing "Imagine being able to:" — concrete, visible, everyday results.
   - dream_outcome: one first-person quote from the client, in their own emotional words.
7. includes — exactly 6 deliverables / tools that make the offer feel premium (e.g. a personal assessment, a personalised pattern map, a personalised roadmap, accountability support, a progress tracker, a toolkit or cheatsheet). Each: title + one-sentence description of what it gives the client. Do NOT mention session counts, duration or delivery format, and do NOT invent named therapy/coaching methods or certifications.

Return ONLY valid JSON:
{ "program_name": "", "tagline": "", "subtitle": "", "core_promise": "",
  "designed_for": ["", "", "", "", "", ""],
  "steps": [ { "label": "", "title": "", "intro": "", "imagine": ["", ""], "dream_outcome": "" } ],
  "includes": [ { "title": "", "description": "" } ] }`;

function buildUserSummary(input: ProgramInput): string {
  const lines: string[] = [];
  lines.push(`Niche: ${input.niche.trim()}`);
  lines.push(`Who they help: ${input.who.trim()}`);
  lines.push(`Their struggle: ${input.struggle.trim()}`);
  lines.push(`Desired result: ${input.result.trim()}`);
  return lines.join('\n');
}

function hardCheck(data: any): { ok: boolean; reason: string } {
  if (!data || typeof data !== 'object') return { ok: false, reason: 'invalid_json' };

  if (typeof data.program_name !== 'string' || data.program_name.trim().length === 0) {
    return { ok: false, reason: 'incomplete_result' };
  }

  if (!Array.isArray(data.steps) || data.steps.length < 4) {
    return { ok: false, reason: 'incomplete_result' };
  }

  for (let i = 0; i < 4; i++) {
    const step = data.steps[i];
    if (!step || typeof step !== 'object') return { ok: false, reason: 'incomplete_result' };
    if (typeof step.label !== 'string' || step.label.trim().length === 0) {
      return { ok: false, reason: 'incomplete_result' };
    }
    if (typeof step.title !== 'string' || step.title.trim().length === 0) {
      return { ok: false, reason: 'incomplete_result' };
    }
    if (typeof step.dream_outcome !== 'string' || step.dream_outcome.trim().length === 0) {
      return { ok: false, reason: 'incomplete_result' };
    }
    if (!Array.isArray(step.imagine) || step.imagine.length < 3) {
      return { ok: false, reason: 'incomplete_result' };
    }
  }

  return { ok: true, reason: '' };
}

function softFix(data: any): any {
  const programName =
    typeof data.program_name === 'string' && data.program_name.trim().length > 0
      ? data.program_name.trim()
      : 'Your Signature Program™';

  const tagline =
    typeof data.tagline === 'string' && data.tagline.trim().length > 0
      ? data.tagline.trim()
      : '';

  const subtitle =
    typeof data.subtitle === 'string' && data.subtitle.trim().length > 0
      ? data.subtitle.trim()
      : '';

  const corePromise =
    typeof data.core_promise === 'string' && data.core_promise.trim().length > 0
      ? data.core_promise.trim()
      : '';

  const designedFor: string[] = Array.isArray(data.designed_for)
    ? data.designed_for
        .filter((d: any) => typeof d === 'string' && d.trim().length > 0)
        .map((d: any) => d.trim())
        .slice(0, 6)
    : [];

  const steps = Array.isArray(data.steps)
    ? data.steps
        .filter((s: any) => s && typeof s === 'object')
        .slice(0, 4)
        .map((s: any) => {
          const imagine: string[] = Array.isArray(s.imagine)
            ? s.imagine
                .filter((im: any) => typeof im === 'string' && im.trim().length > 0)
                .map((im: any) => im.trim())
                .slice(0, 6)
            : [];

          let dreamOutcome =
            typeof s.dream_outcome === 'string' && s.dream_outcome.trim().length > 0
              ? s.dream_outcome.trim()
              : '';

          dreamOutcome = dreamOutcome.replace(/^["'"']+|["'"']+$/g, '');

          return {
            label:
              typeof s.label === 'string' && s.label.trim().length > 0
                ? s.label.trim()
                : 'STEP',
            title:
              typeof s.title === 'string' && s.title.trim().length > 0
                ? s.title.trim()
                : 'Step',
            intro:
              typeof s.intro === 'string' && s.intro.trim().length > 0
                ? s.intro.trim()
                : '',
            imagine,
            dream_outcome: dreamOutcome,
          };
        })
    : [];

  const includes = Array.isArray(data.includes)
    ? data.includes
        .filter((inc: any) => inc && typeof inc === 'object')
        .slice(0, 6)
        .map((inc: any) => ({
          title:
            typeof inc.title === 'string' && inc.title.trim().length > 0
              ? inc.title.trim()
              : '',
          description:
            typeof inc.description === 'string' && inc.description.trim().length > 0
              ? inc.description.trim()
              : '',
        }))
    : [];

  return {
    program_name: programName,
    tagline,
    subtitle,
    core_promise: corePromise,
    designed_for: designedFor,
    steps,
    includes,
  };
}

function errorResponse(status: number, reason: string) {
  return new Response(
    JSON.stringify({ error: "friendly", reason }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { niche, who, struggle, result }: ProgramInput = await req.json();

    if (!niche || typeof niche !== 'string' || niche.trim().length === 0 ||
        !who || typeof who !== 'string' || who.trim().length === 0 ||
        !struggle || typeof struggle !== 'string' || struggle.trim().length === 0 ||
        !result || typeof result !== 'string' || result.trim().length === 0) {
      return errorResponse(400, "invalid_json");
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return errorResponse(500, "missing_api_key");
    }

    const userSummary = buildUserSummary({ niche, who, struggle, result });

    const callOpenAI = async (): Promise<any> => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          response_format: { type: "json_object" },
          temperature: 0.8,
          max_tokens: 4500,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userSummary },
          ],
        }),
      });

      if (response.status === 429) {
        throw { retryable: true, reason: 'rate_limited' };
      }

      if (response.status >= 500) {
        throw { retryable: true, reason: 'openai_error' };
      }

      if (!response.ok) {
        throw { retryable: false, reason: 'openai_error' };
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      try {
        return JSON.parse(content);
      } catch {
        throw { retryable: true, reason: 'invalid_json' };
      }
    };

    let resultData: any = null;
    let success = false;
    let lastReason = 'openai_error';

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        resultData = await callOpenAI();
        const check = hardCheck(resultData);
        if (check.ok) {
          success = true;
          break;
        }
        lastReason = check.reason;
        console.log(`generate-program: attempt ${attempt + 1} failed — ${lastReason}`);
        if (attempt < 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err: any) {
        lastReason = err?.reason || 'openai_error';
        const retryable = err?.retryable ?? false;
        console.log(`generate-program: attempt ${attempt + 1} failed — ${lastReason} (retryable: ${retryable})`);
        if (retryable && attempt < 1) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        break;
      }
    }

    if (!success || !resultData) {
      return errorResponse(500, lastReason);
    }

    const fixed = softFix(resultData);

    return new Response(JSON.stringify(fixed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-program error:", error);
    return errorResponse(500, "openai_error");
  }
});
