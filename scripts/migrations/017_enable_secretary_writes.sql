-- =============================================
-- MIGRATION: Enable Secretary Write/Update
-- =============================================

-- 1. Allow Secretary to UPDATE their own cases (e.g. changing status to 'asignado')
CREATE POLICY "Secretary can update own cases"
ON public.cases
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() OR secretary_id = auth.uid()
)
WITH CHECK (
  created_by = auth.uid() OR secretary_id = auth.uid()
);

-- 2. Allow Secretary to INSERT new assignments (assigning a judge)
CREATE POLICY "Secretary can create assignments"
ON public.case_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be verified via the case ownership
  EXISTS (
    SELECT 1 FROM public.cases
    WHERE cases.id = case_assignments.case_id
    AND (cases.secretary_id = auth.uid() OR cases.created_by = auth.uid())
  )
);
