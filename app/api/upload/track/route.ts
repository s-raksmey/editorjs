const INCREMENT_STORAGE_MUTATION = `
  mutation StorageUsage($size: Float!) {
    storageUsage(size: $size)
  }
`;

export async function POST(req: Request) {
  const authorization = req.headers.get("authorization") ?? "";
  const cookie = req.headers.get("cookie") ?? "";

  if (!authorization.startsWith("Bearer user-mptc.")) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const { size } = await req.json();

    if (typeof size !== "number" || size <= 0) {
      return Response.json(
        { success: false, error: "Invalid size" },
        { status: 400 },
      );
    }

    const res = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apollo-require-preflight": "true",
        "apollographql-client-name": "cmd-admin",
        "apollographql-client-version": "v4",
        authorization,
        ...(cookie && { cookie }),
      },
      body: JSON.stringify({
        query: INCREMENT_STORAGE_MUTATION,
        variables: { size },
      }),
    });

    const json = await res.json();

    if (json.errors) {
      console.error("[TRACK] storageUsage error:", json.errors);
      return Response.json(
        { success: false, error: json.errors[0]?.message },
        { status: 403 },
      );
    }

    console.log("[TRACK] storage updated +", (size / 1024).toFixed(3), "KB");
    return Response.json({ success: true });
  } catch (e) {
    console.error("[TRACK] error:", e);
    return Response.json(
      { success: false, error: "Tracking failed" },
      { status: 500 },
    );
  }
}
