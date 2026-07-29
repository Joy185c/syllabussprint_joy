// PDF text extraction — server-side only, with full debug logging
import { parseOffice } from 'officeparser';
import Tesseract from 'tesseract.js';

import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';

export async function extractTextFromOffice(buffer: Buffer, ext: string): Promise<string> {
  console.log(`[OfficeParser] ====== START OFFICE EXTRACTION ======`);
  console.log(`[OfficeParser] Extension: ${ext}, Buffer length: ${buffer.length}`);
  const startTime = Date.now();
  
  const tmpPath = join(tmpdir(), `${randomBytes(8).toString('hex')}.${ext}`);
  
  try {
     await fs.writeFile(tmpPath, buffer);
     const ast = await parseOffice(tmpPath);
     const text = ast.toText();
     console.log(`[OfficeParser] Extracted ${text.length} chars in ${Date.now() - startTime}ms`);
     if (!text || text.trim().length === 0) throw new Error('Empty text returned');
     return text;
  } catch (err) {
     console.error(`[OfficeParser] Extraction failed:`, err);
     if (ext === 'doc') {
       throw new Error('Legacy DOC format detected. Please save as DOCX and try again.');
     }
     throw new Error(`Failed to parse ${ext?.toUpperCase() || 'document'} file. Please check the file format.`);
  } finally {
     await fs.unlink(tmpPath).catch(console.error);
  }
}

export async function extractTextFromImage(buffer: Buffer, ext: string): Promise<string> {
  console.log(`[OCR] ====== START IMAGE OCR ======`);
  const startTime = Date.now();
  try {
     const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
     console.log(`[OCR] Extracted ${text.length} chars in ${Date.now() - startTime}ms`);
     return text;
  } catch (err) {
     console.error(`[OCR] Failed:`, err);
     throw new Error('Failed to extract text from image.');
  }
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  console.log('[PDF] ====== START PDF EXTRACTION ======');
  console.log(`[PDF] Buffer type: ${typeof buffer}, is Buffer: ${Buffer.isBuffer(buffer)}, length: ${buffer.length} bytes`);

  if (buffer.length < 4) {
    throw new Error('[PDF] Buffer too small to be a valid PDF');
  }

  // Check PDF magic bytes %PDF
  const magic = buffer.slice(0, 4).toString('ascii');
  console.log(`[PDF] Magic bytes (first 4): "${magic}" — valid PDF header: ${magic === '%PDF'}`);

  if (magic !== '%PDF') {
    throw new Error(`[PDF] Not a PDF file. Magic bytes: "${magic}"`);
  }

  // ── Method 1: pdf2json (Highly reliable in Node.js) ─────────────────────
  console.log('[PDF] Attempting Method 1: pdf2json...');
  try {
    const PDFParser = require('pdf2json');
    const pdfParser = new PDFParser(null, 1);
    
    const parsedText = await new Promise<string>((resolve, reject) => {
      pdfParser.on("pdfParser_dataError", (err: any) => reject(new Error(err.parserError)));
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });
      pdfParser.parseBuffer(buffer);
    });

    const cleanText = parsedText.replace(/\\r\\n/g, '\n').replace(/\r\n/g, '\n');
    console.log(`[PDF] pdf2json success. Text length: ${cleanText.length}`);
    console.log(`[PDF] First 500 chars:\n${cleanText.slice(0, 500)}`);
    
    if (cleanText.trim().length > 10) return cleanText;
    throw new Error('pdf2json returned empty text');

  } catch (err1) {
    console.error('[PDF] Method 1 (pdf2json) FAILED:', (err1 as Error).message);
    console.error('[PDF] Stack:', (err1 as Error).stack);
  }

  // ── Method 2: pdfjs-dist ─────────────────────────────────────────────────
  console.log('[PDF] Attempting Method 2: pdfjs-dist...');
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);
    console.log(`[PDF] pdfjs-dist loaded. Keys: ${Object.keys(pdfjsLib).join(', ')}`);

    const lib = (pdfjsLib as any).default ?? pdfjsLib;
    const loadingTask = lib.getDocument({ data: new Uint8Array(buffer), useWorkerFetch: false, isEvalSupported: false });
    const pdf = await loadingTask.promise;
    console.log(`[PDF] pdfjs-dist: numPages = ${pdf.numPages}`);

    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');
      pageTexts.push(pageText);
      console.log(`[PDF] Page ${i}: ${pageText.length} chars`);
    }

    const fullText = pageTexts.join('\n');
    console.log(`[PDF] pdfjs-dist success. Total length: ${fullText.length}`);
    console.log(`[PDF] First 500 chars:\n${fullText.slice(0, 500)}`);

    if (fullText.trim().length > 10) return fullText;
    throw new Error('pdfjs-dist returned empty text');

  } catch (err2) {
    console.error('[PDF] Method 2 (pdfjs-dist) FAILED:', (err2 as Error).message);
    console.error('[PDF] Stack:', (err2 as Error).stack);
  }

  // ── Method 3: Raw text scan (last resort) ────────────────────────────────
  console.log('[PDF] Attempting Method 3: Raw text scan...');
  try {
    const raw = buffer.toString('latin1');
    // Extract printable ASCII text chunks from raw PDF bytes
    const textChunks: string[] = [];
    const regex = /BT[\s\S]*?ET/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
      const chunk = match[0]
        .replace(/\(([^)]+)\)\s*Tj/g, '$1 ')
        .replace(/\[([^\]]+)\]\s*TJ/g, (_, g) =>
          g.replace(/\(([^)]+)\)/g, '$1 ')
        )
        .replace(/BT|ET|T[jJdDmMfFlLsS*]|Td|Tf|Tm|[0-9.\s-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (chunk.length > 2) textChunks.push(chunk);
    }
    const recovered = textChunks.join(' ');
    console.log(`[PDF] Method 3 raw scan: recovered ${recovered.length} chars`);
    if (recovered.trim().length > 20) return recovered;
  } catch (err3) {
    console.error('[PDF] Method 3 (raw scan) FAILED:', (err3 as Error).message);
  }

  console.error('[PDF] ALL extraction methods failed.');
  throw new Error(
    'Failed to extract text from PDF. All extraction methods failed. Check server logs for details.'
  );
}

export async function extractTextFromMarkdown(content: string): Promise<string> {
  // Strip markdown formatting for cleaner AI input
  return content
    .replace(/#{1,6}\s/g, '')
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s/gm, '')
    .replace(/^\s*\d+\.\s/gm, '')
    .trim();
}

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase();
  console.log(`[Extract] filename="${filename}", mimeType="${mimeType}", ext="${ext}", bufferSize=${buffer.length}`);

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return extractTextFromPDF(buffer);
  }

  if (['doc', 'docx', 'ppt', 'pptx'].includes(ext || '')) {
    return extractTextFromOffice(buffer, ext || '');
  }

  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '') || mimeType.startsWith('image/')) {
    return extractTextFromImage(buffer, ext || '');
  }

  // Treat as plain text (txt, csv, json, md)
  const textContent = buffer.toString('utf-8');

  if (ext === 'md' || ext === 'markdown') {
    return extractTextFromMarkdown(textContent);
  }

  return textContent;
}
