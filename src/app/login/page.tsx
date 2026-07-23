import { redirect } from "next/navigation";
import { getSignedInProfile } from "@/lib/auth";
import { LoginPanel } from "@/app/login/login-form";

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

  return <LoginPanel missingProfile={params.error === "missing-profile"} />;
}
