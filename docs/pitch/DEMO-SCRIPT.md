# 5-Minuten Pitch-Demo — CyclesGuard (jeder Club)

**Ziel:** Vertrauen + greifbares Produkt. Kein Tech-Deep-Dive.  
**Live:** https://cyclesguard.vercel.app · Privacy: `/privacy` · Angebot: `/pilot`

**Vorbereitung:** Demo-URL geöffnet, zweites Browser-Profil oder Inkognito für Trainer/Spielerin.

Accounts: [DEMO-ACCOUNTS.md](./DEMO-ACCOUNTS.md) (Pitch-Demo — nicht an Clubs weitergeben, wenn Prod mit echten Usern läuft).

---

## Minute 0:00 — Hook (30 Sek.)

> „Trainer steuern Belastung — **ohne Einblick in Intimdaten**. CyclesGuard übersetzt freiwillige Spielerinnen-Rückmeldungen in eine DOSB-konforme Ampel: Einsatzbereit, angepasstes Training, Regeneration — sonst nichts.“

---

## Minute 0:30 — Trainer-Ansicht (90 Sek.)

1. Login: `trainer@eintracht-demo.de` (Seed-Demo; Name ist historisch — Produkt ist club-agnostisch)
2. Dashboard: Team-Ampel
3. Zeigen:
   - Sortierung: Rot → Gelb → Grau → Grün
   - Regeneration / Einsatzbereit / Keine Daten
   - Optional: Ampel-Trend 7 Tage, Filter „Heute fehlend“, Teilen
4. Betonen:
   - Kein Wort „Zyklus“, keine Symptome, keine Notizen
   - Nur Handlungsempfehlung: z. B. „Plyometrie reduzieren“

---

## Minute 2:00 — Spielerinnen-App (2 Min.)

1. Abmelden / Inkognito
2. Login: `lisa.weber@eintracht-demo.de`
3. Dashboard → heutigen Eintrag (Same-day UX)
4. Energie leicht ändern → **Speichern**
5. Optional: Historie, Einstellungen → Export/Löschen
6. Satz:
   > „Das bleibt bei der Spielerin. Der Trainer sieht nur, ob heute Belastung angepasst werden sollte.“

---

## Minute 4:00 — Zurück zum Trainer (45 Sek.)

1. Trainer erneut einloggen
2. Status/Empfehlung aktualisiert (falls Energie geändert)
3. Kurz **Offline-Hinweis:** PWA in der Kabine; Sync wenn WLAN da ist

---

## Minute 4:45 — Privacy & Rechte (45 Sek.)

1. Als Spielerin: **Einstellungen** → Datenexport, Account löschen  
2. Öffentlich zeigen: https://cyclesguard.vercel.app/privacy  
3. Ein Satz Art. 9 DSGVO + freiwillige Einwilligung

---

## Minute 5:30 — Ask & Soft-Pilot (30 Sek.)

> „Wir bieten **8–12 Wochen kostenlos** mit 5–10 freiwilligen Spielerinnen, wöchentlich 20 Minuten Feedback.“

Details live: https://cyclesguard.vercel.app/pilot · Doc: [PILOTANGEBOT.md](./PILOTANGEBOT.md)

**Konkrete Bitte:**

- 1 Ansprechperson Athletik / Sportmedizin
- 5–10 Freiwillige
- Kick-off-Termin

---

## Edge Cases (wenn gefragt)

| Frage | Antwort |
|-------|---------|
| Sieht der Verein meine Periode? | Nein. RLS + API-Masking. Nur Ampel-Enum. |
| Was wenn keine Rückmeldung? | NO_DATA — Trainer kontaktiert Spielerin, keine Annahme. |
| GPS / Wearables? | Nur wenn ihr es wollt (`INGESTION-DEPLOY`). |
| DOSB? | Aggregation nach internen Regeln; keine Diagnose. |
| Was kostet danach? | Soft-Pilot gratis; Paid Season manuell nach Proof — kein Stripe-Zwang. |

---

## Nach dem Termin

- Link `/privacy` + `/pilot` per E-Mail (oder PDF drucken)
- Demo-Zugang offen lassen
- Follow-up in 7 Tagen · Tracking in [OUTREACH.md](./OUTREACH.md)
