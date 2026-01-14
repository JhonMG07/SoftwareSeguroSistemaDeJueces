-- Asignar TODOS los atributos a los usuarios con rol 'super_admin'

INSERT INTO public.user_attributes (user_id, attribute_id, granted_by, granted_at)
SELECT 
    p.id as user_id,
    a.id as attribute_id,
    p.id as granted_by, -- Auto-asignado para recuperación
    NOW() as granted_at
FROM 
    public.users_profile p
CROSS JOIN 
    public.abac_attributes a
WHERE 
    p.role = 'super_admin'
    AND NOT EXISTS (
        SELECT 1 FROM public.user_attributes ua 
        WHERE ua.user_id = p.id AND ua.attribute_id = a.id
    );

-- Verificación
SELECT p.email, count(ua.attribute_id) as attributes_count
FROM public.users_profile p
LEFT JOIN public.user_attributes ua ON p.id = ua.user_id
WHERE p.role = 'super_admin'
GROUP BY p.email;
