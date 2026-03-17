"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmailSignIn, setLoadingEmailSignIn] = useState(false);
  const [loadingEmailSignUp, setLoadingEmailSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoadingEmailSignIn(true);
    setErrorText(null);
    setInfoText(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorText(error.message);
      setLoadingEmailSignIn(false);
      return;
    }

    window.location.assign("/");
  };

  const handleEmailSignUp = async () => {
    setLoadingEmailSignUp(true);
    setErrorText(null);
    setInfoText(null);

    const supabase = createClient();
    const emailRedirectTo = `${window.location.origin}/auth/confirm?next=/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      setErrorText(error.message);
      setLoadingEmailSignUp(false);
      return;
    }

    setInfoText("Check your email to verify your account, then sign in.");
    setLoadingEmailSignUp(false);
  };

  const disableEmailActions =
    loadingEmailSignIn || loadingEmailSignUp || loadingGoogle;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-start justify-center gap-6 p-8 sm:p-12">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="text-sm text-zinc-600">
        Authenticate with Google, or use email/password with verification.
      </p>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={disableEmailActions}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingGoogle ? "Redirecting..." : "Continue with Google"}
      </button>

      <div className="h-px w-full bg-zinc-200" />

      <form onSubmit={handleEmailSignIn} className="flex w-full flex-col gap-3">
        <label className="text-sm font-medium text-zinc-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />

        <label className="text-sm font-medium text-zinc-700" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={6}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />

        <div className="mt-2 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={disableEmailActions}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingEmailSignIn ? "Signing in..." : "Sign in with email"}
          </button>

          <button
            type="button"
            onClick={() => void handleEmailSignUp()}
            disabled={disableEmailActions}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingEmailSignUp ? "Creating account..." : "Create account"}
          </button>
        </div>
      </form>

      {(callbackError || errorText) && (
        <p className="text-sm text-red-600">
          Login failed: {errorText ?? callbackError}
        </p>
      )}

      {infoText && <p className="text-sm text-emerald-700">{infoText}</p>}

      <Link href="/" className="text-sm text-zinc-700 underline">
        Back to home
      </Link>
    </main>
  );
}