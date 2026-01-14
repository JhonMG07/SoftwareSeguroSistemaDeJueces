import type { SecurityPolicy, SystemUser } from '../types/supreme-court';
import { DEFAULT_ABAC_ATTRIBUTES } from './abac-attributes';

export const MOCK_USERS: SystemUser[] = [
    {
        id: 'user-001',
        email: 'admin@supremacorte.gov',
        fullName: 'María González',
        role: 'super_admin',
        status: 'active',
        attributes: DEFAULT_ABAC_ATTRIBUTES, // Super admin tiene todos
        department: 'Administración General',
        phone: '+52 555 123 4567',
        createdAt: new Date('2024-01-01'),
        createdBy: 'system'
    },
    {
        id: 'user-002',
        email: 'juez.martinez@supremacorte.gov',
        fullName: 'Carlos Martínez',
        role: 'judge',
        status: 'active',
        attributes: DEFAULT_ABAC_ATTRIBUTES.filter(a => a.level <= 3),
        department: 'Sala Civil',
        phone: '+52 555 987 6543',
        createdAt: new Date('2024-02-15'),
        createdBy: 'user-001'
    },
    {
        id: 'user-003',
        email: 'juez.rodriguez@supremacorte.gov',
        fullName: 'Ana Rodríguez',
        role: 'judge',
        status: 'active',
        attributes: DEFAULT_ABAC_ATTRIBUTES.filter(a => a.level <= 3),
        department: 'Sala Penal',
        phone: '+52 555 456 7890',
        createdAt: new Date('2024-03-10'),
        createdBy: 'user-001'
    },
    {
        id: 'user-004',
        email: 'sec.lopez@supremacorte.gov',
        fullName: 'Pedro López',
        role: 'secretary',
        status: 'active',
        attributes: DEFAULT_ABAC_ATTRIBUTES.filter(a => a.level <= 2),
        department: 'Secretaría General',
        phone: '+52 555 789 0123',
        createdAt: new Date('2024-04-05'),
        createdBy: 'user-001'
    }
];

// Políticas de seguridad de ejemplo
export const MOCK_POLICIES: SecurityPolicy[] = [
    {
        id: 'policy-001',
        name: 'Acceso Jueces a Casos',
        description: 'Permite a los jueces ver y editar solo sus casos asignados',
        active: true,
        rules: [
            {
                id: 'rule-001',
                attribute: 'attr-001', // Ver Casos
                operator: 'equals',
                value: true,
                action: 'allow'
            }
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
    },
    {
        id: 'policy-002',
        name: 'Restricción Exportación Secretarios',
        description: 'Los secretarios no pueden exportar documentos',
        active: true,
        rules: [
            {
                id: 'rule-002',
                attribute: 'attr-011', // Sin Exportación
                operator: 'equals',
                value: true,
                action: 'deny'
            }
        ],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
    }
];
