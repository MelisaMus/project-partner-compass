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

    const systemPrompt = [
      "Du bist der Assistent des Kanban-Boards 'Partner Compass' für die Koordination von Projekten mit externen Partnerorganisationen.",
      `Heutiges Datum: ${heute.toISOString().slice(0, 10)}.`,
      "Antworte kurz, klar und auf Deutsch. Nenne die relevanten Karten immer mit Titel und Status.",
      "Nutze ausschließlich die folgenden Board-Daten. Wenn die Daten die Frage nicht beantworten, sage das offen.",
      "",
      "BOARD-DATEN:",
      kontext || "(keine Karten vorhanden)",
    ].join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.8-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.frage },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Zu viele Anfragen – bitte kurz warten und erneut fragen.");
      if (res.status === 402)
        throw new Error("Das KI-Guthaben dieses Arbeitsbereichs ist aufgebraucht.");
      throw new Error(`Die Anfrage an die KI ist fehlgeschlagen (${res.status}): ${text.slice(0, 300)}`);
    }

    const payload = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const antwort = payload.choices?.[0]?.message?.content?.trim();
    return { antwort: antwort || "Dazu finde ich in den Board-Daten keine Antwort." };
  });
