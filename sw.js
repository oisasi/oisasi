/* OisasiOfficial Service Worker
 * - ページ本体（シェル）をキャッシュしておき、オフラインでの再読み込みでも
 *   ブラウザ標準のエラー画面ではなく自サイトのオフライン画面を表示できるようにする
 * - 更新時はキャッシュのバージョンを上げてください（CACHE_VERSION）
 */

const CACHE_VERSION = 'oisasi-shell-v1';

// 存在しないファイルがあってもインストールが失敗しないよう、
// 1つずつ catch して個別に無視する
const CORE_ASSETS = [
  './',
  './index.html',
  './faq.html',
  './oijiiw.html',
  './oijiizatu.html',
  './favicon-16.png',
  './favicon-32.png',
  './おいさしロゴ.png',
  './おいさし写真.png',
  './おいじぃ魔女.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch(() => {
            /* そのファイルが無い/取得できない場合は無視して続行 */
          })
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }
  const sameOrigin = url.origin === self.location.origin;

  // ページ遷移（HTMLの読み込み・再読み込み）は network-first。
  // ネットワークが無ければキャッシュ、それも無ければ index.html（オフライン画面を
  // 表示するシェル）を返し、ブラウザ標準のオフラインエラー画面を出さないようにする。
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (sameOrigin && res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(req)
            .then((cached) => cached || caches.match('./index.html') || caches.match('./'))
        )
    );
    return;
  }

  // クロスオリジン（Googleフォント等）はそのままネットワークに任せる
  if (!sameOrigin) return;

  // 同一オリジンのその他アセット（画像・アイコンなど）は
  // stale-while-revalidate：キャッシュを即返しつつ裏で更新
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
