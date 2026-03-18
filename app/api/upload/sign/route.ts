import { r2Storage } from "@/storage";
import { validateFile } from "@/lib/upload/validate-file";
import { generateUploadKey } from "@/lib/upload/generate-key";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { success: false, error: "No file" },
        { status: 400 }
      );
    }

    const validation = validateFile(file);

    if (!validation.valid) {
      return Response.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    const key = generateUploadKey(file, validation.type);

    const uploadUrl = await r2Storage.getSignedUploadUrl({
      key,
      mime: file.type,
    });

    return Response.json({
      success: true,
      uploadUrl,
      key,
      publicUrl: `${r2Storage.publicUrl}/${key}`,
    });
  } catch (error) {
    console.error("[UPLOAD SIGN ERROR]", error);

    return Response.json(
      { success: false, error: "Upload failed" },
      { status: 500 }
    );
  }
}