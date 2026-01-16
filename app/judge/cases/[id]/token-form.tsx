'use client';

import { useActionState } from 'react';
import { validateCaseToken } from '@/app/judge/actions';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockKeyhole } from "lucide-react";
import { useSearchParams } from 'next/navigation';

export function TokenForm({ caseId, caseNumber }: { caseId: string, caseNumber: string }) {
    const [state, formAction, isPending] = useActionState(validateCaseToken, null);
    const searchParams = useSearchParams();
    const error = state?.error || (searchParams.get('error') ? 'Error de validación' : null);

    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-lg border-l-4 border-l-blue-600">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-blue-100 p-3 rounded-full w-fit mb-4">
                        <LockKeyhole className="h-8 w-8 text-blue-700" />
                    </div>
                    <CardTitle>Acceso Protegido</CardTitle>
                    <CardDescription>
                        El expediente <strong>{caseNumber}</strong> está clasificado.
                        Ingrese el token de acceso único enviado a su correo seguro.
                    </CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <input type="hidden" name="caseId" value={caseId} />

                        <div className="space-y-2">
                            <label htmlFor="token" className="text-sm font-medium">Código de Acceso del Caso</label>
                            <Input
                                id="token"
                                name="token"
                                placeholder="xxxx-xxxx-xxxx-xxxx"
                                className="text-center font-mono tracking-widest text-lg"
                                required
                                autoComplete="off"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md flex items-center gap-2">
                                <ShieldAlertIcon className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isPending}>
                            {isPending ? 'Verificando...' : 'Desbloquear Expediente'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

function ShieldAlertIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
    );
}
