
import type { EditorUploadResponse } from '@/types/upload';

export async function uploadFile(
  file: File,
  onProgress?: (p: number) => void
): Promise<EditorUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: 0,
        message: data.error || 'Upload failed',
      };
    }

    onProgress?.(100);

    return {
      success: 1,
      file: {
        url: data.publicUrl,
        name: file.name,
        size: file.size,
        title: file.name,
      },
    };
  } catch (error) {
    return {
      success: 0,
      message: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
