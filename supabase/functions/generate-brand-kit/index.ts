import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CheckboxQuestion {
  options: string[];
  selected: string[];
  otherText: string;
}

interface Answers {
  selectedNiche: string | null;
  customNiche: string;
  transformationStory: string;
  benefitGroup: CheckboxQuestion;
  lifeStage: CheckboxQuestion;
  naturalHelpSeekers: CheckboxQuestion;
  lifeStageDetail: string;
  naturalHelpDetail: string;
  patternAudience: string;
  patternProblem: string;
  patternTransformation: string;
  patternExpertise: string;
  nicheAudience: string;
  nicheProblem: string;
  nicheAchievement: string;
}

const hexRegex = /^#[0-9A-Fa-f]{6}$/;

function buildUserSummary(niche: string, answers: Answers): string {
  const lines: string[] = [];
  lines.push(`Chosen niche: ${niche}`);

  if (answers.transformationStory.trim()) {
    lines.push(`Transformation story: ${answers.transformationStory.trim()}`);
  }

  const fmtCheckbox = (label: string, q: CheckboxQuestion) => {
    const selected = q.selected.filter((s) => s !== 'Other');
    if (q.selected.includes('Other') && q.otherText.trim()) {
      selected.push(`Other: ${q.otherText.trim()}`);
    }
    if (selected.length > 0) {
      lines.push(`${label}: ${selected.join(', ')}`);
    }
  };

  fmtCheckbox('Groups that benefit most from their journey', answers.benefitGroup);
  fmtCheckbox('Life stage they understand deeply', answers.lifeStage);

  if (answers.lifeStageDetail.trim()) {
    lines.push(`Deep situation detail: ${answers.lifeStageDetail.trim()}`);
  }

  fmtCheckbox('Who naturally comes to them for help', answers.naturalHelpSeekers);

  if (answers.naturalHelpDetail.trim()) {
    lines.push(`What they come for: ${answers.naturalHelpDetail.trim()}`);
  }

  if (answers.patternAudience.trim()) lines.push(`Pattern — audience: ${answers.patternAudience.trim()}`);
  if (answers.patternProblem.trim()) lines.push(`Pattern — problem: ${answers.patternProblem.trim()}`);
  if (answers.patternTransformation.trim()) lines.push(`Pattern — transformation: ${answers.patternTransformation.trim()}`);
  if (answers.patternExpertise.trim()) lines.push(`Pattern — expertise: ${answers.patternExpertise.trim()}`);

  if (answers.nicheAudience.trim() && answers.nicheProblem.trim() && answers.nicheAchievement.trim()) {
    lines.push(`Niche statement: I want to help ${answers.nicheAudience.trim()} who are struggling with ${answers.nicheProblem.trim()} achieve ${answers.nicheAchievement.trim()}.`);
  }

  return lines.join('\n');
}

const systemPrompt = `You are an expert Instagram brand strategist for coaches. Using the person's chosen niche, transformation story, audience, problems, expertise and niche statement, create:

1. instagram.name_field: a keyword-rich Instagram Name field (max 30 characters) in the format "[Your Name] | <searchable keyword>", e.g. "[Your Name] | Career Coach for Women". Instagram search uses this field, so the keyword must be what their audience would type in search.
2. instagram.bio_options: exactly 3 different bios, each MAX 150 characters including spaces and emojis. Each bio must: say who they help and what result, include 1-2 searchable keywords, use 2-3 relevant emojis, use line breaks (\\n), and end with a short call to action (e.g. "👇 Book your free call").
3. instagram.keywords: exactly 5 short search keywords their audience would type.
4. brand_colors.personality: one sentence describing the brand feel.
5. brand_colors.palette: exactly 5 colours with roles Primary, Secondary, Accent, Background, Text. Each has: role, name (a friendly colour name), hex (format #RRGGBB), meaning (one short sentence on why it suits this niche). Background must be light enough for text to be readable; Text must be dark.

Return ONLY valid JSON with exactly this structure:
{ "instagram": { "name_field": "", "bio_options": ["", "", ""], "keywords": ["", "", "", "", ""] }, "brand_colors": { "personality": "", "palette": [ { "role": "", "name": "", "hex": "", "meaning": "" } ] } }`;

function validateResult(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  const ig = data.instagram;
  if (!ig || typeof ig !== 'object') return false;
  if (typeof ig.name_field !== 'string' || ig.name_field.length > 30) return false;
  if (!Array.isArray(ig.bio_options) || ig.bio_options.length !== 3) return false;
  for (const bio of ig.bio_options) {
    if (typeof bio !== 'string' || bio.length > 150) return false;
  }
  if (!Array.isArray(ig.keywords) || ig.keywords.length !== 5) return false;
  for (const kw of ig.keywords) {
    if (typeof kw !== 'string' || kw.length === 0) return false;
  }
  const bc = data.brand_colors;
  if (!bc || typeof bc !== 'object') return false;
  if (typeof bc.personality !== 'string' || bc.personality.length === 0) return false;
  if (!Array.isArray(bc.palette) || bc.palette.length !== 5) return false;
  const validRoles = ['Primary', 'Secondary', 'Accent', 'Background', 'Text'];
  const seenRoles = new Set<string>();
  for (const color of bc.palette) {
    if (!color || typeof color !== 'object') return false;
    if (typeof color.role !== 'string' || !validRoles.includes(color.role)) return false;
    if (seenRoles.has(color.role)) return false;
    seenRoles.add(color.role);
    if (typeof color.name !== 'string' || color.name.length === 0) return false;
    if (typeof color.hex !== 'string' || !hexRegex.test(color.hex)) return false;
    if (typeof color.meaning !== 'string' || color.meaning.length === 0) return false;
  }
  return true;
}

function friendlyError(status: number) {
  return new Response(
    JSON.stringify({ error: "friendly" }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { niche, answers }: { niche: string; answers: Answers } = await req.json();

    if (!niche || typeof niche !== 'string' || niche.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "friendly" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return friendlyError(500);
    }

    const userSummary = buildUserSummary(niche.trim(), answers);

    const callOpenAI = async (): Promise<any> => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          temperature: 0.8,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userSummary },
          ],
        }),
      });

      if (response.status === 429 || response.status >= 500) {
        throw { retryable: true };
      }

      if (!response.ok) {
        throw { retryable: false };
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    };

    let result: any = null;
    let parsed = false;

    // Up to 3 attempts for rate-limit/5xx retries
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await callOpenAI();
        if (validateResult(result)) {
          parsed = true;
          break;
        }
        // Validation failed — retry once with a fresh call
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
      } catch (err: any) {
        if (err && err.retryable && attempt < 2) {
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        // Non-retryable or out of attempts
        break;
      }
    }

    // If not parsed/valid, try one more call (completeness retry)
    if (!parsed) {
      try {
        result = await callOpenAI();
        if (validateResult(result)) {
          parsed = true;
        }
      } catch {
        // give up
      }
    }

    if (!parsed || !result) {
      return friendlyError(500);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return friendlyError(500);
  }
});
