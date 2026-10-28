var CACHE='prompty-v16';
var FILES=['./','./index.html','./addon.js','./manifest.json','./icon-192.png','./icon-512.png'];
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
/* Подключает addon.js к странице автоматически, index.html править не нужно */
function inject(res){
  return res.text().then(function(t){
    if(t.indexOf('addon.js')<0){
      var i=t.lastIndexOf('</body>');
      if(i>-1)t=t.slice(0,i)+'<script src="addon.js" defer></script>'+t.slice(i);
    }
    return new Response(t,{status:200,headers:{'Content-Type':'text/html; charset=utf-8'}});
  });
}
self.addEventListener('fetch',function(e){
  var req=e.request,u=new URL(req.url);
  var isDoc=u.origin===self.location.origin&&(req.mode==='navigate'||/\/(index\.html)?$/.test(u.pathname));
  e.respondWith(caches.match(req).then(function(r){
    var p=r?Promise.resolve(r):fetch(req).catch(function(){return caches.match('./index.html')});
    return p.then(function(res){return isDoc&&res?inject(res.clone()):res});
  }));
});
