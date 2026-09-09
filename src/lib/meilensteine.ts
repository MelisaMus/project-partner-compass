import { supabase } from "@/integrations/supabase/client";

export type Meilenstein = {
  id: string;
  projekt_id: string;
  titel: string;
  frist: string | null;
  notiz: string | null;
  erledigt: boolean;
  sortierung: number;
  created_at: string;
  letzte_aktualisierung: string;
};

export type MeilensteinEingabe = {
  projekt_id: string;
  titel: string;
  frist: string | null;
  notiz?: string | null;
};

export const meilensteineQueryOptions = {
  queryKey: ["meilensteine"] as const,
  queryFn: async (): Promise<Meilenstein[]> => {
    const { data, error } = await supabase
      .from("meilensteine")
      .select("*")
      .order("frist", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Meilenstein[];
  },
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
};

export async function meilensteinAnlegen(eingabe: MeilensteinEingabe): Promise<void> {
  const { error } = await supabase.from("meilensteine").insert(eingabe);
  if (error) throw new Error(error.message);
}

export async function meilensteinAktualisieren(
  id: string,
  aenderung: Partial<Pick<Meilenstein, "titel" | "frist" | "notiz" | "erledigt" | "sortierung">>,
): Promise<void> {
  const { error } = await supabase.from("meilensteine").update(aenderung).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function meilensteinLoeschen(id: string): Promise<void> {
  const { error } = await supabase.from("meilensteine").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Nächste offene Frist eines Projekts (für die Planer-Zusammenfassung). */
export function naechsterOffenerMeilenstein(liste: Meilenstein[]): Meilenstein | null {
  const offen = liste.filter((m) => !m.erledigt && m.frist);
  if (offen.length === 0) return null;
  return offen.reduce((a, b) => ((a.frist ?? "") <= (b.frist ?? "") ? a : b));
}
