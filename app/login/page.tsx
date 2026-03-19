"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);
  const [loadingEmailSignIn, setLoadingEmailSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string | null>(null);
  const [callbackError] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const queryError = new URLSearchParams(window.location.search).get("error");

    if (queryError === "email_verification_failed") {
      return "Email verification failed. Please request a new verification email.";
    }

    return queryError;
  });

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setErrorText(null);
    setInfoText(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setErrorText(error.message);
      setLoadingGoogle(false);
    }
  };

  const handleGithubSignIn = async () => {
    setLoadingGithub(true);
    setErrorText(null);
    setInfoText(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setErrorText(error.message);
      setLoadingGithub(false);
    }
  };

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingEmailSignIn(true);
    setErrorText(null);
    setInfoText(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorText(error.message);
      setLoadingEmailSignIn(false);
      return;
    }

    window.location.assign("/");
  };

  const disableEmailActions =
    loadingEmailSignIn || loadingGoogle || loadingGithub;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f2f5ef] px-4 py-10 sm:px-6">
      <section className="relative z-10 w-full max-w-[620px] overflow-hidden rounded-3xl border border-[#d6e1d4] bg-[#f8fbf5] shadow-[0_30px_80px_rgba(21,56,35,0.14)]">
        <div className="bg-[#f8fbf5] px-6 py-8 sm:px-10 sm:py-10">
          <header className="mb-7">
            <h1 className="font-mono text-5xl font-semibold tracking-[-0.03em] text-[#183429] text-center">
              MangAI
            </h1>
          </header>

          <form onSubmit={handleEmailSignIn} className="space-y-5">
            <div className="space-y-2 bg-[#f8fbf5] flex flex-col">
              <label
                className="text-sm font-semibold uppercase tracking-[0.1em] text-[#486552] "
                htmlFor="email"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                className="h-14 w-full rounded-2xl border border-[#cfdccb] bg-[#ffffff] px-4 text-lg text-[#1c352a] outline-none transition placeholder:text-[#93a598] focus:border-[#86c98f] focus:ring-2 focus:ring-[#b6e2b9]/60"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  className="text-sm font-semibold uppercase tracking-[0.1em] text-[#486552]"
                  htmlFor="password"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setInfoText(
                      "Password reset is not configured yet. Please contact support.",
                    )
                  }
                  className="text-sm font-semibold text-[#3a7d51] transition hover:text-[#2f6943]"
                >
                  Forgot password?
                </button>
              </div>

              <div className="flex h-14 items-center rounded-2xl border border-[#cfdccb] bg-[#ffffff] pr-3">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter your password"
                  className="h-full w-full rounded-2xl bg-transparent px-4 text-lg text-[#1c352a] outline-none placeholder:text-[#93a598]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-sm font-semibold text-[#597062] transition hover:text-[#415548]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-[#5c7465]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-5 w-5 rounded border-[#bfd0bd] text-[#5fa66e]"
              />
              <span>Keep me signed in for 30 days</span>
            </label>

            <button
              type="submit"
              disabled={disableEmailActions}
              className="h-14 w-full rounded-full bg-[#a5e37d] text-lg font-semibold text-[#1d3c2f] transition hover:translate-y-[-1px] hover:bg-[#95d770] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingEmailSignIn ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#7f9284]">
            <span className="h-px flex-1 bg-[#d8e3d2]" />
            <span>Or continue with</span>
            <span className="h-px flex-1 bg-[#d8e3d2]" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={disableEmailActions}
              className="h-12 rounded-full border border-[#cfdccb] bg-[#ffffff] text-sm font-semibold text-[#2f4f3d] transition hover:bg-[#f0f8ed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingGoogle ? "Redirecting..." : "Google"}
            </button>

            <button
              type="button"
              onClick={handleGithubSignIn}
              disabled={disableEmailActions}
              className="h-12 rounded-full border border-[#cfdccb] bg-[#ffffff] text-sm font-semibold text-[#2f4f3d] transition hover:bg-[#f0f8ed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingGithub ? "Redirecting..." : "GitHub"}
            </button>
          </div>

          {(callbackError || errorText) && (
            <p className="mt-5 rounded-2xl border border-[#ebc2cd] bg-[#fff4f7] px-4 py-3 text-sm text-[#a03e60]">
              Login failed: {errorText ?? callbackError}
            </p>
          )}

          {infoText && (
            <p className="mt-5 rounded-2xl border border-[#c7d9ea] bg-[#edf6ff] px-4 py-3 text-sm text-[#335d83]">
              {infoText}
            </p>
          )}

          <p className="mt-8 text-center text-base text-[#607768]">
            Do not have an account?{" "}
            <button
              type="button"
              onClick={() => window.location.assign("/signup")}
              disabled={disableEmailActions}
              className="font-semibold text-[#3f7f56] transition hover:text-[#2f6943] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Create one
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
