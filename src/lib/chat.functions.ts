import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const FrageSchema = z.object({
  frage: z.string().min(1).max(2000),
  verlauf: z
    .array(
      z.object({
        rolle: z.enum(["frage", "antwort"]),
        text: z.string().min(1).max(8000),
      }),
    )
    .max(20)
    .optional(),
});

type Karte = {
  titel: string;
  themenbereich: string | null;
  partnerorganisation: string | null;
  partner_typ: string;
  verantwortliche_person: string | null;
  status: string;
  naechste_frist: string | null;
  foerdermittelbezug: string | null;
  kurzbeschreibung: string | null;
};

function kontextZeile(k: Karte, heute: Date): string {
  let frist = "keine Frist";
  if (k.naechste_frist) {
    const ziel = new Date(`${k.naechste_frist.slice(0, 10)}T00:00:00Z`);
    const tage = Math.round(
      (Date.UTC(ziel.getUTCFullYear(), ziel.getUTCMonth(), ziel.getUTCDate()) -
        Date.UTC(heute.getUTCFullYear(), heute.getUTCMonth(), heute.getUTCDate())) /
        86400000,
    );
    frist = `${k.naechste_frist} (${tage < 0 ? `${Math.abs(tage)} Tage überfällig` : `in ${tage} Tagen`})`;
  }
  return [
    `- Titel: ${k.titel}`,
    `  Status: ${k.status}`,
    `  Partnerorganisation: ${k.partnerorganisation ?? "unbekannt"} (${k.partner_typ})`,
    `  Themenbereich: ${k.themenbereich ?? "-"}`,
    `  Verantwortlich: ${k.verantwortliche_person ?? "-"}`,
    `  Nächste Frist: ${frist}`,
    `  Fördermittelbezug: ${k.foerdermittelbezug ?? "-"}`,
    `  Kurzbeschreibung: ${k.kurzbeschreibung ?? "-"}`,
  ].join("\n");
}

export const boardFrage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FrageSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("Die KI-Anbindung ist nicht konfiguriert.");

    const supabaseKey = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const supabasePublic = createClient(process.env["SUPABASE_URL"]!, supabaseKey, {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (supabaseKey.startsWith("sb_") && h.get("Authorization") === `Bearer ${supabaseKey}`) {
            h.delete("Authorization");
          }
          h.set("apikey", supabaseKey);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data: karten, error } = await supabasePublic
      .from("projekte")
      .select(
        "titel, themenbereich, partnerorganisation, partner_typ, verantwortliche_person, status, naechste_frist, foerdermittelbezug, kurzbeschreibung",
      )
      .order("naechste_frist", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);

    const heute = new Date();
    const kontext =
      (karten as Karte[] | null)?.map((k) => kontextZeile(k, heute)).join("\n") ?? "";

    const instructions = [
      "Du bist der Assistent des Kanban-Boards 'Partner Compass' für die Koordination von Projekten mit mehreren externen Partnerorganisationen.",
      `Heutiges Datum: ${heute.toISOString().slice(0, 10)}.`,
      "Antworte immer auf Deutsch, kurz und klar; nutze Listen, wenn mehrere Projekte relevant sind.",
      "Wenn die Frage das Board betrifft, beantworte sie ausschließlich anhand der Board-Daten und nenne die relevanten Karten mit Titel und Status. Erfinde keine Karten, Fristen oder Partner.",
      "Wenn die Board-Daten die Frage nicht abdecken, sage das offen und beantworte die Frage danach mit deinem allgemeinen Wissen zu Projektkoordination, Fristenmanagement und Zusammenarbeit mit externen Partnern.",
      "Bei allgemeinen Fragen ohne Bezug zum Board antworte einfach hilfreich und weise nicht auf die Board-Daten hin.",
      "",
      "BOARD-DATEN:",
      kontext || "(keine Karten vorhanden)",
    ].join("\n");

    const eingaben = [
      ...(data.verlauf ?? []).map((n) =>
        n.rolle === "frage"
          ? { role: "user" as const, content: [{ type: "input_text" as const, text: n.text }] }
          : { role: "assistant" as const, content: [{ type: "output_text" as const, text: n.text }] },
      ),
      { role: "user" as const, content: [{ type: "input_text" as const, text: data.frage }] },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        instructions,
        input: eingaben,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
      }),
    });

    if (!res.ok || !res.body) {
      const text = res.body ? await res.text() : "";
      if (res.status === 429) throw new Error("Zu viele Anfragen – bitte kurz warten und erneut fragen.");
      if (res.status === 402)
        throw new Error("Das KI-Guthaben dieses Arbeitsbereichs ist aufgebraucht.");
      if (res.status === 403)
        throw new Error("Die KI-Nutzung ist für diesen Arbeitsbereich gesperrt.");
      throw new Error(`Die Anfrage an die KI ist fehlgeschlagen (${res.status}): ${text.slice(0, 300)}`);
    }

    // Streaming-Antwort (SSE) serverseitig einsammeln und als Ganzes zurückgeben.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let puffer = "";
    let antwort = "";
    let fehler = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      puffer += decoder.decode(value, { stream: true });
      const zeilen = puffer.split("\n");
      puffer = zeilen.pop() ?? "";
      for (const zeile of zeilen) {
        if (!zeile.startsWith("data:")) continue;
        const rohdaten = zeile.slice(5).trim();
        if (!rohdaten || rohdaten === "[DONE]") continue;
        try {
          const ereignis = JSON.parse(rohdaten) as {
            type?: string;
            delta?: string;
            response?: { output_text?: string | string[]; error?: { message?: string } };
            message?: string;
            error?: { message?: string };
          };
          if (ereignis.type === "response.output_text.delta" && ereignis.delta) {
            antwort += ereignis.delta;
          } else if (ereignis.type === "response.completed" && !antwort) {
            const gesamt = ereignis.response?.output_text;
            if (Array.isArray(gesamt)) antwort = gesamt.join("");
            else if (typeof gesamt === "string") antwort = gesamt;
          } else if (ereignis.type === "error" || ereignis.type === "response.failed") {
            fehler =
              ereignis.error?.message ?? ereignis.response?.error?.message ?? ereignis.message ?? "";
          }
        } catch {
          // unvollständiges oder unbekanntes Ereignis überspringen
        }
      }
    }

    if (!antwort.trim() && fehler) {
      throw new Error(`Die Anfrage an die KI ist fehlgeschlagen: ${fehler.slice(0, 300)}`);
    }

    return {
      antwort:
        antwort.trim() ||
        "Die KI hat keine Antwort formuliert. Bitte stelle die Frage noch einmal etwas konkreter.",
    };
  });
