import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { jsPDF } from "npm:jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  content: string;
  title?: string;
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
    const { content, title = "Passion Coaching Content" } = body;

    if (!content) {
      throw new Error("Content is required");
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margins = { top: 20, bottom: 20, left: 20, right: 20 };
    const maxWidth = pageWidth - margins.left - margins.right;
    let currentY = margins.top;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, margins.left, currentY);
    currentY += 12;

    doc.setLineWidth(0.5);
    doc.line(margins.left, currentY, pageWidth - margins.right, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      if (line.trim() === '') {
        currentY += 4;
        continue;
      }

      const isHeading = /^#+\s/.test(line) || /^\[\d+\]/.test(line) || line.toUpperCase() === line && line.length > 0 && line.length < 60;
      
      if (isHeading) {
        if (currentY > margins.top + 20) {
          currentY += 5;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        line = line.replace(/^#+\s*/, '').replace(/^\[\d+\]\s*/, '');
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
      }

      const isBullet = /^[-•*]\s/.test(line);
      if (isBullet) {
        line = line.replace(/^[-•*]\s*/, '');
      }

      const wrappedLines = doc.splitTextToSize(line, maxWidth - (isBullet ? 5 : 0));
      
      for (let j = 0; j < wrappedLines.length; j++) {
        if (currentY + 10 > pageHeight - margins.bottom) {
          doc.addPage();
          currentY = margins.top;
        }

        if (isBullet && j === 0) {
          doc.text('•', margins.left, currentY);
          doc.text(wrappedLines[j], margins.left + 5, currentY);
        } else if (isBullet) {
          doc.text(wrappedLines[j], margins.left + 5, currentY);
        } else {
          doc.text(wrappedLines[j], margins.left, currentY);
        }
        
        currentY += isHeading ? 7 : 6;
      }

      if (isHeading) {
        currentY += 2;
      }
    }

    const pdfData = doc.output('arraybuffer');

    return new Response(pdfData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=\"passion-coaching-content.pdf\"",
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate PDF" 
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