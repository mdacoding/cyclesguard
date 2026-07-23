# 15-Minuten Pitch-Demo — CyclesGuard (jeder Club)

**Ziel:** Vertrauen + greifbares Produkt für Athletik **und** DSB.  
**Live:** https://cyclesguard.vercel.app  
**Privacy:** `/privacy` (= `/datenschutz`) · **Angebot:** `/pilot` · **Impressum:** `/impressum` · **Spielerinnen:** `/spielerinnen-info`

**Vorbereitung:** Demo-URL · zweites Browser-Profil/Inkognito · optional Admin-Login bereit.

Accounts: [DEMO-ACCOUNTS.md](./DEMO-ACCOUNTS.md) (intern — nicht an Clubs mit Echtdaten-Prod).

Kurzvariante 5 Min.: nur Abschnitte 1–2 + Ask.

---

## 0:00 — Hook (30 Sek.)

> „Trainer steuern Belastung — **ohne Einblick in Intimdaten**. CyclesGuard übersetzt freiwillige Spielerinnen-Rückmeldungen in eine DOSB-konforme Ampel.“

---

## 0:30 — Trainer Kabine (3 Min.)

1. Login: `trainer@eintracht-demo.de` (Seed-E-Mails historisch; Produkt club-agnostisch)
2. Zeigen:
   - Sortierung Rot → Gelb → Grau → Grün
   - Empfehlung ohne medizinische Sprache
   - Filter „Heute fehlend“ / Teilen / Drucken
   - Ampel-Trend 7 Tage (Spielerinnen-Tage)
3. Betonen: kein „Zyklus“, keine Symptome — nur Ampel + Handlung

---

## 3:30 — Spielerin (3 Min.)

1. Inkognito → `lisa.weber@eintracht-demo.de`
2. Log &lt;30s → Speichern
3. Einstellungen: Export / Löschen
4. Satz: „Das bleibt bei der Spielerin.“

---

## 6:30 — Club-Admin Proof (4 Min.)

1. Admin-Login (Demo-Admin falls gesetzt)
2. Roster: First-Run-Checkliste Soft-Pilot
3. Compliance: Scorecard (Adherence ≥70 %, Keine-Daten-heute, Feedback Ø)
4. Optional: Adherence CSV / Feedback CSV Download
5. Saison-Tab: Closing-Checkliste (für Paid später — Soft-Pilot = `pilot_free`)

---

## 10:30 — Datenschutz live (3 Min.)

1. Öffne https://cyclesguard.vercel.app/datenschutz (redirect → `/privacy`)
2. Tabelle Wer sieht was · Art. 9 · EU-Hosting
3. Soft-Pilot: https://cyclesguard.vercel.app/pilot
4. Ask:

> „8–12 Wochen kostenlos, 5–10 Freiwillige, wöchentlich 20 Minuten Feedback. AVV-Entwurf liegt bereit.“

---

## 13:30 — Abschluss (90 Sek.)

**Bitte:** 1 Ansprechperson Athletik/Medizin · 5–10 Freiwillige · Kick-off-Termin  
**Links mailen:** `/pilot` · `/datenschutz` · Demo-URL  
**Follow-up:** 7 Tage · Tracking in [OUTREACH-TRACKING.md](./OUTREACH-TRACKING.md) · Texte [OUTREACH.md](./OUTREACH.md)

---

## Edge Cases

| Frage | Antwort |
|-------|---------|
| Sieht der Verein meine Periode? | Nein. RLS + API-Masking. |
| Keine Rückmeldung? | NO_DATA — nachfragen, nicht raten. |
| GPS? | Nur auf Club-Nachfrage. |
| Kosten danach? | Soft-Pilot gratis; Paid Season manuell nach Proof. |
