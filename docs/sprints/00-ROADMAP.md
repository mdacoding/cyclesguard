# CyclesGuard — Implementation Plan: Pitch → Pilot → SaaS

**Stand:** 22.07.2026 · **Pitch fertig · Soft-Pilot Hardening (Strang A+B)**  
**Live:** https://cyclesguard.vercel.app  
**Repo:** https://github.com/mdacoding/cyclesguard  

```
Pitch-Ready ✅  →  Termin anfragen  →  Soft-Pilot (48h-ready)  →  Paid SaaS
                     ↑ Founder        ↑ Code/Docs jetzt
```

---

## CTO-Urteil

Produkt ist **präsentierfertig**. Parallel zur Outreach-Wartezeit: **Soft-Pilot in 48h startbar** (Invite gehärtet, Runbook, Push-Setup, AVV-Entwurf, CI/E2E/Sentry-Hook).

| Frage | Antwort |
|-------|---------|
| SaaS für den Pitch fertig? | **Ja** |
| Soft-Pilot technisch vorbereitet? | **Ja** (Runbook + Invite + Push-Docs) |
| Saison-Produktiv ohne AVV? | **Nein** — AVV-Entwurf liegt, Unterschrift mit DSB |

---

## Erledigt (Produkt + Pitch + Wartezeit A/B)

| Item | Status |
|------|--------|
| App A+B, Ampel, Offline, Admin, Logout | ✅ |
| Supabase + Migrationen + Seed + Vercel | ✅ |
| Pitch-Docs + Outreach | ✅ |
| Invite: Neu + bestehende User → Roster | ✅ |
| Auth-Callback finalisiert Membership + Consent-Routing | ✅ |
| Pilot-Runbook, Push-Live, AVV/TOM-Entwurf, RLS-Checkliste | ✅ |
| CI: lint + unit tests + build + public E2E | ✅ |
| Sentry optional (DSN Env) | ✅ |

---

## Founder jetzt (&lt;30 Min.)

1. [`docs/pitch/TERMIN-BEREIT.md`](../pitch/TERMIN-BEREIT.md) — Auth-URLs  
2. [`docs/pitch/OUTREACH.md`](../pitch/OUTREACH.md) — LinkedIn  
3. Optional: Vercel Env gegen `npm run pitch:env-checklist` prüfen  

---

## Nach Club-„Ja“ (48h)

Siehe **[`docs/pitch/PILOT-RUNBOOK.md`](../pitch/PILOT-RUNBOOK.md)**.

1. Secrets rotieren, `NEXT_PUBLIC_DEMO_MODE=false`  
2. Echte Roster per Trainer-Invite  
3. Push Live (`PUSH-LIVE.md`)  
4. AVV mit DSB finalisieren (`docs/privacy/AVV-TOM-DRAFT.md`)  
5. RLS-Checkliste abhaken  

---

## Noch offen (nicht blockierend)

| Item | Wann |
|------|------|
| Ingestion deploy + GPS live | Wenn Club Tracker nennt — siehe [`INGESTION-DEPLOY.md`](../pitch/INGESTION-DEPLOY.md) |
| Custom Domain | Nach Pilot-Zusage |
| Billing / Multi-Tenant | Nach 2. Club / Saisonvertrag |
| Sentry DSN in Vercel setzen | Empfohlen vor Echtdaten — siehe [`SENTRY-LIVE.md`](../pitch/SENTRY-LIVE.md) |
| E2E mit Credentials in CI Secrets | Job `e2e-credentialed` bereit — Secrets setzen |
| Migration `010` in Supabase anwenden | ✅ Live via MCP (`seasons_and_push_last_seen`) |
| Migration `011` team status | Anwenden + Seed |

---

## Club Product Fortschritt (Wartezeit A–E)

| Strang | Status |
|--------|--------|
| A Club-Admin Invite / Saison / Audit CSV | ✅ Code |
| B Player History Insights / Reminder UX | ✅ Code |
| C Retention `last_seen_at` + Cron-Auth Tests | ✅ Code |
| D Landing Marketing | ✅ Code |
| E GPS Lookback 26h + Deploy-Doc + Session-Card | ✅ Code |

## Club Product Ops (1→7)

| # | Item | Status |
|---|------|--------|
| 1 | Seed club_admin + Saison | ✅ Code |
| 2 | Bulk CSV Invite | ✅ Code |
| 3 | Team rename / archive | ✅ Code |
| 4 | Platform Club-Admin zuweisen | ✅ Code |
| 5 | Credentialed E2E CI job | ✅ Code |
| 6 | Sentry Live Doc | ✅ Docs |
| 7 | Demo session_summaries Seed | ✅ Code |

---

## Schnellzugriff

| Doc | Zweck |
|-----|--------|
| [TERMIN-BEREIT.md](../pitch/TERMIN-BEREIT.md) | Pitch-Abhak-Liste |
| [OUTREACH.md](../pitch/OUTREACH.md) | An wen schreiben |
| [PILOT-RUNBOOK.md](../pitch/PILOT-RUNBOOK.md) | Soft-Pilot Start |
| [PUSH-LIVE.md](../pitch/PUSH-LIVE.md) | Reminder live |
| [PRODUCT-BRIEF.md](../pitch/PRODUCT-BRIEF.md) | 1-Seiten-Brief |
| [INGESTION-DEPLOY.md](../pitch/INGESTION-DEPLOY.md) | GPS Ingestion hosten |
