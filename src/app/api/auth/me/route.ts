import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function GET(request: Request) {
  try {
    const headerId = request.headers.get('x-user-id');
    const headerNome = request.headers.get('x-user-name');
    const headerUsername = request.headers.get('x-user-username');

    if (headerId && headerNome && headerUsername) {
      return NextResponse.json({
        success: true,
        user: { id: headerId, nome: headerNome, username: headerUsername }
      });
    }

    const cookieStore = await cookies();
    const authCookie = cookieStore.get('site_auth')?.value;
    const password = process.env.SITE_PASSWORD || 'fitch123';

    if (authCookie) {
      const parts = authCookie.split(':');
      if (parts.length === 4) {
        const [id, encodedNome, username, signature] = parts;
        const expectedSignature = await sha256(id + username + password);
        if (signature === expectedSignature) {
          return NextResponse.json({
            success: true,
            user: { id, nome: decodeURIComponent(encodedNome), username }
          });
        }
      }
    }

    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
