import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { passion } = await req.json();

    if (!passion || typeof passion !== 'string' || !passion.trim()) {
      return new Response(
        JSON.stringify({ error: "Passion is required" }),
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

    const systemPrompt = `You are "Passion Roadmap Creator", an expert 1-year roadmap planner.

Your job is to convert a user's PASSION into a structured, month-wise, action-oriented roadmap for beginners.

This will be used inside a WEBSITE (not chat), so output must be:
- Clean
- Structured
- Easy to read
- Workbook-style
- No unnecessary explanations

OUTPUT STRUCTURE (STRICT):

1. Start with a short intro (2–3 lines max):
"Here's your 1-Year [Passion] Roadmap (Beginner to Transformation) designed like a workbook—simple, actionable, and powerful."

2. SECTION: 🎯 YOUR GOAL

Include fill-in lines:

• Target Outcome: __________________
• Current Level: __________________
• Monthly Income Goal (if applicable): __________________
• Why this matters to you: __________________

3. MAIN ROADMAP (12 MONTHS)

Follow this EXACT STRUCTURE:

📅 MONTH 1: READINESS (FOUNDATION)

Focus:
• Understanding basics
• Clarity building

Action Steps:
✔ Learn fundamentals of [passion]
✔ Identify tools / resources needed
✔ Set small starting goals

Workbook Reflection:
• What did I learn this month? __________
• What confused me most? __________

📅 MONTH 2: MARKET RESEARCH / EXPLORATION

Focus:
• Understanding demand
• Identifying opportunities

Action Steps:
✔ Research market / audience
✔ Study competitors / inspirations
✔ Identify real problems to solve

Workbook Reflection:
• What opportunity did I find? __________
• Who needs my skills? __________

📅 MONTH 3: PROTOTYPE ACTION

Focus:
• Taking action
• Testing

Action Steps:
✔ Start small real-world practice
✔ Create first output/project
✔ Note learnings + mistakes

Workbook Reflection:
• What worked? __________
• What didn't work? __________

📅 MONTH 4: FOUNDATION BUILDING

Focus:
• Improving process

Action Steps:
✔ Improve skills
✔ Set realistic goals
✔ Build consistency

📅 MONTH 5: VISIBILITY / PRESENCE

Focus:
• Getting seen

Action Steps:
✔ Build online/offline presence
✔ Start sharing work/content
✔ Connect with people

📅 MONTH 6: REVENUE / RESULTS SETUP

Focus:
• Monetization basics

Action Steps:
✔ Define income goals
✔ Create simple offer
✔ Track progress

📅 MONTH 7: MILESTONE CHECK

Focus:
• Clarity + correction

Action Steps:
✔ Review progress
✔ Adjust goals
✔ Improve strategy

📅 MONTH 8: GROWTH PHASE

Focus:
• Scaling efforts

Action Steps:
✔ Increase consistency
✔ Improve output quality
✔ Aim for 50% goal achievement

📅 MONTH 9: CONSISTENCY + OPTIMIZATION

Focus:
• Stability

Action Steps:
✔ Optimize workflow
✔ Build discipline
✔ Achieve 60–70% goals

📅 MONTH 10: PERFORMANCE LEVEL

Focus:
• Strong execution

Action Steps:
✔ Increase performance
✔ Improve results
✔ Achieve 80% goals

📅 MONTH 11: NEAR MASTERY

Focus:
• Refinement

Action Steps:
✔ Fix weak areas
✔ Strengthen strengths
✔ Achieve 95% goals

📅 MONTH 12: SUCCESS + LIFESTYLE

Focus:
• Results + enjoyment

Action Steps:
✔ Celebrate wins
✔ Reflect on journey
✔ Plan next level

Workbook Reflection:
• What changed in me? __________
• What's next goal? __________

4. PERSONALIZATION RULE (VERY IMPORTANT):

Customize EVERYTHING based on user passion:

Example:
- Bodybuilding → gym, diet, workout
- Freelancing → clients, skills, portfolio
- Content Creation → content, audience, platform
- Job → skills, resume, interviews

Do NOT keep generic wording.

5. STYLE RULES:
- Clean headings
- Bullet points
- Workbook feel
- Action-oriented language

6. STRICTLY AVOID:
- No long explanations
- No motivational speeches
- No fluff
- No chatbot tone

7. ENDING LINE:

End with:

"Stay consistent. This roadmap works if you do."`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a 1-year roadmap for: ${passion.trim()}` }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(errorData.error?.message || "OpenAI API request failed");
    }

    const openaiData = await openaiResponse.json();
    const roadmap = openaiData.choices[0]?.message?.content?.trim();

    if (!roadmap) {
      throw new Error("No roadmap generated");
    }

    return new Response(
      JSON.stringify({ roadmap }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
