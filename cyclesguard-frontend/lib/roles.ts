export type AppRole = 'player' | 'trainer' | 'club_admin' | 'platform_admin';

export function getAppRole(user: {
  app_metadata?: Record<string, unknown>;
} | null): AppRole {
  const role = user?.app_metadata?.role;
  if (role === 'trainer' || role === 'club_admin' || role === 'platform_admin') {
    return role;
  }
  return 'player';
}

export function isTrainer(user: { app_metadata?: Record<string, unknown> } | null): boolean {
  const role = getAppRole(user);
  return role === 'trainer' || role === 'club_admin' || role === 'platform_admin';
}

export function isClubAdmin(user: { app_metadata?: Record<string, unknown> } | null): boolean {
  const role = getAppRole(user);
  return role === 'club_admin' || role === 'platform_admin';
}

export function homePathForRole(role: AppRole): '/trainer/dashboard' | '/admin/teams' | '/player/dashboard' {
  if (role === 'club_admin' || role === 'platform_admin') return '/admin/teams';
  if (role === 'trainer') return '/trainer/dashboard';
  return '/player/dashboard';
}
