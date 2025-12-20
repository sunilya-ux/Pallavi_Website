import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  content: string;
  title?: string;
  googleAccessToken: string;
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
    const { content, title = "Passion Coaching Instagram Content", googleAccessToken } = body;

    if (!content) {
      throw new Error("Content is required");
    }

    if (!googleAccessToken) {
      throw new Error("Google access token is required");
    }

    const createDocResponse = await fetch("https://docs.googleapis.com/v1/documents", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${googleAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: title,
      }),
    });

    if (!createDocResponse.ok) {
      const error = await createDocResponse.text();
      throw new Error(`Failed to create Google Doc: ${error}`);
    }

    const docData = await createDocResponse.json();
    const documentId = docData.documentId;

    const requests = [];
    const paragraphs = content.split('\n');
    let insertIndex = 1;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      
      if (paragraph.trim() === '') {
        requests.push({
          insertText: {
            location: { index: insertIndex },
            text: '\n',
          },
        });
        insertIndex += 1;
        continue;
      }

      const isHeading = /^#+\s/.test(paragraph) || /^\[\d+\]/.test(paragraph);
      let text = paragraph;
      
      if (isHeading) {
        text = paragraph.replace(/^#+\s*/, '').replace(/^\[\d+\]\s*/, '');
      }

      requests.push({
        insertText: {
          location: { index: insertIndex },
          text: text + '\n',
        },
      });

      if (isHeading) {
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: insertIndex,
              endIndex: insertIndex + text.length,
            },
            paragraphStyle: {
              namedStyleType: 'HEADING_2',
            },
            fields: 'namedStyleType',
          },
        });
      }

      insertIndex += text.length + 1;
    }

    const batchUpdateResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${googleAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      }
    );

    if (!batchUpdateResponse.ok) {
      const error = await batchUpdateResponse.text();
      throw new Error(`Failed to update Google Doc: ${error}`);
    }

    const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

    return new Response(
      JSON.stringify({ 
        success: true,
        documentId,
        documentUrl,
        message: "Your content has been exported to Google Docs."
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error exporting to Google Docs:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to export to Google Docs",
        requiresAuth: true,
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