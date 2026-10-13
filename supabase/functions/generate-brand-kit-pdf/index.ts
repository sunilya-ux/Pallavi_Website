import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { jsPDF } from "npm:jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaletteColor {
  role: string;
  name: string;
  hex: string;
  meaning: string;
}

interface BrandKit {
  instagram: {
    name_field: string;
    bio_options: string[];
    keywords: string[];
  };
  brand_colors: {
    personality: string;
    palette: PaletteColor[];
  };
}

interface RequestBody {
  niche: string;
  nicheStatement: string;
  brandKit: BrandKit;
}

function cleanText(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/[^\x20-\x7E\xA0-\xFF\u2018\u2019\u201C\u201D\u2013\u2014\u2022\u2026]/g, "")
        .replace(/[’'']/g, "'")
        .replace(/["""]/g, '"')
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\u2026/g, "...")
        .replace(/\u2022/g, "*")
        .replace(/  +/g, " ")
        .trim()
    )
    .join("\n");
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/.exec(hex);
  if (!m) return { r: 128, g: 128, b: 128 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

function isLightColor(c: { r: number; g: number; b: number }): boolean {
  return (c.r * 299 + c.g * 587 + c.b * 114) / 1000 > 200;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { niche, nicheStatement, brandKit }: RequestBody = await req.json();

    if (!niche || !brandKit || !brandKit.instagram || !brandKit.brand_colors) {
      return new Response(
        JSON.stringify({ error: "friendly" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pdfData = renderBrandKitPDF(niche, nicheStatement, brandKit);
    return new Response(pdfData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="my-brand-kit.pdf"',
      },
    });
  } catch (error) {
    console.error("Error generating brand kit PDF:", error);
    return new Response(
      JSON.stringify({ error: "friendly" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function renderBrandKitPDF(
  niche: string,
  nicheStatement: string,
  brandKit: BrandKit
): ArrayBuffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ml = 20;
  const mr = 20;
  const mt = 20;
  const mb = 20;
  const cw = pw - ml - mr;
  let y = mt;

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
    }
  };

  const drawHeading = (text: string) => {
    ensureSpace(12);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(13, 148, 136);
    const lines = doc.splitTextToSize(text, cw);
    for (const line of lines) {
      ensureSpace(7);
      doc.text(line, ml, y);
      y += 6;
    }
    y += 2;
  };

  const drawBody = (text: string, opts?: { bold?: boolean; fontSize?: number; color?: { r: number; g: number; b: number }; maxWidth?: number; lineHeight?: number }) => {
    const fs = opts?.fontSize || 10;
    const lh = opts?.lineHeight || fs * 0.5;
    const mw = opts?.maxWidth || cw;
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(fs);
    const c = opts?.color || { r: 51, g: 65, b: 85 };
    doc.setTextColor(c.r, c.g, c.b);
    const lines = doc.splitTextToSize(text, mw);
    for (const line of lines) {
      ensureSpace(lh);
      doc.text(line, ml, y);
      y += lh;
    }
  };

  // 1. Title + subtitle + divider
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text("My Brand Kit", pw / 2, y, { align: "center" });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Build Your Business in One Day", pw / 2, y, { align: "center" });
  y += 6;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(ml, y, pw - mr, y);
  y += 6;

  // 2. Niche + niche statement
  drawHeading("My Niche");
  drawBody(cleanText(niche), { bold: true, fontSize: 11, color: { r: 30, g: 41, b: 59 } });

  drawHeading("My Niche Statement");
  const stmtText = cleanText(nicheStatement);
  doc.setFontSize(10);
  const stmtLines = doc.splitTextToSize(stmtText, cw - 12);
  const stmtHeight = stmtLines.length * 5 + 8;
  ensureSpace(stmtHeight + 2);
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(153, 246, 228);
  doc.setLineWidth(0.3);
  doc.roundedRect(ml, y, cw, stmtHeight, 2, 2, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  let stmtY = y + 6;
  for (const line of stmtLines) {
    doc.text(line, ml + 6, stmtY);
    stmtY += 5;
  }
  y += stmtHeight + 4;

  // 3. Instagram Name Field
  drawHeading("Instagram Name Field");
  drawBody(cleanText(brandKit.instagram.name_field), { bold: true, fontSize: 11, color: { r: 30, g: 41, b: 59 } });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 160, 170);
  doc.text("This is the part Instagram searches.", ml, y);
  y += 4;

  // 4. Bio Options
  drawHeading("Bio Options");
  const bioLabels = ["Option 1", "Option 2", "Option 3"];
  for (let i = 0; i < brandKit.instagram.bio_options.length && i < 3; i++) {
    const bioText = cleanText(brandKit.instagram.bio_options[i]);
    doc.setFontSize(9);
    const bioLines = doc.splitTextToSize(bioText, cw - 16);
    const bioHeight = bioLines.length * 4.5 + 10;

    ensureSpace(bioHeight + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(ml, y, cw, bioHeight, 2, 2, "F");

    let bioY = y + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(13, 148, 136);
    doc.text(bioLabels[i], ml + 6, bioY);
    bioY += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    for (const line of bioLines) {
      doc.text(line, ml + 6, bioY);
      bioY += 4.5;
    }
    y += bioHeight + 3;
  }

  ensureSpace(6);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(150, 160, 170);
  doc.text(
    "Emojis aren't shown in the PDF. Copy your bio from the portal to keep them.",
    ml, y
  );
  y += 6;

  // 5. Search Keywords
  drawHeading("Search Keywords");
  const keywords = brandKit.instagram.keywords.map((k) => cleanText(k)).filter((k) => k.length > 0);
  const kwLine = keywords.join("  |  ");
  drawBody(kwLine, { fontSize: 10, color: { r: 13, g: 148, b: 136 } });
  y += 2;

  // 6. Brand Colours
  drawHeading("Brand Colours");
  ensureSpace(8);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  const personalityLines = doc.splitTextToSize(cleanText(brandKit.brand_colors.personality), cw);
  for (const line of personalityLines) {
    ensureSpace(5);
    doc.text(line, ml, y);
    y += 5;
  }
  y += 4;

  const swatchSize = 22;
  const swatchGap = 6;
  const textX = ml + swatchSize + swatchGap;
  const textMaxW = pw - mr - textX;

  for (const color of brandKit.brand_colors.palette) {
    const rgb = hexToRgb(color.hex);
    const cleanName = cleanText(color.name);
    const cleanMeaning = cleanText(color.meaning);
    const cleanRole = cleanText(color.role);
    const cleanHex = cleanText(color.hex);

    doc.setFontSize(9);
    const meaningLines = doc.splitTextToSize(cleanMeaning, textMaxW);
    const rowHeight = Math.max(swatchSize, meaningLines.length * 4.5 + 12);

    ensureSpace(rowHeight + 4);

    const swatchY = y;

    doc.setFillColor(rgb.r, rgb.g, rgb.b);
    if (isLightColor(rgb)) {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(ml, swatchY, swatchSize, swatchSize, 2, 2, "FD");
    } else {
      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.roundedRect(ml, swatchY, swatchSize, swatchSize, 2, 2, "F");
    }

    let rowY = swatchY + 2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(150, 160, 170);
    doc.text(cleanRole.toUpperCase(), textX, rowY);
    rowY += 4.5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(cleanName, textX, rowY);
    rowY += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(cleanHex, textX, rowY);
    rowY += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    for (const line of meaningLines) {
      doc.text(line, textX, rowY);
      rowY += 4.5;
    }

    y += rowHeight + 4;
  }

  drawFooter();
  return doc.output("arraybuffer");
}
