# CyclesGuard — SaaS Product Plan (CTO)

**Stand:** 22.07.2026  
**Repo:** https://github.com/mdacoding/cyclesguard  
**Live:** https://cyclesguard.vercel.app  
**North star:** Privacy-first readiness platform for women’s football clubs in DACH → later EU.

**Führende Timeline (realistisch):** [`FINISH-PLAN.md`](./FINISH-PLAN.md)  
**M1 Engineering-Detail:** [`FINISH-PLAN-4W.md`](./FINISH-PLAN-4W.md) · Day-to-day: [`../sprints/00-ROADMAP.md`](../sprints/00-ROADMAP.md).

> **Hinweis:** 4–6 Wochen gelten nur für **M1 tech-ready**. Soft-Pilot (8–12 Wochen) + erster bezahlter Club + Multi-Tenant brauchen **Monate**, nicht Wochen.

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
Pitch-Ready ✅ → Soft-Pilot Tech ✅ → M1 tech-ready → Soft-Pilot (8–12 W) → M2 Paid Club → M3 Multi-Tenant SaaS
```

### Stage A — Pitch-Ready ✅

- [x] App + Ampel + Offline + Logout  
- [x] Supabase + Seed + Vercel  
- [x] Pitch-Docs + Outreach  
- [ ] Founder: Auth Site URL + Termin anfragen  

### Stage B — Soft-Pilot (technisch vorbereitet ✅ · Laufzeit 8–12 Wochen)

- [x] Invite / Callback / Runbook / AVV-Entwurf / CI  
- [ ] Nach Ja: Secrets rotieren, Demo-Mode off, AVV unterschreiben, Pilot fahren  

### Stage C — Club Product (M1 tech ~fertig · M2 = bezahlter Club)

- [x] Admin Invite / CSV / Saison / Audit / Insights / Landing / GPS-Bridge-Docs  
- [x] Season commercial fields (manuell, ohne Stripe)  
- [x] Support-Pfad dokumentiert  
- [ ] AVV + Sentry + Soft-Pilot Proof → **erster bezahlter Vertrag (M2, Monate)**  
- [ ] Optional GPS live mit Club-Tracker  

### Stage D — Multi-Tenant SaaS (**M3, nach M2**)

- Stripe / Self-serve / Multi-Club Marketplace / advanced Observability  

**Timeline-Wahrheit:** siehe [`FINISH-PLAN.md`](./FINISH-PLAN.md).

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
| **Kritischer Pfad** | Outreach / Termin (`OUTREACH.md`) — bestimmt M2 |
| **Engineering** | M1 Rest (Sentry/RLS Dry-Run), dann nur Pilot-Feedback |
| **Legal** | AVV/DSB früh |
| **Nicht jetzt** | Stripe, Self-Serve Multi-Tenant (M3) |

---

## 6. Decision log

| Decision | Why |
|----------|-----|
| Pitch before market-ready | Clubs kaufen Story + Demo + Angebot |
| Soft-Pilot free | Vertrauen vor Revenue |
| Ampel-only trainer | Compliance non-negotiable |
| Scope Freeze in Woche 4 | Nur für **M1**-Polish, nicht Gesamt-SaaS |
| Soft-Pilot 8–12 Wochen | Vertrauen; deshalb M2 = Monate |
| Manual season contract before Stripe | Paid-ready ohne Payment-Komplexität |
| Hobby Vercel crons daily | Plan-Limit; genug für Pitch/Pilot |
