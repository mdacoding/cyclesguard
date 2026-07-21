# Sprint 5: Offline-Sync für Cycle Logs (P0)

**Priorität:** P0 — Hard Gate für Kabinen-/Stadion-Einsatz  
**Ziel:** Spielerin kann offline loggen; Sync erfolgt automatisch bei Netz.

---

## CTO Evaluation & Architektur-Entscheidung

Sprint 3 liefert Service Worker + `/~offline`, aber `CycleLogForm` postet synchron an `/api/player/log`. Ohne Netz → Fehler. Die Offline-Seite behauptet Sync — das muss Wahrheit werden.

**Lösung:** Client-seitige Outbox (IndexedDB) + Background Sync / Replay:

```
UI → Outbox (IndexedDB) → [online] → POST /api/player/log → mark synced
```

Idempotenz über client-generierte `client_log_id` (UUID), damit Retries keine Duplikate erzeugen.

---

## User Review Required

> [!IMPORTANT]
> **Konfliktstrategie:** Wenn zwei Geräte denselben Tag loggen — letzter Schreib gewinnt, oder ein Log pro Tag erzwingen?  
> Vorschlag: **ein Log pro Kalendertag pro User** (Upsert auf `(user_id, logged_at::date)`).

---

## Proposed Changes

### 1. Schema

#### [NEW] `supabase/migrations/005_cycle_log_idempotency.sql`
- Spalte `client_log_id UUID UNIQUE` (nullable für Alt-Daten)
- Optional: Unique Index auf `(user_id, (logged_at AT TIME ZONE 'Europe/Berlin')::date)`

### 2. Client Outbox

#### [NEW] `lib/offline/outbox.ts`
- IndexedDB Store `pending_cycle_logs`
- `enqueueLog()`, `listPending()`, `markSynced()`, `flushOutbox()`

#### [MODIFY] `app/player/dashboard/components/CycleLogForm.tsx`
- Immer zuerst Outbox schreiben
- Optimistic UI („Gespeichert — Sync ausstehend“)
- Bei Online: sofort flushen

#### [MODIFY] `app/sw.ts`
- `sync` Event (Background Sync) oder periodischer Client-Flush bei `online`
- Keine medizinischen Daten länger als nötig im SW-Cache halten (nur Outbox IndexedDB)

### 3. API

#### [MODIFY] `app/api/player/log/route.ts`
- Akzeptiert `clientLogId`
- Upsert/Ignore bei Duplikat → 200/201 idempotent

### 4. UX

#### [MODIFY] `app/~offline/page.tsx`
- Zeigt Anzahl ausstehender Logs
- CTA „Erneut versuchen“ triggert Flush

#### [NEW] Offline-Banner im Dashboard
- „Offline — Einträge werden synchronisiert, sobald Netz da ist“

---

## Priorität innerhalb des Sprints

| # | Element | Warum |
|---|---------|-------|
| 1 | Outbox + Form-Integration | Kernverhalten |
| 2 | Idempotente API | Keine Doppel-Logs |
| 3 | Online-Flush + Banner | Vertrauen der Spielerin |
| 4 | Background Sync | Nice, wenn Browser unterstützt |

---

## Verification Plan

- Chrome DevTools → Network Offline → Log speichern → Eintrag lokal sichtbar
- Online schalten → Request an `/api/player/log` → DB-Zeile vorhanden, Outbox leer
- Doppelter Flush mit gleicher `client_log_id` → genau ein DB-Eintrag
