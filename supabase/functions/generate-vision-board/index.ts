import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  financial: string;
  fun: string;
  relationships: string;
  contribution: string;
  career: string;
  health: string;
  personal: string;
  uploadedImage?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { financial, fun, relationships, contribution, career, health, personal, uploadedImage } = body;

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const sections = [
      { label: "Financial / Income Goals", value: financial },
      { label: "Fun / Travel / Lifestyle", value: fun },
      { label: "Relationships / Family", value: relationships },
      { label: "Contribution / Legacy", value: contribution },
      { label: "Career / Business Goals", value: career },
      { label: "Health / Fitness", value: health },
      { label: "Personal Growth / Purchases", value: personal },
    ].filter(section => section.value && section.value.trim());

    if (sections.length === 0) {
      throw new Error("At least one goal section must be provided");
    }

    let prompt = `You are VisionBoard-GPT. Create a premium HD vision board collage based on the user's life goals.

User's Life Goals:
${sections.map((s, i) => `${i + 1}. ${s.label}:\n${s.value}`).join('\n\n')}

INSTRUCTIONS:

- Generate ONE cohesive vision board collage (not 7 separate images)
- Each section should visually represent one life area
- Arrange sections in an attractive grid/collage layout
- Use premium, cinematic, inspirational imagery
- Include motivational visual elements for each goal area`;

    if (uploadedImage) {
      prompt += `
- User provided their photo (analyze the face and identity)
- Extract user's face features and preserve identity consistently
- Place the user naturally in relevant scenes throughout the vision board
- Replace backgrounds completely while keeping user's face recognizable
- Ensure the user appears confident, successful, and happy in each scene`;
    } else {
      prompt += `
- No user photo provided
- Generate a generic high-quality vision board with symbolic imagery
- Use diverse, aspirational visuals that represent the goals`;
    }

    prompt += `

STYLE REQUIREMENTS:
- Premium quality
- Cinematic lighting
- Motivational and inspiring
- Clean, professional composition
- Balanced color palette
- High resolution (1792x1024)

Create a single, powerful vision board image that combines all these life areas into one cohesive, inspiring collage.`;

    const messages: any[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt,
          },
        ],
      },
    ];

    if (uploadedImage) {
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: uploadedImage,
        },
      });
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1792x1024",
        quality: "hd",
        style: "vivid",
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API Error:", errorData);
      throw new Error(errorData.error?.message || "Failed to generate vision board");
    }

    const openaiData = await openaiResponse.json();
    const imageUrl = openaiData.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error("No image URL in OpenAI response");
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error generating vision board:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
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
