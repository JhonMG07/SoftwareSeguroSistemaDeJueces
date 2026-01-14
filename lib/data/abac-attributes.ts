import type { ABACAttribute } from '../types/supreme-court';

// Atributos ABAC por defecto del sistema
export const DEFAULT_ABAC_ATTRIBUTES: ABACAttribute[] = [
    // PERMISOS
    {
        id: 'attr-001',
        name: 'Ver Casos',
        category: 'permission',
        description: 'Permite ver casos judiciales',
        level: 1
    },
    {
        id: 'attr-002',
        name: 'Editar Casos',
        category: 'permission',
        description: 'Permite editar información de casos',
        level: 2
    },
    {
        id: 'attr-003',
        name: 'Crear Casos',
        category: 'permission',
        description: 'Permite crear nuevos casos',
        level: 3
    },
    {
        id: 'attr-004',
        name: 'Eliminar Casos',
        category: 'permission',
        description: 'Permite eliminar casos',
        level: 4
    },
    {
        id: 'attr-005',
        name: 'Gestionar Usuarios',
        category: 'permission',
        description: 'Permite crear, editar y desactivar usuarios',
        level: 5
    },
    {
        id: 'attr-006',
        name: 'Ver Usuarios',
        category: 'permission',
        description: 'Permite ver lista de usuarios del sistema',
        level: 1
    },

    // AUTORIZACIONES
    {
        id: 'attr-007',
        name: 'Información Confidencial',
        category: 'authorization',
        description: 'Acceso a información confidencial',
        level: 3
    },
    {
        id: 'attr-008',
        name: 'Información Secreta',
        category: 'authorization',
        description: 'Acceso a información secreta',
        level: 4
    },
    {
        id: 'attr-009',
        name: 'Información Ultra Secreta',
        category: 'authorization',
        description: 'Acceso a información ultra secreta',
        level: 5
    },

    // RESTRICCIONES
    {
        id: 'attr-010',
        name: 'Solo Lectura',
        category: 'restriction',
        description: 'Restricción de solo lectura',
        level: 1
    },
    {
        id: 'attr-011',
        name: 'Sin Exportación',
        category: 'restriction',
        description: 'No puede exportar documentos',
        level: 2
    }
];
