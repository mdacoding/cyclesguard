'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { createClient } from '@/lib/supabase/client';
import { getAppRole, homePathForRole } from '@/lib/roles';
import DemoLoginHint from './DemoLoginHint';
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgot';

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

const ALLOWED_REDIRECTS: Route[] = [
  '/player/dashboard',
  '/player/settings',
  '/player/onboarding',
  '/player/history',
  '/trainer/dashboard',
  '/admin/teams',
];

function getSafeRedirect(path: string | null): Route {
  if (path && ALLOWED_REDIRECTS.includes(path as Route)) {
    return path as Route;
  }
  return '/player/dashboard';
}

function mapAuthError(error: string): string {
  if (error.includes('Invalid login credentials'))
    return 'E-Mail-Adresse oder Passwort ist falsch.';
  if (error.includes('Email not confirmed'))
    return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
  if (error.includes('User already registered'))
    return 'Diese E-Mail-Adresse ist bereits registriert.';
  if (error.includes('Password should be at least'))
    return 'Das Passwort muss mindestens 6 Zeichen lang sein.';
  if (error.includes('Unable to validate email'))
    return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (error.includes('For security purposes'))
    return 'Zu viele Versuche — bitte kurz warten und erneut versuchen.';
  return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const urlMode = searchParams.get('mode');

  const [mode, setMode] = useState<AuthMode>(
    urlMode === 'forgot' ? 'forgot' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    if (urlError === 'invite_expired') {
      return 'Einladungs- oder Reset-Link ist abgelaufen oder ungültig. Nutze „Passwort vergessen“ oder bitte Trainer/Admin um „Einladung erneut“.';
    }
    if (urlError === 'auth_callback_failed') {
      return 'Authentifizierung fehlgeschlagen. Bitte erneut versuchen oder Passwort vergessen nutzen.';
    }
    return null;
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (urlMode === 'forgot' || urlError === 'invite_expired') setMode('forgot');
  }, [urlMode, urlError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/auth/set-password')}`,
        });
        if (resetError) {
          setError(mapAuthError(resetError.message));
          return;
        }
        setSuccessMessage(
          'Falls ein Konto existiert, senden wir einen Link zum Festlegen des Passworts.'
        );
        setMode('login');
        return;
      }

      if (mode === 'login') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) {
          setError(mapAuthError(authError.message));
          return;
        }
        const role = getAppRole(data.user);
        const home = homePathForRole(role);
        const requested = searchParams.get('redirectTo');
        const safe = getSafeRedirect(requested);
        const roleOk =
          (role === 'trainer' && safe.startsWith('/trainer')) ||
          ((role === 'club_admin' || role === 'platform_admin') && safe.startsWith('/admin')) ||
          (role === 'player' && safe.startsWith('/player'));
        router.push(roleOk ? safe : home);
        router.refresh();
        return;
      }

      if (!DEMO_MODE) {
        setError('Registrierung nur per Team-Einladung. Bitte deine Trainerin/Admin fragen.');
        return;
      }

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (signUpError) {
        setError(mapAuthError(signUpError.message));
        return;
      }
      setSuccessMessage(
        'Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse, um dich anzumelden.'
      );
      setMode('login');
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
          <h1 className="font-display text-4xl font-semibold text-gradient mb-3">
            CyclesGuard
          </h1>
          <p className="text-cream/60 text-sm leading-relaxed max-w-xs mx-auto">
            {DEMO_MODE
              ? 'Deine Stärke beginnt mit dem Verstehen deines Körpers'
              : 'Zugang per Team-Einladung — Soft-Pilot nur für eingeladene Nutzerinnen'}
          </p>
        </div>

        <DemoLoginHint />

        <div className="glass-card p-8">
          {mode !== 'forgot' && (
            <div className={`flex rounded-xl bg-white/5 p-1 mb-8 ${DEMO_MODE ? '' : ''}`} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`${DEMO_MODE ? 'flex-1' : 'w-full'} py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  mode === 'login'
                    ? 'bg-rose-gold text-navy shadow-sm'
                    : 'text-cream/60 hover:text-cream/90'
                }`}
              >
                Anmelden
              </button>
              {DEMO_MODE ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                    mode === 'signup'
                      ? 'bg-rose-gold text-navy shadow-sm'
                      : 'text-cream/60 hover:text-cream/90'
                  }`}
                >
                  Registrieren
                </button>
              ) : null}
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-6">
              <h2 className="font-semibold text-cream mb-1">Passwort vergessen</h2>
              <p className="text-sm text-cream/55 leading-relaxed">
                Wir senden einen Link zum Festlegen eines neuen Passworts an deine E-Mail.
              </p>
            </div>
          )}

          {successMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 bg-sage/10 border border-sage/30 rounded-xl p-4"
            >
              <ShieldCheck className="w-5 h-5 text-sage shrink-0 mt-0.5" />
              <p className="text-sm text-sage/90 leading-relaxed">{successMessage}</p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-6 bg-[#C67B7B]/10 border border-[#C67B7B]/30 rounded-xl p-4"
            >
              <p className="text-sm text-[#C67B7B]/90">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-cream/80">
                E-Mail-Adresse
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="spielerin@verein.de"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-rose-gold/50 focus:border-rose-gold/50 transition-all duration-200"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-cream/80">
                  Passwort
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/40"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'login' ? '••••••••' : 'Min. 6 Zeichen'}
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
                {mode === 'signup' && (
                  <p className="text-xs text-cream/40 mt-1">
                    Mindestens 6 Zeichen. Deine Daten werden verschlüsselt gespeichert.
                  </p>
                )}
                {mode === 'login' && (
                  <div className="flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs text-cream/45 hover:text-rose-gold transition-colors"
                    >
                      Passwort vergessen?
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={
                isLoading || !email || (mode !== 'forgot' && !password)
              }
              className="w-full py-3.5 rounded-xl font-semibold text-navy bg-rose-gold hover:bg-rose-gold/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(232,196,184,0.15)] hover:shadow-[0_0_30px_rgba(232,196,184,0.25)] hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>
                    {mode === 'login'
                      ? 'Anmelden...'
                      : mode === 'forgot'
                        ? 'Senden...'
                        : 'Registrieren...'}
                  </span>
                </>
              ) : (
                <span>
                  {mode === 'login'
                    ? 'Anmelden'
                    : mode === 'forgot'
                      ? 'Link senden'
                      : 'Konto erstellen'}
                </span>
              )}
            </button>
          </form>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className="w-full text-center text-sm text-cream/50 hover:text-cream/80 mt-4"
            >
              Zurück zur Anmeldung
            </button>
          )}

          {!DEMO_MODE && mode === 'login' && (
            <p className="text-center text-xs text-cream/40 mt-6 leading-relaxed">
              Noch kein Zugang? Deine Trainerin oder Club-Admin sendet eine Einladung.
            </p>
          )}

          <p className="text-center text-xs text-cream/30 mt-6 leading-relaxed">
            Deine Gesundheitsdaten sind nach Art. 9 DSGVO geschützt.
            <br />
            Kein Zugriff durch Trainer oder Vereinspersonal.
          </p>
          <p className="text-center text-xs text-cream/35 mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1">
            <a href="/privacy" className="hover:text-rose-gold underline-offset-2 hover:underline">
              Datenschutz
            </a>
            <a href="/pilot" className="hover:text-rose-gold underline-offset-2 hover:underline">
              Soft-Pilot
            </a>
            <a href="/impressum" className="hover:text-rose-gold underline-offset-2 hover:underline">
              Impressum
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-cream/20 mt-8">
          © {new Date().getFullYear()} CyclesGuard · EU-Hosting ·{' '}
          <a href="/datenschutz" className="hover:text-cream/40">
            /datenschutz
          </a>
        </p>
      </div>
    </div>
  );
}
