import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/admin/abac/attributes/[id] - Actualizar atributo
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
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

    // Actualizar atributo
    const { data: attribute, error } = await supabase
        .from('abac_attributes')
        .update({
            name,
            category,
            description,
            level
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[API] Error updating attribute:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Attribute updated:', id);
    return NextResponse.json({ attribute });
}

// DELETE /api/admin/abac/attributes/[id] - Eliminar atributo
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
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

    // Eliminar atributo
    const { error } = await supabase
        .from('abac_attributes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[API] Error deleting attribute:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Attribute deleted:', id);
    return NextResponse.json({ success: true });
}
