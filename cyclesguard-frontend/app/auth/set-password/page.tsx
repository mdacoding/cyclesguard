'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getAppRole, homePathForRole } from '@/lib/roles';
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

function safeInternalPath(path: string | null): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
  return path;
}

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toHint = safeInternalPath(searchParams.get('to'));

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setIsLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Sitzung abgelaufen. Bitte öffne den Link aus der E-Mail erneut oder setze das Passwort über „Passwort vergessen“.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message.includes('same password')
          ? 'Bitte wähle ein neues Passwort.'
          : 'Passwort konnte nicht gespeichert werden. Bitte erneut versuchen.');
        return;
      }

      const role = getAppRole(user);
      const hasConsented = user.user_metadata?.has_consented === true;
      let destination = toHint ?? homePathForRole(role);

      if (role === 'player' && !hasConsented) {
        destination = '/player/onboarding';
      } else if (role === 'trainer' && toHint?.startsWith('/trainer')) {
        destination = toHint;
      } else if (!toHint) {
        destination = homePathForRole(role);
      }

      router.replace(destination as Parameters<typeof router.replace>[0]);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-gold/10 border border-rose-gold/20 mb-6">
            <ShieldCheck className="w-8 h-8 text-rose-gold" />
          </div>
          <h1 className="font-display text-3xl font-semibold text-gradient mb-3">
            Passwort festlegen
          </h1>
          <p className="text-cream/60 text-sm leading-relaxed max-w-xs mx-auto">
            Nach der Einladung legst du hier dein Passwort fest — danach geht es weiter zum Onboarding.
          </p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div role="alert" className="mb-6 bg-[#C67B7B]/10 border border-[#C67B7B]/30 rounded-xl p-4">
              <p className="text-sm text-[#C67B7B]/90">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-cream/80">
                Neues Passwort
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" aria-hidden />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 Zeichen"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-rose-gold/50 focus:border-rose-gold/50 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream/70 transition-colors"
                  aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm" className="block text-sm font-medium text-cream/80">
                Passwort bestätigen
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40" aria-hidden />
                <input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Wiederholen"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-rose-gold/50 focus:border-rose-gold/50 transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirm}
              className="w-full py-3.5 rounded-xl font-semibold text-navy bg-rose-gold hover:bg-rose-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  Speichern…
                </>
              ) : (
                'Passwort speichern'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-cream/40 mt-6">
            Link abgelaufen?{' '}
            <Link href="/login?mode=forgot" className="text-rose-gold/90 hover:underline">
              Passwort erneut anfordern
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-cream/60">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
