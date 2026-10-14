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
const DEFAULT_ROLES = ['Primary', 'Secondary', 'Accent', 'Background', 'Text'];
const HIGHLIGHT_ICONS = [
  'Signpost', 'UserRound', 'MessageSquareQuote', 'Trophy', 'Handshake', 'GraduationCap',
  'MonitorPlay', 'Sunrise', 'ShoppingBag', 'Phone', 'HelpCircle', 'CalendarHeart',
  'Heart', 'Leaf', 'TrendingUp', 'Users', 'Plane', 'Utensils', 'BookOpen', 'Briefcase',
  'Dumbbell', 'Brain', 'Flower2', 'Sparkles', 'Star', 'Gem', 'Home', 'Baby', 'Smile', 'Target',
];
const DEFAULT_HIGHLIGHTS = [
  { use_for: 'Start Here', icon: 'Signpost' },
  { use_for: 'About Me', icon: 'UserRound' },
  { use_for: 'Testimonials', icon: 'MessageSquareQuote' },
  { use_for: 'Client Wins', icon: 'Trophy' },
  { use_for: 'Work With Me', icon: 'Handshake' },
  { use_for: 'Free Tips', icon: 'GraduationCap' },
  { use_for: 'My Life', icon: 'Sunrise' },
];

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
2. instagram.bio_options: exactly 3 different bios, each 110-150 characters (MAX 150 including spaces and emojis). Do not write short one-liners. Each bio must include: who they help + the specific result/transformation, one line of credibility or personal touch drawn from their transformation story, 1-2 searchable keywords used naturally, 2-3 relevant emojis, line breaks (\\n) between ideas, and a short call to action at the end. The 3 bios must feel clearly different in style: (1) results-focused, (2) story/personal-focused, (3) warm/community-focused. Use the person's own words and audience from their answers. Do not generalise "women" to a different group they did not mention.
3. instagram.keywords: exactly 5 short search keywords their audience would type.
4. brand_colors.personality: one sentence describing the brand feel.
5. brand_colors.palette: exactly 5 colours with roles Primary, Secondary, Accent, Background, Text. The 5 colours must form ONE harmonious, professional palette suitable for a premium coaching brand (elegant, trustworthy, modern). Avoid combining several bright saturated colours together. Primary should be confident but not neon. Secondary should complement Primary (analogous or soft complementary). Accent may be brighter but used sparingly. Background must be a very light, warm or neutral tone. Text must be a dark colour with strong contrast on Background. Each colour's "name" must honestly describe the actual hex (e.g. do not call a coral colour "pink"). Each has: role, name, hex (format #RRGGBB), meaning (one short sentence on why it suits this niche).
6. highlights: exactly 7 Instagram highlight covers that suit this person's niche and audience. Each item must have a short "use_for" highlight purpose (maximum 20 characters, adapted to the niche) and one "icon" chosen only from this list: Signpost, UserRound, MessageSquareQuote, Trophy, Handshake, GraduationCap, MonitorPlay, Sunrise, ShoppingBag, Phone, HelpCircle, CalendarHeart, Heart, Leaf, TrendingUp, Users, Plane, Utensils, BookOpen, Briefcase, Dumbbell, Brain, Flower2, Sparkles, Star, Gem, Home, Baby, Smile, Target. The first item must be a start-here or welcome type highlight. Choose icons that clearly match the niche.

