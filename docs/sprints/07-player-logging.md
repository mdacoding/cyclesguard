# Sprint 7: Player Logging Completeness (P1)

**Priorität:** P1 — Datenqualität für Ampel & Adherence  
**Ziel:** Schema und UI auf denselben Stand bringen; Logging in <30 Sekunden.

---

## CTO Evaluation & Architektur-Entscheidung

`cycle_logs` kennt `symptoms` (JSONB) und `notes` — das Formular sendet immer `symptoms: []` und keine Notes. Die Ampel nutzt nur Phase + Energy. Für den Pilot verbessert vollständigeres Logging:

1. bessere Menstruations-Ampel (Energy bleibt führend)
2. spätere Insights (Sprint 11) ohne Schema-Bruch
3. höhere wahrgenommene „medizinische Seriosität“ bei Spielerinnen

**Constraint:** Trainer-API bleibt maskiert — Symptome/Notes fließen **niemals** an Trainer-Clients.

---

## User Review Required

> [!IMPORTANT]
> **Symptom-Katalog:** Welche Symptome sind für Fußball relevant (Krämpfe, Müdigkeit, Kopfschmerz, Stimmung, …)? Max. 8 Chips, sonst sinkt Completion Rate.

---

## Proposed Changes

### 1. Logging UX

#### [MODIFY] `CycleLogForm.tsx`
- Symptom-Chips (multi-select, max 8)
- Optionales Notizfeld (max 500, bereits Zod)
- Energy + Phase bleiben Pflichtkern

#### [NEW] `lib/symptoms.ts`
- Kanonische DE-Labels + Keys für Analytics

### 2. Kalender / Historie

#### [NEW] `app/player/history/page.tsx` (oder Dashboard-Section)
- 28-Tage-Kalender mit Phasenfarben (nur für die Spielerin)
- Tap → Log-Detail (eigene Daten)

#### [MODIFY] `RecentLogsCard.tsx`
- Symptome kompakt anzeigen

### 3. Ampel-Feinjustierung (optional, hinter Flag)

#### [MODIFY] `lib/trainer-status.ts`
- Menstruation: Energy 1 → REST, 2 → REST, 3–4 → MODIFIED, 5 → MODIFIED  
  (Status quo beibehalten; nur dokumentieren / mit Athletiktrainer abstimmen)

### 4. A11y / Mobile

- `maximumScale: 1` in `layout.tsx` entfernen oder lockern (Accessibility)
- Große Tap-Targets für Kabinen-Nutzung (Handschuhe/Stress)

---

## Priorität innerhalb des Sprints

| # | Element | Warum |
|---|---------|-------|
| 1 | Symptome + Notes im Form | Schema nutzen |
| 2 | History/Kalender | Retention |
| 3 | A11y Viewport | Compliance/Usability |
| 4 | Ampel-Feintuning | Nur nach Trainer-Review |

---

## Verification Plan

- Log mit 3 Symptomen + Note → Export enthält Felder
- Trainer-Dashboard Response enthält weiterhin keine Symptome/Notes
- Formular auf iPhone SE-Breite ohne Horizontal-Scroll nutzbar
