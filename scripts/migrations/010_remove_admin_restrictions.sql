-- Eliminar restricciones del super admin (no tiene sentido que el admin tenga restricciones)

DELETE FROM public.user_attributes
WHERE user_id IN (
    SELECT id FROM public.users_profile WHERE role = 'super_admin'
)
AND attribute_id IN (
    SELECT id FROM public.abac_attributes WHERE category = 'restriction'
);

-- Verificar
SELECT 
    p.email,
    a.name,
    a.category
FROM public.users_profile p
JOIN public.user_attributes ua ON p.id = ua.user_id
JOIN public.abac_attributes a ON ua.attribute_id = a.id
WHERE p.role = 'super_admin'
AND a.category = 'restriction';
