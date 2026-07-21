# RLS / Privacy Penetration Checklist

**Zweck:** Vor Soft-Pilot manuell verifizieren, dass Trainer keine Art.-9-Rohdaten sehen.  
**Stand:** Code-Pfad Ampel = `service_role` + Masking in `/api/trainer/team-status` + RLS DENY für Client-Rollen.

---

## A. Automatisierbar (CI)

- [x] Unit-Tests: Empfehlungstexte ohne Menstru-/Zyklus-Wörter (`lib/trainer-status.test.ts`)
- [ ] Playwright Smoke (optional mit Demo-Credentials): Trainer-Response enthält keine `phase`/`symptoms`

---

## B. Manuell — Supabase SQL Editor (als authentifizierter Trainer-JWT)

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
| SQL DENY cycle_logs | | |
| team-status maskiert | | |
| Cross-Team 403 | | |
| Export/Delete | | |

Unterschrift Founder / Tech: _______________
