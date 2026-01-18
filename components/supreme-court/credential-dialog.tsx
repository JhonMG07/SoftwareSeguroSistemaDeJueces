"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Copy } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface CredentialDialogProps {
    open: boolean
    onClose: () => void
    credentials: {
        email: string
        password?: string
    } | null
}

export function CredentialDialog({
    open,
    onClose,
    credentials,
}: CredentialDialogProps) {
    const [copiedEmail, setCopiedEmail] = useState(false)
    const [copiedPassword, setCopiedPassword] = useState(false)

    if (!credentials) return null

    const copyToClipboard = async (text: string, type: 'email' | 'password') => {
        try {
            await navigator.clipboard.writeText(text)
            if (type === 'email') {
                setCopiedEmail(true)
                setTimeout(() => setCopiedEmail(false), 2000)
            } else {
                setCopiedPassword(true)
                setTimeout(() => setCopiedPassword(false), 2000)
            }
            toast.success(`${type === 'email' ? 'Email' : 'Contraseña'} copiado al portapapeles`)
        } catch (err) {
            toast.error('Error al copiar')
        }
    }

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Credenciales de Usuario Generadas</DialogTitle>
                    <DialogDescription>
                        Guarde estas credenciales en un lugar seguro. La contraseña no se podrá ver nuevamente.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email-display">Correo Electrónico</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="email-display"
                                value={credentials.email}
                                readOnly
                                className="font-mono bg-muted"
                            />
                            <Button
                                size="icon"
                                variant="outline"
                                onClick={() => copyToClipboard(credentials.email, 'email')}
                            >
                                {copiedEmail ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    {credentials.password && (
                        <div className="grid gap-2">
                            <Label htmlFor="password-display">Contraseña Temporal</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="password-display"
                                    value={credentials.password}
                                    readOnly
                                    className="font-mono bg-muted"
                                />
                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => copyToClipboard(credentials.password!, 'password')}
                                >
                                    {copiedPassword ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="sm:justify-start">
                    <Button type="button" variant="default" className="w-full" onClick={onClose}>
                        Aceptar y Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
