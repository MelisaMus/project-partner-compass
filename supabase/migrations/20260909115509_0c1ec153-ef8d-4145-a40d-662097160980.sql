CREATE TABLE public.projekte (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titel TEXT NOT NULL,
  themenbereich TEXT,
  partnerorganisation TEXT,
  partner_typ TEXT NOT NULL DEFAULT 'Sonstige',
  verantwortliche_person TEXT,
  status TEXT NOT NULL DEFAULT 'Anbahnung',
  naechste_frist DATE,
  foerdermittelbezug TEXT,
  kurzbeschreibung TEXT,
  letzte_aktualisierung TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.projekte TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projekte TO authenticated;
GRANT ALL ON public.projekte TO service_role;

ALTER TABLE public.projekte ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projekte_public_read" ON public.projekte FOR SELECT USING (true);
CREATE POLICY "projekte_public_insert" ON public.projekte FOR INSERT WITH CHECK (true);
CREATE POLICY "projekte_public_update" ON public.projekte FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "projekte_public_delete" ON public.projekte FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_letzte_aktualisierung()
RETURNS TRIGGER AS $$
BEGIN
  NEW.letzte_aktualisierung = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER projekte_letzte_aktualisierung
BEFORE UPDATE ON public.projekte
FOR EACH ROW EXECUTE FUNCTION public.set_letzte_aktualisierung();

INSERT INTO public.projekte (titel, themenbereich, partnerorganisation, partner_typ, verantwortliche_person, status, naechste_frist, foerdermittelbezug, kurzbeschreibung) VALUES
('Beispielprojekt: Digitale Erschließung eines Stadtarchivs', 'Digitalisierung', 'Beispiel-Kommunalarchiv Musterstadt', 'Öffentliche Einrichtung', 'A. Beispielperson', 'Laufend', (CURRENT_DATE + 10), 'Zwischenbericht Q1 2027', 'Fiktives Beispiel: Gemeinsame Digitalisierung historischer Bestände inklusive Metadatenkonzept.'),
('Beispielprojekt: Beratung für einen gemeinnützigen Verein', 'Beratung', 'Beispielverein für Nachbarschaftshilfe e.V.', 'Non-Profit', 'B. Musterperson', 'In Abstimmung', (CURRENT_DATE + 35), NULL, 'Fiktives Beispiel: Aufbau einer Wirkungsmessung und Begleitung bei der Organisationsentwicklung.'),
('Beispielprojekt: Transferstudie mit einem Technologieunternehmen', 'Forschung', 'Beispiel Technik GmbH', 'Unternehmen', 'C. Testperson', 'Berichtspflicht fällig', (CURRENT_DATE + 4), 'Abschlussbericht Förderlinie Muster', 'Fiktives Beispiel: Auswertung eines gemeinsamen Pilotversuchs, Abschlussbericht steht an.');