// Tipos para el sistema ABAC (Attribute-Based Access Control)

export interface ABACAttribute {
    id: string;
    name: string;
    category: 'permission' | 'authorization' | 'restriction';
    description: string;
    level: number; // 1-5, nivel de privilegio/restricción
}

export interface SecurityPolicy {
    id: string;
    name: string;
    description: string;
    active: boolean;
    rules: PolicyRule[];
    createdAt: string;
    updatedAt: string;
}

export interface PolicyRule {
    id: string;
    attribute: string; // ID del atributo ABAC
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: string | number | boolean;
    action: 'allow' | 'deny';
}

export interface SystemUser {
    id: string
    email: string
    fullName: string
    role: string
    status: "active" | "inactive" | "suspended"
    attributes: ABACAttribute[]
    department: string
    phone: string
    createdAt: Date
    createdBy: string
}

export interface CreateUserForm {
    email: string
    fullName: string
    role: string
    attributes: string[]
    department: string
    phone: string
}

// ============================================
// CASE MANAGEMENT TYPES
// ============================================

export type CaseStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'archived'
export type CasePriority = 'low' | 'medium' | 'high' | 'urgent'
export type Classification = 'public' | 'confidential' | 'secret' | 'top_secret'
export type CaseType = 'civil' | 'penal' | 'laboral' | 'administrativo'

export interface JudicialCase {
    id: string
    caseNumber: string
    title: string
    description: string
    caseType: CaseType
    status: CaseStatus
    priority: CasePriority
    classification: Classification
    assignedJudgeId?: string // ID real del juez (solo visible para admin)
    assignedJudge?: Pick<SystemUser, 'id' | 'fullName' | 'email' | 'role'> // Info del juez asignado
    createdAt: Date | string
    updatedAt: Date | string
    deadline?: Date | string
    createdBy: string
}

export interface CreateCaseForm {
    caseNumber: string
    title: string
    description: string
    caseType: CaseType
    priority: CasePriority
    classification: Classification
    deadline?: Date
}

export interface AssignCaseForm {
    caseId: string
    judgeId?: string  // Opcional si random=true
    random?: boolean  // Para asignación aleatoria
    notes?: string
}

export interface CaseHistoryEntry {
    id: string
    caseId: string
    action: string
    description: string
    performedBy: string
    performedAt: Date | string
}
