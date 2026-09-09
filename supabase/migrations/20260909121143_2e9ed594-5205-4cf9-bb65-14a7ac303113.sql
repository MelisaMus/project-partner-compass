CREATE TABLE public.meilensteine (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projekt_id uuid NOT NULL REFERENCES public.projekte(id) ON DELETE CASCADE,
  titel text NOT NULL,
  frist date,
  notiz text,
  erledigt boolean NOT NULL DEFAULT false,
  sortierung integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  letzte_aktualisierung timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX meilensteine_projekt_id_idx ON public.meilensteine(projekt_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meilensteine TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meilensteine TO authenticated;
GRANT ALL ON public.meilensteine TO service_role;

ALTER TABLE public.meilensteine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meilensteine_public_read" ON public.meilensteine FOR SELECT USING (true);
CREATE POLICY "meilensteine_public_insert" ON public.meilensteine FOR INSERT WITH CHECK (true);
CREATE POLICY "meilensteine_public_update" ON public.meilensteine FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "meilensteine_public_delete" ON public.meilensteine FOR DELETE USING (true);

CREATE TRIGGER meilensteine_letzte_aktualisierung
BEFORE UPDATE ON public.meilensteine
FOR EACH ROW EXECUTE FUNCTION public.set_letzte_aktualisierung();