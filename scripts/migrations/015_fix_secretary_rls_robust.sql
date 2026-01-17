-- =============================================
-- MIGRATION: Robust Fix for Secretary Visibility
-- =============================================

-- 1. Update RLS Policy
-- Drop the previous restrictive policy if it exists (to be safe)
DROP POLICY IF EXISTS "Creators can view their own cases" ON public.cases;

-- Create a more inclusive policy
CREATE POLICY "Secretary/Creator View Policy"
ON public.cases
FOR SELECT
TO authenticated
USING (
  -- Allow if user is the creator
  created_by = auth.uid() 
  -- OR if user is the designated secretary (if column exists)
  OR secretary_id = auth.uid()
);

-- 2. Ensure case_assignments RLS isn't blocking the !inner join
-- Secretaries need to see assignments for cases they manage.
CREATE POLICY "Secretary can view assignments for their cases"
ON public.case_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cases
    WHERE cases.id = case_assignments.case_id
    AND (cases.secretary_id = auth.uid() OR cases.created_by = auth.uid())
  )
);
