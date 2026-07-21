# CyclesGuard Retention Policy (CTO Decision Sprint 9)

| Datensatz | Aufbewahrung | Löschung |
|-----------|--------------|----------|
| `cycle_logs` | Solange Account aktiv | Sofort bei Art. 17 Delete |
| `player_consents` | 3 Jahre nach Widerruf/Delete (Nachweis) — Pilot: mit Account | Mit Account |
| `push_subscriptions` | Bis Opt-out oder 180 Tage inaktiv | Cron `/api/cron/retention` |
| `session_summaries` | Solange Account aktiv | Sofort bei Delete (Cascade) |
| `athlete_links` | Solange Account aktiv | Sofort bei Delete |
| `gps_metrics` / quarantine | Solange Account aktiv | Sofort via Ingestion `DELETE /internal/players/{id}` |
| Team-Aggregate ohne Personenbezug | Vereinsstatistik | Dürfen anonymisiert bleiben |

**Prinzip:** Roh-GPS und Zyklus-Rohdaten werden bei Account-Löschung vollständig entfernt. Trainer sehen niemals Rohdaten — nur Readiness-/Load-Enums.
