import { redirect } from "next/navigation";
import { getSignedInProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { user, profile } = await getSignedInProfile();

  if (!user) {
    redirect("/login");
  }

  if (!profile) {
    redirect("/login?error=missing-profile");
  }

  redirect(profile.role === "worker" ? "/worker" : "/client");
}

