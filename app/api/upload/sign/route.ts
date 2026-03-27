import { generateUploadKey } from "@/lib/upload/generate-key";
import { validateFile } from "@/lib/upload/validate-file";
import { r2Storage } from "@/storage";

function buildHeaders(authorization: string, cookie?: string) {
  return {
    "Content-Type": "application/json",
    "apollo-require-preflight": "true",
    "apollographql-client-name": "cmd-admin",
    "apollographql-client-version": "v4",
    authorization,
    ...(cookie && { cookie }),
  };
}

const ME_QUERY = `query Me { meMptc { uuid } }`;

async function verifyToken(
  authorization: string,
  cookie: string,
): Promise<{ valid: boolean; sessionExpired: boolean }> {
  if (!authorization.startsWith("Bearer user-mptc.")) {
    return { valid: false, sessionExpired: false };
  }

  try {
    const res = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL!, {
      method: "POST",
      headers: buildHeaders(authorization, cookie),
      body: JSON.stringify({ query: ME_QUERY }),
    });

    const { data, errors } = await res.json();

    if (errors) {
      const isExpired = errors.some(
        (e: { extensions?: { code?: string } }) =>
          e.extensions?.code === "SESSION_EXPIRED",
      );
      console.warn(
        isExpired ? "[SIGN] session expired" : "[SIGN] auth errors:",
        errors,
      );
      return { valid: false, sessionExpired: isExpired };
    }

    return { valid: !!data?.meMptc?.uuid, sessionExpired: false };
  } catch (e) {
    console.error("[SIGN] verifyToken error:", e);
    return { valid: false, sessionExpired: false };
  }
}

export async function POST(req: Request) {
  const authorization = req.headers.get("authorization") ?? "";
  const cookie = req.headers.get("cookie") ?? "";

  const { valid, sessionExpired } = await verifyToken(authorization, cookie);

  if (!valid) {
    return Response.json(
      {
        success: false,
        error: sessionExpired ? "Session expired" : "Unauthorized",
      },
      { status: sessionExpired ? 403 : 401 },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { success: false, error: "No file" },
        { status: 400 },
      );
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return Response.json(
        { success: false, error: validation.error },
        { status: validation.status },
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
      size: file.size,
    });
  } catch (error) {
    console.error("[SIGN] error:", error);
    return Response.json(
      { success: false, error: "Upload failed" },
      { status: 500 },
    );
  }
}
