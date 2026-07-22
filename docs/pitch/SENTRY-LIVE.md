# Sentry Live — Soft-Pilot Observability

Code ist verdrahtet (`sentry.*.config.ts`, `instrumentation.ts`, `withSentryConfig`).  
Ohne DSN in Vercel bleiben Events stumm.

---

## 1. DSN anlegen

1. [Sentry](https://sentry.io) → Project (Next.js)  
2. Client Keys (DSN) kopieren  

---

## 2. Vercel Env (Production)

| Variable | Wert |
|----------|------|
| `NEXT_PUBLIC_SENTRY_DSN` | gleicher DSN |
| `SENTRY_DSN` | gleicher DSN |
| `SENTRY_AUTH_TOKEN` | optional — Source Maps Upload |

Danach **Redeploy**.

Lokal prüfen:

```powershell
cd cyclesguard-frontend
npm run pitch:env-checklist
```

`NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` sollten nicht mehr „not set“ sein.

---

## 3. Smoke

1. Eingeloggt eine geschützte Route öffnen  
2. Optional: temporär `throw new Error('sentry-smoke')` in einer Server-Route → Event in Sentry  
3. Prüfen: Request-Bodies / Health-Felder (`phase`, `symptoms`) werden per `beforeSend` gestrippt  

---

## 4. Vor Echtdaten

- [ ] DSN in Production gesetzt  
- [ ] Ein Test-Event sichtbar  
- [ ] Keine Zyklus-Rohdaten in Event-Payloads  

Roadmap: empfohlen vor Soft-Pilot mit echten Spielerinnen.
