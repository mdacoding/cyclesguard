# CyclesGuard — SaaS Product Plan (CTO)

**Stand:** 24.07.2026  
**Repo:** https://github.com/mdacoding/cyclesguard  
**Live:** https://cyclesguard.vercel.app  
**North star:** Privacy-first readiness platform for women’s football clubs in DACH → later EU.

**Nordstern Launch (max. Erfolg):** [`LAUNCH-PLAN.md`](./LAUNCH-PLAN.md)  
**Zeitachsen:** [`FINISH-PLAN.md`](./FINISH-PLAN.md) · Day-to-day: [`../sprints/00-ROADMAP.md`](../sprints/00-ROADMAP.md).

> Produktstrategie: **bestmögliches Launch-Feature-Set** (Trainer-Kabine, Pilot-KPIs, Onboarding, Trust). Soft-Pilot/GTM parallel. Stripe/Self-Serve nach Proof — außer Closing verlangt es früher.

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
- [ ] Founder: Auth Site URL + Redirects einmal in Dashboard abhaken (`TERMIN-BEREIT.md` §1)
- [ ] Founder: Termin anfragen / Outreach (`OUTREACH-TRACKING.md`)  

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
| **Pilot Day-1 (Eng)** | Kabine Empty-State · Admin First-Run Trainer-Check · verify-hardening |
| **Kritischer Sales-Pfad** | Outreach / Termin (`OUTREACH-TRACKING.md`) |
| **Legal** | AVV/DSB bei Club-Adresse · Auth-Mail-Templates im Dashboard (`AUTH-EMAIL-TEMPLATES.md`) |
| **Nach Proof (L4)** | Stripe, Self-Serve Multi-Tenant |

**Stand Eng 24.07.:** L1–L3 ✅ · Ampel-Allowlist ✅ · Rate-Limit 018 ✅ · `/spielerinnen-info` live ✅ · Prod-Build grün

---

## 6. Decision log

| Decision | Why |
|----------|-----|
| Pitch before market-ready | Clubs kaufen Story + Demo + Angebot |
| Soft-Pilot free | Vertrauen vor Revenue |
| Ampel-only trainer | Compliance non-negotiable |
| Launch vor Minimal-Exit | Maximaler Demo-/Pilot-Erfolg schlägt Feature-Freeze |
| Soft-Pilot 8–12 Wochen | Vertrauen; Sales-Kalender unabhängig von Eng-Sprints |
| Manual season contract before Stripe | Closing ohne Payment-Komplexität |
| Hobby Vercel crons daily | Plan-Limit; genug für Pitch/Pilot |
