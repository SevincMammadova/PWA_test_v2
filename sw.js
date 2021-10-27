const STATIC_CACHE = 'STATIC_CACHE';
const DYNAMIC_CACHE = 'DYNAMIC_CACHE';

const staticCacheUrls = [
    '/',
    './index.html',
    './index.css',
    './index.js',
    './offline.html'
]

self.addEventListener('install', async event => {
    console.log('install', event)
    const cache = await caches.open(STATIC_CACHE)
    await cache.addAll(staticCacheUrls)
})

self.addEventListener('activate', async event => {
    const cacheNames = await caches.keys()
    await Promise.all(
        cacheNames
            .filter(name => name !== STATIC_CACHE)
            .filter(name => name !== DYNAMIC_CACHE)
            .map(name => caches.delete(name))
    )
})

self.addEventListener('fetch', event => {
    const {request} = event

    const url = new URL(request.url)
    if (url.origin === location.origin) {
        event.respondWith(cacheFirst(request))
    } else {
        event.respondWith(networkFirst(request))
    }
})


async function cacheFirst(request) {
    const cached = await caches.match(request)
    return cached ?? await fetch(request)
}

async function networkFirst(request) {
    const cache = await caches.open(DYNAMIC_CACHE)
    try {
        const response = await fetch(request)
        await cache.put(request, response.clone())
        return response
    } catch (e) {
        const cached = await cache.match(request)
        return cached ?? await caches.match('/offline.html')
    }
}