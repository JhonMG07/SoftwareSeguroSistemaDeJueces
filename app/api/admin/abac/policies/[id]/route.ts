import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/admin/abac/policies/[id] - Actualizar política
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
    const { name, description, active } = body;

    // Actualizar política
    const { data: policy, error } = await supabase
        .from('security_policies')
        .update({
            name,
            description,
            active
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('[API] Error updating policy:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Policy updated:', id);
    return NextResponse.json({ policy });
}

// DELETE /api/admin/abac/policies/[id] - Eliminar política
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

    // Eliminar política (las reglas se eliminan en cascada)
    const { error } = await supabase
        .from('security_policies')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('[API] Error deleting policy:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[API] Policy deleted:', id);
    return NextResponse.json({ success: true });
}
