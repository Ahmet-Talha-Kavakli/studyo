/* Vayra servis çalışanı — yalnızca "uygulama olarak yükle" için. Önbelleğe ALMAZ: her istek ağa gider,
   çevrimdışıyken gezinme isteklerine kısa bir bilgilendirme sayfası döner. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(
    fetch(e.request).catch(
      () => new Response(
        '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Çevrimdışı · Vayra</title>' +
        '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0f131a;color:#e9eef5;font-family:system-ui,sans-serif;text-align:center">' +
        '<div><p style="font-size:20px;font-weight:600;margin:0">İnternet bağlantısı yok</p><p style="color:#8693a5;margin:8px 0 18px">Bağlantı gelince sayfayı yenile.</p>' +
        '<button onclick="location.reload()" style="border:0;border-radius:999px;padding:10px 18px;background:#e9eef5;color:#0f131a;font-weight:600;cursor:pointer">Yenile</button></div></body>',
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      ),
    ),
  );
});
