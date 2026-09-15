"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

function loginUrl(params: Record<string, string>) {
  return `/login?${new URLSearchParams(params)}`;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(loginUrl({ error: "Email o contraseña incorrectos", next }));
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const origin =
    (await headers()).get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/confirm?next=/mi-cuenta`,
    },
  });

  if (error) {
    redirect(loginUrl({ error: error.message }));
  }

  // Si el proyecto pide confirmar el email, todavía no hay sesión
  if (!data.session) {
    redirect(
      loginUrl({
        message: "Te enviamos un email para confirmar tu cuenta.",
      }),
    );
  }

  revalidatePath("/", "layout");
  redirect("/mi-cuenta");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}
