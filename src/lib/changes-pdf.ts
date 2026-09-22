import { jsPDF } from "jspdf";
import { changeEntries, changesHeading, type ChangeEntry } from "@/lib/changes";
import type { Report } from "@/lib/types";

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 54;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 52;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

const INK: [number, number, number] = [28, 23, 20];
const MUTED: [number, number, number] = [111, 103, 95];
const CLAY: [number, number, number] = [196, 92, 38];
const FOREST: [number, number, number] = [30, 74, 56];
const LINE: [number, number, number] = [228, 217, 204];

function pdfSafe(value: string) {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "-")
    .replace(/[^\n\x20-\x7e]/g, "");
}

type Cursor = { y: number };

function addPage(doc: jsPDF, cursor: Cursor) {
  doc.addPage();
  cursor.y = MARGIN_TOP;
}

function ensure(doc: jsPDF, cursor: Cursor, height: number) {
  if (cursor.y + height > PAGE_HEIGHT - MARGIN_BOTTOM) addPage(doc, cursor);
}

function writeLines(
  doc: jsPDF,
  cursor: Cursor,
  text: string,
  options: {
    size: number;
    font: "times" | "helvetica";
    style: "normal" | "bold" | "italic";
    color: [number, number, number];
    gap?: number;
    indent?: number;
  },
) {
  const indent = options.indent ?? 0;
  const width = CONTENT_WIDTH - indent;
  doc.setFont(options.font, options.style);
  doc.setFontSize(options.size);
  doc.setTextColor(...options.color);
  const lines = doc.splitTextToSize(pdfSafe(text) || " ", width) as string[];
  const leading = options.size * 1.35;
  for (const line of lines) {
    ensure(doc, cursor, leading);
    doc.text(line, MARGIN_X + indent, cursor.y);
    cursor.y += leading;
  }
  cursor.y += options.gap ?? 0;
}

function writeChange(doc: jsPDF, cursor: Cursor, entry: ChangeEntry) {
  const room = PAGE_HEIGHT - MARGIN_BOTTOM - cursor.y;
  if (entry.number > 1 && room < 96) {
    addPage(doc, cursor);
  } else if (entry.number > 1) {
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.6);
    doc.line(MARGIN_X, cursor.y, PAGE_WIDTH - MARGIN_X, cursor.y);
    cursor.y += 16;
  }
  writeLines(doc, cursor, `${entry.number}.  ${entry.section}`, {
    size: 13,
    font: "times",
    style: "bold",
    color: INK,
    gap: 4,
  });
  if (entry.issue) {
    writeLines(doc, cursor, entry.issue, {
      size: 10,
      font: "helvetica",
      style: "italic",
      color: MUTED,
      gap: 10,
    });
  } else {
    cursor.y += 6;
  }
  writeLines(doc, cursor, "NOW", {
    size: 8,
    font: "helvetica",
    style: "bold",
    color: MUTED,
    gap: 3,
  });
  writeLines(doc, cursor, entry.before, {
    size: 11,
    font: "helvetica",
    style: "normal",
    color: MUTED,
    gap: 10,
  });
  writeLines(doc, cursor, "SUGGESTED", {
    size: 8,
    font: "helvetica",
    style: "bold",
    color: CLAY,
    gap: 3,
  });
  writeLines(doc, cursor, entry.after, {
    size: 11,
    font: "helvetica",
    style: "normal",
    color: FOREST,
    gap: 10,
  });
  writeLines(doc, cursor, "WHY", {
    size: 8,
    font: "helvetica",
    style: "bold",
    color: MUTED,
    gap: 3,
  });
  writeLines(doc, cursor, entry.why, {
    size: 11,
    font: "helvetica",
    style: "normal",
    color: INK,
    gap: 18,
  });
}

function paintFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.6);
    doc.line(MARGIN_X, PAGE_HEIGHT - 36, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text("Resume changes", MARGIN_X, PAGE_HEIGHT - 22);
    doc.text(`${page} / ${pages}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 22, { align: "right" });
  }
}

export function buildChangesPdf(report: Report) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const cursor: Cursor = { y: MARGIN_TOP };
  writeLines(doc, cursor, "Resume changes", {
    size: 22,
    font: "times",
    style: "bold",
    color: INK,
    gap: 6,
  });
  writeLines(doc, cursor, changesHeading(report), {
    size: 11,
    font: "helvetica",
    style: "normal",
    color: CLAY,
    gap: 8,
  });
  if (report.summary.trim()) {
    writeLines(doc, cursor, report.summary, {
      size: 11,
      font: "helvetica",
      style: "normal",
      color: MUTED,
      gap: 18,
    });
  } else {
    cursor.y += 10;
  }

  const entries = changeEntries(report);
  if (entries.length === 0) {
    writeLines(doc, cursor, "No line changes were suggested.", {
      size: 11,
      font: "helvetica",
      style: "normal",
      color: INK,
    });
  } else {
    for (const entry of entries) writeChange(doc, cursor, entry);
  }

  paintFooter(doc);
  return doc.output("arraybuffer");
}
