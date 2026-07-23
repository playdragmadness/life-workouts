// Progression service worker — makes the app open offline.
// Strategy: network-first for the page (so you get updates when online,
// cached copy when offline); cache-first for static assets; and NEVER
// touch Supabase API calls (those are handled by the app's write queue).

// Bump this release identifier for each deployment. It keeps an installed app from
// mixing an old page with new scripts/assets.
const CACHE = "progression-v30";
const SHELL = [
  "./",
  "./index.html",
  "./config.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png",
  "./icon-maskable-512.png",
  "./progression-engine.js",
  "./calibration-engine.js",
  "./exercise-library.js",
  "./stretch-library.js",
  "./stretch-catalog.js",
  "./assets/stretches/doorway-chest-v3.png",
  "./assets/stretches/half-kneeling-hip-v3.png",
  "./assets/stretches/childs-pose-reach-v3.png",
  "./assets/stretches/cat-cow-v3.png",
  "./assets/stretches/wall-angels-v3.png",
  "./assets/stretches/seated-hamstring-v3.png",
  "./assets/stretches/wall-calf-v3.png",
  "./assets/stretches/figure-four-v3.png",
  "./assets/education-bone-comparison.png",
  "./assets/education-muscle-comparison.png",
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Only handle GETs. Let all writes / non-GET pass straight through.
  if (req.method !== "GET") return;

  // Never intercept Supabase API traffic (auth, database, functions).
  if (url.hostname.endsWith(".supabase.co")) return;

  const isShell = url.origin === self.location.origin || url.href.startsWith("https://cdn.jsdelivr.net/");
  if (!isShell) return;

  // HTML navigations: network-first (fresh when online), fall back to cache offline.
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    e.respondWith(
      fetch(req).then((res) => {
        if (!res.ok) return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((m) => m || caches.match("./index.html")))
    );
    return;
  }

  // Other shell assets: cache-first, update cache in the background.
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (!res.ok) return res;
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
