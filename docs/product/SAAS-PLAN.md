# CyclesGuard — SaaS Product Plan (CTO)

**Stand:** 21.07.2026  
**Repo:** https://github.com/mdacoding/cyclesguard  
**North star:** Privacy-first readiness platform for women’s football clubs in DACH → later EU.

This document is the **product** lens. Day-to-day pitch execution lives in [`../sprints/00-ROADMAP.md`](../sprints/00-ROADMAP.md).

---

## 1. Problem → Product

| Stakeholder | Problem | CyclesGuard value |
|-------------|---------|-------------------|
| Spielerin | Will Gesundheit steuern, Intimdaten nicht teilen | Private Logs, Export/Löschen, PWA |
| Athletiktrainer | Braucht Belastungssteuerung ohne Art.-9-Konflikt | Ampel + Empfehlung, nie Rohdaten |
| Verein / Medizin | DOSB, DSGVO, Vertrauen | RLS + Masking + 1-Pager + AVV-Pfad |
| CyclesGuard (Business) | Club-Zugang vor Feature-Vollständigkeit | Pitch → Pilot → Paid |

**ICP (Ideal Customer Profile) jetzt:** Frauen-Bundesliga / 2. Liga Athletik + Sportmedizin (Start: Eintracht Frankfurt Frauen).  
**Nicht-ICP jetzt:** Consumer-Apps, gemischte Geschlechter-Teams, GPS-first Sales.

---

## 2. Product stages

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Pitch-Ready│ →  │ Soft-Pilot  │ →  │ Club Product│ →  │ Multi-Tenant│
│  (Woche 0)  │    │ (8–12 Wo.)  │    │ (Saison 1)  │    │  SaaS Scale │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
   Live-Demo          Feedback           Vertrag            Billing
   1 Club story       5–10 Spielerinnen  Domains/AVV        Multi-club
```

### Stage A — Pitch-Ready (aktuell)

**Definition of Done**

- [x] App-Logik + Ampel + Offline-Grundlage  
- [x] Supabase Cloud + Migrationen + Seed  
- [x] Pitch-Docs (Skript, Datenschutz, Angebot)  
- [x] GitHub `mdacoding/cyclesguard`  
- [ ] **Öffentliche Vercel-URL** ← einziger P0-Blocker  
- [ ] Smoke-Test auf Prod-URL  
- [ ] Auth Site URL auf Vercel-Domain  

**Exit:** Termin bei Eintracht mit live Ampel möglich.

### Stage B — Soft-Pilot

**Definition of Done**

- Domäne / stabile Prod-Env, Secrets rotiert  
- Trainer-Onboarding genutzt (Doc bereits da)  
- Push-Reminder live (optional aber empfohlen)  
- Wöchentlicher Feedback-Call (Template da)  
- AVV-Entwurf + TOM-Liste mit Vereins-DSB  

**Exit:** ≥70 % Adherence, Trainer nutzt Ampel, kein Privacy-Vorfall.

### Stage C — Club Product (Paid)

- Saison-/Jahresvertrag, klare SLA  
- Club-Admin Roster (bereits Basis)  
- Support-Kanal, Status-Page light  
- Optional GPS/Wearable mit separatem Consent  

### Stage D — Multi-Tenant SaaS

- Billing (Stripe o.ä.), Org-Isolation härten  
- Self-serve Onboarding, Multi-Club Admin  
- Observability, CI-Deploy Pipelines  
- Marketplace-Features nur nach Nachfrage  

---

## 3. Moat (warum wir gewinnen)

1. **Hard privacy architecture** — RLS DENY + server-side aggregation, nicht nur Policy-Text  
2. **Trainer UX ohne medizinische Sprache** — DOSB-tauglich  
3. **Kabine-ready** — PWA/Offline-Story für Stadion-WLAN  
4. **Club-first GTM** — ein Referenzclub schlägt Feature-Liste  

---

## 4. Pricing (Hypothese — nicht im Pitch verkaufen)

| Angebot | Preisrichtung | Wann |
|---------|---------------|------|
| Soft-Pilot | **0 €** / 8–12 Wochen | Jetzt |
| Club Season | 2–5k € / Saison (Richtwert) | Nach Pilot |
| Liga / Multi-Team | Custom | Nach 2+ Clubs |

Pitch verkauft **Pilot + Vertrauen**, nicht Preis.

---

## 5. Metrics (nach Pilot-Start)

| Metric | Target Pilot |
|--------|--------------|
| Weekly active players / invited | ≥70 % |
| Trainer dashboard opens / week | ≥3 |
| NO_DATA share | sinkend |
| Privacy incidents (trainer saw raw) | **0** |
| NPS / „würden wir weiterempfehlen“ | ≥4/5 |

---

## 6. Tech boundaries (SaaS)

| Keep in product | Defer until paid/pilot+ |
|-----------------|-------------------------|
| Frontend + Supabase Auth/RLS | Billing |
| Trainer Ampel API | Live GPS ML |
| Consent / Export / Delete | Multi-region |
| Vercel + EU region | Custom domains per club (nice) |
| Ingestion service (code ready) | Production GPS ops |

---

## 7. Immediate execution queue (priority)

| Prio | Action | Owner | Outcome |
|------|--------|-------|---------|
| **P0** | Vercel import from GitHub, Root `cyclesguard-frontend` | Founder | Live URL |
| **P0** | Env + Auth redirects | Founder | Login works on prod |
| **P0** | Smoke + Demo rehearsal | Founder | Pitch confidence |
| **P0** | Rotate Supabase secret if exposed in chat/logs | Founder | Security hygiene |
| **P1** | Custom domain (optional) | Founder | Brand |
| **P1** | Push cron live | Eng | Adherence |
| **P2** | AVV + TOM | Founder + counsel | Soft-Pilot legal |

---

## 8. Decision log (CTO)

| Decision | Why |
|----------|-----|
| Pitch before “market-ready” | Clubs buy story + demo + offer |
| No billing until pilot proof | Trust > revenue early |
| Ampel-only trainer surface | Non-negotiable compliance |
| Monorepo on GitHub | Vercel + CI path clear |
| Ingestion not required for pitch | Reduces ops risk |

---

*Update this file when a stage gate flips. Sprint detail stays in `docs/sprints/`.*
