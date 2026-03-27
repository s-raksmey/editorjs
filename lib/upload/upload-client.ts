import { EditorUploadResponse } from "@/types/upload";
import { compressImage } from "./compress-image";
import { sessionStore } from "./session-store";
import { tokenStore } from "./token-store";

function authHeaders(): HeadersInit {
  const token = tokenStore.get();
  console.log(
    "[UPLOAD] tokenStore:",
    token ? `✅ Bearer user-mptc.${token.slice(0, 8)}...` : "❌ empty",
  );
  return token
    ? {
        authorization: `Bearer user-mptc.${token}`,
        "apollo-require-preflight": "true",
        "apollographql-client-name": "cmd-admin",
        "apollographql-client-version": "v4",
      }
    : {};
}

async function signUpload(file: File): Promise<Response> {
  const formData = new FormData();
  formData.append("file", file);
  return fetch("/api/upload/sign", {
    method: "POST",
    credentials: "include",
    headers: authHeaders(),
    body: formData,
  });
}

async function trackStorage(size: number): Promise<void> {
  try {
    const res = await fetch("/api/upload/track", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ size }),
    });
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      console.warn("[UPLOAD] storage tracking failed:", error ?? res.status);
    }
  } catch (e) {
    console.warn("[UPLOAD] storage tracking error:", e);
  }
}

export async function uploadFile(file: File): Promise<EditorUploadResponse> {
  if (!sessionStore.isVerified()) {
    return {
      success: 0,
      message:
        "Two-factor verification required. Enter your 6-digit OTP first.",
    };
  }

  try {
    if (file.type.startsWith("image/")) {
      file = await compressImage(file);
    }

    window.dispatchEvent(new Event("upload:start"));

    const signRes = await signUpload(file);
    console.log("[UPLOAD] sign response status:", signRes.status);

    if (signRes.status === 401) {
      console.warn("[UPLOAD] 401 — token rejected");
      tokenStore.clear();
      sessionStore.clear();
      window.dispatchEvent(new Event("auth:required"));
      window.dispatchEvent(new Event("upload:done"));
      return { success: 0, message: "Authentication required" };
    }

    if (signRes.status === 403) {
      console.warn("[UPLOAD] 403 — session expired");
      tokenStore.clear();
      sessionStore.clear();
      window.dispatchEvent(new Event("auth:session-expired"));
      window.dispatchEvent(new Event("upload:done"));
      return {
        success: 0,
        message: "Session expired. Please re-authenticate.",
      };
    }

    const signData = await signRes.json();
    if (!signData.success) throw new Error(signData.error);

    const uploadRes = await fetch(signData.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`R2 upload failed: ${await uploadRes.text()}`);
    }

    void trackStorage(signData.size);
    window.dispatchEvent(new Event("upload:done"));

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
    window.dispatchEvent(new Event("upload:done"));
    return {
      success: 0,
      message: error instanceof Error ? error.message : "Upload failed",
    };
  }
}
