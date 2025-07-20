// Service Worker pour Dungeon Crawler PWA
const CACHE_NAME = 'dungeon-crawler-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/js/main.js',
  '/js/game.js',
  '/js/utils.js',
  '/js/input.js',
  '/js/audio.js',
  '/js/particles.js',
  '/js/entities.js',
  '/js/items.js',
  '/js/dungeon.js',
  '/js/ui.js'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installation en cours...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('🔧 Service Worker: Mise en cache des ressources');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation terminée');
        // Force l'activation immédiate
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Erreur lors de l\'installation:', error);
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker: Activation en cours...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprimer les anciens caches
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Activation terminée');
      // Prendre le contrôle de tous les clients
      return self.clients.claim();
    })
  );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-HTTP (chrome-extension://, etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la ressource mise en cache si disponible
        if (response) {
          return response;
        }
        
        // Sinon, faire la requête réseau
        return fetch(event.request).then((response) => {
          // Vérifier si la réponse est valide
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Cloner la réponse
          const responseToCache = response.clone();
          
          // Ajouter au cache pour les futures requêtes
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // En cas d'erreur réseau, retourner une page d'erreur basique
          if (event.request.destination === 'document') {
            return new Response(
              `
              <!DOCTYPE html>
              <html>
              <head>
                <title>Hors ligne - Dungeon Crawler</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f1419 100%);
                    color: white;
                    margin: 0;
                    height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                  }
                  .offline-message {
                    max-width: 400px;
                    padding: 40px;
                  }
                  .icon { font-size: 4rem; margin-bottom: 20px; }
                  h1 { color: #ff6b6b; margin-bottom: 20px; }
                  p { margin-bottom: 30px; opacity: 0.8; }
                  button {
                    background: #4a9eff;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                  }
                  button:hover { background: #357abd; }
                </style>
              </head>
              <body>
                <div class="offline-message">
                  <div class="icon">📡</div>
                  <h1>Vous êtes hors ligne</h1>
                  <p>Le jeu Dungeon Crawler nécessite une connexion internet pour le premier chargement. Une fois mis en cache, vous pourrez y jouer hors ligne.</p>
                  <button onclick="window.location.reload()">Réessayer</button>
                </div>
              </body>
              </html>
              `,
              {
                headers: { 'Content-Type': 'text/html' }
              }
            );
          }
        });
      })
  );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Synchronisation en arrière-plan (pour les futures fonctionnalités)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Service Worker: Synchronisation en arrière-plan');
    // Ici vous pourriez synchroniser les scores, sauvegardes, etc.
  }
});

// Notifications push (pour les futures fonctionnalités)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nouvelle notification du jeu!',
      icon: '/manifest.json', // Utiliser l'icône du manifeste
      badge: '/manifest.json',
      vibrate: [100, 50, 100],
      data: data.url || '/',
      actions: [
        {
          action: 'open',
          title: 'Ouvrir le jeu'
        },
        {
          action: 'close',
          title: 'Fermer'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Dungeon Crawler', options)
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

console.log('🔧 Service Worker: Script chargé');