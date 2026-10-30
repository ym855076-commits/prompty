var CACHE='prompty-v10';
var FILES=['./','index.html','manifest.json','icon-192.png'];
self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(FILES.map(function(f){return c.add(f).catch(function(){})}));
  }));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(function(hit){
    var net=fetch(e.request).then(function(r){
      if(r&&r.ok&&e.request.url.indexOf(self.location.origin)===0){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,cp)})}
      return r;
    }).catch(function(){return hit});
    return hit||net;
  }));
});
