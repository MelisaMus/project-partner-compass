CREATE TABLE public.boards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  beschreibung text,
  sortierung integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  letzte_aktualisierung timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.boards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boards TO authenticated;
GRANT ALL ON public.boards TO service_role;

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY boards_public_read ON public.boards FOR SELECT USING (true);
CREATE POLICY boards_public_insert ON public.boards FOR INSERT WITH CHECK (true);
CREATE POLICY boards_public_update ON public.boards FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY boards_public_delete ON public.boards FOR DELETE USING (true);

CREATE TRIGGER boards_set_letzte_aktualisierung
BEFORE UPDATE ON public.boards
FOR EACH ROW EXECUTE FUNCTION public.set_letzte_aktualisierung();

ALTER TABLE public.projekte
  ADD COLUMN board_id uuid REFERENCES public.boards(id) ON DELETE SET NULL;

CREATE INDEX projekte_board_id_idx ON public.projekte(board_id);

INSERT INTO public.boards (name, beschreibung, sortierung) VALUES
  ('Beispiel-Board: Transferprojekte', 'Beispieldaten – Teilprojekte mit externen Partnerorganisationen', 1),
  ('Beispiel-Board: Interne Vorhaben', 'Beispieldaten – Vorhaben mit internen Partnern', 2);