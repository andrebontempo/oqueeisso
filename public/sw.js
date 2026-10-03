const CACHE_NAME = 'oqueeisso-v3';
const STATIC_ASSETS = [
  '/',
  '/css/style.css',
  '/js/pwa.js',
  '/images/icons/icon-192.png',
  '/images/icons/icon-512.png',
  '/images/icons/favicon.png',
  '/manifest.json'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pré-carregando assets estáticos no cache');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Ativação do Service Worker e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de Requisições (Estratégia Network-First para HTML e Cache-First para Assets)
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não GET ou requisições para o backend de auth/pagamento
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Ignorar requisições externas ou da API de pagamentos/webhook
  if (url.origin !== location.origin || url.pathname.startsWith('/api/')) return;

  // Para navegação HTML (Network First)
  if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Copiar resposta válida para o cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // Se estiver offline, tenta retornar do cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('/');
          });
        })
    );
    return;
  }

  // Para assets estáticos (CSS, JS, Imagens - Cache First)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Busca versão atualizada em background para atualizar o cache (Stale While Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});
