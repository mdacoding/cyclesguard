# AVV — Versand-Entwurf an Vereins-DSB (A4)

**Status:** Copy-paste-fertig · Entwurf in [`../privacy/AVV-TOM-DRAFT.md`](../privacy/AVV-TOM-DRAFT.md)  
**Owner:** Founder · vor Soft-Pilot mit Echtdaten senden  
**One-click Draft:** `cd cyclesguard-frontend && npm run open:avv-mailto`  
(optional `$env:AVV_TO="dsb@verein.de"`)

**Hinweis:** Öffentliche DSB-Mails sind oft nicht gelistet — Erstkontakt via Outreach/LinkedIn (Medizin/Athletik), AVV als Follow-up sobald Adresse da ist.

---

## Betreff

CyclesGuard Soft-Pilot — AVV/TOM-Entwurf zur Abstimmung (Datenschutz / Art. 28)

---

## E-Mail-Text

```
Guten Tag,

im Rahmen des geplanten Soft-Pilots von CyclesGuard (freiwillige Readiness-
Erfassung für Athletinnen; Trainer sehen nur Ampel-Signale, keine Rohdaten)
senden wir Ihnen unseren Arbeitsentwurf zu Auftragsverarbeitung und TOM.

Anlage / Link:
- AVV/TOM-Entwurf (Arbeitsstand): siehe Repo-Dokument AVV-TOM-DRAFT.md
  bzw. Anhang PDF (docs/legal/CyclesGuard-AVV.pdf, `npm run gen:avv-pdf`),
  sobald Vereinsdaten + Founder-Anschrift final eingetragen sind

Kernpunkte kurz:
1. Verantwortlicher: Verein / Rechtsträger (Platzhalter im Entwurf)
2. Auftragsverarbeiter: CyclesGuard / Betreiber-Rechtsträger
3. Subprozessoren: Supabase (EU), Vercel (fra1 / EU-Edge)
4. Trainer erhalten keine Art.-9-Rohdaten (technisch: RLS + Aggregation)
5. Soft-Pilot: 8–12 Wochen, freiwillig, Widerruf durch Kontolöschung

Offene Punkte für Ihre Rückmeldung:
- Formeller AVV-Text (Art. 28)
- Meldewege bei Vorfällen
- Alleinige vs. gemeinsame Verantwortlichkeit
- GPS/Wearable ggf. später, separater Consent

Wir bitten um Termin zur Abstimmung vor produktivem Echtdaten-Betrieb.
Demo-/Seed-Accounts sind kein Ersatz für einen unterschriebenen AVV.

Mit freundlichen Grüßen
M. Daud Abdulle
CyclesGuard · cyclesguard@proton.me · m.daud-abdulle@web.de
```

---

## Check nach Versand

| Schritt | Done |
|---------|------|
| Entwurf an DSB / Club-Kontakt gesendet | ☐ |
| Rückmeldung / Termin notiert | ☐ |
| Rechtsträger CyclesGuard im Entwurf eingetragen | ✅ `AVV-TOM-DRAFT.md` §1 (M. Daud Abdulle / CyclesGuard) |
| Postanschrift Impressum final | ☐ Env `NEXT_PUBLIC_IMPRESSUM_STREET` |
| Unterschrift vor Echtdaten | ☐ |
