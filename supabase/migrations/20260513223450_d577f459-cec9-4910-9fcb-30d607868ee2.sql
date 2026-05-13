
CREATE TABLE public.system_health (
  key TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_status TEXT NOT NULL DEFAULT 'ok',
  last_error TEXT
);

ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System health viewable by everyone"
ON public.system_health FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage system health"
ON public.system_health FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
