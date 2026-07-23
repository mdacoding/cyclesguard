# CyclesGuard Support — Soft-Pilot & Paid Season

**Support-Kontakt:** `hello@cyclesguard.de` (oder Founder-Direktkanal aus Outreach)  
**SLA Soft-Pilot:** Best-effort, Antwortziel &lt; 1 Werktag  
**SLA Paid Season (Hypothese):** &lt; 1 Werktag kritische Auth/Roster-Themen  

---

## Was Support tun kann (ohne Art.-9-Zugriff)

| Anliegen | Aktion |
|----------|--------|
| Spielerin nicht im Roster | Club Admin / Trainer: E-Mail-Invite oder CSV |
| Falsches Team | Admin: Mitglied entfernen + neu zuweisen |
| Team nicht sichtbar | Prüfen ob archiviert → Admin „Archivierte anzeigen“ / reaktivieren |
| Push kommt nicht | `PUSH-LIVE.md` + Homescreen/iOS 16.4+ |
| Login-Redirect falsch | Rolle in `app_metadata.role` + Auth Site URL |
| Export/Löschen | Spielerin Settings → Art. 20 / Art. 17 |

**Nie:** Zyklusphasen, Symptome, Notizen an Trainer/Admin weitergeben.

---

## Escalation

1. Club Admin (Roster/Saison)  
2. CyclesGuard Founder (Auth/Env/AVV)  
3. DSB nur bei Datenschutzvorfällen  

---

## Vor Paid Go-Live

- [ ] AVV unterschrieben  
- [x] `NEXT_PUBLIC_DEMO_MODE=false` (Prod, GO-LIVE C1)  
- [ ] Secrets rotiert nach Club-Ja (`PILOT-RUNBOOK.md`)  
- [x] Sentry DSN aktiv (GO-LIVE A1 · Strip unit-getestet)  
- [ ] Season `commercial_status` = `signed` oder `active_paid`  
