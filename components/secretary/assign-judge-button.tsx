'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { assignJudgeAction } from '@/app/actions/assign-case';

interface AssignJudgeButtonProps {
    caseId: string;
    disabled?: boolean;
}

export function AssignJudgeButton({ caseId, disabled }: AssignJudgeButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleAssign = async () => {
        try {
            setLoading(true);
            await assignJudgeAction(caseId);
            toast.success('Juez asignado exitosamente');
        } catch (error: any) {
            toast.error(error.message || 'Error al asignar juez');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            variant="outline"
            onClick={handleAssign}
            disabled={disabled || loading}
            title="Asignar Juez Aleatorio"
        >
            {loading ? (
                <span className="animate-spin mr-2">⏳</span>
            ) : (
                <UserPlus className="h-4 w-4 mr-2" />
            )}
            Asignar Juez
        </Button>
    );
}
