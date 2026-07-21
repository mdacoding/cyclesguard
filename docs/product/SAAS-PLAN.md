# CyclesGuard — SaaS Product Plan (CTO)

**Stand:** 21.07.2026  
**Repo:** https://github.com/mdacoding/cyclesguard  
**Live:** https://cyclesguard.vercel.app  
**North star:** Privacy-first readiness platform for women’s football clubs in DACH → later EU.

Day-to-day pitch checklist: [`../sprints/00-ROADMAP.md`](../sprints/00-ROADMAP.md).

---

## 1. Problem → Product

| Stakeholder | Problem | CyclesGuard value |
|-------------|---------|-------------------|
| Spielerin | Will Gesundheit steuern, Intimdaten nicht teilen | Private Logs, Export/Löschen, PWA |
| Athletiktrainer | Braucht Belastungssteuerung ohne Art.-9-Konflikt | Ampel + Empfehlung, nie Rohdaten |
| Verein / Medizin | DOSB, DSGVO, Vertrauen | RLS + Masking + 1-Pager + AVV-Pfad |
| CyclesGuard (Business) | Club-Zugang vor Feature-Vollständigkeit | Pitch → Pilot → Paid |

**ICP jetzt:** Frauen-Bundesliga / 2. Liga Athletik + Sportmedizin (Start: Eintracht Frankfurt Frauen).

---

## 2. Product stages

```
Pitch-Ready ✅  →  Pre-Meeting  →  Soft-Pilot  →  Club Product  →  Multi-Tenant SaaS
   (jetzt)         (Termin)        (nach Ja)       (Saison 1)         (Scale)
```

### Stage A — Pitch-Ready ✅

- [x] App + Ampel + Offline + Logout  
- [x] Supabase + Seed  
- [x] Pitch-Docs + Outreach-Vorlagen  
- [x] GitHub + Vercel https://cyclesguard.vercel.app  
- [x] Smoke-Test  
- [ ] Founder: Auth Site URL prüfen + Termin anfragen (`docs/pitch/TERMIN-BEREIT.md`, `OUTREACH.md`)

**Exit:** Nachricht an Eintracht gesendet / Termin vereinbart.

### Stage B — Soft-Pilot

- Secrets rotiert, optional Custom Domain  
- 5–10 echte Freiwillige  
- Push optional live  
- Wöchentlicher Feedback-Call  
- AVV / TOM mit Vereins-DSB  

### Stage C — Club Product (Paid)

- Saisonvertrag, Support, Club-Admin Roster  
- Optional GPS mit separatem Consent  

### Stage D — Multi-Tenant SaaS

- Billing, Self-serve, Multi-Club, Observability  

---

## 3. Moat

1. Hard privacy (RLS DENY + server-side Ampel)  
2. Trainer-UX ohne medizinische Sprache  
3. Kabine-ready PWA  
4. Club-first GTM  

---

## 4. Pricing (Hypothese)

| Angebot | Preis | Wann |
|---------|-------|------|
| Soft-Pilot | 0 € / 8–12 Wochen | Jetzt anbieten |
| Club Season | Richtwert 2–5k € / Saison | Nach Pilot |
| Multi-Team | Custom | Nach 2+ Clubs |

---

## 5. Immediate queue

| Prio | Action |
|------|--------|
| **Jetzt** | `docs/pitch/OUTREACH.md` — Termin anfragen |  
| **Nach Ja** | Soft-Pilot P1 (AVV, echte Roster, Push) |  
| **Nicht jetzt** | Billing, GPS-ML, Multi-Tenant |

---

## 6. Decision log

| Decision | Why |
|----------|-----|
| Pitch before market-ready | Clubs kaufen Story + Demo + Angebot |
| Soft-Pilot free | Vertrauen vor Revenue |
| Ampel-only trainer | Compliance non-negotiable |
| Hobby Vercel crons daily | Plan-Limit; genug für Pitch |
