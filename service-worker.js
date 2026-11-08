/* Horario Escolar PWA v1.4.31 — actualizaciones y uso sin conexión */
const PREFIX = 'horario-escolar-v';
const CACHE = PREFIX + '1.4.31';
const CORE = ['./','./index.html','./manifest.webmanifest','./version.json',
 './icon-192.png','./icon-512.png','./apple-touch-icon.png','./qr-horario.png','./ayuda-android.png','./ayuda-iphone.png','./theme-blue-orb.png','./chesterton-banner.png?v=1.4.31','./chesterton-shield.png','./icon-maskable-512.png'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
   keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k))
 )).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(req.mode==='navigate'||url.pathname.endsWith('/index.html')){
   event.respondWith(fetch(req).then(response=>{
     if(response.ok){const c=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,c)));}
     return response;
   }).catch(async()=>await caches.match(req)||await caches.match('./index.html')));
   return;
 }
 event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
  if(response.ok){const c=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(req,c)));}
  return response;
 })));
});

self.addEventListener('message',event=>{ if(event.data && event.data.type==='SKIP_WAITING') self.skipWaiting(); });
