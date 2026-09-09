# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Project Partner Compass

Kanban-Board mit Chat-Abfrage zur Koordination von Teilprojekten mit internen und
externen Partnerorganisationen und parallelen Fristen.

### Bereiche der App

Die Navigation ist in fünf Bereiche gegliedert (verwandte Seiten liegen als
Unterreiter zusammen):

| Bereich | Seiten | Inhalt |
| --- | --- | --- |
| Board | `/`, `/boards` | Kanban-Board mit Statusspalten; zusätzliche Boards/Projektkategorien |
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
- Datenmodell (Lovable Cloud / Postgres): `projekte`, `meilensteine`, `boards`,
  `dokumente`, `kontakte`; Dateien liegen im privaten Bucket `projekt-dokumente`.
- Board, Übersicht und Termine teilen dieselben Daten und aktualisieren sich
  gegenseitig live.
- Tests: `bun run test` (Vitest) für Fristen-, Wochenbericht-, PDF- und Kennzahlenlogik

### Hinweise

- **Alle Beispieldaten sind fiktiv.** Die Beispielkarten und Partnernamen sind frei
  erfunden; es sind keine echten Institutionen abgebildet.
- Das Tool ist als **generisches Konzept für Multi-Partner-Projektkoordination**
  gedacht und nicht an eine bestimmte Institution gebunden.
- Es gibt derzeit noch keine Nutzerverwaltung/Anmeldung (bewusst auf später
  verschoben); die Karten sind daher für alle Besucher lesbar und bearbeitbar.
- Der automatische E-Mail-Versand des Wochenberichts ist vorbereitet, aber noch
  nicht aktiv – dafür wird eine eigene Absender-Domain benötigt.
