import { supabase } from "@/integrations/supabase/client";

export const DOKUMENTE_BUCKET = "projekt-dokumente";

export type Dokument = {
  id: string;
  projekt_id: string;
  dateiname: string;
  pfad: string;
  dateityp: string | null;
  groesse: number | null;
  created_at: string;
  letzte_aktualisierung: string;
};

export function dokumenteQueryOptions(projektId: string) {
  return {
    queryKey: ["dokumente", projektId] as const,
    queryFn: async (): Promise<Dokument[]> => {
      const { data, error } = await supabase
        .from("dokumente")
        .select("*")
        .eq("projekt_id", projektId)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Dokument[];
    },
  };
}

function sicherName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

export async function dokumentHochladen(projektId: string, datei: File): Promise<void> {
  const pfad = `${projektId}/${Date.now()}-${sicherName(datei.name)}`;
  const { error: uploadFehler } = await supabase.storage
    .from(DOKUMENTE_BUCKET)
    .upload(pfad, datei, datei.type ? { contentType: datei.type, upsert: false } : { upsert: false });
  if (uploadFehler) throw new Error(uploadFehler.message);

  const { error } = await supabase.from("dokumente").insert({
    projekt_id: projektId,
    dateiname: datei.name,
    pfad,
    dateityp: datei.type || null,
    groesse: datei.size,
  });
  if (error) {
    await supabase.storage.from(DOKUMENTE_BUCKET).remove([pfad]);
    throw new Error(error.message);
  }
}

export async function dokumentLinkHolen(pfad: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(DOKUMENTE_BUCKET)
    .createSignedUrl(pfad, 60 * 10);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Link konnte nicht erstellt werden");
  return data.signedUrl;
}

export async function dokumentLoeschen(dokument: Dokument): Promise<void> {
  const { error: storageFehler } = await supabase.storage
    .from(DOKUMENTE_BUCKET)
    .remove([dokument.pfad]);
  if (storageFehler) throw new Error(storageFehler.message);
  const { error } = await supabase.from("dokumente").delete().eq("id", dokument.id);
  if (error) throw new Error(error.message);
}

export function groesseText(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
