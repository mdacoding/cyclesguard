# Sprint 6: Push Delivery — Cron & VAPID Send (P0)

**Priorität:** P0 (Soft Gate) — stark empfohlen für Adherence im Pilot  
**Ziel:** Tägliche Reminder wirklich zustellen; Foundation aus Sprint 3 nutzen.

---

## CTO Evaluation & Architektur-Entscheidung

Vorhanden: `push_subscriptions`, Subscribe-API, SW `push`/`notificationclick`, VAPID Public Key.  
Fehlt: Versand mit `VAPID_PRIVATE_KEY`, Scheduling, Cleanup toter Endpoints.

**Lösung:** Geschützter Cron-Endpoint (Vercel Cron oder Supabase Edge + pg_cron):

```
Cron (täglich 07:30 Europe/Berlin)
  → lädt Subscriptions (service_role)
  → web-push send
  → 410 Gone → Subscription löschen
```

Payload bleibt **generic** („Readiness für heute erfassen“) — keine Phasen/Symptome in Push-Texten (DSGVO + iOS Preview-Leak).

---

## User Review Required

> [!IMPORTANT]
> **Uhrzeit & Frequenz:** 07:30 vor Trainingseinheiten? Opt-out pro Wochentag?  
> Vorschlag Pilot: 1× täglich, fest 07:30, global abschaltbar in Settings (bereits vorhanden).

---

## Proposed Changes

### 1. Dependencies & Env

#### [MODIFY] `package.json`
- `web-push` hinzufügen

#### [MODIFY] `.env.example`
- `CRON_SECRET` für Endpoint-Auth dokumentieren

### 2. Send-Pipeline

#### [NEW] `lib/push/send.ts`
- Wrapper um `web-push` mit VAPID keys
- Fehlerbehandlung: 404/410 → DELETE Subscription

#### [NEW] `app/api/cron/daily-reminders/route.ts`
- Auth: `Authorization: Bearer ${CRON_SECRET}`
- Nur Spielerinnen mit aktiver Subscription
- Optional: Skip wenn heute bereits geloggt

#### [MODIFY] `vercel.json`
- Cron Schedule: `30 5 * * *` (UTC = 07:30 Berlin Sommerzeit beachten → besser `0 6 * * *` + TZ-Doku)

### 3. Settings UX

#### [MODIFY] `app/player/settings/page.tsx`
- Hinweis „Erinnerung täglich ca. 07:30“
- Status: letzte erfolgreiche Subscription / Permission denied

### 4. Observability (minimal)

- Structured Log: `sent`, `failed`, `pruned` Counts
- Kein Payload-Inhalt in Logs

---

## Priorität innerhalb des Sprints

| # | Element | Warum |
|---|---------|-------|
| 1 | `web-push` Send + Cron Route | Reminder funktionieren |
| 2 | Dead-endpoint Cleanup | DB-Hygiene |
| 3 | Skip-if-logged-today | Weniger Noise |
| 4 | Settings Copy | Erwartung managen |

---

## Verification Plan

- Lokaler Curl mit `CRON_SECRET` → Notification auf Homescreen-PWA (iOS 16.4+ / Android Chrome)
- Ungültigen Endpoint manuell → wird aus `push_subscriptions` entfernt
- Push-Body enthält keine Wörter wie Menstruation/Zyklus/Phase
