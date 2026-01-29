import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Middleware de Next.js para protección de rutas y manejo de sesión
 */

// Rate limiting simple en memoria (para producción usar Redis)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX_ADMIN = 50; // 50 requests por minuto para admin
const RATE_LIMIT_MAX_GENERAL = 100; // 100 requests por minuto general

function checkRateLimit(identifier: string, maxRequests: number): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(identifier);

    if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
        rateLimitMap.set(identifier, { count: 1, timestamp: now });
        return true;
    }

    record.count++;
    return record.count <= maxRequests;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Crear cliente de Supabase
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Obtener sesión del usuario
    const { data: { user } } = await supabase.auth.getUser();

    // ====================================
    // GLOBAL RATE LIMIT (IP BASED)
    // ====================================
    // Para rutas públicas o login que no tienen usuario autenticado
    const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
    const globalRateLimitKey = `ip:${ip}`;
    // Límite más estricto para IPs anónimas si es necesario, o general
    if (!checkRateLimit(globalRateLimitKey, 1000)) { // 1000 req/min global IP limit (relaxed)
        // Omitir return por ahora para no bloquear todo, ajustar según necesidad
    }

    // Rutas públicas que no requieren autenticación
    const publicRoutes = ['/auth/login', '/auth/signup', '/auth/callback', '/auth/signout', '/'];
    // Permitir acceso a la raíz '/' o manejarla según lógica de negocio (landing page?)
    const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

    if (isPublicRoute && !pathname.startsWith('/auth/callback')) {
        // Si es pública y tiene user, quizás redirigir a dashboard? 
        // Por ahora dejamos pasar como en proxy.ts
        if (!pathname.startsWith('/auth')) {
            return response;
        }
    }

    // Lista explícita de rutas protegidas o lógica inversa (proteger todo excepto público)
    // Aquí implementamos la lógica específica de rutas

    // ====================================
    // VERIFICACIÓN DE AUTENTICACIÓN
    // ====================================
    // Si intenta acceder a ruta protegida sin usuario
    const protectedPrefixes = ['/admin', '/dashboard', '/judge', '/supreme-court', '/api'];
    const isProtectedRoute = protectedPrefixes.some(prefix => pathname.startsWith(prefix));

    if (isProtectedRoute && !user) {
        if (pathname.startsWith('/api')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Si tiene usuario, verificar estado activo y roles
    if (user) {
        const { data: profile } = await supabase
            .from('users_profile')
            .select('role, status')
            .eq('id', user.id)
            .single();

        // Verificar estatus activo (Global)
        if (profile?.status !== 'active') {
            // Permitir signout o APIs de auth
            if (!pathname.startsWith('/auth/signout')) {
                const url = request.nextUrl.clone();
                url.pathname = '/auth/login';
                url.searchParams.set('error', 'account_inactive');
                return NextResponse.redirect(url);
            }
        }

        // ====================================
        // PROTECCIÓN POR ROLES
        // ====================================

        // 1. Supreme Court
        if (pathname.startsWith('/supreme-court')) {
            if (profile?.role !== 'super_admin') {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

        // 2. Admin / Auditor
        if (pathname.startsWith('/admin')) {
            // Rate limiting para admin logic
            const rateLimitKey = `admin:${user.id}`;
            if (!checkRateLimit(rateLimitKey, RATE_LIMIT_MAX_ADMIN)) {
                // Redirigir o error? Admin UI prefiere redirect o error page?
                // Para API json, para UI redirect.
                // Asumimos UI.
            }

            if (profile?.role !== 'admin' && profile?.role !== 'auditor' && profile?.role !== 'super_admin') {
                return NextResponse.redirect(new URL('/unauthorized', request.url));
            }
        }

        // 3. Jueces
        if (pathname.startsWith('/judge')) {
            if (profile?.role !== 'judge') {
                return NextResponse.redirect(new URL('/', request.url));
            }
        }

        // 4. Dashboard (General)
        if (pathname.startsWith('/dashboard')) {
            const rateLimitKey = `dashboard:${user.id}`;
            if (!checkRateLimit(rateLimitKey, RATE_LIMIT_MAX_GENERAL)) {
                // Rate limited
            }
        }

        // ====================================
        // PROTECCIÓN DE APIs
        // ====================================

        if (pathname.startsWith('/api/admin')) {
            // Rate limit
            if (!checkRateLimit(`api-admin:${user.id}`, RATE_LIMIT_MAX_ADMIN)) {
                return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
            }
            // Role check (Super Admin only according to proxy.ts)
            if (profile?.role !== 'super_admin') {
                return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 });
            }
        }

        if (pathname.startsWith('/api/audit')) {
            if (!checkRateLimit(`audit-api:${user.id}`, RATE_LIMIT_MAX_ADMIN)) {
                return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
            }
            if (profile?.role !== 'admin' && profile?.role !== 'auditor' && profile?.role !== 'super_admin') {
                return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
            }
        }

        if (pathname.startsWith('/api/judge')) {
            if (profile?.role !== 'judge' && profile?.role !== 'secretary') {
                return NextResponse.json({ error: 'Forbidden - Judge access required' }, { status: 403 });
            }
        }
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
