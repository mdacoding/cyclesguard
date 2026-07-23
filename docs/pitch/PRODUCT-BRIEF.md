# CyclesGuard — Produkt-Brief (1 Seite)

**Live-Demo:** https://cyclesguard.vercel.app  
**Passwort Demo:** `CyclesGuard2026!` · Accounts: `docs/pitch/DEMO-ACCOUNTS.md`

---

## Was ist CyclesGuard?

CyclesGuard ist ein **privacy-first SaaS für Frauenfußball**: Spielerinnen erfassen freiwillig kurze Tages-Rückmeldungen zu Wohlbefinden und Zyklusphase. Athletiktrainer steuern damit die Belastung — **ohne Intimdaten zu sehen**.

Trainer erhalten nur eine **Ampel**:
- **Einsatzbereit (FIT)**
- **Angepasstes Training (MODIFIED)**
- **Regeneration (REST)**
- **Keine Daten (NO_DATA)**

Dazu eine kurze Handlungsempfehlung (z. B. Plyometrie reduzieren). Keine Phasen, Symptome oder Notizen auf Trainer-Seite.

---

## Für wen?

| Rolle | Nutzen |
|-------|--------|
| Spielerin | &lt;30s Log, Historie, Offline/PWA, Export & Löschen (DSGVO) |
| Athletik / Performance | Team-Ampel für die heutige Einheit, Invite-Roster |
| Verein / Medizin | DOSB-/Art.-9-Story, keine Rohdaten-Weitergabe an Trainer |
| Club-Admin | Roster & Adherence-Quote (keine Gesundheits-Rohdaten) |

**ICP:** Frauen-Bundesliga / 2. Liga / ambitionierte Klubs — Multi-Club Outreach parallel; Seed-Demo historisch „Eintracht“.

---

## Was die Demo heute kann

- Gehostete App (Vercel EU + Supabase Frankfurt)
- Live-Seiten: `/privacy` · `/datenschutz` · `/pilot` · `/impressum`
- Seed-Demo-Team (interne Accounts) mit Spielerinnen + Trainer
- Same-day Log, Symptome, 28-Tage-Historie
- Trainer-Kabine: Ampel, Filter, Teilen, 7d-Trend
- Club-Admin: Adherence/Scorecard, Saison, First-Run
- Consent-Onboarding, Datenexport, Account-Löschung
- PWA / Offline (Kabinen-Story)

**Bewusst nicht in der Pitch-Demo:** Live-GPS, Stripe-Billing, medizinische Diagnostik.

---

## Angebot an den Club

**8–12 Wochen Soft-Pilot kostenlos**, 5–10 freiwillige Spielerinnen, wöchentliches 20-Min-Feedback. Details: `PILOTANGEBOT.md`.

---

## Was nach dem Termin noch ansteht (Preview)

| Wenn Club sagt… | Nächste Arbeit |
|-----------------|----------------|
| **Ja / Interesse** | Soft-Pilot: echte Roster, AVV/DSB, Secrets rotieren, optional Domain, Push live, Feedback-Rhythmus |
| **Später** | Demo online lassen, in 4–6 Wochen nachfassen |
| **Nein** | Gleiches Pitch-Paket an nächsten Club (siehe `OUTREACH.md`) |

Danach erst: Saisonvertrag, Billing, GPS optional, Multi-Tenant — **nicht** Voraussetzung für den ersten Termin.
