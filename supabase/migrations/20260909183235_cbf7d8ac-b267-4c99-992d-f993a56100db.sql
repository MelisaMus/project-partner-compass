DROP POLICY IF EXISTS "Verwaltung pflegt Rollen" ON public.rollen;
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);

CREATE POLICY "Verwaltung pflegt Rollen"
  ON public.rollen FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.rollen r WHERE r.user_id = auth.uid() AND r.rolle = 'verwaltung'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.rollen r WHERE r.user_id = auth.uid() AND r.rolle = 'verwaltung'));

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projekte','boards','meilensteine','dokumente','kontakte'] LOOP
    EXECUTE format('CREATE POLICY "Angemeldete lesen" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format('CREATE POLICY "Verwaltung legt an" ON public.%I FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.rollen r WHERE r.user_id = auth.uid() AND r.rolle = ''verwaltung''))', t);
    EXECUTE format('CREATE POLICY "Verwaltung aendert" ON public.%I FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.rollen r WHERE r.user_id = auth.uid() AND r.rolle = ''verwaltung'')) WITH CHECK (EXISTS (SELECT 1 FROM public.rollen r WHERE r.user_id = auth.uid() AND r.rolle = ''verwaltung''))', t);
    EXECUTE format('CREATE POLICY "Verwaltung loescht" ON public.%I FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.rollen r WHERE r.user_id = auth.uid() AND r.rolle = ''verwaltung''))', t);
  END LOOP;
END $$;
