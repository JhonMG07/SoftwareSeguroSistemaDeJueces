'use client';
// Manages inactivity and absolute session timeouts

import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 60 * 1000; // 1 minuto
const ABSOLUTE_TIMEOUT = 5 * 60 * 1000; // 5 minutos

export function SessionTimeoutManager({ serverInstanceId }: { serverInstanceId: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
    const absoluteTimerRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = useCallback(async (reason: 'inactivity' | 'absolute' | 'restart') => {
        // Evitar bucles: si ya estamos en auth, no intentar salir de nuevo salvo que sea forzado
        if (window.location.pathname.startsWith('/auth')) return;

        await supabase.auth.signOut();

        let message = '';
        if (reason === 'inactivity') message = 'Sesión cerrada por inactividad (1 min).';
        else if (reason === 'absolute') message = 'La sesión ha expirado (límite de 5 min).';
        else if (reason === 'restart') message = 'El servidor se ha reiniciado. Por favor inicie sesión nuevamente.';

        if (message) toast.error(message);

        router.push('/auth/login');
        router.refresh();
    }, [router, supabase]);

    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        // Solo establecer el timer si NO estamos en auth
        inactivityTimerRef.current = setTimeout(() => {
            handleLogout('inactivity');
        }, INACTIVITY_TIMEOUT);
    }, [handleLogout]);

    useEffect(() => {
        // VALIDACIÓN DE REINICIO DE SERVIDOR
        // Si el cliente tiene un ID guardado y es diferente al actual del servidor -> Logout
        const storedServerId = sessionStorage.getItem('server-instance-id');
        if (storedServerId && storedServerId !== serverInstanceId) {
            sessionStorage.setItem('server-instance-id', serverInstanceId); // Actualizamos para que no lo haga en bucle
            handleLogout('restart');
            return;
        }
        // Si no hay guardado, lo guardamos (primera carga)
        if (!storedServerId) {
            sessionStorage.setItem('server-instance-id', serverInstanceId);
        }

        // No ejecutar lógica de timeout en páginas de autenticación
        if (pathname?.startsWith('/auth')) {
            // Limpiar timers si navegamos a auth
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (absoluteTimerRef.current) clearTimeout(absoluteTimerRef.current);
            return;
        }

        // Verificar sesión activa inicial
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Configurar temporizador absoluto (5 min) solo una vez al montar si hay sesión
            // Y si no existe ya
            if (!absoluteTimerRef.current) {
                absoluteTimerRef.current = setTimeout(() => {
                    handleLogout('absolute');
                }, ABSOLUTE_TIMEOUT);
            }

            // Configurar listeners de actividad
            const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
            const handleActivity = () => {
                if (!pathname?.startsWith('/auth')) {
                    resetInactivityTimer();
                }
            };

            events.forEach((event) => {
                document.addEventListener(event, handleActivity);
            });

            // Iniciar temporizador de inactividad
            resetInactivityTimer();

            return () => {
                if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
                if (absoluteTimerRef.current) clearTimeout(absoluteTimerRef.current);
                events.forEach((event) => {
                    document.removeEventListener(event, handleActivity);
                });
            };
        };

        checkSession();

        // Limpieza al desmontar
        return () => {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            if (absoluteTimerRef.current) clearTimeout(absoluteTimerRef.current);
        };

    }, [handleLogout, resetInactivityTimer, supabase, pathname, serverInstanceId]);

    return null; // Componente lógico sin UI
}
