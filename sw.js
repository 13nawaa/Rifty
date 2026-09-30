const CACHE_NAME='rifty-beta-v3';
const APP_SHELL=[
  './',
  './index.html',
  './style.css',
  './polish.css',
  './motion.css',
  './profile-settings.css',
  './app.js',
  './progress.js',
  './profile.js',
  './auth-config.js',
  './auth.js',
  './community.js',
  './icons.js',
  './manifest.webmanifest',
  './assets/logo-custom.png',
  './app-icon-192.png',
  './app-icon-512.png',
  './assets/google.svg',
  './assets/fonts/Damion-Regular.ttf',
  './avatars/bernth.jpg',
  './avatars/carl.jpg',
  './avatars/facile.jpg',
  './avatars/florent.jpg',
  './avatars/galago.jpg',
  './avatars/guitarcook.jpg',
  './avatars/hg.jpg',
  './avatars/impro.jpg',
  './avatars/judge.jpg',
  './avatars/justin.jpg',
  './avatars/marty.jpg',
  './avatars/my.jpg',
  './avatars/neo.jpg',
  './avatars/paul.jpg',
  './avatars/pickup.jpg',
  './avatars/romain.jpg',
  './avatars/saturax.jpg'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith('rifty-')&&key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request)
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy));
          return response;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request,{ignoreSearch:true}).then(cached=>{
      const fresh=fetch(request).then(response=>{
        if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()));
        return response;
      }).catch(()=>cached);
      return cached||fresh;
    })
  );
});
