// Text cleaning and chunking for AI ingestion

export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')        // Collapse excessive blank lines
    .replace(/[ \t]{2,}/g, ' ')         // Normalize spaces
    .replace(/[^\x20-\x7E\n]/g, ' ')    // Remove non-printable chars
    .trim();
}

export function chunkText(text: string, maxChars = 10000): string[] {
  if (text.length <= maxChars) return [text];

  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + para).length > maxChars && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current += (current ? '\n\n' : '') + para;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function prepareTextForAI(raw: string): string {
  const cleaned = cleanText(raw);
  // For syllabus extraction we send the first 12k chars (the important content is usually up front)
  return cleaned.slice(0, 12000);
}
