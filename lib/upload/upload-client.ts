import { compressImage } from "./compress-image";
import { EditorUploadResponse } from "@/types/upload";

export async function uploadFile(file: File): Promise<EditorUploadResponse> {
  try {
    if (file.type.startsWith("image/")) {
      file = await compressImage(file);
    }

    const formData = new FormData();
    formData.append("file", file);

    const signRes = await fetch("/api/upload/sign", {
      method: "POST",
      body: formData,
    });

    const signData = await signRes.json();

    if (!signData.success) {
      throw new Error(signData.error);
    }

    const uploadRes = await fetch(signData.uploadUrl, {
      method: "PUT",
      body: file,
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      throw new Error(`Upload failed: ${text}`);
    }

    return {
      success: 1,
      file: {
        url: signData.publicUrl,
        name: file.name,
        size: file.size,
        title: file.name,
      },
    };
  } catch (error) {
    console.error("[UPLOAD ERROR]", error);

    return {
      success: 0,
      message: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
