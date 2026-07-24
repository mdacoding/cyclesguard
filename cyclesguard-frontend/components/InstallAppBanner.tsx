'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';

const DISMISS_KEY = 'cg_install_banner_dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const chrome = /CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS && webkit && !chrome;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export default function InstallAppBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return;
    } catch {
      /* ignore */
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    if (isIosSafari()) {
      setShowIos(true);
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setDeferred(null);
    setShowIos(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (!visible) return null;

  return (
    <section
      className="glass-card p-4 border border-sage/25 bg-sage/5 animate-slideUp"
      role="region"
      aria-label="App installieren"
    >
      <div className="flex items-start gap-3">
        <Download className="w-5 h-5 text-sage shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-medium text-cream">Auf den Homescreen</p>
          {showIos && !deferred ? (
            <p className="text-xs text-cream/60 leading-relaxed">
              Tippe auf <Share className="inline w-3.5 h-3.5 text-cream/80" aria-hidden /> Teilen und wähle
              „Zum Home-Bildschirm“. So kommen Erinnerungen zuverlässiger — ohne Zyklus-Details in der
              Vorschau.
            </p>
          ) : (
            <p className="text-xs text-cream/60 leading-relaxed">
              Installiere CyclesGuard als App — schneller Log und Push auch ohne offenen Tab. Reminder
              bleiben coach-safe (keine Intimdaten).
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            {deferred ? (
              <button
                type="button"
                onClick={install}
                className="min-h-10 px-4 rounded-lg bg-sage/90 text-navy text-sm font-semibold hover:bg-sage transition-colors"
              >
                Installieren
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="min-h-10 px-3 rounded-lg text-cream/50 text-sm hover:text-cream/80 transition-colors"
            >
              Später
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="p-1.5 rounded-lg text-cream/40 hover:text-cream/70 hover:bg-white/5"
          aria-label="Schließen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
