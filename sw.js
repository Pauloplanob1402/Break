/* ============================================================
   BREAK — Service Worker v2
   Estratégia: Cache-First + Notificações Locais
   ============================================================ */

const CACHE_NAME = 'break-v2';

const ASSETS = [
  '/',
  '/index.html',
  '/breaks.json',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap'
];

/* ── Instalação ── */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .catch(() => {}) /* não falha se algum asset offline */
  );
  self.skipWaiting();
});

/* ── Ativação: remove caches antigos ── */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch: Cache-First com fallback de rede ── */
self.addEventListener('fetch', e => {
  /* Só intercepta GET */
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === 'opaque') return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          return response;
        })
        .catch(() => {
          /* Fallback para navegação offline */
          if (e.request.destination === 'document') return caches.match('/index.html');
        });
    })
  );
});

/* ══════════════════════════════════════
   NOTIFICAÇÕES LOCAIS
   - 100% client-side, zero servidor
   - Agenda diariamente às 8h
══════════════════════════════════════ */

let notifTimer = null;

function scheduleDaily() {
  if (notifTimer) clearTimeout(notifTimer);

  const now    = new Date();
  const target = new Date(now);
  target.setHours(8, 0, 0, 0);

  /* Se já passou das 8h hoje, agenda para amanhã */
  if (target <= now) target.setDate(target.getDate() + 1);

  const delay = target - now;

  notifTimer = setTimeout(async () => {
    try {
      await self.registration.showNotification('BREAK', {
        body: 'Hoje você vai quebrar ou repetir o padrão?',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'break-daily',
        renotify: false,
        silent: false,
        vibrate: [200, 100, 200],
      });
    } catch (_) {}

    /* Reagenda para o dia seguinte */
    scheduleDaily();
  }, delay);
}

/* Mensagem do app principal para agendar notificação */
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIF') {
    scheduleDaily();
  }
});

/* Clique na notificação: abre o app */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('/');
    })
  );
});
