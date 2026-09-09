ALTER TABLE public.projekte REPLICA IDENTITY FULL;
ALTER TABLE public.meilensteine REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projekte;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meilensteine;