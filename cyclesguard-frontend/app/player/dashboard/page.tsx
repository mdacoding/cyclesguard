import { createServerSupabaseClient } from '@/lib/supabase/server';
import CycleLogForm from './components/CycleLogForm';
import FeedbackBanner from './components/FeedbackBanner';
import RecentLogsCard from './components/RecentLogsCard';
import PushPromptBanner from './components/PushPromptBanner';
import SessionSummaryCard from './components/SessionSummaryCard';
import { mapDbCycleLog } from '@/lib/cycle-log-mapper';
import { isSameBerlinDay } from '@/lib/date';
import { computeLoggingStreak } from '@/lib/player-insights';
import { streakGoalProgress, STREAK_GOAL_DAYS } from '@/lib/adherence';
import { redirect } from 'next/navigation';
import { CalendarDays, Settings, Sparkles, Flame, CheckCircle2, Target } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import PilotFeedbackCapture from '@/components/PilotFeedbackCapture';
import InstallAppBanner from '@/components/InstallAppBanner';

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: logsData, error } = await supabase
    .from('cycle_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('logged_at', { ascending: false })
    .limit(7);

  if (error) {
    console.error('Failed to fetch cycle logs:', error);
  }

  const logs = (logsData ?? []).map((row) => mapDbCycleLog(row as Record<string, unknown>));
  const lastLog = logs[0] ?? null;
  const todayLog = logs.find((log) => isSameBerlinDay(log.loggedAt)) ?? null;
  const isFirstRun = logs.length === 0;
  const bannerLog = todayLog ?? lastLog;
  const streak = computeLoggingStreak(logs);
  const goal = streakGoalProgress(streak, STREAK_GOAL_DAYS);

  const { data: sessionRow } = await supabase
    .from('session_summaries')
    .select('started_at, duration_minutes, distance_km, avg_heart_rate, load_score')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen py-10 px-4 animate-fadeIn">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-gradient mb-2">
              CyclesGuard
            </h1>
            <p className="text-cream/80 text-lg">
              Hallo{user.email ? `, ${user.email.split('@')[0]}` : ''}!
              {todayLog ? ' Du kannst deinen heutigen Eintrag anpassen.' : ' Zeichne heute deine Readiness auf.'}
            </p>
            {!isFirstRun && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-cream/70">
                  {todayLog ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-sage" aria-hidden />
                  ) : (
                    <CalendarDays className="w-3.5 h-3.5 text-rose-gold" aria-hidden />
                  )}
                  {todayLog ? 'Heute erledigt' : 'Heute noch offen'}
                </span>
                {streak > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-rose-gold/10 border border-rose-gold/20 text-rose-gold/90">
                    <Flame className="w-3.5 h-3.5" aria-hidden />
                    Streak {streak} {streak === 1 ? 'Tag' : 'Tage'}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-cream/70">
                  <Target className="w-3.5 h-3.5 text-sage" aria-hidden />
                  {goal.met
                    ? `Ziel ${goal.goal}d erreicht`
                    : `Ziel ${goal.streak}/${goal.goal} Tage`}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 self-start md:self-auto">
            <Link
              href="/player/history"
              className="flex items-center justify-center min-h-12 min-w-12 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              aria-label="Verlauf"
            >
              <CalendarDays className="w-5 h-5 text-cream/80" />
            </Link>
            <Link
              href="/player/settings"
              className="flex items-center justify-center min-h-12 min-w-12 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              aria-label="Einstellungen"
            >
              <Settings className="w-5 h-5 text-cream/80" />
            </Link>
            <LogoutButton compact />
          </div>
        </header>

        {isFirstRun && (
          <section className="glass-card p-6 border border-rose-gold/20 bg-rose-gold/5 animate-slideUp">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-rose-gold shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-lg mb-1">Willkommen — dein erster Eintrag</h2>
                <p className="text-sm text-cream/70 leading-relaxed">
                  Wähle unten deine Phase und dein Energielevel. Das dauert unter 30 Sekunden.
                  Deine Daten bleiben privat — Trainer sehen nur aggregierte Readiness.
                </p>
              </div>
            </div>
          </section>
        )}

        {!isFirstRun && !todayLog && (
          <section className="glass-card p-5 border border-rose-gold/25 bg-rose-gold/5 animate-slideUp">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-base mb-1">Heute noch offen — Streak retten</h2>
                <p className="text-sm text-cream/65">
                  {goal.met
                    ? `Dein ${goal.goal}-Tage-Ziel steht. Ein kurzer Eintrag hält den Streak.`
                    : streak > 0
                      ? `Noch ${goal.remaining} ${goal.remaining === 1 ? 'Tag' : 'Tage'} bis zum ${goal.goal}-Tage-Ziel.`
                      : `Starte neu — Ziel: ${goal.goal} Tage hintereinander loggen.`}
                </p>
              </div>
              <a
                href="#log"
                className="inline-flex items-center justify-center min-h-11 px-4 rounded-xl bg-rose-gold text-navy text-sm font-medium shrink-0"
              >
                Jetzt loggen
              </a>
            </div>
          </section>
        )}

        <PushPromptBanner hasLogged={!isFirstRun} />
        <InstallAppBanner />

        {bannerLog && (
          <section className="animate-slideUp">
            <FeedbackBanner phase={bannerLog.phase} isToday={!!todayLog} />
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <section id="log" className="glass-card p-6 md:p-8 animate-slideUp scroll-mt-8" style={{ animationDelay: '0.1s' }}>
              <h2 className="font-display text-2xl font-semibold mb-6">
                {todayLog ? 'Heutigen Eintrag anpassen' : 'Wie fühlst du dich heute?'}
              </h2>
              <CycleLogForm todayLog={todayLog} lastLog={lastLog} />
            </section>
          </div>

          <div className="md:col-span-1 space-y-6">
            {sessionRow && (
              <SessionSummaryCard
                startedAt={sessionRow.started_at}
                durationMinutes={sessionRow.duration_minutes}
                distanceKm={sessionRow.distance_km}
                avgHeartRate={sessionRow.avg_heart_rate}
                loadScore={sessionRow.load_score}
              />
            )}
            <section className="glass-card p-6 animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <RecentLogsCard logs={logs} />
            </section>
            <PilotFeedbackCapture context="player_dashboard" enabled={!isFirstRun} />
          </div>
        </div>
      </div>
    </div>
  );
}
