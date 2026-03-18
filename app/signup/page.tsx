"use client";

import { createClient } from "@/lib/supabase/client";
import { useRef, useState } from "react";

export default function SignupPage() {
  const cardRef = useRef<HTMLElement | null>(null);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [loadingEmailSignUp, setLoadingEmailSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string | null>(null);

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
    <main className="flex min-h-screen items-center justify-center bg-[#edf1f8] px-4 py-10 sm:px-6">
      <section
        ref={cardRef}
        onMouseEnter={() => setIsCardHovered(true)}
        onMouseLeave={handleCardMouseLeave}
        className={`w-full max-w-[560px] rounded-2xl border border-[#d8e2f1] bg-[#f3f7ff] px-6 py-8 sm:px-10 sm:py-10 transition-transform duration-200 ${isCardHovered ? "scale-100 -translate-y-1" : "scale-90"}`}
      >
        <header className="mb-7 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-[#0f1b2d]">
            Create account
          </h1>
          <p className="mt-3 text-xl text-[#5f6f87]">
            Sign up to start your reading journey
          </p>
        </header>

        <form onSubmit={handleEmailSignUp} className="space-y-5">
          <div className="space-y-2">
            <label className="text-lg font-medium text-[#13233a]" htmlFor="email">
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
            <label className="text-lg font-medium text-[#13233a]" htmlFor="password">
              Password
            </label>
            <div className="flex h-14 items-center rounded-xl border border-[#d0dbeb] bg-[#fbfdff] pr-3">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                placeholder="Create a password"
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

          <button
            type="submit"
            disabled={loadingEmailSignUp}
            className="h-14 w-full rounded-xl bg-[#8fb6f3] text-xl font-semibold text-[#123a72] transition hover:bg-[#80aaf0] disabled:cursor-not-allowed hover:-translate-y-1 disabled:opacity-60"
          >
            {loadingEmailSignUp ? "Creating..." : "Create account"}
          </button>
        </form>

        {errorText && (
          <p className="mt-5 rounded-lg border border-[#edb6c6] bg-[#fff2f7] px-4 py-3 text-sm text-[#9f3258]">
            Sign up failed: {errorText}
          </p>
        )}

        {infoText && (
          <p className="mt-5 rounded-lg border border-[#b9cfee] bg-[#ecf4ff] px-4 py-3 text-sm text-[#305e9a]">
            {infoText}
          </p>
        )}

        <p className="mt-8 text-center text-xl text-[#5f6f87]">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => window.location.assign("/login")}
            className="font-semibold text-[#7da6eb] transition hover:text-[#6a95db]"
          >
            Sign in
          </button>
        </p>
      </section>
    </main>
  );
}
