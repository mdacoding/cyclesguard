# 5-Minuten Pitch-Demo — Eintracht Frankfurt Frauen

**Ziel:** Vertrauen + greifbares Produkt. Kein Tech-Deep-Dive.

**Vorbereitung:** Demo-URL geöffnet, zweites Browser-Profil oder Inkognito für Trainer/Spielerin.

Accounts: [DEMO-ACCOUNTS.md](./DEMO-ACCOUNTS.md)

---

## Minute 0:00 — Hook (30 Sek.)

> „Trainer steuern Belastung und Verletzungsprävention — **ohne Einblick in Intimdaten**. CyclesGuard übersetzt freiwillige Spielerinnen-Rückmeldungen in eine DOSB-konforme Ampel: Einsatzbereit, angepasstes Training, Regeneration — sonst nichts.“

---

## Minute 0:30 — Trainer-Ansicht (90 Sek.)

1. Login: `trainer@eintracht-demo.de`
2. Dashboard: Team **Eintracht Frankfurt Frauen**
3. Zeigen:
   - Sortierung: Rot → Gelb → Grau → Grün
   - **Lisa Weber — Regeneration** (Rot)
   - **Anna Müller — Einsatzbereit** (Grün)
   - **Lea Hoffmann — Keine Daten** (Grau)
4. Betonen:
   - Kein Wort „Zyklus“, keine Symptome, keine Notizen
   - Nur Handlungsempfehlung: z. B. „Plyometrie reduzieren“

---

## Minute 2:00 — Spielerinnen-App (2 Min.)

1. Abmelden / Inkognito
2. Login: `lisa.weber@eintracht-demo.de`
3. Dashboard → heutigen Eintrag (Same-day UX)
4. Energie leicht ändern → **Speichern**
5. Optional: Symptom-Chips, 28-Tage-Historie (`/player/history`)
6. Satz:
   > „Das bleibt bei der Spielerin. Der Trainer sieht nur, ob heute Belastung angepasst werden sollte.“

---

## Minute 4:00 — Zurück zum Trainer (45 Sek.)

1. Trainer erneut einloggen
2. Lisa Weber — Status/Empfehlung hat sich aktualisiert (falls Energie geändert)
3. Kurz **Offline-Hinweis:** PWA funktioniert in der Kabine; Sync wenn WLAN da ist

---

## Minute 4:45 — Privacy & Rechte (45 Sek.)

1. Als Spielerin: **Einstellungen** → Datenexport, Account löschen
2. Ein Satz Art. 9 DSGVO + freiwillige Einwilligung
3. Verweis auf [DATENSCHUTZ-DOSB-1-PAGER.md](./DATENSCHUTZ-DOSB-1-PAGER.md) (PDF ausdrucken oder mailen)

---

## Minute 5:30 — Ask & Pilot (30 Sek.)

> „Wir bieten **8–12 Wochen kostenlos** mit 5–10 freiwilligen Spielerinnen, wöchentlich 20 Minuten Feedback. Ihr bekommt eine funktionierende Ampel; wir bauen mit euch GPS und Club-Prozesse erst, wenn ihr wollt.“

Details: [PILOTANGEBOT.md](./PILOTANGEBOT.md)

**Konkrete Bitte:**

- 1 Ansprechpartnerin Athletik / Sportmedizin
- 5–10 Freiwillige
- Termin für Kick-off in 2 Wochen

---

## Edge Cases (wenn gefragt)

| Frage | Antwort |
|-------|---------|
| Sieht der Verein meine Periode? | Nein. RLS + API-Masking. Nur Ampel-Enum. |
| Was wenn keine Rückmeldung? | NO_DATA — Trainer kontaktiert Spielerin, keine Annahme. |
| GPS / Wearables? | Roadmap Pilot; Pitch-Demo ohne GPS. |
| DOSB? | Aggregation nach internen Regeln; keine Diagnose. |

---

## Nach dem Termin

- 1-Pager + Pilotangebot per E-Mail
- Demo-Zugang 4 Wochen offen lassen
- Follow-up in 7 Tagen
