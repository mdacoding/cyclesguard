'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type LogoutButtonProps = {
  className?: string;
  label?: string;
  /** Icon-only compact control for headers */
  compact?: boolean;
};

export default function LogoutButton({
  className = '',
  label = 'Abmelden',
  compact = false,
}: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      // Still leave the app surface — session clear may have partially succeeded
      router.push('/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={loading}
        aria-label={label}
        title={label}
        className={`flex items-center justify-center min-h-12 min-w-12 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-cream/80" />
        ) : (
          <LogOut className="w-5 h-5 text-cream/80" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loading}
      className={`flex items-center gap-2 min-h-12 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      <span>{label}</span>
    </button>
  );
}
