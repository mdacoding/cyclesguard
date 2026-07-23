# Sentry Live — Soft-Pilot Observability

Code ist verdrahtet (`sentry.*.config.ts`, `instrumentation.ts`, `withSentryConfig`, `lib/sentry-strip.ts`).  
Ohne DSN in Vercel bleiben Events stumm.

**Unit:** `npm test` — `lib/sentry-strip.test.ts` beweist Strip von `phase` / `symptoms` / Request-Bodies.

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
3. Prüfen: Request-Bodies / Health-Felder (`phase`, `symptoms`) werden per `beforeSend` / `stripSentryEventHealth` gestrippt  

---

## 4. Vor Echtdaten

- [x] DSN in Production gesetzt (GO-LIVE A1, 23.07.2026)
- [x] Strip-Logic unit-getestet (`sentry-strip.test.ts`)
- [ ] Ein Test-Event sichtbar (Founder: einmal Smoke in Sentry UI)
- [x] Keine Zyklus-Rohdaten in Event-Payloads (Code + Unit)

Roadmap: empfohlen vor Soft-Pilot mit echten Spielerinnen.
