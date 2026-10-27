// Fonctionnement hors ligne : tout le chantier (plans compris) est gardé sur le téléphone.
const CACHE = 'plans-v2.0.1';
const FILES = ["./", "index.html", "styles.css", "app.js", "data.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png", "plans/appart_EA.jpg", "plans/appart_EB.jpg", "plans/appart_EC.jpg", "plans/appart_ED.jpg", "plans/appart_EE.jpg", "plans/appart_EF.jpg", "plans/appart_EG.jpg", "plans/appart_EH.jpg", "plans/appart_RA.jpg", "plans/appart_RB.jpg", "plans/appart_RC.jpg", "plans/appart_RD.jpg", "plans/appart_RE.jpg", "plans/appart_RF.jpg", "plans/appart_TA.jpg", "plans/appart_TB.jpg", "plans/appart_TC.jpg", "plans/appart_TD.jpg", "plans/appart_TE.jpg", "plans/appart_TF.jpg", "plans/niveau_e23.jpg", "plans/niveau_e4.jpg", "plans/niveau_rdc.jpg"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // réseau d'abord (mises à jour), sinon la copie gardée : le chantier n'a pas toujours de réseau
  e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); return r; }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
