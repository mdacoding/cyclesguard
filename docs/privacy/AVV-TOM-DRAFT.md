# AVV / TOM — Entwurf (Soft-Pilot)

**Status:** Arbeitsentwurf für Abstimmung mit Vereins-DSB / Rechtsberatung.  
**Kein Ersatz** für einen unterschriebenen Auftragsverarbeitungsvertrag.

---

## 1. Parteien (Platzhalter)

| Rolle | Partei |
|-------|--------|
| Verantwortlicher | [Verein — Rechtsträger einsetzen] |
| Auftragsverarbeiter | CyclesGuard / [Betreiber-Rechtsträger] |
| Subprozessoren | Supabase (EU), Vercel (Region `fra1` / EU-Edge) |

---

## 2. Gegenstand der Verarbeitung

- Zweck: Freiwillige Erfassung von Readiness-/Wohlbefindensdaten durch Spielerinnen; aggregierte Ampel für Athletiktraining; optional Push-Reminder.
- Kategorien: Identitätsdaten (E-Mail, Name), Art.-9-Gesundheitsdaten (Zyklusphase, Symptome, Energie), technische Logs (Consent-Hash, Push-Endpoints).
- Betroffene: Teilnehmende Spielerinnen (Freiwillige Soft-Pilot), Trainer (nur Ampel), Club-Admins (nur Roster-Metadaten).

---

## 3. Was Trainer / Verein **nicht** erhalten

- Keine Roh-Zyklusdaten, Symptome oder Freitext-Notizen
- Keine Diagnosen
- Nur Enums: `FIT` / `MODIFIED_TRAINING` / `REST` / `NO_DATA` + Handlungsempfehlung

Durchgesetzt technisch: RLS DENY auf `cycle_logs` für Trainer-Rolle + serverseitige Aggregation mit Service Role nur scoped auf Team-Members.

---

## 4. TOM (Technisch-organisatorische Maßnahmen) — Kurz

| Maßnahme | Umsetzung |
|----------|-----------|
| Zugangskontrolle | Supabase Auth, Rollen in `app_metadata` |
| Trennung | Team-Tenancy (`team_members`), scoped APIs |
| Verschlüsselung | TLS in Transit; Supabase at-rest |
| Pseudonymisierung Audit | Consent-IP als SHA-256 + Salt (`CONSENT_IP_SALT`) |
| Löschung Art. 17 | Account-Delete + optional GPS-Cleanup via Ingestion |
| Export Art. 20 | `/api/player/export` |
| Logging | Keine Health-Payloads in App-Logs; Audit ohne Rohdaten |
| Hosting-Region | Prefer EU (Supabase Frankfurt, Vercel `fra1`) |
| Secrets | Env in Vercel; Rotation vor Echtdaten |

Details Retention: [retention.md](./retention.md)

---

## 5. Soft-Pilot Spezifika

- Dauer: 8–12 Wochen, kostenlos (siehe Pitch-Angebot)
- Teilnehmerzahl: 5–10 Freiwillige
- Keine Pflichtnutzung; Widerruf jederzeit durch Kontolöschung
- Demo-Accounts getrennt von Echtdaten halten (`PILOT-RUNBOOK.md`)

---

## 6. Offene Punkte für DSB

1. Formeller AVV-Text (Standardvertragsklauseln / Art. 28)  
2. Meldewege bei Datenschutzvorfällen (24h intern / 72h Behörde)  
3. Ob Club als alleiniger Verantwortlicher oder gemeinsame Verantwortlichkeit  
4. GPS-/Wearable-Anbindung: separater Consent, erst nach Club-Entscheidung  

---

## 7. Nächster Schritt

1. Diesen Entwurf an Vereins-DSB senden  
2. Rechtsträger CyclesGuard eintragen  
3. Unterschrift vor produktivem Echtdaten-Betrieb — **Demo mit Seed-Accounts ist kein Ersatz**  
