"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { siteConfig } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/utils";

function withParams(path: string, params: Record<string, string>) {
  return `${path}?${new URLSearchParams(params)}`;
}

async function siteOrigin() {
  return (await headers()).get("origin") || siteConfig.url;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(withParams("/login", { error: authErrorMessage(error), next }));
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(formData.get("next"));

  if (fullName.length < 3) {
    redirect(
      withParams("/login", {
        modo: "registro",
        error: "Escribí tu nombre y apellido.",
        next,
      }),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    redirect(
      withParams("/login", {
        modo: "registro",
        error: authErrorMessage(error),
        next,
      }),
    );
  }

  // Si el proyecto pide confirmar el email, todavía no hay sesión
  if (!data.session) {
    redirect(
      withParams("/login", {
        message:
          "Te enviamos un email para confirmar tu cuenta. Abrí el link y listo.",
        next,
      }),
    );
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}

/** Manda el link para elegir una contraseña nueva. No revela si el email existe. */
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/mi-cuenta/contrasena`,
  });

  if (error && error.code?.startsWith("over_")) {
    redirect(
      withParams("/login/recuperar", { error: authErrorMessage(error) }),
    );
  }

  redirect(
    withParams("/login/recuperar", {
      message:
        "Si hay una cuenta con ese email, te llegó un link para elegir una contraseña nueva.",
    }),
  );
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!(await getCurrentUser())) {
    redirect("/login?next=/mi-cuenta/contrasena");
  }

  if (password !== confirm) {
    redirect(
      withParams("/mi-cuenta/contrasena", {
        error: "Las contraseñas no coinciden.",
      }),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      withParams("/mi-cuenta/contrasena", { error: authErrorMessage(error) }),
    );
  }

  redirect(
    withParams("/mi-cuenta", { message: "Actualizamos tu contraseña." }),
  );
}
