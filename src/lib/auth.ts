import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfileRole = "worker" | "client";

export type Profile = {
  id: string;
  role: ProfileRole;
  full_name: string;
};

export async function getSignedInProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single<Profile>();

  if (error || !profile) {
    return { supabase, user, profile: null };
  }

  return { supabase, user, profile };
}

export async function requireRole(role: ProfileRole) {
  const session = await getSignedInProfile();

  if (!session.user) {
    redirect("/login");
  }

  if (!session.profile) {
    redirect("/login?error=missing-profile");
  }

  if (session.profile.role !== role) {
    redirect(session.profile.role === "worker" ? "/worker" : "/client");
  }

  return {
    supabase: session.supabase,
    user: session.user,
    profile: session.profile
  };
}

