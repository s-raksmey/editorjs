import { r2Storage } from '@/storage';
import {
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from '@/types/upload';

function generateUploadKey(file: File) {
  const safe = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const folder = file.type.startsWith('video/')
    ? 'uploads/videos'
    : 'uploads/images';
  return `${folder}/${Date.now()}-${safe}`;
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    const isImage = IMAGE_MIME_TYPES.includes(file.type);
    const isVideo = VIDEO_MIME_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return Response.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return Response.json({ error: 'Image too large' }, { status: 400 });
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return Response.json({ error: 'Video too large' }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const key = generateUploadKey(file);

    const publicUrl = await r2Storage.upload({
      key,
      buffer,
      mime: file.type,
    });

    return Response.json({
      success: true,
      publicUrl,
      type: isImage ? 'image' : 'video',
    });
  } catch (err) {
    console.error('[UPLOAD]', err);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }
}