Return ONLY valid JSON with exactly this structure:
{ "instagram": { "name_field": "", "bio_options": ["", "", ""], "keywords": ["", "", "", "", ""] }, "brand_colors": { "personality": "", "palette": [ { "role": "", "name": "", "hex": "", "meaning": "" } ] }, "highlights": [ { "use_for": "", "icon": "" } ] }`;

// ——— HARD checks: only these cause a retry ———
function hardCheck(data: any): { ok: boolean; reason: string } {
  if (!data || typeof data !== 'object') return { ok: false, reason: 'invalid_json' };
  const ig = data.instagram;
  if (!ig || typeof ig !== 'object') return { ok: false, reason: 'incomplete_result' };
  const bc = data.brand_colors;
  if (!bc || typeof bc !== 'object') return { ok: false, reason: 'incomplete_result' };

  // bio_options: at least 3 non-empty strings
  if (!Array.isArray(ig.bio_options)) return { ok: false, reason: 'incomplete_result' };
  const nonEmptyBios = ig.bio_options.filter((b: any) => typeof b === 'string' && b.trim().length > 0);
  if (nonEmptyBios.length < 3) return { ok: false, reason: 'incomplete_result' };

  // palette: at least 5 items, each with a valid hex
  if (!Array.isArray(bc.palette)) return { ok: false, reason: 'incomplete_result' };
  const validHexColors = bc.palette.filter(
    (c: any) => c && typeof c === 'object' && typeof c.hex === 'string' && hexRegex.test(c.hex)
  );
  if (validHexColors.length < 5) return { ok: false, reason: 'incomplete_result' };

  return { ok: true, reason: '' };
}

// ——— SOFT fixes: applied silently after hard checks pass ———
function trimBio(bio: string): string {
  if (bio.length <= 150) return bio;
  // Try cutting at the last line break before 150
  const cut = bio.slice(0, 150);
  const lastBreak = cut.lastIndexOf('\n');
  if (lastBreak > 60) return cut.slice(0, lastBreak).trimEnd();
  // Otherwise cut at the last word boundary before 150
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 60) return cut.slice(0, lastSpace).trimEnd();
  return cut.trimEnd();
}

function trimAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > 0) return cut.slice(0, lastSpace).trimEnd();
  return cut.trimEnd();
}

function softFix(data: any): any {
  const ig = data.instagram;
  const bc = data.brand_colors;

  // --- bio_options: keep first 3, trim each to 150 ---
  const bios = (ig.bio_options as any[])
    .filter((b: any) => typeof b === 'string' && b.trim().length > 0)
    .slice(0, 3)
    .map((b: string) => trimBio(b));

  // --- name_field: max 64, trim at word boundary; default if empty ---
  let nameField = typeof ig.name_field === 'string' ? ig.name_field.trim() : '';
  if (nameField.length === 0) {
    nameField = '[Your Name] | Coach';
  } else if (nameField.length > 64) {
    nameField = trimAtWord(nameField, 64);
  }

  // --- keywords: keep up to 5 non-empty, accept 3+ ---
  const keywords = Array.isArray(ig.keywords)
    ? (ig.keywords as any[])
        .filter((k: any) => typeof k === 'string' && k.trim().length > 0)
        .slice(0, 5)
    : [];

  // --- palette: keep first 5 valid-hex colours, fix roles/names/meanings ---
  const palette = (bc.palette as any[])
    .filter((c: any) => c && typeof c === 'object' && typeof c.hex === 'string' && hexRegex.test(c.hex))
    .slice(0, 5)
    .map((c: any, i: number) => ({
      role: (typeof c.role === 'string' && c.role.trim().length > 0) ? c.role : DEFAULT_ROLES[i],
      name: (typeof c.name === 'string' && c.name.trim().length > 0) ? c.name : DEFAULT_ROLES[i],
      hex: c.hex,
      meaning: (typeof c.meaning === 'string' && c.meaning.trim().length > 0) ? c.meaning : '',
    }));

  // Reassign roles by position if any are missing or duplicated
  const seenRoles = new Set<string>();
  let hasDupOrMissing = false;
  for (const c of palette) {
    if (seenRoles.has(c.role) || !DEFAULT_ROLES.includes(c.role)) {
      hasDupOrMissing = true;
    }
    seenRoles.add(c.role);
  }
  if (hasDupOrMissing) {
    palette.forEach((c, i) => { c.role = DEFAULT_ROLES[i]; });
  }

  // --- personality: default if empty ---
  const personality = (typeof bc.personality === 'string' && bc.personality.trim().length > 0)
    ? bc.personality
    : 'A warm, confident and professional brand.';

  const highlights = (Array.isArray(data.highlights) ? data.highlights : [])
    .slice(0, 7)
    .filter((item: any) => item && typeof item === 'object')
    .map((item: any, index: number) => ({
      use_for: typeof item.use_for === 'string' && item.use_for.trim().length > 0
        ? trimAtWord(item.use_for.trim(), 20)
        : DEFAULT_HIGHLIGHTS[index].use_for,
      icon: typeof item.icon === 'string' && HIGHLIGHT_ICONS.includes(item.icon)
        ? item.icon
        : 'Sparkles',
    }));

  while (highlights.length < 7) {
    highlights.push(DEFAULT_HIGHLIGHTS[highlights.length]);
  }

  return {
    instagram: { 
      name_field: nameField,
      bio_options: bios,
      keywords,
    },
    brand_colors: {
      personality,
      palette,
    },
    highlights,
  };
}

function errorResponse(status: number, reason: string) {
  return new Response(
    JSON.stringify({ error: "friendly", reason }),
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
      return errorResponse(400, "invalid_json");
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return errorResponse(500, "missing_api_key");
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

    let result: any = null;
    let success = false;
    let lastReason = 'openai_error';

    // Maximum 3 OpenAI calls total
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await callOpenAI();
        const check = hardCheck(result);
        if (check.ok) {
          success = true;
          break;
        }
        lastReason = check.reason;
        console.log(`generate-brand-kit: attempt ${attempt + 1} failed — ${lastReason}`);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (err: any) {
        lastReason = err?.reason || 'openai_error';
        const retryable = err?.retryable ?? false;
        console.log(`generate-brand-kit: attempt ${attempt + 1} failed — ${lastReason} (retryable: ${retryable})`);
        if (retryable && attempt < 2) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        // Non-retryable or out of attempts
        break;
      }
    }

    if (!success || !result) {
      return errorResponse(500, lastReason);
    }

    const fixed = softFix(result);

    return new Response(JSON.stringify(fixed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-brand-kit error:", error);
    return errorResponse(500, "openai_error");
  }
});
