const MAX_BYTES = 4 * 1024 * 1024;

const EMPTY_RESUME = "This resume is empty. Upload it again.";
const UNREADABLE_RESUME = "We couldn't read the text in that file. Upload your resume again.";
const NOT_A_RESUME = "This doesn't look like a resume or CV. Upload your resume again.";

export async function extractResumeText(file: File) {
  if (file.size === 0) {
    throw new Error(EMPTY_RESUME);
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Keep the resume under 4 MB.");
  }

  const name = file.name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  let text = "";

  try {
    if (name.endsWith(".txt") || name.endsWith(".md")) {
      text = new TextDecoder().decode(bytes);
    } else if (name.endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
      text = result.value;
    } else if (name.endsWith(".pdf")) {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(bytes);
      const extracted = await extractText(pdf, { mergePages: true });
      text = extracted.text;
    } else {
      throw new Error("Upload a PDF, DOCX, or TXT resume.");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Upload a PDF, DOCX, or TXT resume.") {
      throw error;
    }
    throw new Error(UNREADABLE_RESUME);
  }

  if (!text.replace(/\s/g, "")) {
    throw new Error(UNREADABLE_RESUME);
  }
  if (!looksLikeResume(text)) {
    throw new Error(NOT_A_RESUME);
  }
  return text.trim();
}

function looksLikeResume(text: string) {
  const sample = text.slice(0, 12000).toLowerCase();
  const groups = [
    /\b(experience|employment|work history|professional history)\b/.test(sample),
    /\b(education|university|bachelor|master|degree|college|b\.?\s?tech|b\.?a\.?|m\.?s\.?)\b/.test(sample),
    /\b(skills|proficient|technologies)\b/.test(sample),
    /\b(project|internship|responsibilit|achiev)\b/.test(sample),
    /@|\+?\d[\d\s().-]{8,}/.test(sample),
    /\b(resume|curriculum vitae|\bcv\b)\b/.test(sample),
  ];
  const hits = groups.filter(Boolean).length;
  const notResume =
    /\b(we are hiring|we're hiring|job description|about the company|equal opportunity|apply now|ingredients|preheat|invoice number|amount due|dear hiring|i am writing to apply)\b/.test(
      sample,
    );
  if (notResume && hits < 4) return false;
  return hits >= 2;
}
