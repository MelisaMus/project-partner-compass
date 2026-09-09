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

Kanban-Board mit Chat-Abfrage zur Koordination von Teilprojekten mit mehreren
externen Partnerorganisationen und parallelen Fristen.

- Board-Spalten: Anbahnung, In Abstimmung, Laufend, Berichtspflicht fällig, Abgeschlossen
- Fristen-Ampel: grün > 4 Wochen, gelb 1–4 Wochen, rot < 1 Woche (auch überfällig)
- Statusabfrage: Die Frage wird gemeinsam mit allen aktuellen Kartendaten als
  strukturierter Kontext an ein Sprachmodell geschickt (keine Vektorsuche).
- Tests der Fristen-Logik: `bun run test` (Vitest, `src/lib/fristen.test.ts`)

### Hinweise

- **Alle Beispieldaten sind fiktiv.** Die Beispielkarten und Partnernamen sind frei
  erfunden; es sind keine echten Institutionen abgebildet.
- Das Tool ist als **generisches Konzept für Multi-Partner-Projektkoordination**
  gedacht und nicht an eine bestimmte Institution gebunden.
- In diesem ersten Schritt gibt es noch keine Nutzerverwaltung/Anmeldung; die
  Karten sind daher für alle Besucher lesbar und bearbeitbar.
