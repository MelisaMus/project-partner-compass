CREATE TABLE public.dokumente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id uuid NOT NULL REFERENCES public.projekte(id) ON DELETE CASCADE,
  dateiname text NOT NULL,
  pfad text NOT NULL,
  dateityp text,
  groesse bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  letzte_aktualisierung timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dokumente TO anon, authenticated;
GRANT ALL ON public.dokumente TO service_role;

ALTER TABLE public.dokumente ENABLE ROW LEVEL SECURITY;

CREATE POLICY dokumente_public_read ON public.dokumente FOR SELECT USING (true);
CREATE POLICY dokumente_public_insert ON public.dokumente FOR INSERT WITH CHECK (true);
CREATE POLICY dokumente_public_update ON public.dokumente FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY dokumente_public_delete ON public.dokumente FOR DELETE USING (true);

CREATE TRIGGER dokumente_letzte_aktualisierung
BEFORE UPDATE ON public.dokumente
FOR EACH ROW EXECUTE FUNCTION public.set_letzte_aktualisierung();

CREATE INDEX dokumente_projekt_id_idx ON public.dokumente(projekt_id);

CREATE POLICY "projekt_dokumente_read" ON storage.objects FOR SELECT USING (bucket_id = 'projekt-dokumente');
CREATE POLICY "projekt_dokumente_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'projekt-dokumente');
CREATE POLICY "projekt_dokumente_delete" ON storage.objects FOR DELETE USING (bucket_id = 'projekt-dokumente');