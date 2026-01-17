-- =============================================
-- MIGRATION: Fix Assignment Visibility
-- =============================================

-- Problem: Secretaries can't see the Judge's assignment row because the previous policy 
-- might have been too complex or checking the wrong relationship.

-- 1. Drop old restrictive policies for Select
DROP POLICY IF EXISTS "Secretary can view assignments for their cases" ON public.case_assignments;
DROP POLICY IF EXISTS "Secretary can create assignments" ON public.case_assignments;

-- 2. New Broad SELECT Policy
-- "Authenticated users can view assignments for cases they have access to"
-- This relies on the fact that if you can see the case (which we fixed in 015), you should see its assignments.
CREATE POLICY "View assignments for visible cases"
ON public.case_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cases
    WHERE cases.id = case_assignments.case_id
    -- Re-iterate access logic just to be safe and explicit:
    AND (
      cases.created_by = auth.uid() 
      OR cases.secretary_id = auth.uid()
      OR cases.id IN (
        SELECT case_id FROM public.case_assignments WHERE anon_actor_id::text = auth.uid()::text -- (This line handles Judges viewing their own)
      )
    )
  )
);

-- 3. Restore INSERT Policy (from 017, but cleaner)
CREATE POLICY "Secretary can insert assignments"
ON public.case_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cases
    WHERE cases.id = case_assignments.case_id
    AND (cases.secretary_id = auth.uid() OR cases.created_by = auth.uid())
  )
);
