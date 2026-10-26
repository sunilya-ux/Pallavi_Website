import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { jsPDF } from "npm:jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProgramStep {
  label: string;
  title: string;
  intro: string;
  imagine: string[];
  dream_outcome: string;
}

interface ProgramInclude {
  title: string;
  description: string;
}

interface ProgramResult {
  program_name: string;
  tagline: string;
  subtitle: string;
  core_promise: string;
  designed_for: string[];
  steps: ProgramStep[];
  includes: ProgramInclude[];
}

interface RequestBody {
  program: ProgramResult;
}

function cleanText(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/₹/g, "Rs. ")
        .replace(/[^\x20-\x7E™]/g, "")
        .replace(/  +/g, " ")
        .trim()
    )
    .join("\n");
}

function buildFileName(programName: string): string {
  const base = programName
    .toLowerCase()
    .replace(/™/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return (base || "my-signature-program") + ".pdf";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { program }: RequestBody = await req.json();

    if (!program || !program.program_name || !Array.isArray(program.steps)) {
      return new Response(
        JSON.stringify({ error: "friendly" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pdfData = renderProgramPDF(program);
    const fileName = buildFileName(program.program_name);

    return new Response(pdfData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error generating program PDF:", error);
    return new Response(
      JSON.stringify({ error: "friendly" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function renderProgramPDF(program: ProgramResult): ArrayBuffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 18;
  const mr = 18;
  const mt = 18;
  const mb = 18;
  const cw = pw - ml - mr;
  let y = mt;

  // Colors
  const TEAL: [number, number, number] = [13, 148, 136];
  const LIGHT_TEAL: [number, number, number] = [240, 253, 250];
  const DARK: [number, number, number] = [15, 23, 42];
  const GREY: [number, number, number] = [71, 85, 105];
  const CREAM: [number, number, number] = [254, 247, 230];
  const BORDER: [number, number, number] = [226, 232, 240];

  const ensureSpace = (needed: number) => {
    if (y + needed > ph - mb) {
      drawFooter();
      doc.addPage();
      y = mt;
    }
  };

  const drawFooter = () => {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(150, 160, 170);
      doc.text("lifecoachpallavichatterjee.com", pw / 2, ph - 8, { align: "center" });
      doc.text(`Page ${i} of ${pageCount}`, pw - mr, ph - 8, { align: "right" });
    }
  };

  const drawTickCircle = (cx: number, cy: number, r: number) => {
    doc.setFillColor(TEAL[0], TEAL[1], TEAL[2]);
    doc.circle(cx, cy, r, "F");
    // Draw tick with two short white lines
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(cx - r * 0.35, cy, cx - r * 0.1, cy + r * 0.3);
    doc.line(cx - r * 0.1, cy + r * 0.3, cx + r * 0.4, cy - r * 0.3);
  };

  const drawRoundedRect = (x: number, yPos: number, w: number, h: number, r: number, fill: [number, number, number], border?: [number, number, number]) => {
    doc.setFillColor(fill[0], fill[1], fill[2]);
    if (border) {
      doc.setDrawColor(border[0], border[1], border[2]);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, yPos, w, h, r, r, "FD");
    } else {
      doc.roundedRect(x, yPos, w, h, r, r, "F");
    }
  };

  // 1. Header box (teal, full width, rounded)
  {
    const name = cleanText(program.program_name);
    const tagline = cleanText(program.tagline || "");
    const subtitle = cleanText(program.subtitle || "");

    doc.setFontSize(20);
    const nameLines = doc.splitTextToSize(name, cw - 16);
    doc.setFontSize(12);
    const taglineLines = tagline ? doc.splitTextToSize(tagline, cw - 16) : [];
    doc.setFontSize(10);
    const subtitleLines = subtitle ? doc.splitTextToSize(subtitle, cw - 16) : [];

    let boxH = 16; // padding top + label
    boxH += nameLines.length * 8;
    if (taglineLines.length > 0) boxH += 4 + taglineLines.length * 5.5;
    if (subtitleLines.length > 0) boxH += 3 + subtitleLines.length * 5;
    boxH += 10; // padding bottom

    ensureSpace(boxH + 4);
    drawRoundedRect(ml, y, cw, boxH, 3, TEAL);

    let innerY = y + 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(200, 240, 235);
    doc.text("YOUR SIGNATURE PROGRAM", ml + 8, innerY);
    innerY += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    for (const line of nameLines) {
      doc.text(line, ml + 8, innerY);
      innerY += 8;
    }

    if (taglineLines.length > 0) {
      innerY += 1;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(245, 255, 252);
      for (const line of taglineLines) {
        doc.text(line, ml + 8, innerY);
        innerY += 5.5;
      }
    }

    if (subtitleLines.length > 0) {
      innerY += 1;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(220, 245, 240);
      for (const line of subtitleLines) {
        doc.text(line, ml + 8, innerY);
        innerY += 5;
      }
    }

    y += boxH + 6;
  }

  // 2. Core promise
  if (program.core_promise) {
    const promise = cleanText(program.core_promise);
    doc.setFontSize(12);
    const promiseLines = doc.splitTextToSize(promise, cw - 16);
    const boxH = 10 + promiseLines.length * 5.5 + 6;

    ensureSpace(boxH + 4);
    drawRoundedRect(ml, y, cw, boxH, 2, LIGHT_TEAL);

    let innerY = y + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(TEAL[0], TEAL[1], TEAL[2]);
    doc.text("THE CORE PROMISE", ml + 8, innerY);
    innerY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    for (const line of promiseLines) {
      doc.text(line, ml + 8, innerY);
      innerY += 5.5;
    }

    y += boxH + 6;
  }

  // 3. Designed for
  if (program.designed_for && program.designed_for.length > 0) {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text("This program is designed for you if you...", ml, y);
    y += 6;

    const items = program.designed_for.map((d) => cleanText(d)).filter((d) => d.length > 0);
    for (const item of items) {
      doc.setFontSize(10);
      const itemLines = doc.splitTextToSize(item, cw - 10);
      const rowH = Math.max(5, itemLines.length * 5);
      ensureSpace(rowH + 2);

      const tickR = 1.8;
      const tickX = ml + tickR;
      const tickY = y + 1.5;
      drawTickCircle(tickX, tickY, tickR);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      let textY = y + 2.5;
      for (const line of itemLines) {
        doc.text(line, ml + 7, textY);
        textY += 5;
      }
      y += rowH + 2;
    }
    y += 2;
  }

  // 4. The 4-Step Transformation
  {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text("The 4-Step Transformation", ml, y);
    y += 7;

    const steps = program.steps.slice(0, 4);
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const label = cleanText(step.label || "");
      const title = cleanText(step.title || "");
      const intro = cleanText(step.intro || "");
      const imagine = (step.imagine || []).map((im) => cleanText(im)).filter((im) => im.length > 0).slice(0, 6);
      const dream = cleanText(step.dream_outcome || "");

      // Calculate card height
      doc.setFontSize(13);
      const titleLines = doc.splitTextToSize(title, cw - 16);
      doc.setFontSize(10);
      const introLines = intro ? doc.splitTextToSize(intro, cw - 16) : [];
      doc.setFontSize(10);
      const imagineLines: string[] = [];
      for (const im of imagine) {
        const imLines = doc.splitTextToSize(im, cw - 24);
        imagineLines.push(...imLines);
      }
      doc.setFontSize(10);
      const dreamLines = dream ? doc.splitTextToSize(`"${dream}"`, cw - 22) : [];

      let cardH = 14; // pill + padding top
      cardH += titleLines.length * 5.5;
      if (introLines.length > 0) cardH += 3 + introLines.length * 4.5;
      if (imagineLines.length > 0) cardH += 4 + 6 + imagineLines.length * 4.5;
      if (dreamLines.length > 0) cardH += 4 + 6 + dreamLines.length * 5 + 6;
      cardH += 8; // padding bottom

      // If card doesn't fit and isn't too long, start on new page
      ensureSpace(cardH + 4);

      drawRoundedRect(ml, y, cw, cardH, 2, [255, 255, 255], BORDER);

      let innerY = y + 6;

      // Pill: STEP N · LABEL
      const pillText = `STEP ${i + 1} \u00B7 ${label.toUpperCase()}`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      const pillW = Math.min(doc.getTextWidth(pillText) + 8, cw - 16);
      const pillH = 4.5;
      drawRoundedRect(ml + 8, innerY - 3.5, pillW, pillH, 2, TEAL);
      doc.setTextColor(255, 255, 255);
      doc.text(pillText, ml + 12, innerY - 0.3);
      innerY += 5;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(DARK[0], DARK[1], DARK[2]);
      for (const line of titleLines) {
        doc.text(line, ml + 8, innerY);
        innerY += 5.5;
      }

      // Intro
      if (introLines.length > 0) {
        innerY += 2;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        for (const line of introLines) {
          doc.text(line, ml + 8, innerY);
          innerY += 4.5;
        }
      }

      // Imagine
      if (imagineLines.length > 0) {
        innerY += 3;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text("Imagine being able to:", ml + 8, innerY);
        innerY += 5;

        for (const line of imagineLines) {
          const tickR = 1.5;
          drawTickCircle(ml + 11 + tickR, innerY - 1, tickR);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(GREY[0], GREY[1], GREY[2]);
          doc.text(line, ml + 16, innerY);
          innerY += 4.5;
        }
      }

      // Dream outcome box
      if (dreamLines.length > 0) {
        innerY += 3;
        const dreamBoxH = 6 + dreamLines.length * 5 + 4;
        // Draw cream box with teal left bar
        doc.setFillColor(CREAM[0], CREAM[1], CREAM[2]);
        doc.setDrawColor(CREAM[0], CREAM[1], CREAM[2]);
        doc.roundedRect(ml + 8, innerY, cw - 16, dreamBoxH, 1.5, 1.5, "F");
        // Teal left bar (3px ≈ 1mm)
        doc.setFillColor(TEAL[0], TEAL[1], TEAL[2]);
        doc.rect(ml + 8, innerY, 1, dreamBoxH, "F");

        let dreamY = innerY + 5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text("The dream outcome:", ml + 12, dreamY);
        dreamY += 5;

        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        for (const line of dreamLines) {
          doc.text(line, ml + 12, dreamY);
          dreamY += 5;
        }

        innerY += dreamBoxH;
      }

      y += cardH + 5;
    }
  }

  // 5. What's Included
  if (program.includes && program.includes.length > 0) {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text("What's Included", ml, y);
    y += 7;

    const includes = program.includes.slice(0, 6);
    const colCount = 2;
    const colGap = 5;
    const colW = (cw - colGap) / colCount;

    for (let idx = 0; idx < includes.length; idx += colCount) {
      const rowItems = includes.slice(idx, idx + colCount);
      const rowH = 16; // fixed approximate height per row

      // Calculate max height needed
      const heights: number[] = [];
      for (let c = 0; c < rowItems.length; c++) {
        const inc = rowItems[c];
        const title = cleanText(inc.title || "");
        const desc = cleanText(inc.description || "");
        doc.setFontSize(10);
        const titleLines = doc.splitTextToSize(title, colW - 14);
        doc.setFontSize(9);
        const descLines = doc.splitTextToSize(desc, colW - 14);
        heights.push(8 + titleLines.length * 4.5 + descLines.length * 4.5 + 4);
      }
      const maxH = Math.max(...heights, rowH);

      ensureSpace(maxH + 4);

      for (let c = 0; c < rowItems.length; c++) {
        const inc = rowItems[c];
        const colX = ml + c * (colW + colGap);
        const title = cleanText(inc.title || "");
        const desc = cleanText(inc.description || "");

        drawRoundedRect(colX, y, colW, maxH, 2, [255, 255, 255], BORDER);

        // Tick circle
        drawTickCircle(colX + 6, y + 6, 1.8);

        let innerY = y + 8;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        const titleLines = doc.splitTextToSize(title, colW - 14);
        for (const line of titleLines) {
          doc.text(line, colX + 11, innerY);
          innerY += 4.5;
        }

        innerY += 1;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        const descLines = doc.splitTextToSize(desc, colW - 14);
        for (const line of descLines) {
          doc.text(line, colX + 11, innerY);
          innerY += 4.5;
        }
      }

      y += maxH + 4;
    }
  }

  drawFooter();
  return doc.output("arraybuffer");
}
