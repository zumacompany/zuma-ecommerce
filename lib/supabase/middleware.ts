import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabasePublishableKey =
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    if (!supabaseUrl || !supabasePublishableKey) {
        return response
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabasePublishableKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const { data, error } = await supabase.auth.getUser()
    const user = data?.user

    const pathname = request.nextUrl.pathname
    const isAdminPage = pathname.startsWith('/admin')
    const isAdminApi = pathname.startsWith('/api/admin')
    const isAdminLogin = pathname.startsWith('/admin/login')
    const isAdminSignup = pathname.startsWith('/admin/signup')
    const isAdminRecovery = pathname.startsWith('/admin/reset-password')
    const isAdminSignupApi = pathname.startsWith('/api/admin/signup')
    const isAdminBootstrapStatusApi = pathname.startsWith('/api/admin/bootstrap-status')
    const isAdminPublicPage = isAdminLogin || isAdminSignup || isAdminRecovery
    const isAdminPublicApi = isAdminSignupApi || isAdminBootstrapStatusApi
    const isAdminPublicRoute = isAdminPublicPage || isAdminPublicApi
    const isCustomerPage = pathname.startsWith('/cliente')
    const isCustomerLogin = pathname.startsWith('/cliente/login')
    const isCustomerRecovery = pathname.startsWith('/cliente/recuperar-senha')
    const isCustomerPublicPage = isCustomerLogin || isCustomerRecovery
    const role = user?.app_metadata?.role ?? user?.user_metadata?.role
    const roles = user?.app_metadata?.roles ?? user?.user_metadata?.roles
    const isAdmin = role === 'admin' || (Array.isArray(roles) && roles.includes('admin'))
    const hasAdminAccess = isAdmin

    // Protect admin pages and admin APIs
    if ((isAdminPage || isAdminApi) && !isAdminPublicRoute) {
        if (!user) {
            if (isAdminApi) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }
        if (!hasAdminAccess) {
            if (isAdminApi) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
            }
            return NextResponse.redirect(new URL('/404', request.url))
        }
    }

    // Redirect to dashboard if logged in and admin trying to access auth pages
    if ((isAdminLogin || isAdminSignup) && user && hasAdminAccess) {
        return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Protect customer pages (except login page)
    if (isCustomerPage && !isCustomerPublicPage) {
        if (!user) {
            // Redirect to customer login
            return NextResponse.redirect(new URL('/cliente/login', request.url))
        }
        // Admins trying to access customer area should be redirected to admin
        if (hasAdminAccess) {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
    }

    // Redirect to customer dashboard if already logged in and trying to access login
    if (isCustomerPublicPage && user && hasAdminAccess) {
        return NextResponse.redirect(new URL('/admin', request.url))
    }

    if (isCustomerPublicPage && user && !hasAdminAccess) {
        return NextResponse.redirect(new URL('/cliente/dashboard', request.url))
    }

    return response
}
