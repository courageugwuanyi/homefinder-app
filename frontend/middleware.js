import { NextResponse } from 'next/server'

export function middleware(request) {
    const token = request.cookies.get('authToken')?.value
    const { pathname } = request.nextUrl

    // Protected routes that require authentication
    const protectedPaths = [
        '/real-estate/my-properties',
        '/real-estate/account-infoo',
        '/agent/dashboard'
    ]

    // Check if the current path is protected
    const isProtectedPath = protectedPaths.some(path =>
        pathname.startsWith(path)
    )

    if (isProtectedPath && !token) {
        const redirectUrl = new URL('/real-estate', request.url)
        return NextResponse.redirect(redirectUrl)
    }

    // Minimal security setup for most apps
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    return response
}

export const config = {
    matcher: [
        '/real-estate/add-property/:path*',
        '/real-estate/my-properties/:path*',
        '/real-estate/account-infoo/:path*',
        '/agent/dashboard/:path*'
    ]
}