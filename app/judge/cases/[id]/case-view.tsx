'use client';

import { useActionState } from 'react';
import { submitVerdict } from '@/app/judge/actions';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Gavel, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";

interface CaseViewProps {
    caseData: {
        id: string;
        case_number: string;
        title: string;
        description: string;
        classification: string;
        priority: string;
        case_type: string;
        file_url?: string;
    };
}

export function CaseView({ caseData }: CaseViewProps) {
    const [state, formAction, isPending] = useActionState(submitVerdict, null);

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{caseData.case_number}</h1>
                        <Badge variant="outline" className="text-base">{caseData.classification}</Badge>
                        <Badge className="bg-blue-600 hover:bg-blue-700">{caseData.case_type}</Badge>
                    </div>
                    <p className="text-xl text-muted-foreground">{caseData.title}</p>
                </div>
                <div className="text-right">
                    <Badge variant={caseData.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-sm px-4 py-1">
                        Prioridad: {caseData.priority?.toUpperCase()}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Columna Izquierda: Detalles del Caso */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" /> Detalles del Expediente
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="prose max-w-none dark:prose-invert">
                            <p className="whitespace-pre-wrap">{caseData.description}</p>

                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-2">Documentos Adjuntos</h3>
                                {caseData.file_url ? (
                                    <div className="p-4 border rounded-md bg-white dark:bg-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-blue-500" />
                                            <div>
                                                <p className="font-medium">Expediente Principal</p>
                                                <p className="text-sm text-muted-foreground">Documento original del caso</p>
                                            </div>
                                        </div>
                                        <Button asChild variant="outline">
                                            <a href={caseData.file_url} target="_blank" rel="noopener noreferrer">
                                                Ver Documento
                                            </a>
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground italic">No hay documentos adjuntos.</p>
                                )}
                            </div>

                            <div className="mt-8 p-4 bg-muted rounded-lg border">
                                <h4 className="font-semibold mb-2 flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    Nota de Seguridad
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Este expediente está bajo monitoreo de auditoría. Todas las acciones son registradas.
                                    Su identidad está protegida mediante pseudonimización (`anon_actor_id`).
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Columna Derecha: Dictamen */}
                <div className="lg:col-span-1">
                    <Card className="border-2 border-primary/20 shadow-xl sticky top-6">
                        <CardHeader className="bg-primary/5">
                            <CardTitle className="flex items-center gap-2 text-primary">
                                <Gavel className="h-5 w-5" />
                                Emisión de Fallo
                            </CardTitle>
                            <CardDescription>
                                Esta acción es final e irrevocable.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form action={formAction} className="space-y-6">
                                <input type="hidden" name="caseId" value={caseData.id} />

                                <div className="space-y-2">
                                    <label htmlFor="verdict" className="text-sm font-medium">Resolución Judicial</label>
                                    <Textarea
                                        id="verdict"
                                        name="verdict"
                                        placeholder="Escriba su dictamen aquí..."
                                        className="min-h-[300px] font-serif text-lg leading-relaxed resize-none focus-visible:ring-primary"
                                        required
                                    />
                                    <p className="text-xs text-muted-foreground text-right">
                                        Se aplicará firma digital automática al enviar.
                                    </p>
                                </div>

                                {state?.error && (
                                    <Alert variant="destructive">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{state.error}</AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full text-lg py-6"
                                    size="lg"
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        'Procesando...'
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Firmar y Enviar Dictamen
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    Al enviar, el token de acceso será invalidado y el caso se marcará como cerrado.
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
