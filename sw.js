var CACHE='prompty-v7';
var FILES=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES)}));
  self.skipWaiting();
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(k){
    return Promise.all(k.filter(function(n){return n!==CACHE}).map(function(n){return caches.delete(n)}));
  }));
  self.clients.claim();
});
self.addEventListener('fetch',function(e){
  e.respondWith(caches.match(e.request).then(function(r){
    return r||fetch(e.request).catch(function(){return caches.match('./index.html')});
  }));
});
