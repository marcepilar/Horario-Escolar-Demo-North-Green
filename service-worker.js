/* Horario Escolar DEMO North Green V1.0.25: actualización resistente a fallos de precarga. */
const PREFIX='horario-escolar-demo-north-green-v';
const CACHE=PREFIX+'1.0.25';
const SHELL=['./index.html','./manifest.webmanifest','./version.json'];
const OPTIONAL=['./','./icon-192.png','./icon-512.png','./icon-maskable-512.png',
  './apple-touch-icon.png','./qr-horario.png','./ayuda-android.png',
  './ayuda-iphone.png','./theme-blue-orb.png','./north-green-banner.png'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // La página principal es el único requisito para activar la nueva versión.
    await cache.add(new Request('./index.html',{cache:'reload'}));
    // Un archivo auxiliar faltante NO debe bloquear la actualización completa.
    await Promise.allSettled([...SHELL.slice(1),...OPTIONAL].map(url=>
      cache.add(new Request(url,{cache:'reload'}))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  // version.json siempre se consulta en la red para detectar nuevas versiones.
  if(url.pathname.endsWith('/version.json')){
    event.respondWith(fetch(new Request(req,{cache:'no-store'})).catch(()=>caches.match('./version.json')));
    return;
  }
  // Navegación online primero; offline usa el último HTML guardado.
  if(req.mode==='navigate'||url.pathname.endsWith('/index.html')){
    event.respondWith((async()=>{
      try{
        const response=await fetch(new Request(req,{cache:'no-store'}));
        if(response.ok){
          const c=await caches.open(CACHE);
          await c.put('./index.html',response.clone());
        }
        return response;
      }catch(_){
        return await caches.match('./index.html') || Response.error();
      }
    })());
    return;
  }
  // Manifest e iconos frescos cuando hay red; caché como respaldo.
  if(url.pathname.endsWith('/manifest.webmanifest') || /\/(?:icon-192|icon-512|icon-maskable-512|apple-touch-icon)\.png$/.test(url.pathname)){
    event.respondWith((async()=>{
      try{
        const response=await fetch(new Request(req,{cache:'no-store'}));
        if(response.ok){
          const c=await caches.open(CACHE);
          await c.put(req,response.clone());
        }
        return response;
      }catch(_){return await caches.match(req,{ignoreSearch:true}) || Response.error();}
    })());
    return;
  }
  // Resto de recursos: caché para conservar funcionamiento offline.
  event.respondWith((async()=>{
    const cached=await caches.match(req,{ignoreSearch:true});
    if(cached)return cached;
    const response=await fetch(req);
    if(response.ok){
      const c=await caches.open(CACHE);
      await c.put(req,response.clone());
    }
    return response;
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});
