/* Begleit-Seite offline: Seite und Symbol liegen im iPhone. Öffnen geht sofort aus dem Speicher,
   mit Netz wird still die neueste Version für das nächste Öffnen geholt.
   Nur Dateien dieser Webseite – Anfragen an ntfy.sh laufen unverändert direkt ins Netz. */
var CACHE = 'mt-begleiter-v1';
var FILES = ['./begleiter.html', './icon-180.png'];

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
  var isPage = /begleiter\.html$/.test(url.pathname);
  var isIcon = /icon-180\.png$/.test(url.pathname);
  if(!isPage && !isIcon) return;
  var key = isPage ? './begleiter.html' : './icon-180.png';
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
