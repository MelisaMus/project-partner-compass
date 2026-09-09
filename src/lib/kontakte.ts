import { supabase } from "@/integrations/supabase/client";

export type Kontakt = {
  id: string;
  partnerorganisation: string;
  name: string;
  rolle: string | null;
  email: string | null;
  telefon: string | null;
  notiz: string | null;
  created_at: string;
  letzte_aktualisierung: string;
};

export type KontaktEingabe = {
  partnerorganisation: string;
  name: string;
  rolle?: string | null;
  email?: string | null;
  telefon?: string | null;
  notiz?: string | null;
};

export const kontakteQueryOptions = {
  queryKey: ["kontakte"] as const,
  queryFn: async (): Promise<Kontakt[]> => {
    const { data, error } = await supabase
      .from("kontakte")
      .select("*")
      .order("partnerorganisation", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Kontakt[];
  },
};

export async function kontaktAnlegen(eingabe: KontaktEingabe): Promise<void> {
  const { error } = await supabase.from("kontakte").insert(eingabe);
  if (error) throw new Error(error.message);
}

export async function kontaktLoeschen(id: string): Promise<void> {
  const { error } = await supabase.from("kontakte").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Kontakte einer Partnerorganisation (Groß-/Kleinschreibung egal). */
export function kontakteFuerPartner(liste: Kontakt[], partner: string | null): Kontakt[] {
  const gesucht = (partner ?? "").trim().toLowerCase();
  if (!gesucht) return [];
  return liste.filter((k) => k.partnerorganisation.trim().toLowerCase() === gesucht);
}

export function telefonLink(telefon: string): string {
  return `tel:${telefon.replace(/[^\d+]/g, "")}`;
}
