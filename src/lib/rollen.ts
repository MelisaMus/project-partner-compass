import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/** Zwei Zugriffsstufen: Verwaltung darf bearbeiten, Lesen darf nur ansehen. */
export type Rolle = "verwaltung" | "lesen";

export const meineRolleQueryOptions = {
  queryKey: ["meine-rolle"] as const,
  queryFn: async (): Promise<Rolle> => {
    const { data: sitzung } = await supabase.auth.getUser();
    const userId = sitzung.user?.id;
    if (!userId) return "lesen";
    const { data, error } = await supabase.from("rollen").select("rolle").eq("user_id", userId);
    if (error) throw new Error(error.message);
    return (data ?? []).some((zeile) => zeile.rolle === "verwaltung") ? "verwaltung" : "lesen";
  },
  staleTime: 60_000,
};

/** True, wenn die angemeldete Person Projekte, Termine, Dokumente und Kontakte ändern darf. */
export function useDarfBearbeiten(): boolean {
  const { data } = useQuery(meineRolleQueryOptions);
  return data === "verwaltung";
}

export const ROLLE_TEXT: Record<Rolle, string> = {
  verwaltung: "Verwaltung (darf bearbeiten)",
  lesen: "Lesen (nur ansehen)",
};
