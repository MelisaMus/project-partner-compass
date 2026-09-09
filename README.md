# Project Partner Compass

Kanban-Board mit Chat-Abfrage zur Koordination von Teilprojekten mit internen und
externen Partnerorganisationen und parallelen Fristen.

Die App richtet sich an jede Art von Multi-Partner-Koordination – zum Beispiel
transdisziplinäre Transferprojekte an Hochschulen – und beantwortet Fragen zum
Projektstand direkt aus den Board-Daten, statt sich durch alle Karten zu klicken.

## Funktionen

Die Navigation ist in fünf Bereiche gegliedert (verwandte Seiten liegen als
Unterreiter zusammen):

| Bereich | Seiten | Inhalt |
| --- | --- | --- |
| Board | `/`, `/boards` | Kanban-Board mit Statusspalten und Drag & Drop; zusätzliche Boards/Projektkategorien |
| Übersicht | `/uebersicht`, `/partner` | Projektliste gruppiert nach Status, Partner oder Frist inkl. Detailpanel, Dokumenten und Chat-Feld; Auswertung pro Partnerorganisation |
| Termine & Fristen | `/termine`, `/fristen` | Meilenstein-Planer pro Projekt; Alarm für überfällige und bald fällige Fristen |
| Chat | `/chat` | Fragen zum Projektstand mit Verlauf |
| Berichte | `/wochenbericht`, `/export` | Wochenbericht-Vorschau (montags 07:00 geplant); PDF-Export einzelner Projekte und der Gesamtliste |

### Kernlogik

- Board-Spalten: Anbahnung, In Abstimmung, Laufend, Berichtspflicht fällig, Abgeschlossen
- Fristen-Ampel: grün > 4 Wochen, gelb 1–4 Wochen, rot < 1 Woche (auch überfällig);
  Vorlaufzeit und Warnfarbe des Alarms sind einstellbar
- Statusabfrage: Die Frage wird gemeinsam mit allen aktuellen Kartendaten als
  strukturierter Kontext an ein Sprachmodell geschickt (keine Vektorsuche).
- Board, Übersicht und Termine teilen dieselben Daten und aktualisieren sich
  gegenseitig live.

## Technischer Aufbau

- **Frontend:** React 19, TypeScript, TanStack Start (Router + Server Functions), Vite
- **Styling:** Tailwind CSS v4, Design-Tokens in `src/styles.css` (Farbwelt „Ocean Deep“,
  Schriften Urbanist/Epilogue)
- **Daten:** Lovable Cloud (Postgres/Supabase) mit Realtime-Synchronisierung
- **Tests:** Vitest

### Verzeichnisse

```text
src/routes/       Seiten (Board, Übersicht, Partner, Termine, Fristen, Chat, Berichte)
src/components/   Seitenleiste, Kartendialog, Meilenstein-Planer, Chat-Panel u. a.
src/lib/          Fristen-, Kennzahlen-, Wochenbericht- und PDF-Logik inkl. Tests
supabase/         Migrationen des Datenmodells
```

### Datenmodell

Tabellen: `projekte`, `meilensteine`, `boards`, `dokumente`, `kontakte`.
Hochgeladene Dateien liegen in einem privaten Storage-Bucket `projekt-dokumente`.

## Lokal starten

Voraussetzung: Node.js 20+ (oder [Bun](https://bun.sh)).

```sh
git clone <repository-url>
cd <repository-name>
npm install
npm run dev
```

Die App läuft anschließend auf `http://localhost:8080`.

### Skripte

| Befehl | Zweck |
| --- | --- |
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build |
| `npm run test` | Vitest (Fristen-, Wochenbericht-, PDF- und Kennzahlenlogik) |

### Umgebungsvariablen

Für den lokalen Betrieb wird eine `.env` mit der Backend-Verbindung benötigt:

```text
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_SUPABASE_PROJECT_ID=...
```

In Lovable werden diese Werte automatisch gesetzt. Die Chat-Abfrage läuft
serverseitig über den Lovable AI Gateway (`LOVABLE_API_KEY`); dieser Schlüssel
gehört ausschließlich in die Serverumgebung und niemals ins Repository.

## Hinweise

- **Alle Beispieldaten sind fiktiv.** Die Beispielkarten und Partnernamen sind frei
  erfunden; es sind keine echten Institutionen abgebildet.
- Das Tool ist als **generisches Konzept für Multi-Partner-Projektkoordination**
  gedacht und nicht an eine bestimmte Institution gebunden.
- Es gibt derzeit **keine Nutzerverwaltung/Anmeldung** (bewusst auf später
  verschoben). Solange sie fehlt, sind Karten, Kontakte und Dokumente für alle
  Besucher der veröffentlichten App lesbar und bearbeitbar – bitte keine
  vertraulichen Daten eintragen.
- Der automatische E-Mail-Versand des Wochenberichts ist vorbereitet, aber noch
  nicht aktiv – dafür wird eine eigene Absender-Domain benötigt.

## Entwicklung mit Lovable

Dieses Projekt wurde mit [Lovable](https://lovable.dev) gebaut und ist mit GitHub
synchronisiert: Änderungen in Lovable werden ins Repository committet, Pushes ins
Repository erscheinen wieder im Lovable-Editor.
