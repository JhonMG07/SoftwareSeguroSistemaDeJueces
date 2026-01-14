import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/abac/attributes - Listar todos los atributos
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

    // Obtener atributos
    const { data: attributes, error } = await supabase
        .from('abac_attributes')
        .select('*')
        .order('category', { ascending: true })
        .order('level', { ascending: true });

    if (error) {
        console.error('[API] Error fetching attributes:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ attributes });
}

// POST /api/admin/abac/attributes - Crear atributo
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
    const { name, category, description, level } = body;

    // Validación
    if (!name || !category || !description || !level) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Crear atributo
    const { data: attribute, error } = await supabase
        .from('abac_attributes')
        .insert({
            name,
            category,
            description,
            level
        })
        .select()
        .single();

    if (error) {
        console.error('[API] Error creating attribute:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Attribute created:', attribute.id);
    return NextResponse.json({ attribute }, { status: 201 });
}
