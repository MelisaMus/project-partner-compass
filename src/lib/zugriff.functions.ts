import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Zugang = {
  id: string;
  email: string;
  rolle: "verwaltung" | "lesen";
  letzte_anmeldung: string | null;
  angelegt: string;
};

/** Stellt sicher, dass die anfragende Person die Rolle "verwaltung" hat. */
async function nurVerwaltung(context: { supabase: { from: (t: string) => any }; userId: string }) {
  const { data, error } = await context.supabase
    .from("rollen")
    .select("rolle")
    .eq("user_id", context.userId)
    .eq("rolle", "verwaltung")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Nur die Verwaltung darf Zugänge verwalten.");
}

export const zugaengeListe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Zugang[]> => {
    await nurVerwaltung(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: nutzer, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);

    const { data: rollen, error: rollenFehler } = await supabaseAdmin
      .from("rollen")
      .select("user_id, rolle");
    if (rollenFehler) throw new Error(rollenFehler.message);

    const verwaltung = new Set(
      (rollen ?? []).filter((r) => r.rolle === "verwaltung").map((r) => r.user_id),
    );

    return nutzer.users.map((u) => ({
      id: u.id,
      email: u.email ?? "(ohne E-Mail)",
      rolle: verwaltung.has(u.id) ? ("verwaltung" as const) : ("lesen" as const),
      letzte_anmeldung: u.last_sign_in_at ?? null,
      angelegt: u.created_at,
    }));
  });

export const zugangAnlegen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((daten) =>
    z
      .object({
        email: z.string().email(),
        passwort: z.string().min(10, "Mindestens 10 Zeichen"),
        rolle: z.enum(["verwaltung", "lesen"]),
      })
      .parse(daten),
  )
  .handler(async ({ context, data }) => {
    await nurVerwaltung(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: neu, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.passwort,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    if (!neu.user) throw new Error("Zugang konnte nicht angelegt werden.");

    if (data.rolle === "verwaltung") {
      const { error: rollenFehler } = await supabaseAdmin
        .from("rollen")
        .insert({ user_id: neu.user.id, rolle: "verwaltung" });
      if (rollenFehler) throw new Error(rollenFehler.message);
    }
    return { ok: true as const };
  });

export const rolleSetzen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((daten) =>
    z.object({ userId: z.string().uuid(), rolle: z.enum(["verwaltung", "lesen"]) }).parse(daten),
  )
  .handler(async ({ context, data }) => {
    await nurVerwaltung(context as never);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.rolle === "verwaltung") {
      const { error } = await supabaseAdmin
        .from("rollen")
        .upsert({ user_id: data.userId, rolle: "verwaltung" }, { onConflict: "user_id,rolle" });
      if (error) throw new Error(error.message);
      return { ok: true as const };
    }

    // Letzte Verwaltung darf sich die Rechte nicht selbst entziehen.
    const { data: verwaltende, error: zaehlFehler } = await supabaseAdmin
      .from("rollen")
      .select("user_id")
      .eq("rolle", "verwaltung");
    if (zaehlFehler) throw new Error(zaehlFehler.message);
    if ((verwaltende ?? []).length <= 1 && (verwaltende ?? [])[0]?.user_id === data.userId) {
      throw new Error("Mindestens ein Zugang muss die Rolle Verwaltung behalten.");
    }

    const { error } = await supabaseAdmin
      .from("rollen")
      .delete()
      .eq("user_id", data.userId)
      .eq("rolle", "verwaltung");
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const zugangEntfernen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((daten) => z.object({ userId: z.string().uuid() }).parse(daten))
  .handler(async ({ context, data }) => {
    await nurVerwaltung(context as never);
    if ((context as { userId: string }).userId === data.userId) {
      throw new Error("Der eigene Zugang kann nicht entfernt werden.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
