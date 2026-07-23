# Push Live — Soft-Pilot Setup

Tägliche Reminder ohne medizinische Inhalte in der OS-Vorschau.

---

## 1. Keys erzeugen (lokal)

```bash
cd cyclesguard-frontend
npx web-push generate-vapid-keys
```

Ausgabe → in Vercel **Production** (und Preview falls nötig):

| Env | Wert |
|-----|------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public Key |
| `VAPID_PRIVATE_KEY` | Private Key |
| `CRON_SECRET` | langes Zufallsgeheimnis (z. B. `openssl rand -hex 32`) |

Redeploy nach Env-Änderung.

---

## 2. Cron

In `vercel.json`:

- Pfad: `/api/cron/daily-reminders`
- Schedule: `0 6 * * *` (UTC ≈ 08:00 Berlin Sommerzeit / 07:00 Winterzeit)

Vercel sendet `Authorization: Bearer <CRON_SECRET>`.

Testen (automatisiert — prüft alle 3 Cron-Routen + 401-ohne-Auth):

```bash
cd cyclesguard-frontend
CRON_SECRET=*** npm run verify:cron -- https://cyclesguard.vercel.app
```

Manuell (Fallback):

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  https://cyclesguard.vercel.app/api/cron/daily-reminders
```

Erwartung: JSON `{ "ok": true, "sent": N, "failed": …, "pruned": … }`

---

## 3. Gerätetest

1. Spielerin: App auf Homescreen (iOS Safari → Teilen → Zum Home-Bildschirm)  
2. Settings → **Erinnerungen aktivieren** → Browser-Permission erlauben  
3. Cron manuell triggern **oder** warten bis Schedule  
4. Notification-Text prüfen: nur „Readiness für heute“ — **kein** Zyklus-/Menstruationswort  

Skip-Logik: Wer heute schon geloggt hat, bekommt keinen Reminder.

---

## 4. Troubleshooting

| Symptom | Check |
|---------|--------|
| 401 vom Cron | `CRON_SECRET` mismatch Vercel ↔ Header |
| 500 „VAPID keys“ | Keys fehlen / Redeploy vergessen |
| Keine Notification | Permission denied; iOS ohne PWA; Subscription tot (410 → auto-prune) |
| CSP/connect errors | `connect-src` muss Push-Endpoint erlauben (Browser-seitig OK) |

---

## 5. Opt-out

Settings → Erinnerungen deaktivieren → Subscription wird gelöscht.  
Retention-Cron entfernt Subscriptions älter als 180 Tage.

---

## 6. Sign-off (Launch Trust)

| Check | Done |
|-------|------|
| B1 VAPID/CRON_SECRET in Vercel Production | ☐ Founder |
| B2 Cron erreichbar + korrekt | ✅ Script `npm run verify:cron` — einmal gegen Prod ausführen |
| B3 Gerätetest ohne Zyklus-/Menstruationswort | ☐ Tech (manuell, Gerät nötig) |
| Skip-Wochenende Preferenzen (Settings) | ☐ Tech |

**Verifiziert von:** _____________ **Datum:** _______
