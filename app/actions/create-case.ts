'use server';

import { createClient } from '@/lib/supabase/server';
import { IdentityVaultService } from '@/lib/vault/identity-service';
import { Resend } from 'resend';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Inicializar cliente Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function createCaseAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No autenticado');
  }

  // 1. Validar Permisos (Role Secretary)
  const { data: profile } = await supabase
    .from('users_profile')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'secretary') {
    throw new Error('No autorizado: Se requiere rol de secretario');
  }

  // 2. Extraer datos del form
  const title = formData.get('title') as string;
  const caseType = formData.get('case_type') as string;
  const priority = formData.get('priority') as string;
  const description = formData.get('description') as string;
  const file = formData.get('file') as File;

  if (!title || !file) {
    throw new Error('Título y archivo son requeridos');
  }

  // 3. Subir archivo a Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `cases/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Error subiendo archivo: ${uploadError.message}`);
  }


  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  // Generar Token de Acceso
  const accessToken = crypto.randomUUID();

  // 5. Insertar Caso
  const { data: newCase, error: insertError } = await supabase
    .from('cases')
    .insert({
      title,
      case_type: caseType,
      priority: priority,
      description,
      file_url: urlData.publicUrl,
      status: 'por_asignar', // INITIAL STATUS
      secretary_id: user.id,
      access_token: accessToken,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Error creando caso: ${insertError.message}`);
  }

  // 6. Crear Mapeo en Identity Vault SOLO para el Secretario
  try {
    const { anonActorId: secAnonId } = await IdentityVaultService.createMapping({
      userId: user.id,
      caseId: newCase.id,
      createdBy: user.id
    });

    await supabase.from('case_assignments').insert({
      case_id: newCase.id,
      anon_actor_id: secAnonId,
      role: 'secretary',
      status: 'active'
    });

  } catch (vaultError: any) {
    throw new Error(`Error en asignación segura: ${vaultError.message}`);
  }

  revalidatePath('/dashboard/secretary');
}
