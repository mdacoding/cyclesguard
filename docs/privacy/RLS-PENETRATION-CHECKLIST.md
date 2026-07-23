# RLS / Privacy Penetration Checklist

**Zweck:** Vor Soft-Pilot manuell verifizieren, dass Trainer keine Art.-9-Rohdaten sehen.  
**Stand:** Code-Pfad Ampel = `service_role` + Masking in `/api/trainer/team-status` + RLS DENY für Client-Rollen.

---

## A. Automatisierbar (CI)

- [x] Unit-Tests: Empfehlungstexte ohne Menstru-/Zyklus-Wörter (`lib/trainer-status.test.ts`)
- [x] Playwright Smoke (mit Demo-Credentials): Trainer-Response ohne `phase`/`symptoms` (`e2e/smoke.spec.ts` + CI `e2e-credentialed`)
- [x] **Echter Trainer-JWT Dry-Run** — `npm run verify:rls-trainer` (`scripts/rls-trainer-check.mjs`) meldet sich als Trainer per Passwort an (Anon-Key, kein Service-Role) und fragt `cycle_logs`, `player_consents`, `push_subscriptions`, `session_summaries` direkt per PostgREST ab. Erwartung: 0 Zeilen / Denial. Positive Control: `team_members` liefert Roster. CI-Job `rls-trainer-check` (gated auf `E2E_TRAINER_EMAIL/PASSWORD` Secrets).
- [x] Fixture-Hinweise: `docs/privacy/rls-trainer-expected.sql` (jetzt per Script statt manuellem SQL-Editor)

---

## B. Manuell — Supabase SQL Editor (als authentifizierter Trainer-JWT)

**Ersetzt durch Abschnitt A (Script).** Nur als Fallback, falls kein Script-Zugriff möglich ist.

Voraussetzung: Session eines Trainer-Users (nicht Service Role).

1. **Direktzugriff cycle_logs muss scheitern oder leer sein**

```sql
select * from public.cycle_logs limit 5;
```

Erwartung: 0 rows oder Policy-Fehler — **nie** fremde Symptome/Phasen.

2. **team_members sichtbar (Roster ok)**

```sql
select team_id, user_id, role from public.team_members;
```

Erwartung: nur eigene Teams.

3. **player_consents nicht lesbar für Trainer**

```sql
select * from public.player_consents limit 5;
```

Erwartung: deny / leer.

---

## C. Manuell — Browser / Network

1. Als Trainer einloggen → DevTools → Network → `/api/trainer/team-status`
2. JSON prüfen — erlaubt: `playerId`, `name`, `status`, `loadFlag`, `recommendation`
3. **Nicht** erlaubt in Response: `phase`, `symptoms`, `energy_level`, `notes`, Roh-GPS
4. Als Spielerin `/api/player/export` — enthält eigene Logs (Art. 20)
5. Als Trainer `/api/player/export` — 401/403

---

## D. Cross-Team Isolation

1. Zweites Demo-Team anlegen (oder zweiter Trainer ohne Membership)
2. Trainer A darf Ampel nur für Team A sehen
3. Invite mit `teamId` außerhalb Scope → HTTP 403

---

## E. Delete / Export

1. Testspielerin anlegen → Log → Export JSON Keys: `logs`, `consents`, `push_subscriptions`, …
2. Delete Account → Auth-User weg; `cycle_logs` für UUID leer
3. Wenn Ingestion konfiguriert: GPS-Zeilen entfernt

---

## Sign-off

| Check | Datum | OK |
|-------|-------|----|
| SQL DENY cycle_logs | 2026-07-22 | Policies live: `trainer_deny_all` + own-row CRUD (MCP verify) |
| Trainer-JWT Dry-Run (live) | 2026-07-23 | Automatisiert: `npm run verify:rls-trainer` — auszuführen sobald `E2E_TRAINER_*` Secrets gesetzt sind |
| team-status maskiert | 2026-07-22 | E2E credentialed + unit contract |
| Cross-Team 403 | | ⬜ manuell / erweitertes E2E |
| Export/Delete | | ⬜ manuell |
| `pilot_feedback` own-only + club scope | 2026-07-22 | insert/select own; admin GET `club_id` scoped (014) |

**Hinweis Tech (23.07.2026):** Live-DB Policies für `cycle_logs`, `player_consents`, `pilot_feedback`, `admin_audit_log` per `pg_policies` bestätigt. Trainer-JWT Dry-Run ist jetzt **Script + CI-Job**, kein manueller SQL-Editor-Schritt mehr. Verbleibend: einmalig Repo-Secrets setzen und Job grün sehen (Founder/Tech, kein Code).
Unterschrift Founder / Tech: _______________
