# CyclesGuard — Implementation Plan: Eintracht Frankfurt Pitch & Pilot

**Stand:** 21.07.2026  
**Ziel jetzt:** Eintracht Frankfurt Frauen **überzeugen**, kostenlos zu testen und das Produkt gemeinsam zu schärfen.  
**Nicht-Ziel jetzt:** Marktfertigkeit, Billing, Multi-Club-Scale, Wearable-ML.

```
Fertig (A+B)  →  Pitch-Ready (P0)  →  Soft-Pilot  →  Markt (später, mit Club)
     ✅              ← hier            nach Ja         bedingt Kooperation
```

---

## Aktueller Stand (Fakten)

| Bereich | Status |
|---------|--------|
| Product A+B (UX, Ampel, Offline, Admin) | ✅ Code + Build grün |
| Supabase Cloud `jgtqtuwtrulwehrtcydf` | ✅ Projekt live (Frankfurt) |
| Migrationen `001`–`008` | ✅ `supabase db push` durch |
| Demo-Seed Eintracht Frauen | ✅ `npm run seed:eintracht` OK |
| Pitch-Materialien (Skript, Datenschutz, Angebot) | ✅ `docs/pitch/` |
| UUID-Fix (`gen_random_uuid`) | ✅ Cloud-kompatibel |
| Migration `009` (consent unique) | ✅ applied |
| **Vercel-Deploy (öffentliche Demo-URL)** | ⬜ **nächster Blocker** |
| Push live / Domains / AVV | ⬜ P1 nach Pitch-Interesse |

**Demo-Accounts** (Passwort `CyclesGuard2026!`): siehe `docs/pitch/DEMO-ACCOUNTS.md`.

---

## Zeitliche Antwort

| Meilenstein | Dauer | Was der Club sieht |
|-------------|-------|-------------------|
| **Pitch-Ready** | **noch 1–3 Tage** (nur Vercel + Probe) | Live-URL, Ampel-Demo, Datenschutz, Pilotangebot |
| **Soft-Pilot startklar** | **+1–2 Wochen** nach Pitch-Zusage | Prod-Härte, Onboarding, Feedback-Rhythmus |
| **Marktfertig** | **später (2–4 Monate)** | Nur wenn Kooperation läuft |

---

## P0 — Must vor dem Pitch

| # | Arbeit | Status |
|---|--------|--------|
| P0.1 | Gehostete Demo (Vercel + Supabase Cloud) | 🟡 Supabase ✅ · **Vercel offen** |
| P0.2 | Migrationen auf Demo-DB | ✅ `001`–`008` applied |
| P0.3 | Seed „Eintracht Frauen“ | ✅ |
| P0.4 | Pitch-Skript + 5-Min-Demo-Flow | ✅ `DEMO-SCRIPT.md` |
| P0.5 | 1-Pager Datenschutz / DOSB | ✅ |
| P0.6 | Pilotangebot schriftlich | ✅ |

### Sofort nächste Schritte (P0 abschließen)

1. Vercel: Root `cyclesguard-frontend`, Env aus `.env.local` + `NEXT_PUBLIC_DEMO_MODE=true`  
2. Supabase Auth: Site URL + Redirect `https://<vercel>/auth/callback`  
3. `npm run pitch:smoke -- https://<vercel-url>` + Demo einmal durchspielen  
4. Termin bei Eintracht anfragen  

Details: `docs/pitch/DEPLOY.md`, `docs/pitch/SUPABASE-SETUP.md`.

---

## P1 — Should vor Soft-Pilot (nach Interesse)

| # | Arbeit | Status |
|---|--------|--------|
| P1.1 | Prod-Env härten (Secrets, Domain, Monitoring) | ⬜ |
| P1.2 | Trainer-Onboarding 1 Seite | ✅ `TRAINER-ONBOARDING.md` |
| P1.3 | Push-Reminder live (VAPID + Cron auf Vercel) | ⬜ (Keys lokal vorhanden) |
| P1.4 | Feedback-Kanal / wöchentlicher Call | ✅ `PILOT-FEEDBACK.md` |

---

## P2 — Später mit Club

GPS/Wearable, Durable Queue Ops, Billing, Multi-Club-SaaS, ML/ACL, Bulk-CSV, perfektes Offline-Sync.

---

## Was Eintracht überzeugt (Pitch-Kern)

1. Privacy-by-Design / DOSB — nur Ampel, keine Rohdaten  
2. Sofort nutzbar — Log &lt;30s, Trainer steuert Belastung  
3. Kabine — PWA/Offline-Story  
4. 8–12 Wochen kostenlos + Feedback  
5. Klare Grenzen — GPS optional im Pilot  

---

## CTO Guardrails

1. Trainer sieht nur `FIT / MODIFIED_TRAINING / REST / NO_DATA` (+ Load)  
2. Keine Phasen-/Symptom-/Notiz-Leaks im Trainer-UI  
3. Pilot = freiwillig, Opt-out/Löschung jederzeit  
4. Keine Heilversprechen („Trainingssteuerung“, keine Diagnose)  

---

## Nächster Ausführungsschritt

**P0.1 fertigstellen:** Vercel-Deploy + Smoke-Test → dann Pitch-Termin.  
Alles andere für den Termin ist vorbereitet.
