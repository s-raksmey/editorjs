const VERIFY_TOTP_MUTATION = `
  mutation Verify($token: String!) {
    userMptcTwoFAVerify(token: $token)
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
    const { otp } = await req.json();

    if (!otp || !/^\d{6}$/.test(otp)) {
      return Response.json(
        { success: false, error: "Invalid OTP format" },
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
        query: VERIFY_TOTP_MUTATION,
        variables: { token: otp },
      }),
    });

    const setCookie = res.headers.get("set-cookie");
    const json = await res.json();

    if (json.errors) {
      const msg = json.errors[0]?.message ?? "Verification failed";
      return Response.json({ success: false, error: msg }, { status: 403 });
    }

    if (!json.data?.userMptcTwoFAVerify) {
      return Response.json(
        { success: false, error: "Invalid code. Try again." },
        { status: 403 },
      );
    }

    const headers = new Headers({ "Content-Type": "application/json" });
    if (setCookie) headers.set("set-cookie", setCookie);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers,
    });
  } catch (e) {
    console.error("[VERIFY-OTP] error:", e);
    return Response.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}
