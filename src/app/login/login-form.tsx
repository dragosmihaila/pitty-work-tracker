"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { createClient } from "@/lib/supabase/browser";
import type { ProfileRole } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n";
import { usePlatformStyle } from "@/lib/use-platform-style";

export function LoginPanel({ missingProfile }: { missingProfile: boolean }) {
  const { language, setLanguage, t } = useLanguage();
  const platformStyle = usePlatformStyle();

  return (
    <main className={`flex min-h-screen items-center justify-center bg-paper px-4 py-10 os-${platformStyle}`}>
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="label">{t("appName")}</p>
          <LanguageSwitcher label={t("language")} language={language} onChange={setLanguage} />
        </div>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">{t("signIn")}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t("loginHelp")}</p>
        {missingProfile ? (
          <div className="mt-4 rounded-md border border-clay/30 bg-clay/10 p-3 text-sm text-clay">
            {t("missingProfile")}
          </div>
        ) : null}
        <LoginForm t={t} />
      </section>
    </main>
  );
}

function LoginForm({ t }: { t: (key: string, values?: Record<string, string | number>) => string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .single<{ role: ProfileRole }>();

    if (profileError || !profile) {
      setError(t("signedInMissingProfile"));
      setIsLoading(false);
      return;
    }

    router.replace(profile.role === "worker" ? "/worker" : "/client");
    router.refresh();
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="label" htmlFor="email">
          {t("email")}
        </label>
        <input className="field" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <label className="label" htmlFor="password">
          {t("password")}
        </label>
        <input
          className="field"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error ? <p className="text-sm text-clay">{error}</p> : null}
      <button className="btn-primary w-full" disabled={isLoading} type="submit">
        {isLoading ? t("signingIn") : t("signIn")}
      </button>
    </form>
  );
}
