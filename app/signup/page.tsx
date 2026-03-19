"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function SignupPage() {
  const [loadingEmailSignUp, setLoadingEmailSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string | null>(null);

  const handleEmailSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingEmailSignUp(true);
    setErrorText(null);
    setInfoText(null);

    const supabase = createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setErrorText(error.message);
      setLoadingEmailSignUp(false);
      return;
    }

    if (session) {
      window.location.assign("/");
      return;
    }

    // Fallback: if no session is returned, continue at login without verification messaging.
    setInfoText("Account created. You can sign in now.");
    setLoadingEmailSignUp(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7f2] px-4 py-10 sm:px-6">
      <section className="relative z-10 w-full max-w-[620px] overflow-hidden rounded-3xl border border-[#d7e4d3] bg-[#f9fcf7] shadow-[0_26px_72px_rgba(22,62,39,0.14)]">
        <div className="bg-[#f9fcf7] px-6 py-8 sm:px-10 sm:py-10">
          <header className="mb-7">
            <h1 className="font-mono text-5xl font-semibold tracking-[-0.03em] text-[#183429] text-center">
              MangAI
            </h1>
          </header>

          <form onSubmit={handleEmailSignUp} className="space-y-5">
            <div className="space-y-2 bg-[#f9fcf7] flex flex-col">
              <label
                className="text-sm font-semibold uppercase tracking-[0.1em] text-[#486552]"
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
                className="h-14 w-full rounded-2xl border border-[#cfddca] bg-[#ffffff] px-4 text-lg text-[#1c352a] outline-none transition placeholder:text-[#95a79a] focus:border-[#86c98f] focus:ring-2 focus:ring-[#b6e2b9]/60"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-semibold uppercase tracking-[0.1em] text-[#486552]"
                htmlFor="password"
              >
                Password
              </label>
              <div className="flex h-14 items-center rounded-2xl border border-[#cfddca] bg-[#ffffff] pr-3">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  placeholder="Create a password"
                  className="h-full w-full rounded-2xl bg-transparent px-4 text-lg text-[#1c352a] outline-none placeholder:text-[#95a79a]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-sm font-semibold text-[#5a7263] transition hover:text-[#405848]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingEmailSignUp}
              className="h-14 w-full rounded-full bg-[#a5e37d] text-lg font-semibold text-[#1d3c2f] transition hover:translate-y-[-1px] hover:bg-[#95d770] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingEmailSignUp ? "Creating..." : "Create account"}
            </button>
          </form>

          {errorText && (
            <p className="mt-5 rounded-2xl border border-[#ebc2cd] bg-[#fff4f7] px-4 py-3 text-sm text-[#a03e60]">
              Sign up failed: {errorText}
            </p>
          )}

          {infoText && (
            <p className="mt-5 rounded-2xl border border-[#c7d9ea] bg-[#edf6ff] px-4 py-3 text-sm text-[#335d83]">
              {infoText}
            </p>
          )}

          <p className="mt-8 text-center text-base text-[#607768]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => window.location.assign("/login")}
              className="font-semibold text-[#3f7f56] transition hover:text-[#2f6943]"
            >
              Sign in
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
