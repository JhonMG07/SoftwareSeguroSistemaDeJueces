import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/abac/policies - Listar todas las políticas
export async function GET() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que sea super_admin
    const { data: profile } = await supabase
        .from('users_profile')
        .select('role, status')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'super_admin' || profile?.status !== 'active') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Obtener políticas con sus reglas
    const { data: policies, error } = await supabase
        .from('security_policies')
        .select(`
      *,
      rules:policy_rules(
        id,
        attribute_id,
        operator,
        value,
        action
      )
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[API] Error fetching policies:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ policies });
}

// POST /api/admin/abac/policies - Crear política
export async function POST(request: Request) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificar que sea super_admin
    const { data: profile } = await supabase
        .from('users_profile')
        .select('role, status')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'super_admin' || profile?.status !== 'active') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, active = true } = body;

    // Validación
    if (!name || !description) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Crear política
    const { data: policy, error } = await supabase
        .from('security_policies')
        .insert({
            name,
            description,
            active
        })
        .select()
        .single();

    if (error) {
        console.error('[API] Error creating policy:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Policy created:', policy.id);

    // Retornar con formato de rules vacío
    return NextResponse.json({
        policy: {
            ...policy,
            rules: []
        }
    }, { status: 201 });
}
