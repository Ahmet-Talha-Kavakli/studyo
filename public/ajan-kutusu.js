/*
 * Vayra Build ajan kutusu. Kullanım:
 *   <script src="https://<vayra>/ajan-kutusu.js" data-ajan="AJAN_KIMLIGI" async></script>
 * Köşede (sağ ya da sol) ajanın düğmesi çıkar: simge, etiketli hap ya da özel görsel. İstenirse birkaç saniye sonra
 * karşılama balonu görünür. Tıklayınca sohbet kutusu açılır (iframe, sitenin stilini etkilemez). Ayarlar ajanın
 * yayın panelinden gelir; izinli alan adları dışında kutu hiç çıkmaz.
 * data-ortam="deneme": canlı yerine deneme ortamındaki sürüm. Giriş yapmış kullanıcıyı tanıtmak için (kanallar arası
 * tek kişi): window.VayraAjan = { eposta: "...", ad: "...", imza: HMAC_SHA256(kimlik anahtarı, eposta) } ya da
 * data-eposta, data-ad, data-imza nitelikleri. İmza sunucuda üretilmeli; anahtar sayfaya konmaz.
 */
(function () {
  var betik = document.currentScript;
  if (!betik) return;
  var id = betik.getAttribute("data-ajan");
  if (!id || window["__vayraAjan_" + id]) return;
  window["__vayraAjan_" + id] = true;
  var koken = new URL(betik.src).origin;
  var site = location.hostname;
  var ortam = betik.getAttribute("data-ortam") === "deneme" ? "deneme" : "";
  var kisi = window.VayraAjan || {};
  var eposta = kisi.eposta || betik.getAttribute("data-eposta") || "", imza = kisi.imza || betik.getAttribute("data-imza") || "", kisiAd = kisi.ad || betik.getAttribute("data-ad") || "";
  var kimlik = "";
  try { if (eposta && imza) kimlik = btoa(unescape(encodeURIComponent(JSON.stringify({ eposta: eposta, ad: kisiAd })))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); } catch (e) { kimlik = ""; }
  var ek = (ortam ? "&ortam=deneme" : "") + (kimlik ? "&kimlik=" + encodeURIComponent(kimlik) + "&imza=" + encodeURIComponent(imza) : "");

  fetch(koken + "/api/build/genel/ajan/" + encodeURIComponent(id) + "?site=" + encodeURIComponent(site) + (ortam ? "&ortam=deneme" : ""))
    .then(function (r) { return r.json(); })
    .then(function (v) { if (v && v.ok && v.kanallar && v.kanallar.widget) kur(v); })
    .catch(function () {});

  function parlaklik(hex) { var n = parseInt(hex.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255); }
  function mutlak(u) { return u && u.indexOf("/") === 0 ? koken + u : u; }
  function fontAile(k) {
    if (k.font === "serif") return 'Georgia, "Times New Roman", serif';
    var g = k.font === "ozel" ? (k.ozelFont || "").trim() : k.font === "inter" ? "Inter" : k.font === "yuvarlak" ? "Nunito" : "";
    if (g) {
      var l = document.createElement("link");
      l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=" + encodeURIComponent(g).replace(/%20/g, "+") + ":wght@500;600&display=swap";
      document.head.appendChild(l);
      return '"' + g + '", system-ui, sans-serif';
    }
    return "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  }

  function kur(v) {
    var k = v.kutu || {};
    var vurgu = v.tema && v.tema.vurgu ? v.tema.vurgu : "#55d6fd";
    var yazi = parlaklik(vurgu) > 150 ? "#000" : "#fff";
    var koyu = !v.tema || v.tema.koyu !== false;
    var sol = k.konum === "sol";
    var bosluk = typeof k.bosluk === "number" ? k.bosluk : 20;
    var yan = sol ? "left" : "right";
    var bt = k.baslatici || { tur: "simge" };
    var aile = fontAile(k);
    var simge = mutlak(bt.tur === "gorsel" && bt.gorsel ? bt.gorsel : v.ajan.simge);
    var acik = false;
    var dar = window.matchMedia("(max-width: 480px)").matches;

    var dugme = document.createElement("button");
    dugme.type = "button";
    dugme.setAttribute("aria-label", v.ajan.ad + " ile sohbet et");
    var etiketli = bt.tur === "etiket" && bt.etiket;
    dugme.style.cssText = "position:fixed;" + yan + ":" + bosluk + "px;bottom:" + bosluk + "px;z-index:2147483000;border:0;cursor:pointer;transition:transform .2s ease;display:flex;align-items:center;gap:8px;font:600 14px/1 " + aile + ";color:" + yazi + ";background:" + vurgu + ";"
      + (etiketli ? "height:52px;padding:4px 18px 4px 4px;border-radius:26px;" : "width:60px;height:60px;padding:3px;border-radius:30px;");
    var resim = document.createElement("img");
    resim.src = simge; resim.alt = "";
    resim.style.cssText = etiketli ? "width:44px;height:44px;border-radius:22px;object-fit:cover;display:block" : "width:54px;height:54px;border-radius:27px;object-fit:cover;display:block";
    dugme.appendChild(resim);
    var etiket = null;
    if (etiketli) { etiket = document.createElement("span"); etiket.textContent = bt.etiket; dugme.appendChild(etiket); }
    var kapat = document.createElement("span");
    kapat.textContent = "×";
    kapat.style.cssText = "display:none;width:" + (etiketli ? "44px;height:44px;line-height:42px" : "54px;height:54px;line-height:52px") + ";text-align:center;font:300 32px/1 system-ui,sans-serif;color:" + yazi;
    dugme.appendChild(kapat);
    dugme.onmouseenter = function () { dugme.style.transform = "scale(1.05)"; };
    dugme.onmouseleave = function () { dugme.style.transform = "none"; };

    var pano = document.createElement("div");
    var ust = etiketli ? 64 : 72;
    pano.style.cssText = dar
      ? "position:fixed;inset:0;z-index:2147483001;display:none;background:" + (koyu ? "#0b0b0c" : "#fff")
      : "position:fixed;" + yan + ":" + bosluk + "px;bottom:" + (bosluk + ust) + "px;z-index:2147483001;width:400px;height:min(640px,calc(100vh - " + (bosluk + ust + 28) + "px));border-radius:20px;overflow:hidden;display:none;border:1px solid rgba(127,127,127,.25);background:" + (koyu ? "#0b0b0c" : "#fff");
    var cerceve = null;

    var balon = null;
    function balonKapat() { if (balon) { balon.remove(); balon = null; } try { sessionStorage.setItem("vayra-balon-" + id + (kural ? ":" + kural.yol : ""), "1"); } catch (e) { /* yok */ } }
    // Sayfa kuralları: yol eşleşirse balon o metinle çıkar (* joker); yoksa genel karşılama metni.
    function yolUyar(desen, yol) { var r = new RegExp("^" + String(desen).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"); return r.test(yol); }
    var kural = (k.kurallar || []).filter(function (x) { return x && x.yol && x.metin && yolUyar(x.yol, location.pathname); })[0];
    var balonMetni = kural ? kural.metin : k.proaktif && k.proaktif.metin;
    if (k.proaktif && k.proaktif.acik && balonMetni) {
      var goruldu = false;
      try { goruldu = sessionStorage.getItem("vayra-balon-" + id + (kural ? ":" + kural.yol : "")) === "1"; } catch (e) { /* yok */ }
      if (!goruldu) setTimeout(function () {
        if (acik || balon) return;
        balon = document.createElement("div");
        balon.setAttribute("role", "status");
        balon.style.cssText = "position:fixed;" + yan + ":" + bosluk + "px;bottom:" + (bosluk + ust) + "px;z-index:2147483000;max-width:260px;padding:12px 34px 12px 14px;border-radius:16px;cursor:pointer;font:400 14px/1.45 " + aile + ";"
          + (koyu ? "background:#161618;color:#fff;border:1px solid rgba(255,255,255,.1)" : "background:#fff;color:#16161a;border:1px solid rgba(0,0,0,.1)");
        balon.textContent = balonMetni;
        var x = document.createElement("button");
        x.type = "button"; x.setAttribute("aria-label", "Kapat"); x.textContent = "×";
        x.style.cssText = "position:absolute;top:6px;right:8px;border:0;background:none;cursor:pointer;font:300 20px/1 system-ui;color:inherit;opacity:.55";
        x.onclick = function (e) { e.stopPropagation(); balonKapat(); };
        balon.appendChild(x);
        balon.onclick = function () { balonKapat(); ac(); };
        document.body.appendChild(balon);
      }, Math.max(0, Number(k.proaktif.gecikme) || 0) * 1000);
    }

    function ac() {
      balonKapat();
      if (!cerceve) {
        cerceve = document.createElement("iframe");
        cerceve.src = koken + "/ajan/" + encodeURIComponent(id) + "/kutu?site=" + encodeURIComponent(site) + ek;
        cerceve.title = v.ajan.ad;
        cerceve.allow = "clipboard-write; microphone";
        cerceve.style.cssText = "width:100%;height:100%;border:0;display:block";
        pano.appendChild(cerceve);
      }
      acik = true; pano.style.display = "block"; resim.style.display = "none"; if (etiket) etiket.style.display = "none"; kapat.style.display = "block";
      if (etiketli) dugme.style.padding = "4px";
      if (dar) dugme.style.display = "none";
    }
    function kapa() {
      acik = false; pano.style.display = "none"; resim.style.display = "block"; if (etiket) etiket.style.display = "inline"; kapat.style.display = "none"; dugme.style.display = "flex";
      if (etiketli) dugme.style.padding = "4px 18px 4px 4px";
    }
    dugme.onclick = function () { acik ? kapa() : ac(); };
    window.addEventListener("message", function (e) { if (e.origin === koken && e.data && e.data.vayra === "ajan-kapat") kapa(); });

    document.body.appendChild(pano);
    document.body.appendChild(dugme);
  }
})();
