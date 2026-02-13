
import { r2Storage } from '@/storage';
import {
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  PDF_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_PDF_SIZE,
} from '@/types/upload';


type ValidationResult = { valid: true; type: 'image' | 'video' | 'pdf' } | { valid: false; error: string; status: number };

function validateFile(file: File): ValidationResult {
  if (!file) {
    return { valid: false, error: 'No file provided', status: 400 };
  }
  const isImage = IMAGE_MIME_TYPES.includes(file.type);
  const isVideo = VIDEO_MIME_TYPES.includes(file.type);
  const isPDF = PDF_MIME_TYPES.includes(file.type as import('@/types/upload').PDFMimeType);
  if (!isImage && !isVideo && !isPDF) {
    return { valid: false, error: 'Unsupported file type', status: 400 };
  }
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Image too large', status: 400 };
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { valid: false, error: 'Video too large', status: 400 };
  }
  if (isPDF && file.size > MAX_PDF_SIZE) {
    return { valid: false, error: 'PDF too large', status: 400 };
  }
  if (isImage) return { valid: true, type: 'image' };
  if (isVideo) return { valid: true, type: 'video' };
  if (isPDF) return { valid: true, type: 'pdf' };
  return { valid: false, error: 'Unknown file type', status: 400 };
}

function generateUploadKey(file: File) {
  const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  let folder = 'uploads/other';
  if (file.type.startsWith('video/')) {
    folder = 'uploads/videos';
  } else if (file.type.startsWith('image/')) {
    folder = 'uploads/images';
  } else if (PDF_MIME_TYPES.includes(file.type as import('@/types/upload').PDFMimeType)) {
    folder = 'uploads/pdfs';
  }
  return `${folder}/${Date.now()}-${safe}`;
}



export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return Response.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return Response.json({ success: false, error: validation.error }, { status: validation.status });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const key = generateUploadKey(file);

    let publicUrl: string;
    try {
      publicUrl = await r2Storage.upload({
        key,
        buffer,
        mime: file.type,
      });
    } catch (uploadErr) {
      console.error('[UPLOAD ERROR]', uploadErr);
      return Response.json({ success: false, error: 'Failed to upload file' }, { status: 500 });
    }

    return Response.json({
      success: true,
      publicUrl,
      type: validation.type,
    });
  } catch (err) {
    console.error('[UPLOAD]', err);
    return Response.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}