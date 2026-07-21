# Demo-Accounts — Eintracht Pitch

**Passwort für alle Demo-Accounts:** `CyclesGuard2026!`

> Nur für Pitch/Demo-Umgebung. Vor echtem Pilot rotieren.

---

## Trainer

| E-Mail | Rolle | Dashboard |
|--------|-------|-----------|
| `trainer@eintracht-demo.de` | Athletik (Demo) | `/trainer/dashboard` |

---

## Spielerinnen (Team: Eintracht Frankfurt Frauen)

| Name | E-Mail | Erwartete Ampel (Trainer) | Demo-Hinweis |
|------|--------|---------------------------|--------------|
| Anna Müller | `anna.mueller@eintracht-demo.de` | **FIT** (Grün) | Volle Belastung |
| Sara Klein | `sara.klein@eintracht-demo.de` | **MODIFIED** (Gelb) | Ovulation |
| Lisa Weber | `lisa.weber@eintracht-demo.de` | **REST** (Rot) | Menstruation, Energie 1 |
| Nina Fischer | `nina.fischer@eintracht-demo.de` | **MODIFIED** (Gelb) | Menstruation, Energie 4 |
| Mia Becker | `mia.becker@eintracht-demo.de` | **FIT** (Grün) | Luteal |
| Lea Hoffmann | `lea.hoffmann@eintracht-demo.de` | **NO_DATA** (Grau) | Kein Log |
| Julia Richter | `julia.richter@eintracht-demo.de` | **NO_DATA** (Grau) | Log älter als 48h |

---

## Live-Demo-Empfehlung

1. **Trainer zuerst** kurz zeigen (Ampel-Übersicht)
2. **Als Lisa Weber einloggen** → Log aktualisieren → zurück zum Trainer → Ampel reagiert
3. **Lea Hoffmann** als Beispiel für „Spielerin kontaktieren“ (NO_DATA)

Seed erneut ausführen: `npm run seed:eintracht` (idempotent).
