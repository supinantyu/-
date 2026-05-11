const CACHE_NAME = "kuu-reading-timer-v14-1";

const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./kuu_waiting.png",
  "./kuu_waiting_1.png",
  "./kuu_waiting_2.png",
  "./kuu_waiting_3.png",
  "./kuu_waiting_4.png",
  "./kuu_waiting_meal.png",
  "./kuu_waiting_brush.png",
  "./kuu_waiting_sleepy_night.png",
  "./kuu_waiting_cosplay_bunny.png",
  "./kuu_waiting_cosplay_nurse.png",
  "./kuu_waiting_cosplay_cheer.png",
  "./kuu_waiting_cosplay_magical.png",
  "./kuu_reading.png",
  "./kuu_recording.png",
  "./genre-mystery.png",
  "./genre-sf.png",
  "./genre-youth.png",
  "./genre-shinsho.png",
  "./genre-horror.png",
  "./genre-lightnovel.png",
  "./genre-fantasy.png",
  "./bg-common.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
