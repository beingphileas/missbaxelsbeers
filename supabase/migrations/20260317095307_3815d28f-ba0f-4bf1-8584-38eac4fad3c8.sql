
-- Table to link users to breweries
CREATE TABLE public.brewery_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brewery_id uuid NOT NULL REFERENCES public.breweries(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, brewery_id)
);

ALTER TABLE public.brewery_users ENABLE ROW LEVEL SECURITY;

-- Brewery users can see their own link
CREATE POLICY "Users can see their own brewery links"
  ON public.brewery_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can manage all brewery_users
CREATE POLICY "Admins can manage brewery users"
  ON public.brewery_users FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Pending changes table for moderation queue
CREATE TABLE public.pending_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id uuid NOT NULL REFERENCES public.breweries(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL, -- 'brewery' or 'beer'
  entity_id uuid, -- existing entity id (null for new beers)
  change_type text NOT NULL, -- 'create', 'update', 'delete'
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_changes ENABLE ROW LEVEL SECURITY;

-- Brewery users can see and create their own pending changes
CREATE POLICY "Brewery users can view own pending changes"
  ON public.pending_changes FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Brewery users can create pending changes"
  ON public.pending_changes FOR INSERT
  TO authenticated
  WITH CHECK (
    submitted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.brewery_users
      WHERE user_id = auth.uid() AND brewery_id = pending_changes.brewery_id
    )
  );

-- Admins can manage all pending changes (approve/reject)
CREATE POLICY "Admins can manage pending changes"
  ON public.pending_changes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete pending changes"
  ON public.pending_changes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_pending_changes_updated_at
  BEFORE UPDATE ON public.pending_changes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Allow brewery users to read their own brewery (already public) and their own beers (already public)
-- But we need a helper function to check if user owns a brewery
CREATE OR REPLACE FUNCTION public.owns_brewery(_user_id uuid, _brewery_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.brewery_users
    WHERE user_id = _user_id AND brewery_id = _brewery_id
  )
$$;
