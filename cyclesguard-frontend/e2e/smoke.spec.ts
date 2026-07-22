import { test, expect } from '@playwright/test';

/**
 * Soft-Pilot / Pitch smoke against a deployed URL (default: production).
 *
 * Credentials (optional — tests skip login when missing):
 *   E2E_TRAINER_EMAIL / E2E_TRAINER_PASSWORD
 *   E2E_PLAYER_EMAIL / E2E_PLAYER_PASSWORD
 *   E2E_BASE_URL (default https://cyclesguard.vercel.app)
 */

const trainerEmail = process.env.E2E_TRAINER_EMAIL;
const trainerPassword = process.env.E2E_TRAINER_PASSWORD;
const playerEmail = process.env.E2E_PLAYER_EMAIL;
const playerPassword = process.env.E2E_PLAYER_PASSWORD;

test.describe('public smoke', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /CyclesGuard/i })).toBeVisible();
    await expect(page.getByLabel(/E-Mail/i)).toBeVisible();
  });

  test('home page shows brand and login CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /CyclesGuard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Anmelden$/i }).first()).toBeVisible();
  });
});

test.describe('trainer flow', () => {
  test.skip(!trainerEmail || !trainerPassword, 'E2E_TRAINER_* not set');

  test('trainer dashboard shows ampel without medical fields', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/E-Mail/i).fill(trainerEmail!);
    await page.getByLabel(/Passwort/i).fill(trainerPassword!);
    await page.getByRole('button', { name: /Anmelden/i }).click();
    await expect(page).toHaveURL(/\/trainer\/dashboard/);

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/trainer/team-status') && r.ok()
    );
    await page.reload();
    const response = await responsePromise;
    const body = await response.json();

    expect(Array.isArray(body)).toBeTruthy();
    for (const entry of body) {
      expect(entry).toHaveProperty('status');
      expect(entry).toHaveProperty('recommendation');
      expect(entry).not.toHaveProperty('phase');
      expect(entry).not.toHaveProperty('symptoms');
      expect(entry).not.toHaveProperty('energy_level');
      expect(String(entry.recommendation)).not.toMatch(/menstru|zyklus|eisprung|ovulation/i);
    }
  });
});

test.describe('player flow', () => {
  test.skip(!playerEmail || !playerPassword, 'E2E_PLAYER_* not set');

  test('player can open dashboard after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/E-Mail/i).fill(playerEmail!);
    await page.getByLabel(/Passwort/i).fill(playerPassword!);
    await page.getByRole('button', { name: /Anmelden/i }).click();
    await expect(page).toHaveURL(/\/player\/(dashboard|onboarding)/);
  });
});
