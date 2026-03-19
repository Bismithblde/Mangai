"use client";

import { createClient } from "@/lib/supabase/client";
import { useRef, useState } from "react";

export default function LoginPage() {
  const cardRef = useRef<HTMLElement | null>(null);
  const [isCardHovered, setIsCardHovered] = useState(false);
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

  const handleCardMouseLeave = (event: React.MouseEvent<HTMLElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();

    if (!rect) {
      setIsCardHovered(false);
      return;
    }

    const isInsideBounds =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (!isInsideBounds) {
      setIsCardHovered(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#edf1f8] px-4 py-10 sm:px-6 ">
      <section
        ref={cardRef}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={handleCardMouseLeave}
        className={`w-full max-w-[560px] rounded-2xl border border-[#d8e2f1] bg-[#f3f7ff]
px-6 py-8 sm:px-10 sm:py-10 transform-gpu will-change-transform
shadow-[0_10px_24px_rgba(24,58,114,0.10)] transition-transform duration-200
${isCardHovered ? "-translate-y-3" : "translate-y-0"}`}
      >
        <header className="mb-7 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-[#0f1b2d]">
            Welcome back
          </h1>
          <p className="mt-3 text-xl text-[#5f6f87]">
            Sign in to continue your reading journey
          </p>
        </header>

        <form onSubmit={handleEmailSignIn} className="space-y-5">
          <div className="space-y-2">
            <label
              className="text-lg font-medium text-[#13233a]"
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
              className="h-14 w-full rounded-xl border border-[#d0dbeb] bg-[#fbfdff] px-4 text-xl text-[#1b2d48] outline-none transition focus:border-[#98b8ea] hover:bg-[#ffffff]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <label
                className="text-lg font-medium text-[#13233a]"
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
                className="text-base font-medium text-[#7da6eb] transition hover:text-[#6a95db]"
              >
                Forgot password?
              </button>
            </div>

            <div className="flex h-14 items-center rounded-xl border border-[#d0dbeb] bg-[#fbfdff] pr-3">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                placeholder="Enter your password"
                className="hover:bg-[#ffffff] h-full w-full rounded-xl bg-transparent px-4 text-xl text-[#1b2d48] outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-sm font-medium text-[#6e819f] transition hover:text-[#586a86]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-lg text-[#5f6f87]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-5 w-5 rounded border-[#c3d2e9] text-[#8fb6f3]"
            />
            <span>Remember me for 30 days</span>
          </label>

          <button
            type="submit"
            disabled={disableEmailActions}
            className="h-14 w-full rounded-xl bg-[#8fb6f3] text-xl font-semibold text-[#123a72] transition hover:bg-[#80aaf0] disabled:cursor-not-allowed hover:-translate-y-1"
          >
            {loadingEmailSignIn ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4 text-sm uppercase tracking-[0.08em] text-[#70809a]">
          <span className="h-px flex-1 bg-[#cfdaeb]" />
          <span>Or continue with</span>
          <span className="h-px flex-1 bg-[#cfdaeb]" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={disableEmailActions}
            className="h-14 rounded-xl border border-[#d0dbeb] bg-[#fbfdff] text-lg font-medium text-[#243958] transition hover:bg-[#f2f7ff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingGoogle ? "Redirecting..." : "Google"}
          </button>

          <button
            type="button"
            onClick={handleGithubSignIn}
            disabled={disableEmailActions}
            className="h-14 rounded-xl border border-[#d0dbeb] bg-[#fbfdff] text-lg font-medium text-[#243958] transition hover:bg-[#f2f7ff] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingGithub ? "Redirecting..." : "GitHub"}
          </button>
        </div>

        {(callbackError || errorText) && (
          <p className="mt-5 rounded-lg border border-[#edb6c6] bg-[#fff2f7] px-4 py-3 text-sm text-[#9f3258]">
            Login failed: {errorText ?? callbackError}
          </p>
        )}

        {infoText && (
          <p className="mt-5 rounded-lg border border-[#b9cfee] bg-[#ecf4ff] px-4 py-3 text-sm text-[#305e9a]">
            {infoText}
          </p>
        )}

        <p className="mt-8 text-center text-xl text-[#5f6f87]">
          Do not have an account?{" "}
          <button
            type="button"
            onClick={() => window.location.assign("/signup")}
            disabled={disableEmailActions}
            className="font-semibold text-[#7da6eb] transition hover:text-[#6a95db] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create one
          </button>
        </p>
      </section>
    </main>
  );
}
