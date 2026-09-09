import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PARTNER_TYPEN,
  STATUS_SPALTEN,
  leeresProjekt,
  type Projekt,
  type ProjektEingabe,
} from "@/lib/projekte";

type Props = {
  offen: boolean;
  projekt: Projekt | null;
  onClose: () => void;
  onSpeichern: (eingabe: ProjektEingabe) => Promise<void> | void;
  onLoeschen?: (id: string) => Promise<void> | void;
};

function zuEingabe(projekt: Projekt | null): ProjektEingabe {
  if (!projekt) return { ...leeresProjekt };
  const { id: _id, letzte_aktualisierung: _stand, ...rest } = projekt;
  return rest;
}

export function KartenDialog({ offen, projekt, onClose, onSpeichern, onLoeschen }: Props) {
  const [werte, setWerte] = useState<ProjektEingabe>(() => zuEingabe(projekt));
  const [speichert, setSpeichert] = useState(false);

  useEffect(() => {
    if (offen) setWerte(zuEingabe(projekt));
  }, [offen, projekt]);

  const setFeld = <K extends keyof ProjektEingabe>(feld: K, wert: ProjektEingabe[K]) =>
    setWerte((alt) => ({ ...alt, [feld]: wert }));

  const absenden = async () => {
    if (!werte.titel.trim()) return;
    setSpeichert(true);
    try {
      await onSpeichern({ ...werte, naechste_frist: werte.naechste_frist || null });
    } finally {
      setSpeichert(false);
    }
  };

  return (
    <Dialog open={offen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{projekt ? "Karte bearbeiten" : "Neue Karte anlegen"}</DialogTitle>
          <DialogDescription>
            Alle Felder des Teilprojekts – Änderungen werden sofort im Board sichtbar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="titel">Titel</Label>
            <Input
              id="titel"
              value={werte.titel}
              onChange={(e) => setFeld("titel", e.target.value)}
              placeholder="Kurzer Projekttitel"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="themenbereich">Themenbereich</Label>
            <Input
              id="themenbereich"
              value={werte.themenbereich ?? ""}
              onChange={(e) => setFeld("themenbereich", e.target.value)}
              placeholder="z. B. Digitalisierung"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="partner">Partnerorganisation</Label>
            <Input
              id="partner"
              value={werte.partnerorganisation ?? ""}
              onChange={(e) => setFeld("partnerorganisation", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Partner-Typ</Label>
            <Select value={werte.partner_typ} onValueChange={(v) => setFeld("partner_typ", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTNER_TYPEN.map((typ) => (
                  <SelectItem key={typ} value={typ}>
                    {typ}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="person">Verantwortliche Person</Label>
            <Input
              id="person"
              value={werte.verantwortliche_person ?? ""}
              onChange={(e) => setFeld("verantwortliche_person", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={werte.status} onValueChange={(v) => setFeld("status", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_SPALTEN.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="frist">Nächste Frist</Label>
            <Input
              id="frist"
              type="date"
              value={werte.naechste_frist ?? ""}
              onChange={(e) => setFeld("naechste_frist", e.target.value || null)}
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="foerder">Fördermittelbezug (optional)</Label>
            <Input
              id="foerder"
              value={werte.foerdermittelbezug ?? ""}
              onChange={(e) => setFeld("foerdermittelbezug", e.target.value)}
              placeholder="z. B. Zwischenbericht Q1 2027"
            />
          </div>

          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="kurz">Kurzbeschreibung</Label>
            <Textarea
              id="kurz"
              rows={4}
              value={werte.kurzbeschreibung ?? ""}
              onChange={(e) => setFeld("kurzbeschreibung", e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {projekt && onLoeschen ? (
              <Button variant="ghost" className="text-destructive" onClick={() => onLoeschen(projekt.id)}>
                Karte löschen
              </Button>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={absenden} disabled={speichert || !werte.titel.trim()}>
              {speichert ? "Speichern…" : "Speichern"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
