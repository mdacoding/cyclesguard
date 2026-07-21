# Sprint 11: Trainer Load Insights — aggregiert (P2)

**Priorität:** P2 — Mehrwert für Athletiktrainer ohne Privacy-Bruch  
**Ziel:** Zusätzliche Trainingssteuerung auf Basis von Session-Aggregaten + Ampel — weiterhin **keine** medizinischen Rohdaten.

---

## CTO Evaluation & Architektur-Entscheidung

Sprint 3/4 Ampel = Zyklus-abgeleitetes Readiness-Signal.  
Sprint 8 Summaries = GPS/HR-Aggregate pro Spielerin.

**Sprint 11 kombiniert beides serverseitig** zu coach-sicheren Flags:

| Signal | Bedeutung | Quelle |
|--------|-----------|--------|
| `FIT` / `MODIFIED` / `REST` | Readiness | Cycle → maskiert |
| `LOAD_HIGH` | Ungewöhnlich hohe Last letzte 7 Tage | Session summaries |
| `DATA_STALE` | Kein Log > 48h | Cycle log timestamp (nur Alter, nicht Phase) |

Trainer-UI zeigt z. B.:

> „Angepasstes Training · Hohe Last (7d) · Sprungkraft reduzieren“

**Niemals:** Phase, Symptome, Notes, GPS-Koordinaten, HF-Kurve im Trainer-Client.

---

## User Review Required

> [!IMPORTANT]
> **Schwellen für LOAD_HIGH:** Welches Metrik-Set (Player Load, Distanz, HI-Distanz, SRPE)? Mit Athletiktrainer kalibrieren, bevor Defaults live gehen.

---

## Proposed Changes

### 1. Aggregation Engine

#### [NEW] `lib/trainer-insights.ts`
- Input: readiness status + session aggregates
- Output: `{ status, loadFlag, recommendation }` — reine Enums/Texte

#### [MODIFY] `app/api/trainer/team-status/route.ts`
- Reichert Response um `loadFlag?: 'NORMAL' | 'HIGH' | 'UNKNOWN'` an
- Keine Rohzahlen zwingend nötig; optional `loadPercentile` (0–100) wenn Trainer das will — **keine** absoluten HF-Werte

### 2. UI

#### [MODIFY] `app/trainer/dashboard/page.tsx`
- Zweite Spalte / Badge für Load
- Sortierung: REST zuerst, dann MODIFIED+HIGH_LOAD, dann FIT
- Wochen-Trend (nur Counts: wie viele FIT/MODIFIED/REST) — bereits teilweise vorhanden, erweitern

### 3. Guardrails

- Contract-Test: Response-Schema allowlist (Zod) — unbekannte Felder verbieten in Tests
- Security-Test: Trainer JWT darf `cycle_logs` select nicht

---

## Priorität innerhalb des Sprints

| # | Element | Warum |
|---|---------|-------|
| 1 | Insights-Mapper + API-Felder | Produktkern |
| 2 | Dashboard Sort/Badges | Usability Kabine/Platz |
| 3 | Schema-Allowlist Tests | Privacy-Regression |
| 4 | Schwellen-Config | Kalibrierung |

---

## Verification Plan

- Response JSON Schema enthält nur allowlistete Keys
- Spielerin mit Ovulation + hoher Last → `MODIFIED_TRAINING` + `LOAD_HIGH`, Empfehlung ohne Zykluswortlaut
- Direkter Supabase-Client als Trainer auf `cycle_logs` → Fehler
