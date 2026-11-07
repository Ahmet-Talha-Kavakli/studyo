/* Vayra Build bildirim servis çalışanı (yalnız tarayıcı bildirimleri; önbelleğe almaz, isteklere karışmaz).
   Kapsamı /panel/build/ (kök /sw.js uygulama kurulumu içindir, ikisi çakışmaz). Yük sunucuda aes128gcm ile
   şifrelenir; tarayıcı çözer ve burada { baslik, metin, adres, etiket } olarak gelir. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let v = {};
  try { v = e.data ? e.data.json() : {}; } catch (_) { v = { metin: e.data ? e.data.text() : "" }; }
  const baslik = v.baslik || "Vayra";
  e.waitUntil(self.registration.showNotification(baslik, {
    body: v.metin || "",
    icon: "/icon.png",
    badge: "/favicon-32.png",
    tag: v.etiket || undefined,
    renotify: !!v.etiket,
    data: { adres: v.adres || "/panel/build/sohbet", id: v.id },
    lang: "tr",
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const hedef = new URL((e.notification.data && e.notification.data.adres) || "/panel/build/sohbet", self.location.origin).href;
  e.waitUntil((async () => {
    const l = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of l) {
      if (c.url === hedef && "focus" in c) return c.focus();
    }
    for (const c of l) {
      if (new URL(c.url).origin === self.location.origin && "navigate" in c) { await c.focus(); return c.navigate(hedef); }
    }
    return self.clients.openWindow(hedef);
  })());
});

/* Tarayıcı aboneliği yenilerse (anahtar değişimi) sayfa açıldığında istemci yeniden kaydeder. */
self.addEventListener("pushsubscriptionchange", () => {});
