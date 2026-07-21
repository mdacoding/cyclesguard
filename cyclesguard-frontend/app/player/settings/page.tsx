'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  Trash2,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Bell,
  BellOff,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import LogoutButton from '@/components/LogoutButton';
import {
  isPushSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '@/lib/push-client';

export default function SettingsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isPushSupported()) return;

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setPushEnabled(!!subscription))
      .catch(() => {
        // Ignore — push state stays disabled
      });
  }, []);

  const handleExport = () => {
    window.open('/api/player/export', '_blank');
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Möchtest du dein Konto und alle deine Gesundheitsdaten WIRKLICH unwiderruflich löschen? Dieser Vorgang kann nicht rückgängig gemacht werden.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/player/delete-account', {
        method: 'DELETE',
      });

      if (response.ok) {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
      } else {
        alert('Fehler beim Löschen des Kontos.');
      }
    } catch {
      alert('Netzwerkfehler.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePushToggle = async () => {
    setPushLoading(true);
    setPushError(null);

    try {
      if (pushEnabled) {
        await unsubscribeFromPushNotifications();
        setPushEnabled(false);
      } else {
        const success = await subscribeToPushNotifications();
        if (success) {
          setPushEnabled(true);
        } else {
          setPushError(
            'Benachrichtigungen konnten nicht aktiviert werden. Prüfe die Browser-Berechtigung.'
          );
        }
      }
    } catch {
      setPushError('Fehler beim Konfigurieren der Benachrichtigungen.');
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 animate-fadeIn">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <Link
              href="/player/dashboard"
              className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-cream" />
            </Link>
            <h1 className="font-display text-3xl font-semibold text-gradient">
              Einstellungen
            </h1>
          </div>
          <LogoutButton />
        </header>

        <section className="glass-card p-6 md:p-8 animate-slideUp">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
            <LogOut className="w-5 h-5 text-rose-gold" />
            <h2 className="text-xl font-semibold">Sitzung</h2>
          </div>
          <p className="text-sm text-cream/60 mb-4">
            Melde dich ab, um dich mit einem anderen Account anzumelden (z.&nbsp;B. Trainer /
            Spielerin in der Demo).
          </p>
          <LogoutButton className="bg-rose-gold/10 border-rose-gold/30 text-rose-gold hover:bg-rose-gold/20" />
        </section>

        <section className="glass-card p-6 md:p-8 animate-slideUp">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <Bell className="w-6 h-6 text-rose-gold" />
            <h2 className="text-xl font-semibold">Erinnerungen</h2>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-white/5">
            <div>
              <h3 className="font-medium text-cream mb-1">Tägliche Erinnerungen aktivieren</h3>
              <p className="text-sm text-cream/60">
                Tägliche Erinnerung ca. 07:00–08:00 (Europe/Berlin). Funktioniert nach
                Installation auf dem Homescreen (iOS 16.4+). Keine medizinischen Inhalte in der Nachricht.
              </p>
              {pushError && (
                <p className="text-sm text-menstrual mt-2">{pushError}</p>
              )}
            </div>
            <button
              onClick={handlePushToggle}
              disabled={pushLoading || !isPushSupported()}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors text-sm font-medium shrink-0 disabled:opacity-50 ${
                pushEnabled
                  ? 'bg-sage/20 text-sage border border-sage/30'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {pushLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : pushEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
              <span>{pushEnabled ? 'Aktiv' : 'Aktivieren'}</span>
            </button>
          </div>
        </section>

        <section className="glass-card p-6 md:p-8 animate-slideUp">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            <ShieldCheck className="w-6 h-6 text-sage" />
            <h2 className="text-xl font-semibold">Datenschutz & DSGVO</h2>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-white/5">
              <div>
                <h3 className="font-medium text-cream mb-1">Daten exportieren (Art. 20)</h3>
                <p className="text-sm text-cream/60">
                  Lade alle deine Zyklus-Einträge als maschinenlesbare JSON-Datei herunter.
                </p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>Exportieren</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-[#C67B7B]/10 border border-[#C67B7B]/20">
              <div>
                <h3 className="font-medium text-[#C67B7B] mb-1">Konto löschen (Art. 17)</h3>
                <p className="text-sm text-cream/60">
                  Löscht dein Konto und <strong>alle</strong> deine Gesundheitsdaten unwiderruflich
                  von den Servern.
                </p>
              </div>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C67B7B] hover:bg-[#C67B7B]/90 text-navy transition-colors text-sm font-medium disabled:opacity-50 shrink-0"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Konto löschen</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
