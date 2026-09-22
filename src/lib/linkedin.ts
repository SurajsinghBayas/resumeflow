export function linkedinName(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/linkedin\.com\/(?:in|pub)\/([^/?#]+)/i);
  const source = decodeURIComponent(match?.[1] ?? trimmed).replace(/[-_]+/g, " ");
  const words = source.replace(/\s+/g, " ").trim();
  if (!words) return trimmed;
  return words.replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}

export function linkedinHref(value: string) {
  const trimmed = value.trim();
  if (!/linkedin\.com/i.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/\//, "")}`;
}

export function isLinkedinProfile(value: string) {
  return /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub)\/[A-Za-z0-9\-_%]+\/?$/i.test(value.trim());
}
