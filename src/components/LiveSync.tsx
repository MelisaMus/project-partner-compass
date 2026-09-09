import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/**
 * Hält Board und Übersicht synchron: jede Änderung an Projekten oder
 * Meilensteinen aktualisiert sofort alle offenen Ansichten.
 */
export function LiveSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const kanal = supabase
      .channel("partner-compass-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projekte" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["projekte"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meilensteine" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["meilensteine"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(kanal);
    };
  }, [queryClient]);

  return null;
}
