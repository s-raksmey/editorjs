"use client";

import { sessionStore } from "@/lib/upload/session-store";
import { tokenStore } from "@/lib/upload/token-store";
import { useEffect, useRef, useState } from "react";

type AuthState = "idle" | "verifying" | "loggedIn" | "expired";
type OtpState = "idle" | "submitting" | "verified" | "error";

function getInitialToken() {
  return tokenStore.get() ?? "";
}
function getInitialAuthState(): AuthState {
  return tokenStore.get() ? "loggedIn" : "idle";
}
function getInitialOtpState(): OtpState {
  return sessionStore.isVerified() ? "verified" : "idle";
}

export function TokenAuth() {
  const [authState, setAuthState] = useState<AuthState>(getInitialAuthState);
  const [token, setToken] = useState<string>(getInitialToken);
  const [inputValue, setInputValue] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [visible, setVisible] = useState(false);

  const [otpState, setOtpState] = useState<OtpState>(getInitialOtpState);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = () => {
      tokenStore.clear();
      sessionStore.clear();
      setToken("");
      setAuthState("expired");
      setOtpState("idle");
      setOtpValue("");
      setOtpError("");
    };
    window.addEventListener("auth:required", handler);
    return () => window.removeEventListener("auth:required", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      tokenStore.clear();
      sessionStore.clear();
      setToken("");
      setAuthState("expired");
      setOtpState("idle");
      setOtpValue("");
      setOtpError("");
    };
    window.addEventListener("auth:session-expired", handler);
    return () => window.removeEventListener("auth:session-expired", handler);
  }, []);

  useEffect(() => {
    const onStart = () =>
      setAuthState((p) => (p === "loggedIn" ? "verifying" : p));
    const onDone = () =>
      setAuthState((p) => (p === "verifying" ? "loggedIn" : p));
    window.addEventListener("upload:start", onStart);
    window.addEventListener("upload:done", onDone);
    return () => {
      window.removeEventListener("upload:start", onStart);
      window.removeEventListener("upload:done", onDone);
    };
  }, []);

  useEffect(() => {
    if (authState === "loggedIn" && otpState === "idle") {
      setTimeout(() => otpInputRef.current?.focus(), 50);
    }
  }, [authState, otpState]);

  const handleConnectToken = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setTokenError("Please paste your token.");
      return;
    }
    const clean = trimmed
      .replace(/^Bearer\s+user-mptc\./i, "")
      .replace(/^user-mptc\./i, "");
    tokenStore.set(clean);
    setToken(clean);
    setInputValue("");
    setTokenError("");
    setAuthState("loggedIn");
    sessionStore.clear();
    setOtpState("idle");
    setOtpValue("");
    setOtpError("");
  };

  const handleVerifyOtp = async () => {
    const code = otpValue.trim();
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setOtpError("Enter a valid 6-digit code.");
      return;
    }
    setOtpState("submitting");
    setOtpError("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer user-mptc.${token}`,
          "apollo-require-preflight": "true",
          "apollographql-client-name": "cmd-admin",
          "apollographql-client-version": "v4",
        },
        body: JSON.stringify({ otp: code }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setOtpError(json.error ?? "Invalid code. Try again.");
        setOtpState("error");
        setOtpValue("");
        setTimeout(() => otpInputRef.current?.focus(), 50);
        return;
      }

      sessionStore.setVerified(true);
      window.dispatchEvent(new Event("auth:verified"));
      setOtpState("verified");
      setOtpValue("");
    } catch {
      setOtpError("Verification failed. Try again.");
      setOtpState("error");
      setOtpValue("");
    }
  };

  const handleDisconnect = () => {
    tokenStore.clear();
    sessionStore.clear();
    window.dispatchEvent(new Event("auth:required"));
    setToken("");
    setAuthState("idle");
    setOtpState("idle");
    setOtpValue("");
    setOtpError("");
    setVisible(false);
  };

  const masked = token ? `user-mptc.${token.slice(0, 8)}${"•".repeat(12)}` : "";

  if (authState === "verifying") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
        <span className="text-xs text-gray-400 font-mono tracking-wide animate-pulse">
          verifying…
        </span>
      </div>
    );
  }

  if (authState === "expired") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-200 bg-red-50">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
          <span className="text-xs text-red-400 font-mono tracking-wide">
            session expired
          </span>
        </div>
        <TokenInput
          value={inputValue}
          onChange={(v) => {
            setInputValue(v);
            setTokenError("");
          }}
          onSubmit={handleConnectToken}
          visible={visible}
          onToggleVisible={() => setVisible((v) => !v)}
          error={tokenError}
          placeholder="Paste new token…"
          borderColor="border-red-200 focus:border-gray-400"
        />
        <button
          onClick={handleConnectToken}
          className="px-4 py-1.5 rounded-full text-xs font-medium font-mono tracking-wide bg-black text-white hover:bg-gray-800 transition-all duration-200"
        >
          Reconnect
        </button>
        {tokenError && (
          <span className="text-xs text-red-400 font-mono">{tokenError}</span>
        )}
      </div>
    );
  }

  if (authState === "loggedIn") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-xs text-gray-500 font-mono tracking-wide">
            {masked}
          </span>
          <button
            onClick={handleDisconnect}
            className="ml-1 text-xs text-gray-300 hover:text-red-400 font-mono transition-colors"
            aria-label="Remove token"
          >
            ✕
          </button>
        </div>

        <div className="w-px h-4 bg-gray-200" />

        {otpState === "verified" ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs text-emerald-600 font-mono tracking-wide">
              2FA verified
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={otpValue}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtpValue(val);
                setOtpError("");
                if (val.length === 6) {
                  setTimeout(() => handleVerifyOtp(), 0);
                }
              }}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              placeholder="6-digit OTP"
              disabled={otpState === "submitting"}
              className={`
                w-32 px-3 py-1.5 rounded-full text-xs font-mono tracking-widest text-center
                border bg-white outline-none transition-all duration-200
                placeholder:text-gray-300 text-gray-700
                disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  otpError
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-gray-400"
                }
              `}
            />
            <button
              onClick={handleVerifyOtp}
              disabled={otpState === "submitting" || otpValue.length !== 6}
              className="px-3 py-1.5 rounded-full text-xs font-medium font-mono tracking-wide bg-black text-white hover:bg-gray-800 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {otpState === "submitting" ? "…" : "Verify"}
            </button>
            {otpError && (
              <span className="text-xs text-red-400 font-mono">{otpError}</span>
            )}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <TokenInput
        value={inputValue}
        onChange={(v) => {
          setInputValue(v);
          setTokenError("");
        }}
        onSubmit={handleConnectToken}
        visible={visible}
        onToggleVisible={() => setVisible((v) => !v)}
        error={tokenError}
        placeholder="Paste token…"
        borderColor={
          tokenError
            ? "border-red-300 focus:border-red-400"
            : "border-gray-200 focus:border-gray-400"
        }
      />
      <button
        onClick={handleConnectToken}
        className="px-4 py-1.5 rounded-full text-xs font-medium font-mono tracking-wide bg-black text-white hover:bg-gray-800 transition-all duration-200"
      >
        Connect
      </button>
      {tokenError && (
        <span className="text-xs text-red-400 font-mono">{tokenError}</span>
      )}
    </div>
  );
}

function TokenInput({
  value,
  onChange,
  onSubmit,
  visible,
  onToggleVisible,
  error,
  placeholder,
  borderColor,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  visible: boolean;
  onToggleVisible: () => void;
  error: string;
  placeholder: string;
  borderColor: string;
}) {
  return (
    <div className="relative flex items-center">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder={placeholder}
        className={`
          w-56 px-3 py-1.5 pr-12 rounded-full text-xs font-mono tracking-wide
          border bg-white outline-none transition-all duration-200
          placeholder:text-gray-300 text-gray-700
          ${error ? "border-red-300 focus:border-red-400" : borderColor}
        `}
      />
      <button
        onClick={onToggleVisible}
        className="absolute right-2.5 text-gray-300 hover:text-gray-500 transition-colors text-xs font-mono"
        tabIndex={-1}
      >
        {visible ? "hide" : "show"}
      </button>
    </div>
  );
}
