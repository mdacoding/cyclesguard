# Ingestion Deploy (GPS bridge) — Soft-Pilot / Club Product

**Wann:** Erst wenn der Club den Tracker nennt (Catapult / STATSports / Polar / Custom).  
**Bis dahin:** Frontend läuft ohne `INGESTION_*` Env — Cron no-opt, Athlete-Links bleiben in Supabase.

Live Frontend: https://cyclesguard.vercel.app  
Service: `cyclesguard-ingestion/` (Spring Boot 3.3, Java 21)

---

## 1. Host (EU)

Beliebig Docker-fähig in der EU, z. B. Railway / Fly.io / Hetzner VPS.

```bash
cd cyclesguard-ingestion
docker compose up -d --build
# Health: GET /actuator/health
```

Oder Image aus `Dockerfile` auf eigene Postgres zeigen.

---

## 2. Env (Ingestion)

| Variable | Zweck |
|----------|--------|
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | Postgres für Outbox + Registry |
| `WEBHOOK_SECRET` | HMAC für Wearable-Webhook |
| `MANAGEMENT_API_KEY` | Frontend ↔ Ingestion (`X-Management-Key`) |
| `FRONTEND_ORIGIN` | CORS / Allowlist für Management-Calls |

Rotate secrets vor Echtdaten (wie Pilot-Runbook).

---

## 3. Vercel (Frontend)

| Variable | Wert |
|----------|------|
| `INGESTION_BASE_URL` | `https://<ingestion-host>` (ohne trailing slash) |
| `INGESTION_MANAGEMENT_KEY` | gleicher Wert wie `MANAGEMENT_API_KEY` |

Cron `session-summaries` läuft täglich und zieht die letzten **26h** Aggregate → `session_summaries`.

---

## 4. Identity mapping

1. Club Admin → Roster → **Athlete-Link**: User-UUID + Provider + External Athlete ID  
2. API synced Registry an Ingestion (wenn Env gesetzt)  
3. Bis ein Provider-Adapter existiert: Webhook-Payloads müssen **`playerId` = Supabase User UUID** senden  

Trainer sehen nur Load-Flags über `/api/trainer/team-status` — nie Koordinaten.

---

## 5. Smoke checklist

- [ ] `/actuator/health` = UP  
- [ ] Webhook mit gültigem HMAC → 202  
- [ ] Athlete-Link speichern → Registry-Log OK  
- [ ] Cron `session-summaries` mit Bearer `CRON_SECRET` → `synced > 0` nach Test-Session  
- [ ] Player Dashboard zeigt „Letzte Einheit“  
- [ ] Account-Delete löscht GPS via Management API (fail closed wenn Ingestion konfiguriert — siehe delete-account)

---

## 6. Nicht jetzt

Provider-spezifische SDKs, ML-Risk-Modelle, Multi-Region — nach Pilot-Proof.
