"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

async function confirmEmail(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  return error;
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  fullName: z.string().min(2).max(80),
  organizationName: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
});

export type AuthFields = {
  email?: string;
  fullName?: string;
  organizationName?: string;
  password?: string;
};

export type AuthState = {
  error?: string;
  message?: string;
  success?: string;
  fields?: AuthFields;
  formKey?: string;
};

function readFields(formData: FormData): AuthFields {
  return {
    email: String(formData.get("email") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    organizationName: String(formData.get("organizationName") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
}

function firstAuthError(error: z.ZodError) {
  const field = error.issues[0]?.path[0];
  if (field === "password") return "Password must be at least 8 characters.";
  if (field === "email") return "Enter a valid work email.";
  if (field === "fullName") return "Name must be at least 2 characters.";
  if (field === "organizationName") return "Organization name must be at least 2 characters.";
  return "Check your details and try again.";
}

function errorState(error: string, formData: FormData): AuthState {
  return {
    error,
    fields: readFields(formData),
    formKey: crypto.randomUUID(),
  };
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return errorState(firstAuthError(parsed.error), formData);
  }

  const supabase = await createClient();
  let { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error?.message.toLowerCase().includes("email not confirmed")) {
    const admin = createAdminClient();
    const { data: users } = await admin.auth.admin.listUsers();
    const user = users.users.find(
      (entry) => entry.email?.toLowerCase() === parsed.data.email.toLowerCase(),
    );

    if (user) {
      await confirmEmail(user.id);
      ({ error } = await supabase.auth.signInWithPassword(parsed.data));
    }
  }

  if (error) {
    return errorState(error.message, formData);
  }

  redirect("/dashboard");
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    organizationName: formData.get("organizationName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return errorState(firstAuthError(parsed.error), formData);
  }

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        full_name: parsed.data.fullName,
        organization_name: parsed.data.organizationName,
      },
    },
  });

  if (error) {
    return errorState(error.message, formData);
  }

  if (data.user && !data.session) {
    await confirmEmail(data.user.id);
  }

  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (signInError) {
      return errorState(signInError.message, formData);
    }
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export const signIn = loginAction;
export const signUp = registerAction;
export const signOut = signOutAction;
