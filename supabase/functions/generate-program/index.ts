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

const systemPrompt = `You are an expert coaching program designer. Using the coach's niche, who they help, their struggle and the desired result, build a 4-module coaching program in 4 stages:

STAGE 1 — Write exactly 4 steps a person in this audience must take to go from their current situation to the desired result. Each step: short title + one-line description.
STAGE 2 — DIPICTO: for EACH step, list what this audience will face while taking it: Doubts, Issues, Pains, Irritation/frustration, Challenges, Troubles, Obstacles. One short, specific point for each of the 7 (in the audience's own words, real and emotional).
STAGE 3 — Turn EACH DIPICTO point into a concrete, result-oriented "How to ..." question (e.g. "How to lose baby weight without strict dieting?", "How to earn your first ₹1 lakh as a coach?").
STAGE 4 — For each step, choose the ONE most powerful how-to question, and give it ONE catchy module name.

Also create ONE overall program name.

NAMING STYLE (very important) — names must be short (2–7 words), emotional, result-oriented, and paint a picture in the reader's mind. Avoid generic names like "Module 1: Basics" or "Introduction to Fitness". Learn from these examples of great names:
"Basics Of Mathematics & Focused Mind", "Getaway from Anxious to Assured in Mathematics", "3 Point Pro-Res Video Setup", "Instant Video Topic Generator", "Magic Scripting Formula", "40 Instantly Clickable Video Titles", "DIY ₹3300 Studio", "Magic EMI Calculator", "Get Super Assertive Quiz", "Viral Video Ideas Cheatsheet", "The Ultimate Guide to [Specific Topic]", "The Step-by-Step Blueprint for [Achieving Desired Result]", and for weight loss: "Fit Into Your Old Dress Again".
Power words you may use: Magic, Formula, Blueprint, Ultimate, Instant, Secret, Cheatsheet, Code, Shortcut, DIY, numbers. The program name may use a "From [pain] to [result]" or "Getaway from X to Y" style.

Return ONLY valid JSON:
{ "program_name": "",
  "steps": [ { "title": "", "description": "",
               "dipicto": [ { "type": "Doubts", "point": "", "how_to": "" }, ... 7 items in order Doubts, Issues, Pains, Irritation, Challenges, Troubles, Obstacles ],
               "module": { "how_to": "", "name": "" } } ] }`;

const DIPICTO_TYPES = ['Doubts', 'Issues', 'Pains', 'Irritation', 'Challenges', 'Troubles', 'Obstacles'];

function buildUserSummary(input: ProgramInput): string {
  const lines: string[] = [];
  lines.push(`Niche: ${input.niche.trim()}`);
  lines.push(`Who they help: ${input.who.trim()}`);
  lines.push(`Their struggle: ${input.struggle.trim()}`);
  lines.push(`Desired result: ${input.result.trim()}`);
  return lines.join('\n');
}

function trimAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) return cut.slice(0, lastSpace).trimEnd();
  return cut.trimEnd();
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
    if (typeof step.title !== 'string' || step.title.trim().length === 0) {
      return { ok: false, reason: 'incomplete_result' };
    }
    const mod = step.module;
    if (!mod || typeof mod !== 'object') return { ok: false, reason: 'incomplete_result' };
    if (typeof mod.name !== 'string' || mod.name.trim().length === 0) {
      return { ok: false, reason: 'incomplete_result' };
    }
    if (typeof mod.how_to !== 'string' || mod.how_to.trim().length === 0) {
      return { ok: false, reason: 'incomplete_result' };
    }
  }

  return { ok: true, reason: '' };
}

function softFix(data: any): any {
  const programName = trimAtWord(
    (typeof data.program_name === 'string' ? data.program_name.trim() : 'Your Signature Program') || 'Your Signature Program',
    80,
  );

  const steps = (data.steps as any[])
    .filter((s: any) => s && typeof s === 'object')
    .slice(0, 4)
    .map((s: any) => {
      const dipicto = Array.isArray(s.dipicto)
        ? s.dipicto
            .filter((d: any) => d && typeof d === 'object')
            .slice(0, 7)
            .map((d: any) => ({
              type: (typeof d.type === 'string' && d.type.trim().length > 0) ? d.type.trim() : 'Doubts',
              point: (typeof d.point === 'string' && d.point.trim().length > 0) ? d.point.trim() : '',
              how_to: (typeof d.how_to === 'string' && d.how_to.trim().length > 0) ? d.how_to.trim() : '',
            }))
        : [];

      const mod = s.module && typeof s.module === 'object' ? s.module : {};
      return {
        title: (typeof s.title === 'string' && s.title.trim().length > 0) ? s.title.trim() : 'Step',
        description: (typeof s.description === 'string' && s.description.trim().length > 0) ? s.description.trim() : '',
        dipicto,
        module: {
          how_to: (typeof mod.how_to === 'string' && mod.how_to.trim().length > 0) ? mod.how_to.trim() : '',
          name: trimAtWord(
            (typeof mod.name === 'string' && mod.name.trim().length > 0) ? mod.name.trim() : 'Module',
            80,
          ),
        },
      };
    });

  return { program_name: programName, steps };
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
          max_tokens: 4000,
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
