import { supabase } from "@/integrations/supabase/client";

export const STATUS_SPALTEN = [
  "Anbahnung",
  "In Abstimmung",
  "Laufend",
  "Berichtspflicht fällig",
  "Abgeschlossen",
] as const;

export type Status = (typeof STATUS_SPALTEN)[number];

export const PARTNER_TYPEN = [
  "Non-Profit",
  "Unternehmen",
  "Öffentliche Einrichtung",
  "Sonstige",
] as const;

export type PartnerTyp = (typeof PARTNER_TYPEN)[number];

export type Projekt = {
  id: string;
  titel: string;
  themenbereich: string | null;
  partnerorganisation: string | null;
  partner_typ: string;
  verantwortliche_person: string | null;
  status: string;
  naechste_frist: string | null;
  foerdermittelbezug: string | null;
  kurzbeschreibung: string | null;
  letzte_aktualisierung: string;
};

export type ProjektEingabe = Omit<Projekt, "id" | "letzte_aktualisierung">;

export const leeresProjekt: ProjektEingabe = {
  titel: "",
  themenbereich: "",
  partnerorganisation: "",
  partner_typ: "Sonstige",
  verantwortliche_person: "",
  status: "Anbahnung",
  naechste_frist: null,
  foerdermittelbezug: "",
  kurzbeschreibung: "",
};

export const projekteQueryOptions = {
  queryKey: ["projekte"] as const,
  queryFn: async (): Promise<Projekt[]> => {
    const { data, error } = await supabase
      .from("projekte")
      .select("*")
      .order("naechste_frist", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Projekt[];
  },
  // Fristen-Alarm hält sich ohne Neuladen aktuell
  refetchInterval: 60_000,
  refetchOnWindowFocus: true,
};

export async function projektAnlegen(eingabe: ProjektEingabe): Promise<void> {
  const { error } = await supabase.from("projekte").insert(eingabe);
  if (error) throw new Error(error.message);
}

export async function projektAktualisieren(id: string, eingabe: Partial<ProjektEingabe>): Promise<void> {
  const { error } = await supabase.from("projekte").update(eingabe).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function projektLoeschen(id: string): Promise<void> {
  const { error } = await supabase.from("projekte").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
