# AVV / TOM — Entwurf (Soft-Pilot)

**Status:** Arbeitsentwurf für Abstimmung mit Vereins-DSB / Rechtsberatung.  
**Kein Ersatz** für einen unterschriebenen Auftragsverarbeitungsvertrag.  
**Stand:** 23.07.2026

Versand-Paket: [`../pitch/AVV-EMAIL-DRAFT.md`](../pitch/AVV-EMAIL-DRAFT.md) · `npm run open:avv-mailto`

---

## 1. Parteien

| Rolle | Partei |
|-------|--------|
| **Verantwortlicher** | [Verein — Rechtsträger / e.V. einsetzen] |
| **Auftragsverarbeiter** | **M. Daud Abdulle** (handelnd als CyclesGuard), E-Mail: hello@cyclesguard.de · Anschrift: siehe `/impressum` bzw. [Anschrift Founder ergänzen] |
| **Subprozessoren** | Supabase Inc. (EU-Region Frankfurt) · Vercel Inc. (Region `fra1` / EU-Edge) |

CyclesGuard ist Early-Access / Soft-Pilot; formeller Gesellschafts-Rechtsträger kann später nachgezogen werden — DSB vor Echtdaten informieren.

---

## 2. Gegenstand der Verarbeitung (Art. 28 Abs. 3 lit. a)

- **Zweck:** Freiwillige Erfassung von Readiness-/Wohlbefindensdaten durch Spielerinnen; aggregierte Ampel für Athletiktraining; optional Push-Reminder.
- **Kategorien:** Identitätsdaten (E-Mail, Name), Art.-9-Gesundheitsdaten (Zyklusphase, Symptome, Energie), technische Logs (Consent-Hash, Push-Endpoints).
- **Betroffene:** Teilnehmende Spielerinnen (Freiwillige Soft-Pilot), Trainer (nur Ampel), Club-Admins (nur Roster-Metadaten).
- **Dauer:** Soft-Pilot 8–12 Wochen bzw. bis Widerruf / Kontolöschung; Retention siehe [retention.md](./retention.md).

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
| Logging | Keine Health-Payloads in App-Logs; Sentry strippt `phase`/`symptoms`; Audit ohne Rohdaten |
| Hosting-Region | Prefer EU (Supabase Frankfurt, Vercel `fra1`) |
| Secrets | Env in Vercel; Rotation vor Echtdaten |

Details Retention: [retention.md](./retention.md)

---

## 5. Soft-Pilot Spezifika

- Dauer: 8–12 Wochen, kostenlos (siehe Pitch-Angebot)
- Teilnehmerzahl: 5–10 Freiwillige
- Keine Pflichtnutzung; Widerruf jederzeit durch Kontolöschung
- Demo-Accounts getrennt von Echtdaten halten (`PILOT-RUNBOOK.md`)
- Einwilligungs-Vorlage: [`../pitch/SPIELERINNEN-INFO.md`](../pitch/SPIELERINNEN-INFO.md)

---

## 6. Art. 28 — Skizze (Vertragsinhalt)

Der formelle AVV soll mindestens regeln:

1. **Gegenstand & Dauer** — wie §2  
2. **Art & Zweck** — Soft-Pilot Readiness; keine Diagnostik  
3. **Weisungsgebundenheit** — CyclesGuard verarbeitet nur nach dokumentierter Weisung des Vereins (Produktfunktion = Weisung)  
4. **Vertraulichkeit** — Personen mit Zugang sind zur Vertraulichkeit verpflichtet  
5. **TOM** — wie §4; Verein kann Auskunft verlangen  
6. **Subprozessoren** — Supabase, Vercel; Wechsel nur mit Information + Widerspruchsrecht in angemessener Frist  
7. **Unterstützung bei Betroffenenrechten** — Export/Löschung in der App; Support hello@cyclesguard.de  
8. **Unterstützung bei DSFA / Behörden** — nach zumutbarem Aufwand  
9. **Löschung / Rückgabe** nach Ende — Konten löschen, Backups nach Retention  
10. **Nachweise** — Audit-Logs ohne Health-Rohdaten; RLS-Verify-Scripts  

*Volltext / Standardvertragsklauseln: mit DSB finalisieren.*

---

## 7. Meldewege bei Datenschutzvorfällen

| Stufe | Frist | Aktion |
|-------|-------|--------|
| **Intern entdeckt** | **sofort / ≤ 24 h** | Founder + hello@cyclesguard.de; Sentry/Logs prüfen; betroffene Systeme isolieren |
| **Meldung an Verantwortlichen (Verein)** | **unverzüglich, spätestens 24 h** nach Kenntnis | Kurzbeschreibung, Kategorien, grobe Anzahl Betroffener, Maßnahmen |
| **Behörde (durch Verantwortlichen)** | **≤ 72 h** nach Kenntnis (Art. 33), soweit meldepflichtig | Verein/DSB entscheidet; CyclesGuard liefert TOM-/Zeitlinie |
| **Betroffene** | nach Art. 34, wenn hohes Risiko | Verein führt Kommunikation; CyclesGuard unterstützt inhaltlich |

Kontakt CyclesGuard-Vorfälle: **hello@cyclesguard.de** (Betreff: `DS-Vorfall Soft-Pilot`).

---

## 8. Verantwortlichkeit

**Default Soft-Pilot:** Verein = **alleiniger Verantwortlicher** für die Entscheidung „wer nimmt teil / Zweck Athletik“; CyclesGuard = **Auftragsverarbeiter** (Hosting + Ampel-Aggregation).

**Gemeinsame Verantwortlichkeit** nur, wenn der Verein ausdrücklich Produkt-Features mitbestimmt, die über die dokumentierte Ampel hinausgehen — dann separate Vereinbarung (Art. 26). Standardmäßig **nicht** vorgesehen.

GPS-/Wearable-Anbindung: separater Consent, erst nach Club-Entscheidung.

---

## 9. Nächster Schritt

1. Entwurf an Vereins-DSB senden (`AVV-EMAIL-DRAFT.md` / `open:avv-mailto`)  
2. Anschrift Founder in `/impressum` finalisieren  
3. Unterschrift vor produktivem Echtdaten-Betrieb — **Demo mit Seed-Accounts ist kein Ersatz**
