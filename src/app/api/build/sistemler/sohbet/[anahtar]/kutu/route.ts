import { ANAHTAR_DESENI } from "@/lib/build/sistemGenel";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ anahtar: string }> };

/**
 * Gömülü sohbet kutusu betiği: <script src="https://<vayra>/api/build/sistemler/sohbet/<anahtar>/kutu" async></script>
 * Köşede yuvarlak düğme çıkar; tıklayınca sohbet sayfası iframe içinde açılır (sitenin stilini etkilemez). İsteğe bağlı
 * data-renk (ör. #55d6fd), data-konum (sag ya da sol), data-etiket (düğme yazısı). İzinli alan adları tetikte yazılıysa
 * kutu yalnız o sitelerde görünür.
 */
export async function GET(req: Request, { params }: Ctx) {
  const anahtar = (await params).anahtar;
  if (!ANAHTAR_DESENI.test(anahtar)) return new Response("/* Vayra sohbet: geçersiz anahtar */", { status: 404, headers: { "Content-Type": "application/javascript; charset=utf-8" } });
  const koken = new URL(req.url).origin.replace("0.0.0.0", "localhost");
  const js = `(function () {
  var A = ${JSON.stringify(anahtar)}, K = ${JSON.stringify(koken)};
  if (window["__vayraSohbet_" + A]) return; window["__vayraSohbet_" + A] = true;
  var betik = document.currentScript || {};
  var al = function (k, v) { return (betik.getAttribute && betik.getAttribute(k)) || v; };
  var renk = al("data-renk", "#55d6fd"), sol = al("data-konum", "sag") === "sol", etiket = al("data-etiket", "");
  fetch(K + "/api/build/sistemler/sohbet/" + A).then(function (r) { return r.json(); }).then(function (v) {
    if (!v || !v.ok || !v.acik) return;
    var h = location.hostname.toLowerCase();
    if (v.alanAdlari && v.alanAdlari.length && !v.alanAdlari.some(function (d) { return h === d || h.slice(-(d.length + 1)) === "." + d; })) return;
    kur(v);
  }).catch(function () {});
  function kur(v) {
    var n = parseInt(renk.replace("#", ""), 16), parlak = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
    var d = document.createElement("button");
    d.type = "button"; d.setAttribute("aria-label", v.baslik || "Sohbet");
    d.style.cssText = "position:fixed;bottom:20px;" + (sol ? "left" : "right") + ":20px;z-index:2147483000;height:56px;min-width:56px;padding:0 " + (etiket ? "20px" : "0") + ";border-radius:999px;border:0;cursor:pointer;background:" + renk + ";color:" + (parlak ? "#000" : "#fff") + ";font:600 15px system-ui,-apple-system,Segoe UI,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .15s";
    d.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>' + (etiket ? "<span>" + etiket.replace(/[<>&]/g, "") + "</span>" : "");
    var c = document.createElement("div");
    c.style.cssText = "position:fixed;bottom:88px;" + (sol ? "left" : "right") + ":20px;z-index:2147483000;width:min(400px,calc(100vw - 24px));height:min(640px,calc(100vh - 110px));border-radius:22px;overflow:hidden;display:none;background:#0b0b0c;border:1px solid rgba(255,255,255,.1)";
    var f = document.createElement("iframe");
    f.title = v.baslik || "Sohbet"; f.style.cssText = "width:100%;height:100%;border:0"; f.allow = "clipboard-write";
    c.appendChild(f);
    var acik = false;
    function ac(x) { acik = x; c.style.display = x ? "block" : "none"; if (x && !f.src) f.src = K + "/s/c/" + A + "?gomulu=1"; d.style.transform = x ? "scale(.94)" : "scale(1)"; }
    d.onclick = function () { ac(!acik); };
    window.addEventListener("message", function (e) { if (e.origin === K && e.data && e.data.vayraSohbet === "kapat") ac(false); });
    document.body.appendChild(c); document.body.appendChild(d);
  }
})();`;
  return new Response(js, { headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" } });
}
