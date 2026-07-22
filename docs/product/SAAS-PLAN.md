# CyclesGuard — SaaS Product Plan (CTO)

**Stand:** 22.07.2026  
**Repo:** https://github.com/mdacoding/cyclesguard  
**Live:** https://cyclesguard.vercel.app  
**North star:** Privacy-first readiness platform for women’s football clubs in DACH → later EU.

Day-to-day: [`../sprints/00-ROADMAP.md`](../sprints/00-ROADMAP.md).

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
Pitch-Ready ✅  →  Pre-Meeting  →  Soft-Pilot (48h-ready) ✅  →  Club Product  →  Multi-Tenant SaaS
```

### Stage A — Pitch-Ready ✅

- [x] App + Ampel + Offline + Logout  
- [x] Supabase + Seed + Vercel  
- [x] Pitch-Docs + Outreach  
- [ ] Founder: Auth Site URL + Termin anfragen  

**Exit:** Nachricht an Eintracht gesendet / Termin vereinbart.

### Stage B — Soft-Pilot (technisch vorbereitet ✅)

- [x] Invite Neu + bestehende User → Roster  
- [x] Auth-Callback Membership + Consent-Routing  
- [x] Pilot-Runbook / Push-Live / AVV-Entwurf / RLS-Checkliste  
- [x] CI lint + tests + public E2E; optional Sentry  
- [ ] Nach Ja: Secrets rotieren, Demo-Mode off, echte Freiwillige, AVV unterschreiben  

### Stage C — Club Product (Paid)

- [x] Club-Admin E-Mail-Invite + Saison-Setup + Audit-CSV  
- [x] Player Insights / Reminder-Prefs / Landing  
- [x] GPS Bridge Lookback + Deploy-Doc + Session-Card  
- [ ] Saisonvertrag, Support, AVV unterschrieben  
- [ ] Optional GPS live mit Club-Tracker  

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
| **Jetzt** | Outreach (`OUTREACH.md`) |
| **Nach Ja** | `PILOT-RUNBOOK.md` durchziehen |
| **Nicht jetzt** | Billing, GPS-ML, Multi-Tenant |

---

## 6. Decision log

| Decision | Why |
|----------|-----|
| Pitch before market-ready | Clubs kaufen Story + Demo + Angebot |
| Soft-Pilot free | Vertrauen vor Revenue |
| Ampel-only trainer | Compliance non-negotiable |
| Existing-user roster add | Pilot darf nicht an „already registered“ scheitern |
| Hobby Vercel crons daily | Plan-Limit; genug für Pitch/Pilot |
