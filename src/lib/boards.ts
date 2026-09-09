import { supabase } from "@/integrations/supabase/client";

export type Board = {
  id: string;
  name: string;
  beschreibung: string | null;
  sortierung: number;
  letzte_aktualisierung: string;
};

export const OHNE_BOARD = "ohne";

export const boardsQueryOptions = {
  queryKey: ["boards"] as const,
  queryFn: async (): Promise<Board[]> => {
    const { data, error } = await supabase
      .from("boards")
      .select("id, name, beschreibung, sortierung, letzte_aktualisierung")
      .order("sortierung", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as Board[];
  },
  refetchOnWindowFocus: true,
};

export async function boardAnlegen(name: string, beschreibung: string | null): Promise<void> {
  const { error } = await supabase.from("boards").insert({ name, beschreibung });
  if (error) throw new Error(error.message);
}

export async function boardUmbenennen(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("boards").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function boardLoeschen(id: string): Promise<void> {
  const { error } = await supabase.from("boards").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
