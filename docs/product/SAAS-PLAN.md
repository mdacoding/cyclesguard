# CyclesGuard — SaaS Product Plan (CTO)

**Stand:** 22.07.2026  
**Repo:** https://github.com/mdacoding/cyclesguard  
**Live:** https://cyclesguard.vercel.app  
**North star:** Privacy-first readiness platform for women’s football clubs in DACH → later EU.

**Finish plan (≤4 Wochen):** [`FINISH-PLAN-4W.md`](./FINISH-PLAN-4W.md) · Day-to-day: [`../sprints/00-ROADMAP.md`](../sprints/00-ROADMAP.md).

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
Pitch-Ready ✅ → Soft-Pilot Tech ✅ → Club Product Paid-Ready (4W Exit) → Multi-Tenant SaaS
```

### Stage A — Pitch-Ready ✅

- [x] App + Ampel + Offline + Logout  
- [x] Supabase + Seed + Vercel  
- [x] Pitch-Docs + Outreach  
- [ ] Founder: Auth Site URL + Termin anfragen  

### Stage B — Soft-Pilot (technisch vorbereitet ✅)

- [x] Invite / Callback / Runbook / AVV-Entwurf / CI  
- [ ] Nach Ja: Secrets rotieren, Demo-Mode off, AVV unterschreiben  

### Stage C — Club Product → **Exit „fertig“**

- [x] Admin Invite / CSV / Saison / Audit / Insights / Landing / GPS-Bridge-Docs  
- [x] Season commercial fields (manuell, ohne Stripe)  
- [x] Support-Pfad dokumentiert  
- [ ] AVV unterschrieben + Sentry DSN + Soft-Pilot Proof  
- [ ] Optional GPS live mit Club-Tracker  

**Exit-Kriterien:** siehe `FINISH-PLAN-4W.md` / `00-ROADMAP.md`.

### Stage D — Multi-Tenant SaaS (nach Exit)

- Stripe / Self-serve / Multi-Club Marketplace / advanced Observability  

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
| Soft-Pilot | 0 € / 8–12 Wochen | Jetzt |
| Club Season | 2–5k € / Saison | Nach Pilot (manual contract) |
| Multi-Team | Custom | Nach 2+ Clubs |

---

## 5. Immediate queue

| Prio | Action |
|------|--------|
| **Engineering** | 4W-Plan W1 Harden (diese Iteration) → W2 Compliance Support |
| **Founder** | Outreach + Sentry DSN + AVV-Pfad |
| **Nicht jetzt** | Stripe, GPS-ML, Self-Serve Multi-Tenant |

---

## 6. Decision log

| Decision | Why |
|----------|-----|
| Pitch before market-ready | Clubs kaufen Story + Demo + Angebot |
| Soft-Pilot free | Vertrauen vor Revenue |
| Ampel-only trainer | Compliance non-negotiable |
| Manual season contract before Stripe | Paid-ready ohne Payment-Komplexität |
| Scope Freeze in Woche 4 | Fertigstellung schützt vor Feature-Creep |
| Hobby Vercel crons daily | Plan-Limit; genug für Pitch/Pilot |
