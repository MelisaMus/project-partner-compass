CREATE TABLE public.kontakte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partnerorganisation text NOT NULL,
  name text NOT NULL,
  rolle text,
  email text,
  telefon text,
  notiz text,
  created_at timestamptz NOT NULL DEFAULT now(),
  letzte_aktualisierung timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kontakte TO anon, authenticated;
GRANT ALL ON public.kontakte TO service_role;

ALTER TABLE public.kontakte ENABLE ROW LEVEL SECURITY;

CREATE POLICY kontakte_public_read ON public.kontakte FOR SELECT USING (true);
CREATE POLICY kontakte_public_insert ON public.kontakte FOR INSERT WITH CHECK (true);
CREATE POLICY kontakte_public_update ON public.kontakte FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY kontakte_public_delete ON public.kontakte FOR DELETE USING (true);

CREATE TRIGGER kontakte_letzte_aktualisierung
BEFORE UPDATE ON public.kontakte
FOR EACH ROW EXECUTE FUNCTION public.set_letzte_aktualisierung();

CREATE INDEX kontakte_partner_idx ON public.kontakte(partnerorganisation);