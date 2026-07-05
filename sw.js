const CACHE_NAME = 'dawamu-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/admin-dashboard.html',
  '/teacher-dashboard.html',
  '/parent-dashboard.html',
  '/dashboard.html',
  '/manage-subject.html',
  '/manage-bill.html',
  '/manage-library.html',
  '/manage-leaves.html',
  '/manage-timetable.html',
  '/generate-reports.html',
  '/sms-notifications.html',
  '/online-payments.html',
  '/analytics.html',
  '/graduation.html',
  '/images/Logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});
