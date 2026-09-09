-- Öffentliche Policies entfernen
DROP POLICY IF EXISTS boards_public_read ON public.boards;
DROP POLICY IF EXISTS boards_public_insert ON public.boards;
DROP POLICY IF EXISTS boards_public_update ON public.boards;
DROP POLICY IF EXISTS boards_public_delete ON public.boards;

DROP POLICY IF EXISTS projekte_public_read ON public.projekte;
DROP POLICY IF EXISTS projekte_public_insert ON public.projekte;
DROP POLICY IF EXISTS projekte_public_update ON public.projekte;
DROP POLICY IF EXISTS projekte_public_delete ON public.projekte;

DROP POLICY IF EXISTS meilensteine_public_read ON public.meilensteine;
DROP POLICY IF EXISTS meilensteine_public_insert ON public.meilensteine;
DROP POLICY IF EXISTS meilensteine_public_update ON public.meilensteine;
DROP POLICY IF EXISTS meilensteine_public_delete ON public.meilensteine;

DROP POLICY IF EXISTS dokumente_public_read ON public.dokumente;
DROP POLICY IF EXISTS dokumente_public_insert ON public.dokumente;
DROP POLICY IF EXISTS dokumente_public_update ON public.dokumente;
DROP POLICY IF EXISTS dokumente_public_delete ON public.dokumente;

DROP POLICY IF EXISTS kontakte_public_read ON public.kontakte;
DROP POLICY IF EXISTS kontakte_public_insert ON public.kontakte;
DROP POLICY IF EXISTS kontakte_public_update ON public.kontakte;
DROP POLICY IF EXISTS kontakte_public_delete ON public.kontakte;

-- Nur angemeldete Personen
CREATE POLICY boards_auth_all ON public.boards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY projekte_auth_all ON public.projekte FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY meilensteine_auth_all ON public.meilensteine FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY dokumente_auth_all ON public.dokumente FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY kontakte_auth_all ON public.kontakte FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Anonyme Rechte entziehen
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.boards FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.projekte FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.meilensteine FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.dokumente FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.kontakte FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.boards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projekte TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meilensteine TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dokumente TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kontakte TO authenticated;
GRANT ALL ON public.boards TO service_role;
GRANT ALL ON public.projekte TO service_role;
GRANT ALL ON public.meilensteine TO service_role;
GRANT ALL ON public.dokumente TO service_role;
GRANT ALL ON public.kontakte TO service_role;

-- Projektdateien im Storage
DROP POLICY IF EXISTS projekt_dokumente_read ON storage.objects;
DROP POLICY IF EXISTS projekt_dokumente_insert ON storage.objects;
DROP POLICY IF EXISTS projekt_dokumente_delete ON storage.objects;

CREATE POLICY projekt_dokumente_auth_read ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'projekt-dokumente');
CREATE POLICY projekt_dokumente_auth_insert ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'projekt-dokumente');
CREATE POLICY projekt_dokumente_auth_delete ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'projekt-dokumente');