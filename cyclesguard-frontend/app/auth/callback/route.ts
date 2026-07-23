import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { finalizeInviteIfNeeded } from '@/lib/invite-membership';
import { getAppRole, homePathForRole } from '@/lib/roles';

function redirectTo(request: Request, origin: string, destination: string) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  if (isLocalEnv) {
    return NextResponse.redirect(`${origin}${destination}`);
  }
  if (forwardedHost) {
    return NextResponse.redirect(`https://${forwardedHost}${destination}`);
  }
  return NextResponse.redirect(`${origin}${destination}`);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const expired =
        /expired|invalid|otp|code/i.test(error.message) || error.status === 400;
      return NextResponse.redirect(
        `${origin}/login?error=${expired ? 'invite_expired' : 'auth_callback_failed'}&mode=forgot`
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      try {
        const admin = createAdminClient();
        await finalizeInviteIfNeeded(admin, user);
      } catch (e) {
        console.error('Invite finalize failed:', e);
      }
    }

    const role = getAppRole(user);
    const hasConsented = user?.user_metadata?.has_consented === true;
    const nextOk = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//');
    let destination = nextOk ? nextParam : homePathForRole(role);

    // Invite/recovery must reach set-password before consent onboarding.
    const isSetPassword =
      destination === '/auth/set-password' || destination.startsWith('/auth/set-password?');

    if (role === 'player' && !hasConsented && !isSetPassword) {
      destination = '/player/onboarding';
    }

    return redirectTo(request, origin, destination);
  }

  return NextResponse.redirect(`${origin}/login?error=invite_expired&mode=forgot`);
}
