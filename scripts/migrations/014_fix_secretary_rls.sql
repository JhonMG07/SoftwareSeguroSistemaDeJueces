-- =============================================
-- MIGRATION: Fix Secretary RLS Visibility
-- =============================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential conflicting/placeholder policies if strictly needed, 
--    but usually we just ADD a new permissive policy.
--    (Optional: DROP POLICY IF EXISTS "Assigned users can view their cases" ON cases;)

-- 3. Add Policy: Creators (Secretaries) can view their own cases
CREATE POLICY "Creators can view their own cases"
ON public.cases
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid()
);

-- Note: This assumes 'created_by' is the column used for ownership.
-- If 'secretary_id' column exists and is used instead, include it:
-- OR secretary_id = auth.uid()

-- 4. Verify
-- SELECT * FROM pg_policies WHERE tablename = 'cases';
