import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { extractText } from '@/lib/pdf/parse';
import { prepareTextForAI } from '@/lib/pdf/chunk';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'text/markdown',
  'text/plain',
  'text/x-markdown',
];

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const workspaceId = formData.get('workspace_id') as string | null;

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!workspaceId) {
      return Response.json({ error: 'workspace_id is required' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: 'File too large. Max 20MB.' }, { status: 413 });
    }
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(pdf|md|markdown|txt)$/i)) {
      return Response.json({ error: 'Invalid file type. Upload PDF, Markdown, or TXT.' }, { status: 415 });
    }

    const supabase = createServerClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`[Upload] File received: name="${file.name}", type="${file.type}", size=${file.size}, bufferLen=${buffer.length}`);

    // 1. Extract text from file
    let rawText: string;
    try {
      rawText = await extractText(buffer, file.type, file.name);
      console.log(`[Upload] Extraction success. rawText length: ${rawText.length}`);
      console.log(`[Upload] First 300 chars: ${rawText.slice(0, 300)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Text extraction failed';
      console.error('[Upload] Extraction error:', msg);
      return Response.json({ error: msg }, { status: 422 });
    }

    if (!rawText || rawText.trim().length < 50) {
      console.error(`[Upload] Extracted text too short: ${rawText?.trim().length ?? 0} chars`);
      return Response.json(
        { error: 'Could not extract readable text from this file. It may be a scanned PDF.' },
        { status: 422 }
      );
    }

    // 2. Upload file to Supabase Storage
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'syllabus';
    const storagePath = `${workspaceId}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error('[Upload] Storage error:', uploadError);
      return Response.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    const storageUrl = urlData?.publicUrl ?? '';

    // 3. Save syllabus_files record
    const cleanedText = prepareTextForAI(rawText);
    const { data: syllabusFile, error: dbError } = await supabase
      .from('syllabus_files')
      .insert({
        workspace_id: workspaceId,
        filename: file.name,
        storage_url: storageUrl,
        raw_text: cleanedText,
        uploaded_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('[Upload] DB error:', dbError);
      return Response.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    return Response.json({
      success: true,
      syllabus_id: syllabusFile.id,
      filename: file.name,
      text_length: cleanedText.length,
    });
  } catch (err) {
    console.error('[Upload] Unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
