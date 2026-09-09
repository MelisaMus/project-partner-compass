-- 1. Rollen-Enum und Tabelle
CREATE TYPE public.app_role AS ENUM ('verwaltung', 'lesen');

CREATE TABLE public.rollen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rolle public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, rolle)
);

GRANT SELECT ON public.rollen TO authenticated;
GRANT ALL ON public.rollen TO service_role;

ALTER TABLE public.rollen ENABLE ROW LEVEL SECURITY;

-- 2. Security-Definer-Funktion (keine RLS-Rekursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.rollen WHERE user_id = _user_id AND rolle = _role
  )
$$;

-- 3. Policies auf rollen
CREATE POLICY "Angemeldete sehen Rollen"
  ON public.rollen FOR SELECT TO authenticated USING (true);

CREATE POLICY "Verwaltung pflegt Rollen"
  ON public.rollen FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'verwaltung'))
  WITH CHECK (public.has_role(auth.uid(), 'verwaltung'));

GRANT INSERT, UPDATE, DELETE ON public.rollen TO authenticated;

-- 4. Bestehende Zugänge erhalten Verwaltungsrechte
INSERT INTO public.rollen (user_id, rolle)
SELECT id, 'verwaltung'::public.app_role FROM auth.users
ON CONFLICT (user_id, rolle) DO NOTHING;

-- 5. Datentabellen: lesen für alle Angemeldeten, schreiben nur Verwaltung
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projekte','boards','meilensteine','dokumente','kontakte'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Angemeldete verwalten ' || t, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Angemeldete verwalten Projekte" ON public.projekte;
DROP POLICY IF EXISTS "Angemeldete verwalten Boards" ON public.boards;
DROP POLICY IF EXISTS "Angemeldete verwalten Meilensteine" ON public.meilensteine;
DROP POLICY IF EXISTS "Angemeldete verwalten Dokumente" ON public.dokumente;
DROP POLICY IF EXISTS "Angemeldete verwalten Kontakte" ON public.kontakte;
