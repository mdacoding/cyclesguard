# CyclesGuard — Datenschutz & DOSB (1-Pager)

**Stand:** Soft-Pilot / Club-Pitch  
**Live:** https://cyclesguard.vercel.app/privacy · hello@cyclesguard.de  
**Repo:** github.com/mdacoding/cyclesguard

---

## Was ist CyclesGuard?

Eine **privacy-first** Web-App für Spielerinnen im Leistungssport: freiwillige Tages-Rückmeldung zu Wohlbefinden und Zyklusphase — übersetzt in **trainingsrelevante Signale** für Athletiktrainer.

---

## Kernversprechen

| Wer | Sieht was |
|-----|-----------|
| **Spielerin** | Eigene Logs, Symptome, Historie, Export, Löschung |
| **Trainer** | Nur Ampel: Einsatzbereit · Angepasstes Training · Regeneration · Keine Daten + Last-Hinweis |
| **Verein / Club-Admin** | Roster & Adherence-Metadaten — **keine** Gesundheits-Rohdaten |
| **CyclesGuard (technisch)** | Verschlüsselte Speicherung; Aggregation serverseitig mit strikter Autorisierung |

**Trainer haben auf Datenbankebene keinen Zugriff auf `cycle_logs`** (PostgreSQL RLS, explizite DENY-Policy).

---

## DSGVO

- **Art. 9:** Gesundheitsbezogene Daten — **explizite Einwilligung** vor Nutzung (Onboarding)
- **Art. 15 / 20:** Datenexport über Spielerinnen-Einstellungen
- **Art. 17:** Account-Löschung inkl. Zykluslogs und verknüpfter Summaries
- **Zweckbindung:** Readiness für Trainingssteuerung — kein Marketing, kein Weiterverkauf
- **Hosting:** EU (Supabase Frankfurt, Vercel fra1)
- **Consent-Audit:** Zeitstempel + gehashte IP (Salt), keine Klartext-IPs in Logs

---

## DOSB / Sportpraxis

- Keine medizinische Diagnose — **aggregierte Trainingshinweise**
- Keine Pflicht zur Offenlegung gegenüber Trainer
- **NO_DATA** statt Raten, wenn keine aktuelle Meldung (>48h → veraltet)
- Empfehlungen sportlich formuliert (Belastung, Plyometrie, Regeneration)

---

## Technische Sicherheit (Kurz)

- Supabase Auth + Row Level Security
- Trainer-API aggregiert mit Service Role **nur serverseitig** nach Rollenprüfung
- HTTPS, PWA ohne Third-Party-Tracking im Kernflow
- Cron/Secrets getrennt; Service Keys nicht im Browser

---

## Soft-Pilot mit eurem Verein

- Freiwilligkeit, schriftliche Information an Spielerinnen
- Gemeinsame Abstimmung mit DSB bei Bedarf
- Auftragsverarbeitung (AVV) vor produktivem Echtbetrieb — Demo ohne personenbezogene Echtdaten möglich
- Angebot: https://cyclesguard.vercel.app/pilot

---

## Offene Punkte (ehrlich)

- Formale AVV-Unterschrift: sobald Club-/DSB-Adresse vorliegt (Entwurf + Mailto fertig)
- GPS/Wearable-Anbindung: separates Consent, nur auf Club-Nachfrage

---

*Dieses Dokument ersetzt keine Rechtsberatung. Für den Verein: Abstimmung mit Datenschutzbeauftragtem empfohlen.*
