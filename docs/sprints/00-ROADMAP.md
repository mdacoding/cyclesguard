# CyclesGuard — Implementation Plan: Pitch → Pilot → SaaS

**Stand:** 21.07.2026  
**Repo:** https://github.com/mdacoding/cyclesguard (`main` synced)  
**Ziel jetzt:** Eintracht Frankfurt Frauen **überzeugen** (Live-Demo + Pilotangebot).  
**Produktziel:** Privacy-first Club-SaaS (siehe [`docs/product/SAAS-PLAN.md`](../product/SAAS-PLAN.md)).

```
Code A+B ✅ → Cloud DB ✅ → GitHub ✅ → Vercel ⬜ → Pitch → Soft-Pilot → Paid SaaS
                                              ↑
                                         nächster CTO-Schritt
```

---

## CTO-Lagebild (Fakten)

| Bereich | Status |
|---------|--------|
| Product A+B (UX, Ampel, Offline, Admin) | ✅ Build + Tests grün |
| Supabase Cloud `jgtqtuwtrulwehrtcydf` | ✅ Frankfurt |
| Migrationen `001`–`009` | ✅ applied |
| Demo-Seed Eintracht Frauen | ✅ |
| Pitch-Materialien | ✅ `docs/pitch/` |
| GitHub `mdacoding/cyclesguard` | ✅ `origin/main` |
| CI Workflow | ✅ `.github/workflows/ci.yml` |
| **Vercel Production URL** | ⬜ **einziger P0-Blocker** |
| Soft-Pilot Ops (Domain, Push live, AVV) | ⬜ P1 nach Club-Interesse |

**Demo-Accounts:** `docs/pitch/DEMO-ACCOUNTS.md` (Passwort `CyclesGuard2026!`).

---

## Zeitliche Antwort

| Meilenstein | Dauer ab heute | Deliverable |
|-------------|----------------|-------------|
| **Pitch-Ready** | **0–2 Tage** | Vercel-URL + Smoke + Demo-Probe |
| **Pitch-Termin** | nach URL | Eintracht Termin anfragen |
| **Soft-Pilot startklar** | +1–2 Wochen nach Ja | Prod-Härte, Feedback-Rhythmus |
| **Paid Club Product** | nach erfolgreichem Pilot | Vertrag, Support, optional GPS |
| **Multi-Tenant SaaS** | 2–4 Monate nach Product-Market | Billing, Self-serve |

---

## P0 — Must vor dem Pitch

| # | Arbeit | Status |
|---|--------|--------|
| P0.1 | Gehostete Demo (Vercel + Supabase) | 🟡 DB ✅ · **Vercel offen** |
| P0.2 | Migrationen Demo-DB | ✅ `001`–`009` |
| P0.3 | Seed Eintracht Frauen | ✅ |
| P0.4 | Pitch-Skript | ✅ |
| P0.5 | Datenschutz 1-Pager | ✅ |
| P0.6 | Pilotangebot | ✅ |
| P0.7 | Code auf GitHub | ✅ |

### Sofort nächste Schritte (P0 abschließen)

1. **Vercel** → New Project → Import `mdacoding/cyclesguard`  
   - Root Directory: **`cyclesguard-frontend`**  
   - Region: Frankfurt (`fra1` in `vercel.json`)  
2. Env aus lokalem `.env.local` übernehmen + `NEXT_PUBLIC_DEMO_MODE=true`  
   - **Pflicht:** `SUPABASE_SERVICE_ROLE_KEY` (sonst leere Trainer-Ampel)  
3. Supabase Auth: Site URL + Redirect `https://<vercel>/auth/callback`  
4. `NEXT_PUBLIC_SITE_URL` auf Vercel-URL setzen, Redeploy  
5. `npm run pitch:smoke -- https://<vercel-url>` + Demo einmal üben  
6. **Security:** Secret Key rotieren, falls er in Chats/Logs stand  
7. Termin bei Eintracht anfragen  

Anleitung: [`docs/pitch/DEPLOY.md`](../pitch/DEPLOY.md).

---

## P1 — Soft-Pilot (nach Interesse)

| # | Arbeit | Status |
|---|--------|--------|
| P1.1 | Prod härten (Secrets rotiert, Domain, Monitoring) | ⬜ |
| P1.2 | Trainer-Onboarding | ✅ Doc |
| P1.3 | Push-Reminder live | ⬜ Keys lokal da |
| P1.4 | Feedback-Rhythmus | ✅ Doc |
| P1.5 | AVV / TOM mit Vereins-DSB | ⬜ |

---

## P2 — Club Product / SaaS Scale (bewusst später)

Billing, Multi-Club, GPS live ops, ML, Bulk-CSV, perfektes Offline-Sync — siehe [`SAAS-PLAN.md`](../product/SAAS-PLAN.md) Stages C–D.

---

## Pitch-Kern (unverändert)

1. Privacy-by-Design / DOSB — nur Ampel  
2. Log &lt;30s, Trainer steuert Belastung  
3. Kabine — PWA/Offline  
4. 8–12 Wochen kostenlos + Feedback  
5. GPS optional, ehrlich kommuniziert  

---

## CTO Guardrails

1. Trainer: nur `FIT / MODIFIED_TRAINING / REST / NO_DATA` (+ Load)  
2. Keine Phasen-/Symptom-/Notiz-Leaks  
3. Pilot freiwillig, Export/Löschung jederzeit  
4. Keine Heilversprechen  

---

## Nächster Ausführungsschritt

**Heute/morgen:** Vercel aus GitHub deployen → Smoke → Demo üben → Termin.  
Produktstrategie und Stage-Gates: [`docs/product/SAAS-PLAN.md`](../product/SAAS-PLAN.md).
