import test from 'node:test';
import assert from 'node:assert/strict';
import { inviteCallbackRedirect } from '@/lib/auth-password-email';

test('inviteCallbackRedirect lands on set-password via auth callback', () => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://cyclesguard.vercel.app';
  const player = inviteCallbackRedirect('player');
  assert.match(player, /^https:\/\/cyclesguard\.vercel\.app\/auth\/callback\?next=/);
  const next = decodeURIComponent(player.split('next=')[1] ?? '');
  assert.equal(next, '/auth/set-password?to=/player/onboarding');

  const trainer = inviteCallbackRedirect('trainer');
  const trainerNext = decodeURIComponent(trainer.split('next=')[1] ?? '');
  assert.equal(trainerNext, '/auth/set-password?to=/trainer/onboarding');
});
