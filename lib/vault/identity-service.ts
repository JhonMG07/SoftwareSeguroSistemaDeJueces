import { vaultClient } from './client';
import crypto from 'crypto';

/**
 * Servicio para gestionar el Identity Vault
 * Maneja el mapeo entre identidades anónimas y reales
 */
export class IdentityVaultService {

    /**
     * Crear mapeo de identidad anónima para un caso
     * Si ya existe un mapeo para ese usuario y caso, retorna el existente
     * 
     * @param params.userId - ID del juez/secretario (identidad real)
     * @param params.caseId - ID del caso que se está asignando
     * @param params.createdBy - ID del Super Admin que hace la asignación
     * @returns Pseudónimo generado (anon_actor_id)
     */
    static async createMapping(params: {
        userId: string;
        caseId: string;
        createdBy: string;
    }): Promise<{ anonActorId: string }> {

        // 1. Buscar si ya existe un mapeo para este usuario y caso
        const { data: existing, error: searchError } = await vaultClient
            .from('identity_mapping')
            .select('anon_actor_id')
            .eq('user_id', params.userId)
            .eq('case_id', params.caseId)
            .maybeSingle();

        if (searchError) {
            console.error('[Vault] Error searching existing mapping:', searchError);
        }

        if (existing) {
            console.log('[Vault] Found existing mapping:', {
                anonActorId: existing.anon_actor_id,
                caseId: params.caseId
            });
            return { anonActorId: existing.anon_actor_id };
        }

        // 2. No existe, crear nuevo mapeo
        const anonActorId = crypto.randomUUID();

        console.log('[Vault] Creating new identity mapping:', {
            anonActorId,
            caseId: params.caseId,
        });

        const { error } = await vaultClient
            .from('identity_mapping')
            .insert({
                anon_actor_id: anonActorId,
                user_id: params.userId,
                case_id: params.caseId,
                created_by: params.createdBy
            });

        if (error) {
            console.error('[Vault] Error creating mapping:', {
                error,
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            throw new Error(`Failed to create identity mapping: ${error.message || JSON.stringify(error)}`);
        }

        // Registrar en log de auditoría
        await this.logAccess(anonActorId, params.createdBy, 'create_mapping');

        return { anonActorId };
    }

    /**
     * Resolver identidad real desde pseudónimo
     * 
     * ⚠️ RESTRINGIDO: Solo para Super Admin o sistema interno
     * Todos los accesos quedan registrados en auditoría
     * 
     * @param anonActorId - Pseudónimo a resolver
     * @param requestedBy - ID del usuario que solicita la resolución
     * @returns Identidad real y caso asociado, o null si no existe
     */
    static async resolveIdentity(
        anonActorId: string,
        requestedBy: string
    ): Promise<{ userId: string; caseId: string } | null> {

        console.log('[Vault] Resolving identity:', { anonActorId, requestedBy });

        const { data, error } = await vaultClient
            .from('identity_mapping')
            .select('user_id, case_id, access_count')
            .eq('anon_actor_id', anonActorId)
            .single();

        if (error || !data) {
            console.error('[Vault] Error resolving identity:', error);
            return null;
        }

        // Auditar acceso
        await this.logAccess(anonActorId, requestedBy, 'resolve_identity');

        // Actualizar contador de accesos y timestamp
        await vaultClient
            .from('identity_mapping')
            .update({
                last_accessed_at: new Date().toISOString(),
                access_count: (data.access_count || 0) + 1
            })
            .eq('anon_actor_id', anonActorId);

        return {
            userId: data.user_id,
            caseId: data.case_id
        };
    }

    /**
     * Obtener todos los pseudónimos asignados a un usuario
     * 
     * Usado cuando el juez quiere ver sus casos asignados.
     * El sistema consulta el vault para obtener sus pseudónimos
     * y luego busca los casos en la BD principal.
     * 
     * @param userId - ID del usuario
     * @returns Lista de pseudónimos con sus casos asociados
     */
    static async getUserPseudonyms(
        userId: string
    ): Promise<Array<{ anonActorId: string; caseId: string }>> {

        const { data, error } = await vaultClient
            .from('identity_mapping')
            .select('anon_actor_id, case_id')
            .eq('user_id', userId);

        if (error) {
            console.error('[Vault] Error getting pseudonyms:', error);
            return [];
        }

        return (data || []).map(row => ({
            anonActorId: row.anon_actor_id,
            caseId: row.case_id
        }));
    }

    /**
     * Verificar si un usuario tiene acceso a un caso específico
     * 
     * @param userId - ID del usuario
     * @param caseId - ID del caso
     * @returns Si tiene acceso y cuál es su pseudónimo para ese caso
     */
    static async verifyAccess(
        userId: string,
        caseId: string
    ): Promise<{ hasAccess: boolean; anonActorId?: string }> {

        const { data } = await vaultClient
            .from('identity_mapping')
            .select('anon_actor_id')
            .eq('user_id', userId)
            .eq('case_id', caseId)
            .maybeSingle();

        return {
            hasAccess: !!data,
            anonActorId: data?.anon_actor_id
        };
    }

    /**
     * Revocar acceso eliminando el mapeo
     * 
     * ⚠️ CUIDADO: Esto elimina permanentemente la vinculación
     * Usar solo cuando se remueve a un juez de un caso
     * 
     * @param anonActorId - Pseudónimo a revocar
     * @param revokedBy - ID del Super Admin que revoca
     */
    static async revokeMapping(
        anonActorId: string,
        revokedBy: string
    ): Promise<void> {

        console.log('[Vault] Revoking mapping:', { anonActorId, revokedBy });

        // Registrar revocación en auditoría antes de eliminar
        await this.logAccess(anonActorId, revokedBy, 'revoke_mapping');

        // Eliminar mapeo del vault
        const { error } = await vaultClient
            .from('identity_mapping')
            .delete()
            .eq('anon_actor_id', anonActorId);

        if (error) {
            console.error('[Vault] Error revoking mapping:', error);
            throw new Error('Failed to revoke mapping');
        }
    }

    /**
     * Registrar acceso al vault en log de auditoría
     * 
     * @private
     * @param anonActorId - Pseudónimo accedido
     * @param accessedBy - Usuario que accedió
     * @param reason - Razón del acceso
     */
    private static async logAccess(
        anonActorId: string,
        accessedBy: string,
        reason: string
    ): Promise<void> {

        await vaultClient
            .from('identity_access_log')
            .insert({
                anon_actor_id: anonActorId,
                accessed_by: accessedBy,
                access_reason: reason,
                accessed_at: new Date().toISOString()
            });
    }

    /**
     * Obtener logs de auditoría
     * Solo para Super Admin
     * 
     * @param limit - Número de registros a retornar
     * @returns Logs de acceso ordenados por fecha descendente
     */
    static async getAuditLogs(limit: number = 100) {
        const { data, error } = await vaultClient
            .from('identity_access_log')
            .select('*')
            .order('accessed_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[Vault] Error getting audit logs:', error);
            return [];
        }

        return data || [];
    }
}
