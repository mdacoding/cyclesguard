/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';
import {
  DAILY_REMINDER_BODY,
  DAILY_REMINDER_TITLE,
  pushPayloadIsCoachSafe,
} from '../lib/push/payload';
import { flushOutbox, OUTBOX_SYNC_TAG } from '../lib/offline/outbox';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener('push', (event) => {
  const payload = event.data?.json() as
    | { title?: string; body?: string }
    | undefined;

  const title = payload?.title ?? DAILY_REMINDER_TITLE;
  const body = payload?.body ?? DAILY_REMINDER_BODY;
  // Defense in depth: never show medical wording even if a bad payload arrives.
  const safe =
    pushPayloadIsCoachSafe(JSON.stringify({ title, body })) &&
    pushPayloadIsCoachSafe(body);

  event.waitUntil(
    self.registration.showNotification(safe ? title : DAILY_REMINDER_TITLE, {
      body: safe ? body : DAILY_REMINDER_BODY,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'cyclesguard-daily',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/player/dashboard');
    })
  );
});

// Chromium Background Sync: flush IndexedDB outbox when connectivity returns (tab may be closed).
self.addEventListener('sync', (event) => {
  const syncEvent = event as Event & { tag: string; waitUntil: (p: Promise<unknown>) => void };
  if (syncEvent.tag !== OUTBOX_SYNC_TAG) return;
  syncEvent.waitUntil(
    flushOutbox().then(async (result) => {
      if (result.synced === 0) return;
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: 'OUTBOX_FLUSHED', ...result });
      }
    })
  );
});
