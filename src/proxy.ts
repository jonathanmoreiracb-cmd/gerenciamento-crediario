import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Web-safe SHA-256 hash function (compatible with Edge Runtime)
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Next.js internals, static files, favicon, API endpoints pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/login'
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('site_auth')?.value;
  const password = process.env.SITE_PASSWORD || 'fitch123';

  let authenticated = false;
  let userId = '';
  let userNome = '';
  let userUsername = '';

  if (authCookie) {
    const parts = authCookie.split(':');
    if (parts.length === 4) {
      const [id, encodedNome, username, signature] = parts;
      const expectedSignature = await sha256(id + username + password);
      if (signature === expectedSignature) {
        authenticated = true;
        userId = id;
        userNome = decodeURIComponent(encodedNome);
        userUsername = username;
      }
    }
  }

  if (!authenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/' && pathname !== '') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Pass authenticated user details upstream in headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', userId);
  requestHeaders.set('x-user-name', userNome);
  requestHeaders.set('x-user-username', userUsername);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
