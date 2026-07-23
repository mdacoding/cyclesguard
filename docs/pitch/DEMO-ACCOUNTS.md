# Demo-Accounts — Pitch / Soft-Pilot Seed

**Passwort für alle Demo-Accounts:** `CyclesGuard2026!`

> Nur für Pitch/Demo-Umgebung. Vor echtem Pilot rotieren. Nicht an Clubs mit Prod-Echtdaten weitergeben.

**Seed:** `npm run seed:demo` (Alias: `seed:eintracht`)  
Optional: `DEMO_TEAM_NAME` / `DEMO_CLUB_NAME` / `DEMO_SEASON_NAME`  
Default Team-Name: **CyclesGuard Demo Frauen** (Legacy „Eintracht Frankfurt Frauen“ wird beim Re-Seed umbenannt).

---

## Trainer

| E-Mail | Rolle | Dashboard |
|--------|-------|-----------|
| `trainer@eintracht-demo.de` | Athletik (Demo) | `/trainer/dashboard` |

Domain `@eintracht-demo.de` bleibt stabil für bestehende Auth-User — Anzeigename des Teams ist club-agnostisch.

---

## Club Admin

| E-Mail | Rolle | Dashboard |
|--------|-------|-----------|
| `admin@eintracht-demo.de` | Club Admin (Demo) | `/admin/teams` |

Zeigt Teams, Saison, Roster-Invite, Scorecard (Adherence + Trainer aktiv 7d) — **keine** Zyklus-Rohdaten.

---

## Spielerinnen (Demo-Team)

| Name | E-Mail | Erwartete Ampel (Trainer) | Demo-Hinweis |
|------|--------|---------------------------|--------------|
| Anna Müller | `anna.mueller@eintracht-demo.de` | **FIT** (Grün) | Volle Belastung · Session-Card |
| Sara Klein | `sara.klein@eintracht-demo.de` | **MODIFIED** (Gelb) | Ovulation · **HIGH** Load-Demo |
| Lisa Weber | `lisa.weber@eintracht-demo.de` | **REST** (Rot) | Menstruation, Energie 1 |
| Nina Fischer | `nina.fischer@eintracht-demo.de` | **MODIFIED** (Gelb) | Menstruation, Energie 4 |
| Mia Becker | `mia.becker@eintracht-demo.de` | **FIT** (Grün) | Luteal |
| Lea Hoffmann | `lea.hoffmann@eintracht-demo.de` | **NO_DATA** (Grau) | Kein Log |
| Julia Richter | `julia.richter@eintracht-demo.de` | **NO_DATA** (Grau) | Log älter als 48h |

---

## Live-Demo-Empfehlung

1. **Trainer** Ampel + Trend 7d  
2. **Lisa Weber** Log → zurück Trainer  
3. **Admin** Scorecard + `/datenschutz` Ask  

Ablauf: [`DEMO-SCRIPT.md`](./DEMO-SCRIPT.md) · Seed: `npm run seed:demo`
