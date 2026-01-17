'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Check, X, AlertTriangle } from 'lucide-react';
import { reviewVerdict } from './actions';
import { toast } from 'sonner';

interface ReviewButtonsProps {
    caseId: string;
    caseNumber: string;
}

export function ReviewButtons({ caseId, caseNumber }: ReviewButtonsProps) {
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ approved: boolean } | null>(null);
    const router = useRouter();

    const handleReviewClick = (approved: boolean) => {
        setPendingAction({ approved });
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        if (!pendingAction) return;

        setConfirmOpen(false);
        setLoading(true);

        try {
            const result = await reviewVerdict(caseId, pendingAction.approved);
            
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(result.message || 'Caso revisado exitosamente');
                // Forzar actualización de la página para reflejar cambios
                router.refresh();
            }
        } catch (error) {
            console.error('Error reviewing verdict:', error);
            toast.error('Error al procesar la revisión');
        } finally {
            setLoading(false);
            setPendingAction(null);
        }
    };

    const handleCancel = () => {
        setConfirmOpen(false);
        setPendingAction(null);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                    onClick={() => handleReviewClick(true)}
                    disabled={loading}
                >
                    <Check className="h-4 w-4 mr-1" />
                    Aprobar
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => handleReviewClick(false)}
                    disabled={loading}
                >
                    <X className="h-4 w-4 mr-1" />
                    Desaprobar
                </Button>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${pendingAction?.approved ? 'bg-green-100' : 'bg-red-100'}`}>
                                {pendingAction?.approved ? (
                                    <Check className="h-5 w-5 text-green-600" />
                                ) : (
                                    <X className="h-5 w-5 text-red-600" />
                                )}
                            </div>
                            <DialogTitle className="text-xl">
                                {pendingAction?.approved ? 'Aprobar Dictamen' : 'Desaprobar Dictamen'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="pt-4 text-base">
                            ¿Estás seguro de <span className="font-semibold">{pendingAction?.approved ? 'aprobar' : 'desaprobar'}</span> el dictamen del caso <span className="font-semibold text-slate-900 dark:text-slate-100">{caseNumber}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            El caso será cerrado y archivado permanentemente. Esta acción no se puede deshacer.
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            className={pendingAction?.approved 
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }
                            onClick={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? 'Procesando...' : pendingAction?.approved ? 'Sí, Aprobar' : 'Sí, Desaprobar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
