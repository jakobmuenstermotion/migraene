/* Begleit-Seite offline: Seite und Symbol liegen im iPhone. Öffnen geht sofort aus dem Speicher,
   mit Netz wird still die neueste Version für das nächste Öffnen geholt.
   Nur Dateien dieser Webseite – Anfragen an ntfy.sh laufen unverändert direkt ins Netz. */
var CACHE = 'mt-begleiter-mondgarten-76013ceb1e4c';
var FILES = ["./begleiter.html","./companion-garden.css","./companion-garden.js","./garden-assets-webp/daisy-final.webp","./garden-assets-webp/daisy-sheet.webp","./garden-assets-webp/fern-final.webp","./garden-assets-webp/fern-sheet.webp","./garden-assets-webp/hearts-final.webp","./garden-assets-webp/hearts-sheet.webp","./garden-assets-webp/lavender-final.webp","./garden-assets-webp/lavender-sheet.webp","./garden-assets-webp/lily-final.webp","./garden-assets-webp/lily-sheet.webp","./garden-assets-webp/monstera-final.webp","./garden-assets-webp/monstera-sheet.webp","./garden-assets-webp/pearls-final.webp","./garden-assets-webp/pearls-sheet.webp","./garden-assets-webp/pilea-final.webp","./garden-assets-webp/pilea-sheet.webp","./garden-assets-webp/pothos-final.webp","./garden-assets-webp/pothos-sheet.webp","./garden-assets-webp/rose-final.webp","./garden-assets-webp/rose-sheet.webp","./garden-modules/plant-renderer.js","./garden-modules/plants.js","./icon-180.png","./mondgarten/automation.mjs","./mondgarten/boutiques.mjs","./mondgarten/companion-bridge.mjs","./mondgarten/content.mjs","./mondgarten/controls.js","./mondgarten/core.mjs","./mondgarten/daily.mjs","./mondgarten/day-feedback.mjs","./mondgarten/day-rhythm.mjs","./mondgarten/economy.mjs","./mondgarten/funding.mjs","./mondgarten/game.js","./mondgarten/harvest.mjs","./mondgarten/icon.svg","./mondgarten/index.html","./mondgarten/journey.mjs","./mondgarten/lighting.mjs","./mondgarten/logistics.mjs","./mondgarten/money.mjs","./mondgarten/pad-design.mjs","./mondgarten/portrait.css","./mondgarten/scene.js","./mondgarten/snail-appearance.mjs","./mondgarten/snail-care.mjs","./mondgarten/snail-farm.mjs","./mondgarten/style.css","./mondgarten/upgrade-info.mjs","./mondgarten/vendor/THREE-LICENSE.txt","./mondgarten/vendor/three.core.js","./mondgarten/vendor/three.module.js","./mondgarten/village-content.mjs","./mondgarten/village.mjs","./mondgarten/woodcock.mjs"];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(FILES.map(function(f){ return c.add(f).catch(function(){}); }));
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k!==CACHE && k.indexOf('mt-begleiter-')===0; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method!=='GET') return;
  var url = new URL(req.url);
  if(url.origin!==self.location.origin) return;
  var key=FILES.find(function(f){return new URL(f,self.registration.scope).pathname===url.pathname;});
  if(!key)return;
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(key).then(function(hit){
      var net = fetch(req, {cache:'no-store'}).then(function(r){
        if(r && r.ok && r.type==='basic') c.put(key, r.clone());
        return r;
      });
      if(hit){ e.waitUntil(net.catch(function(){})); return hit; }
      return net.catch(function(){ return new Response('Offline – bitte einmal mit Internet öffnen.', {status:503, headers:{'Content-Type':'text/plain; charset=utf-8'}}); });
    });
  }));
});
