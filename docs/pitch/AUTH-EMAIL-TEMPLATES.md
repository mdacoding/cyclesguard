# Auth E-Mail Templates — Soft-Pilot (Supabase Dashboard)

**Zweck:** Club-taugliche DE-Texte ohne medizinische / Zyklus-Wörter.  
**Wo:** Supabase → Authentication → Email Templates  
**Stand:** 24.07.2026

Redirects müssen zu `NEXT_PUBLIC_SITE_URL` passen — siehe [`TERMIN-BEREIT.md`](./TERMIN-BEREIT.md) §1 und [`SUPABASE-SETUP.md`](./SUPABASE-SETUP.md).

Code-Pfad Invite/Setup: `lib/auth-password-email.ts` · `inviteCallbackRedirect` → `/auth/callback` → `/auth/set-password`.

---

## Guardrails (Copy)

- Keine Wörter: Periode, Zyklus, Menstruation, Symptome, Eisprung, Diagnose  
- Ton: klar, ruhig, Vereins-Alltag  
- CTA: Passwort setzen / Anmelden — keine Ampel-Erklärungen in der Mail

---

## 1. Invite User (Spielerinnen / Trainer)

**Subject:** CyclesGuard — Einladung Soft-Pilot

```
Hallo,

du wurdest zu CyclesGuard eingeladen (Soft-Pilot deines Vereins).

CyclesGuard hilft Athletik, Belastung besser zu steuern — deine privaten
Angaben bleiben bei dir. Trainer:innen sehen nur Ampel-Signale, keine Intimdaten.

Passwort festlegen:
{{ .ConfirmationURL }}

Danach: kurze Einwilligung → fertig.

Fragen? hello@cyclesguard.de

CyclesGuard
```

---

## 2. Reset Password / Magic Link (Forgot Password)

**Subject:** CyclesGuard — Passwort zurücksetzen

```
Hallo,

du hast ein neues Passwort für CyclesGuard angefordert.

Link (gültig für kurze Zeit):
{{ .ConfirmationURL }}

Falls du das nicht warst: E-Mail ignorieren.

CyclesGuard · hello@cyclesguard.de
```

---

## 3. Confirm Signup (falls aktiv)

**Subject:** CyclesGuard — E-Mail bestätigen

```
Hallo,

bitte bestätige deine E-Mail für CyclesGuard:
{{ .ConfirmationURL }}

CyclesGuard · hello@cyclesguard.de
```

---

## Check nach Speichern

| Check | Done |
|-------|------|
| Site URL + Redirects gesetzt | ☐ Founder |
| Invite-Mail einmal an eigene Adresse testen | ☐ |
| Link landet auf `/auth/set-password` (nicht Login-Loop) | ☐ |
| Keine medizinischen Wörter in Templates | ☐ |

Nach Club-Ja: Demo-Passwort nie an echte Spielerinnen — nur Invite-Flow.
