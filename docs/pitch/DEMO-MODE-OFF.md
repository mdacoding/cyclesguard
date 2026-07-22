# CyclesGuard — Demo-Mode Off / Secrets (Pre-Paid & Soft-Pilot)

**Stand:** 22.07.2026  
**Wann:** Nach Club-„Ja“, vor echten Freiwilligen oder Paid Season.  
**Siehe auch:** [`PILOT-RUNBOOK.md`](./PILOT-RUNBOOK.md) · [`GO-LIVE.md`](./GO-LIVE.md)

Kein Stripe nötig — nur Ops-Hygiene.

---

## 1. Secrets rotieren

| Secret | Aktion |
|--------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Nur in Vercel Server Env — nie Client |
| `CRON_SECRET` | Neu generieren wenn geleakt / nach Pitch-Sharing |
| `VAPID_PRIVATE_KEY` | Unverändert lassen wenn Push schon live; sonst neu + Redeploy |
| Ingestion HMAC (falls GPS) | Club-spezifisch rotieren |

---

## 2. Demo vs. Production

| Check | Done |
|-------|------|
| Demo-Accounts nur intern (`DEMO-ACCOUNTS.md` nicht an Club) | ☐ |
| Seed-Skript nicht gegen Prod mit echten Spielerinnen laufen lassen | ☐ |
| Landing / Soft-Pilot CTA zeigt Support-Pfad | ☐ |
| Club-Admin Dry-Run mit **Club**-Konto, nicht nur Platform | ☐ |

---

## 3. Nach Soft-Pilot → Paid

| Check | Done |
|-------|------|
| Saison commercial `signed` / `active_paid` + Fee/Ref | ☐ |
| Club Billing Email / Legal Name gesetzt (Admin → Saison) | ☐ |
| AVV unterschrieben | ☐ |
| Sentry Events in Prod sichtbar | ☐ |

Owner: Founder · Datum: _______
