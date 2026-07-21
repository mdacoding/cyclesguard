# CyclesGuard — Implementation Plan: Pitch → Pilot → SaaS

**Stand:** 21.07.2026 (nach Live-Deploy + Logout + UX-Abnahme)  
**Repo:** https://github.com/mdacoding/cyclesguard  
**Live-Demo:** https://cyclesguard.vercel.app  
**Ziel jetzt:** Eintracht Frankfurt Frauen **vorstellen** (Termin + Demo).  
**Produktziel:** Privacy-first Club-SaaS — [`docs/product/SAAS-PLAN.md`](../product/SAAS-PLAN.md)

```
Code A+B ✅ → Cloud DB ✅ → GitHub ✅ → Vercel ✅ → Pre-Meeting ⬜ → Soft-Pilot → Paid SaaS
                                                    ↑
                                              menschlich / Ops
```

---

## CTO-Urteil: Pitch-Produkt

| Frage | Antwort |
|-------|---------|
| Ist die Demo präsentierfertig? | **Ja** — Live-URL, Seed, Ampel, Login/Logout, Pitch-Docs |
| Kann man mit einem Bundesliga-Club zusammenarbeiten? | **Soft-Pilot vorschlagen: ja.** Saison-Produktivbetrieb: erst nach Pilot + AVV |
| Was fehlt noch für den Termin? | Kein Feature-Blocker — nur Vorbereitung (Auth-Check, Üben, Kontaktdaten, Termin) |

---

## CTO-Lagebild (Fakten)

| Bereich | Status |
|---------|--------|
| Product A+B (UX, Ampel, Offline, Admin) | ✅ |
| Login / Logout / Rollenwechsel | ✅ (User-abgenommen) |
| Spielerinnen- + Trainer-UI | ✅ (User: „sieht echt gut aus“) |
| Supabase Cloud + Migrationen `001`–`009` | ✅ |
| Demo-Seed Eintracht Frauen | ✅ |
| Vercel Production | ✅ https://cyclesguard.vercel.app |
| Smoke HTTP | ✅ |
| Pitch-Materialien (Skript, Datenschutz, Angebot) | ✅ Docs vorhanden |
| GitHub + CI | ✅ |
| Soft-Pilot Ops (Domain, Push live, AVV) | ⬜ **P1 — nicht Pitch-Blocker** |

**Demo-Accounts:** `docs/pitch/DEMO-ACCOUNTS.md` · Passwort `CyclesGuard2026!`

---

## P0 — Must vor dem Pitch (Produkt)

| # | Arbeit | Status |
|---|--------|--------|
| P0.1 | Gehostete Demo (Vercel + Supabase) | ✅ |
| P0.2 | Migrationen Demo-DB | ✅ |
| P0.3 | Seed Eintracht Frauen | ✅ |
| P0.4 | Pitch-Skript | ✅ |
| P0.5 | Datenschutz 1-Pager | ✅ Doc |
| P0.6 | Pilotangebot | ✅ Doc |
| P0.7 | Code auf GitHub | ✅ |
| P0.8 | Logout / Account-Wechsel | ✅ |

**P0 Produkt = erledigt.**

---

## Pre-Meeting (vor Termin — kein Code-Blocker)

| # | Arbeit | Status | Wer |
|---|--------|--------|-----|
| PM.1 | Supabase Auth Site URL + Redirect = `https://cyclesguard.vercel.app` (+ `/auth/callback`) | ⬜ prüfen | Founder |
| PM.2 | Demo einmal durchspielen (Skript 5 Min) | ⬜ | Founder |
| PM.3 | Platzhalter ersetzen: Name/E-Mail in `DATENSCHUTZ-DOSB-1-PAGER.md` + `PILOTANGEBOT.md` | ⬜ | Founder |
| PM.4 | 1-Pager + Pilotangebot als PDF/Druck für Meeting | ⬜ | Founder |
| PM.5 | Secret Key rotieren (war in Chats) · Demo-Passwort nur intern | ⬜ | Founder |
| PM.6 | Termin bei Eintracht anfragen (Athletik / Sportmedizin) | ⬜ | Founder |

---

## P1 — Soft-Pilot (nach Club-Interesse)

| # | Arbeit | Status |
|---|--------|--------|
| P1.1 | Prod härten (Secrets rotiert, optional Domain, Monitoring) | ⬜ |
| P1.2 | Trainer-Onboarding | ✅ Doc |
| P1.3 | Push-Reminder live testen | ⬜ |
| P1.4 | Feedback-Rhythmus | ✅ Doc |
| P1.5 | AVV / TOM mit Vereins-DSB | ⬜ |
| P1.6 | Echte Spielerinnen-Roster (nicht nur Demo) | ⬜ |

---

## P2 — später

Billing, Multi-Club, GPS live, ML — siehe SAAS-PLAN Stages C–D.

---

## Pitch-Kern (im Termin)

1. Privacy-by-Design / DOSB — nur Ampel  
2. Log &lt;30s  
3. Kabine — PWA/Offline  
4. 8–12 Wochen kostenlos + Feedback  
5. GPS optional  

---

## Nächster Ausführungsschritt

1. **PM.1–PM.5** abhaken (30–90 Min.)  
2. **PM.6** Termin anfragen  
3. Im Meeting: Live-URL + Skript + 1-Pager + Pilotangebot  

Kein weiteres Feature-Building vor dem Termin nötig.
