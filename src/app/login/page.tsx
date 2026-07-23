import { redirect } from "next/navigation";
import { getSignedInProfile } from "@/lib/auth";
import { LoginForm } from "@/app/login/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { profile } = await getSignedInProfile();
  const params = await searchParams;

  if (profile) {
    redirect(profile.role === "worker" ? "/worker" : "/client");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="label">Pitty Work Log</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use the email and password from Supabase Auth.
        </p>
        {params.error === "missing-profile" ? (
          <div className="mt-4 rounded-md border border-clay/30 bg-clay/10 p-3 text-sm text-clay">
            Your account is missing a profile row. Add one in Supabase before signing in.
          </div>
        ) : null}
        <LoginForm />
      </section>
    </main>
  );
}

