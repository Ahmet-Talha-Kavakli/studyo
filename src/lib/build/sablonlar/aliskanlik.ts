/* Şablon: Ritim · Alışkanlık Takibi — mobil uygulama (PWA). Simgeli ve renkli alışkanlıklar; her gün, belirli günler ya da
 * haftada N kez hedefi; sayılı alışkanlıklar (8 bardak gibi); haftalık şerit, seriler, yıllık ısı haritası, istatistik ekranı,
 * hatırlatma saati, sürükleyerek sıralama ve arşiv. Veriler cihazda (localStorage) saklanır. */
import { ORTAK_JS } from "./ortak";

const STIL = String.raw`/* Ritim — sıcak kâğıt zemin, mürekkep metin, alışkanlık başına canlı renk; Bricolage Grotesque ve Figtree. */
:root {
  --zemin: #f3efe7;
  --yuzey: #fffdf9;
  --yuzey-2: #f7f3ec;
  --murekkep: #1d1a16;
  --soluk: #6d675d;
  --soluk-2: #8d867a;
  --cizgi: rgba(29, 26, 22, 0.09);
  --cizgi-2: rgba(29, 26, 22, 0.16);
  --imza: #ff5b35;
  --imza-2: #ff8a5c;
  --yesil: #23a26d;
  --baslik: "Bricolage Grotesque", "Figtree", system-ui, sans-serif;
  --yazi: "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif;
  --egri: cubic-bezier(0.22, 1, 0.36, 1);
  --yay: cubic-bezier(0.34, 1.56, 0.64, 1);
  --sutun: 480px;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html { background: var(--zemin); }
body {
  margin: 0; min-height: 100vh; min-height: 100dvh; color: var(--murekkep); font-family: var(--yazi);
  font-size: 15px; line-height: 1.45; -webkit-font-smoothing: antialiased; overflow-x: hidden;
}
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; border: 0; background: none; padding: 0; }
:focus-visible { outline: 2.5px solid var(--imza); outline-offset: 2px; border-radius: 12px; }
h1, h2, h3 { font-family: var(--baslik); margin: 0; letter-spacing: -0.025em; font-weight: 700; }
svg { display: block; }

.arka { position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(60% 40% at 0% 0%, rgba(255, 91, 53, 0.10), rgba(255, 91, 53, 0) 70%),
    radial-gradient(50% 40% at 100% 100%, rgba(35, 162, 109, 0.10), rgba(35, 162, 109, 0) 70%),
    var(--zemin); }

#ekran { max-width: var(--sutun); margin: 0 auto; padding: calc(env(safe-area-inset-top) + 20px) 18px calc(env(safe-area-inset-bottom) + 112px); outline: none; }
.giris { animation: belir 0.4s var(--egri); }
@keyframes belir { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* Üst */
.ust { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ust .tarih { margin: 0; color: var(--soluk); font-size: 13.5px; font-weight: 600; }
.ust h1 { font-size: 30px; line-height: 1.1; margin-top: 2px; }
.yuvarlak-dugme { flex: none; width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: var(--murekkep); color: #fff; transition: transform 0.2s var(--yay); }
.yuvarlak-dugme:active { transform: scale(0.9); }
.yuvarlak-dugme svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; }

/* Özet halkası */
.ozet { display: flex; align-items: center; gap: 16px; margin-top: 18px; padding: 16px 18px; border-radius: 26px; background: var(--murekkep); color: #fff; position: relative; overflow: hidden; }
.ozet::after { content: ""; position: absolute; right: -40px; top: -60px; width: 180px; height: 180px; border-radius: 50%; background: radial-gradient(circle, rgba(255, 91, 53, 0.45), rgba(255, 91, 53, 0) 70%); }
.ozet-halka { position: relative; width: 74px; height: 74px; flex: none; }
.ozet-halka svg { width: 74px; height: 74px; transform: rotate(-90deg); }
.ozet-halka circle { fill: none; stroke-width: 8; }
.ozet-halka .iz { stroke: rgba(255, 255, 255, 0.14); }
.ozet-halka .dolgu { stroke: var(--imza); stroke-linecap: round; transition: stroke-dashoffset 0.8s var(--egri); }
.ozet-halka b { position: absolute; inset: 0; display: grid; place-items: center; font: 700 19px var(--baslik); }
.ozet-metin { position: relative; z-index: 1; min-width: 0; }
.ozet-metin strong { display: block; font: 700 19px/1.2 var(--baslik); }
.ozet-metin span { display: block; color: rgba(255, 255, 255, 0.68); font-size: 13.5px; margin-top: 3px; }

/* Hafta şeridi */
.hafta { margin-top: 18px; }
.hafta-ust { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.hafta-ust b { font: 700 15px var(--baslik); }
.hafta-ok { display: flex; gap: 4px; }
.hafta-ok button { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: var(--soluk); }
.hafta-ok button:hover:not(:disabled) { background: var(--yuzey); color: var(--murekkep); }
.hafta-ok button:disabled { opacity: 0.3; cursor: default; }
.hafta-ok svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.gunler { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.gun { display: grid; justify-items: center; gap: 5px; padding: 8px 0 9px; border-radius: 18px; border: 1px solid transparent; transition: background 0.2s, border-color 0.2s; }
.gun small { font-size: 11.5px; font-weight: 700; color: var(--soluk-2); }
.gun .halkacik { position: relative; width: 34px; height: 34px; }
.gun .halkacik svg { width: 34px; height: 34px; transform: rotate(-90deg); }
.gun .halkacik circle { fill: none; stroke-width: 3.5; }
.gun .halkacik .iz { stroke: var(--cizgi-2); }
.gun .halkacik .dolgu { stroke: var(--yesil); stroke-linecap: round; }
.gun .halkacik i { position: absolute; inset: 0; display: grid; place-items: center; font: 700 13.5px var(--baslik); font-style: normal; }
.gun.tam .halkacik i { color: #fff; }
.gun.tam .halkacik::before { content: ""; position: absolute; inset: 4px; border-radius: 50%; background: var(--yesil); }
.gun.tam .halkacik i { z-index: 1; }
.gun.secili { background: var(--yuzey); border-color: var(--cizgi-2); }
.gun.secili small { color: var(--imza); }
.gun:disabled { opacity: 0.35; cursor: default; }

/* Bölüm başlığı */
.bolum { display: flex; align-items: baseline; justify-content: space-between; margin: 24px 2px 10px; }
.bolum h2 { font-size: 18px; }
.bolum span { color: var(--soluk); font-size: 13px; font-weight: 600; }

/* Alışkanlık kartı */
.liste { display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; }
.ak { --r: #ff5b35; display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 12px; border-radius: 22px; background: var(--yuzey); border: 1px solid var(--cizgi); position: relative; transition: background 0.3s, border-color 0.3s; }
.ak.bitti { background: color-mix(in srgb, var(--r) 9%, var(--yuzey)); border-color: color-mix(in srgb, var(--r) 30%, transparent); }
.ak-govde { flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; text-align: left; padding: 2px 0; }
.ak-simge { flex: none; width: 46px; height: 46px; border-radius: 15px; display: grid; place-items: center; background: color-mix(in srgb, var(--r) 15%, transparent); color: var(--r); }
.ak-simge svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.ak-yazi { min-width: 0; }
.ak-yazi b { display: block; font: 650 16px/1.25 var(--baslik); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ak.bitti .ak-yazi b { text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--r) 60%, transparent); text-decoration-thickness: 2px; }
.ak-alt { display: flex; align-items: center; gap: 8px; margin-top: 3px; color: var(--soluk); font-size: 12.5px; font-weight: 600; flex-wrap: wrap; }
.seri { display: inline-flex; align-items: center; gap: 3px; color: #d9541f; }
.seri svg { width: 13px; height: 13px; fill: currentColor; stroke: none; }
.ak.uyku { opacity: 0.62; }

/* İşaret düğmesi */
.isaret { --p: 0; flex: none; position: relative; width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; touch-action: manipulation; }
.isaret svg.halka { position: absolute; inset: 0; width: 52px; height: 52px; transform: rotate(-90deg); }
.isaret .halka circle { fill: none; stroke-width: 4; }
.isaret .halka .iz { stroke: color-mix(in srgb, var(--r) 22%, transparent); }
.isaret .halka .dolgu { stroke: var(--r); stroke-linecap: round; stroke-dasharray: 144.5; stroke-dashoffset: calc(144.5 - 144.5 * var(--p)); transition: stroke-dashoffset 0.5s var(--egri); }
.isaret .ic { position: absolute; inset: 6px; border-radius: 50%; display: grid; place-items: center; background: transparent; transform: scale(0.6); opacity: 0; transition: transform 0.35s var(--yay), opacity 0.2s, background 0.3s; }
.isaret.dolu .ic { background: var(--r); transform: scale(1); opacity: 1; }
.isaret .tik { width: 22px; height: 22px; fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 24; stroke-dashoffset: 24; transition: stroke-dashoffset 0.35s 0.1s var(--egri); position: relative; }
.isaret.dolu .tik { stroke-dashoffset: 0; }
.isaret .sayi, .isaret .tik { grid-area: 1 / 1; }
.isaret .sayi { position: relative; font: 700 14px var(--baslik); color: var(--r); }
.isaret.dolu .sayi { display: none; }
.isaret:active { transform: scale(0.92); }
.isaret.zipla { animation: zipla 0.45s var(--yay); }
@keyframes zipla { 0% { transform: scale(1); } 35% { transform: scale(0.82); } 100% { transform: scale(1); } }
.patla { position: absolute; left: 50%; top: 50%; width: 0; height: 0; pointer-events: none; }
.patla i { position: absolute; width: 7px; height: 7px; margin: -3.5px; border-radius: 50%; background: var(--r); animation: kivilcim 0.65s var(--egri) forwards; }
@keyframes kivilcim { from { transform: rotate(var(--a)) translateY(0) scale(1); opacity: 1; } to { transform: rotate(var(--a)) translateY(-40px) scale(0.2); opacity: 0; } }
.azalt { flex: none; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; color: var(--soluk); border: 1px solid var(--cizgi-2); }
.azalt svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }

.bos { text-align: center; padding: 34px 18px; border-radius: 24px; border: 1.5px dashed var(--cizgi-2); color: var(--soluk); }
.bos b { display: block; color: var(--murekkep); font: 700 17px var(--baslik); margin-bottom: 4px; }
.bos button { margin-top: 14px; }

.kutlama { margin-top: 14px; padding: 14px 16px; border-radius: 20px; background: color-mix(in srgb, var(--yesil) 12%, var(--yuzey)); border: 1px solid color-mix(in srgb, var(--yesil) 30%, transparent); display: flex; align-items: center; gap: 12px; font-weight: 600; animation: belir 0.5s var(--egri); }
.kutlama svg { width: 26px; height: 26px; flex: none; fill: none; stroke: var(--yesil); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }

/* Düğmeler */
.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 50px; padding: 0 22px; border-radius: 999px; font-weight: 700; font-size: 15px; background: var(--murekkep); color: #fff; transition: transform 0.18s var(--yay), opacity 0.2s; }
.dugme:active { transform: scale(0.96); }
.dugme.imza { background: var(--imza); }
.dugme.ikincil { background: var(--yuzey); color: var(--murekkep); border: 1px solid var(--cizgi-2); }
.dugme.tehlike { background: #fff0ec; color: #c43b16; border: 1px solid rgba(196, 59, 22, 0.2); }
.dugme.tam { width: 100%; }
.dugme svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }

/* Kart */
.kart { padding: 16px; border-radius: 24px; background: var(--yuzey); border: 1px solid var(--cizgi); }
.kart + .kart { margin-top: 12px; }
.kart h3 { font-size: 16px; margin-bottom: 12px; }
.kart-ust { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.kart-ust h3 { margin: 0; }
.kart-ust span { color: var(--soluk); font-size: 12.5px; font-weight: 600; }

/* İstatistik */
.olcu-izgara { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
.olcu { padding: 14px 16px; border-radius: 22px; background: var(--yuzey); border: 1px solid var(--cizgi); }
.olcu span { display: block; color: var(--soluk); font-size: 12.5px; font-weight: 600; }
.olcu b { display: block; font: 700 26px/1.15 var(--baslik); margin-top: 4px; letter-spacing: -0.03em; }
.olcu small { color: var(--soluk-2); font-size: 12px; font-weight: 600; }
.olcu.koyu { background: var(--murekkep); color: #fff; border-color: transparent; }
.olcu.koyu span, .olcu.koyu small { color: rgba(255, 255, 255, 0.65); }
.secici { display: inline-flex; padding: 4px; border-radius: 999px; background: var(--yuzey-2); border: 1px solid var(--cizgi); }
.secici button { min-height: 32px; padding: 0 11px; white-space: nowrap; border-radius: 999px; font-size: 12.5px; font-weight: 700; color: var(--soluk); }
.secici button.secili { background: var(--murekkep); color: #fff; }
.cubuklar { display: flex; align-items: flex-end; gap: 5px; height: 140px; padding-top: 8px; }
.cubuk { flex: 1; min-width: 0; display: grid; grid-template-rows: 1fr auto; gap: 6px; height: 100%; }
.cubuk div { align-self: end; border-radius: 8px 8px 4px 4px; background: color-mix(in srgb, var(--imza) 30%, var(--yuzey-2)); min-height: 4px; transition: height 0.6s var(--egri); }
.cubuk.yuksek div { background: var(--imza); }
.cubuk.bugun div { background: var(--murekkep); }
.cubuk small { text-align: center; font-size: 10.5px; font-weight: 700; color: var(--soluk-2); white-space: nowrap; overflow: hidden; }
.sira-satir { display: flex; align-items: center; gap: 12px; padding: 10px 0; }
.sira-satir + .sira-satir { border-top: 1px solid var(--cizgi); }
.sira-satir .ak-simge { width: 38px; height: 38px; border-radius: 12px; }
.sira-satir .ak-simge svg { width: 20px; height: 20px; }
.sira-bilgi { flex: 1; min-width: 0; }
.sira-bilgi b { display: flex; justify-content: space-between; gap: 8px; font-size: 14.5px; font-weight: 700; }
.sira-bilgi b span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sira-bilgi b em { font-style: normal; color: var(--soluk); font-size: 13px; flex: none; }
.cizgi-bar { height: 7px; border-radius: 99px; background: var(--yuzey-2); margin-top: 7px; overflow: hidden; }
.cizgi-bar i { display: block; height: 100%; border-radius: 99px; background: var(--r); }

/* Isı haritası */
.isi-kap { overflow-x: auto; overflow-y: hidden; padding-bottom: 6px; scrollbar-width: thin; -webkit-overflow-scrolling: touch; }
.isi { display: grid; grid-auto-flow: column; grid-template-rows: 14px repeat(7, 12px); gap: 3px; width: max-content; }
.isi .ay { font-size: 10px; font-weight: 700; color: var(--soluk-2); white-space: nowrap; grid-row: 1; }
.isi .h { width: 12px; height: 12px; border-radius: 3.5px; background: var(--yuzey-2); box-shadow: inset 0 0 0 1px var(--cizgi); }
.isi .h.p { box-shadow: none; }
.isi .h.gelecek { background: transparent; box-shadow: none; }
.isi-alt { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; color: var(--soluk); font-size: 12px; font-weight: 600; gap: 10px; flex-wrap: wrap; }
.lejant { display: inline-flex; align-items: center; gap: 4px; }
.lejant i { width: 11px; height: 11px; border-radius: 3px; display: inline-block; }

/* Yönet listesi */
.yonet { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.yonet-satir { --r: #ff5b35; display: flex; align-items: center; gap: 10px; padding: 10px 10px 10px 6px; border-radius: 20px; background: var(--yuzey); border: 1px solid var(--cizgi); touch-action: pan-y; }
.yonet-satir.surukleniyor { position: relative; z-index: 5; border-color: var(--murekkep); transform: scale(1.02); transition: none; }
.tut { flex: none; width: 34px; height: 44px; display: grid; place-items: center; color: var(--soluk-2); cursor: grab; touch-action: none; }
.tut svg { width: 18px; height: 18px; fill: currentColor; }
.yonet-satir .ak-simge { width: 40px; height: 40px; border-radius: 13px; }
.yonet-satir .ak-simge svg { width: 21px; height: 21px; }
.yonet-bilgi { flex: 1; min-width: 0; text-align: left; overflow: hidden; }
.yonet-bilgi b { display: block; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.yonet-bilgi span { font-size: 12.5px; color: var(--soluk); font-weight: 600; }
.mini { flex: none; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; color: var(--soluk); }
.mini:hover { background: var(--yuzey-2); color: var(--murekkep); }
.mini svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ayar-satir { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; }
.ayar-satir + .ayar-satir { border-top: 1px solid var(--cizgi); }
.ayar-satir b { display: block; font-size: 14.5px; }
.ayar-satir span { display: block; color: var(--soluk); font-size: 12.5px; }
.metin-dugme { color: var(--imza); font-weight: 700; font-size: 14px; padding: 8px 4px; }

/* Sekmeler */
.sekmeler { position: fixed; z-index: 30; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 12px); transform: translateX(-50%); width: min(calc(100% - 28px), 380px); display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 6px; border-radius: 26px; background: rgba(29, 26, 22, 0.92); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); }
.sekmeler button { min-height: 52px; border-radius: 20px; display: grid; justify-items: center; align-content: center; gap: 2px; color: rgba(255, 255, 255, 0.6); font-size: 11.5px; font-weight: 700; transition: background 0.2s, color 0.2s; }
.sekmeler button svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.sekmeler button.secili { background: rgba(255, 255, 255, 0.12); color: #fff; }
.sekmeler button.secili svg { stroke: var(--imza-2); }

/* Alt sayfa */
.perde { position: fixed; inset: 0; z-index: 40; background: rgba(29, 26, 22, 0.38); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); animation: perde 0.25s; }
@keyframes perde { from { opacity: 0; } }
.alt-sayfa { position: fixed; z-index: 41; left: 50%; bottom: 0; transform: translateX(-50%); width: min(100%, var(--sutun)); max-height: 92vh; max-height: 92dvh; overflow-y: auto; overscroll-behavior: contain; background: var(--yuzey); border-radius: 30px 30px 0 0; padding: 8px 20px calc(env(safe-area-inset-bottom) + 24px); animation: yukari 0.38s var(--egri); }
@keyframes yukari { from { transform: translate(-50%, 100%); } }
.alt-sayfa.kapaniyor { transition: transform 0.25s ease-in; transform: translate(-50%, 100%) !important; }
.tutamak { display: block; width: 100%; height: 26px; position: sticky; top: -8px; z-index: 2; background: var(--yuzey); touch-action: none; cursor: grab; }
.tutamak::before { content: ""; position: absolute; left: 50%; top: 10px; width: 42px; height: 5px; margin-left: -21px; border-radius: 9px; background: var(--cizgi-2); }
.sayfa-ust { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.sayfa-ust h2 { font-size: 22px; }
.sayfa-ust.yuzen { position: absolute; right: 16px; top: 22px; margin: 0; z-index: 3; }
.detay-bas h2 { padding-right: 44px; }
.kapat { flex: none; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; background: var(--yuzey-2); }
.kapat svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }

/* Form */
.alan { display: block; margin-bottom: 16px; }
.alan > span { display: block; font-size: 13px; font-weight: 700; color: var(--soluk); margin-bottom: 7px; }
.girdi { width: 100%; min-height: 50px; padding: 0 16px; border-radius: 16px; border: 1.5px solid var(--cizgi-2); background: var(--yuzey-2); font-size: 16px; outline: none; transition: border-color 0.2s, background 0.2s; }
.girdi:focus { border-color: var(--murekkep); background: #fff; }
.oneriler { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px; margin: -6px 0 16px; scrollbar-width: none; }
.oneriler::-webkit-scrollbar { display: none; }
.oneriler button { flex: none; min-height: 34px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--cizgi-2); font-size: 13px; font-weight: 600; white-space: nowrap; }
.ikon-izgara { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.ikon-izgara button { aspect-ratio: 1; border-radius: 14px; display: grid; place-items: center; background: var(--yuzey-2); color: var(--soluk); border: 1.5px solid transparent; }
.ikon-izgara button svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
.ikon-izgara button.secili { color: var(--r); border-color: var(--r); background: color-mix(in srgb, var(--r) 12%, transparent); }
.renkler { display: flex; gap: 8px; flex-wrap: wrap; }
.renkler button { width: 36px; height: 36px; border-radius: 50%; background: var(--c); position: relative; }
.renkler button.secili::after { content: ""; position: absolute; inset: -5px; border-radius: 50%; border: 2.5px solid var(--c); }
.parcali { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 4px; border-radius: 16px; background: var(--yuzey-2); border: 1px solid var(--cizgi); }
.parcali button { min-height: 42px; border-radius: 12px; font-size: 13px; font-weight: 700; color: var(--soluk); }
.parcali button.secili { background: var(--yuzey); color: var(--murekkep); box-shadow: 0 1px 2px rgba(29, 26, 22, 0.08); }
.gun-cipleri { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-top: 10px; }
.gun-cipleri button { min-height: 40px; border-radius: 12px; border: 1.5px solid var(--cizgi-2); font-size: 12.5px; font-weight: 700; color: var(--soluk); }
.gun-cipleri button.secili { background: var(--murekkep); border-color: var(--murekkep); color: #fff; }
.adimlayici { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 8px 8px 16px; border-radius: 16px; background: var(--yuzey-2); border: 1px solid var(--cizgi); margin-top: 10px; }
.adimlayici b { font-size: 14px; }
.adimlayici div { display: flex; align-items: center; gap: 6px; }
.adimlayici button { width: 38px; height: 38px; border-radius: 12px; background: var(--yuzey); border: 1px solid var(--cizgi-2); display: grid; place-items: center; }
.adimlayici button svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }
.adimlayici output { min-width: 30px; text-align: center; font: 700 18px var(--baslik); }
.iki { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.anahtar { position: relative; flex: none; width: 50px; height: 30px; }
.anahtar input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.anahtar i { position: absolute; inset: 0; border-radius: 99px; background: var(--cizgi-2); transition: background 0.2s; pointer-events: none; }
.anahtar i::after { content: ""; position: absolute; left: 3px; top: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform 0.25s var(--yay); }
.anahtar input:checked + i { background: var(--yesil); }
.anahtar input:checked + i::after { transform: translateX(20px); }
.eylem-satir { display: flex; gap: 8px; margin-top: 18px; }
.eylem-satir .dugme { flex: 1; }

/* Detay */
.detay-bas { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.detay-bas .ak-simge { width: 58px; height: 58px; border-radius: 19px; }
.detay-bas .ak-simge svg { width: 30px; height: 30px; }
.detay-bas h2 { font-size: 23px; line-height: 1.15; }
.detay-bas p { margin: 3px 0 0; color: var(--soluk); font-size: 13.5px; font-weight: 600; }
.dortlu { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px; }
.dortlu div { padding: 12px 14px; border-radius: 18px; background: var(--yuzey-2); }
.dortlu span { display: block; font-size: 12px; color: var(--soluk); font-weight: 600; }
.dortlu b { font: 700 22px var(--baslik); letter-spacing: -0.02em; }

/* Bildirim */
.tost { position: fixed; z-index: 60; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 96px); transform: translate(-50%, 20px); opacity: 0; pointer-events: none; max-width: calc(100% - 40px); padding: 12px 18px; border-radius: 16px; background: var(--murekkep); color: #fff; font-weight: 600; font-size: 14px; transition: opacity 0.25s, transform 0.3s var(--egri); text-align: center; }
.tost.acik { opacity: 1; transform: translate(-50%, 0); }

/* Masaüstü kenar notu */
.kenar { display: none; }
@media (min-width: 760px) {
  #ekran { margin-top: 28px; margin-bottom: 28px; background: rgba(255, 253, 249, 0.55); border: 1px solid var(--cizgi); border-radius: 36px; padding-left: 26px; padding-right: 26px; min-height: calc(100vh - 56px); }
  .sekmeler { bottom: 40px; }
}
@media (min-width: 1180px) {
  .kenar { display: block; position: fixed; left: calc(50% - 560px); top: 64px; width: 260px; }
  .kenar .logo { display: flex; align-items: center; gap: 10px; font: 800 22px var(--baslik); letter-spacing: -0.03em; }
  .kenar .logo svg { width: 40px; height: 40px; }
  .kenar p { color: var(--soluk); font-size: 15px; line-height: 1.55; margin: 18px 0 0; }
  .kenar ul { list-style: none; padding: 0; margin: 22px 0 0; display: grid; gap: 10px; color: var(--soluk); font-size: 14px; font-weight: 600; }
  .kenar li { display: flex; gap: 10px; align-items: center; }
  .kenar li i { width: 8px; height: 8px; border-radius: 50%; background: var(--imza); flex: none; }
  .kenar.sag { left: auto; right: calc(50% - 560px); text-align: left; }
  .kenar.sag b { display: block; font: 700 40px/1 var(--baslik); letter-spacing: -0.04em; }
  .kenar.sag span { color: var(--soluk); font-size: 13.5px; font-weight: 600; }
  .kenar.sag div + div { margin-top: 22px; }
}
@media (max-width: 360px) {
  #ekran { padding-left: 14px; padding-right: 14px; }
  .ust h1 { font-size: 26px; }
  .ak-simge { width: 40px; height: 40px; }
  .ikon-izgara { grid-template-columns: repeat(6, 1fr); }
}
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Ritim · Alışkanlık Takibi — veriler bu cihazda (localStorage). Sekmeler: Bugün, İstatistik, Alışkanlıklar. ── */
(function () {
  var ANAHTAR = "ritim-aliskanlik-v1";
  var GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  var GUN_UZUN = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  var AY_KISA = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  var RENKLER = ["#ff5b35", "#23a26d", "#3a6cf4", "#9b5cf6", "#e9a800", "#e5457b", "#0fa3b8", "#6f7d2a"];
  var IKONLAR = {
    su: '<path d="M12 3.5c3.3 4 6 7.4 6 10.6a6 6 0 0 1-12 0c0-3.2 2.7-6.6 6-10.6z"/><path d="M9.3 14.8a2.8 2.8 0 0 0 2.5 2.5"/>',
    kitap: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8 7.5h8"/>',
    kosu: '<circle cx="14.5" cy="4.5" r="2"/><path d="M8 21l3.2-5.5 3 2.5 1.8 3"/><path d="M6.5 11.5l3-3 4 1 2.5 3.5 3 .5"/><path d="M11.2 15.5l1.3-6"/>',
    lotus: '<path d="M12 20c-4.5 0-8-2.5-9-6 3 0 6 1.2 9 6z"/><path d="M12 20c4.5 0 8-2.5 9-6-3 0-6 1.2-9 6z"/><path d="M12 20c-2.4-2.6-3.2-6.4 0-12 3.2 5.6 2.4 9.4 0 12z"/>',
    ay: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    dil: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
    elma: '<path d="M12 7.5c-1.6-1.2-4.8-1.4-6.4.8-1.8 2.5-1 7.3 1.4 10.3 1.4 1.8 2.8 2.3 5 1.3 2.2 1 3.6.5 5-1.3 2.4-3 3.2-7.8 1.4-10.3-1.6-2.2-4.8-2-6.4-.8z"/><path d="M12 7.5c0-2 .8-3.5 2.5-4.5"/>',
    kalem: '<path d="M16.5 3.5l4 4L8 20H4v-4z"/><path d="M13.5 6.5l4 4"/>',
    agirlik: '<path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12"/>',
    bitki: '<path d="M12 21v-9"/><path d="M12 12c0-4 2.5-7 7-7 0 4.5-3 7-7 7z"/><path d="M12 15c0-3-2-5.5-6-5.5 0 3.5 2.5 5.5 6 5.5z"/>',
    telefon: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M3 3l18 18"/>',
    para: '<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
    muzik: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    gunes: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>'
  };
  var ALEV = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 3.5 5 5.6 5 10.4A5 5 0 0 1 7 12.6c0-2 .9-3.4 2-4.4.2 1.4.9 2.4 2 2.9C11 7.7 10.6 4.6 12 2z"/></svg>';
  var S = function (yol, ek) { return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (ek || "") + '>' + yol + '</svg>'; };
  var ARTI = S('<path d="M12 5v14M5 12h14"/>'), EKSI = S('<path d="M5 12h14"/>'), CARPI = S('<path d="M6 6l12 12M18 6L6 18"/>');
  var SOL = S('<path d="M15 6l-6 6 6 6"/>'), SAG = S('<path d="M9 6l6 6-6 6"/>');
  var ONERI = [
    { ad: "Su iç", ikon: "su", renk: 6, hedef: 8, birim: "bardak" }, { ad: "10 dakika meditasyon", ikon: "lotus", renk: 3 },
    { ad: "Kitap oku", ikon: "kitap", renk: 0 }, { ad: "Yürüyüş", ikon: "kosu", renk: 1, tur: "haftalik", haftalik: 4 },
    { ad: "Günlük yaz", ikon: "kalem", renk: 4 }, { ad: "Meyve ye", ikon: "elma", renk: 5, hedef: 2, birim: "porsiyon" },
    { ad: "Bitkileri sula", ikon: "bitki", renk: 7, tur: "gunler", gunler: [1, 4] }, { ad: "Harcamaları yaz", ikon: "para", renk: 2 }
  ];

  /* ── Durum ── */
  var bugun = istanbul().tarih;
  var V = yukle();
  var aktif = "bugun", seciliGun = bugun, haftaOfset = 0, istatAralik = 14;

  function kimlik() { return "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function yukle() {
    try { var j = JSON.parse(localStorage.getItem(ANAHTAR) || "null"); if (j && Array.isArray(j.aliskanliklar)) return j; } catch (e) {}
    var t = tohum(); try { localStorage.setItem(ANAHTAR, JSON.stringify(t)); } catch (e) {}
    return t;
  }
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(V)); } catch (e) {} }

  /* İlk açılışta canlı görünsün diye son altı ayın geçmişi tutarlı bir rastgelelikle doldurulur. */
  function tohum() {
    var bas = gunEkle(bugun, -190);
    var l = [
      { id: "su", ad: "Su iç", ikon: "su", renk: 6, tur: "gunluk", gunler: [], haftalik: 3, hedef: 8, birim: "bardak", saat: "10:00", hatirlat: true, olasilik: 0.8, bugunDeger: 5 },
      { id: "meditasyon", ad: "10 dakika meditasyon", ikon: "lotus", renk: 3, tur: "gunluk", gunler: [], haftalik: 3, hedef: 1, birim: "", saat: "08:00", hatirlat: true, olasilik: 0.86, bugunDeger: 1, seriSon: 23 },
      { id: "kitap", ad: "20 sayfa kitap oku", ikon: "kitap", renk: 0, tur: "gunluk", gunler: [], haftalik: 3, hedef: 1, birim: "", saat: "22:00", hatirlat: true, olasilik: 0.74, bugunDeger: 0, seriSon: 9 },
      { id: "kosu", ad: "Koşu ya da yürüyüş", ikon: "kosu", renk: 1, tur: "haftalik", gunler: [], haftalik: 3, hedef: 1, birim: "", saat: "07:30", hatirlat: false, olasilik: 0.5, bugunDeger: 0 },
      { id: "ispanyolca", ad: "İspanyolca çalış", ikon: "dil", renk: 2, tur: "gunler", gunler: [1, 3, 5, 6], haftalik: 3, hedef: 1, birim: "", saat: "19:00", hatirlat: true, olasilik: 0.78, bugunDeger: 0 },
      { id: "ekransiz", ad: "Yatmadan önce ekran yok", ikon: "telefon", renk: 5, tur: "gunluk", gunler: [], haftalik: 3, hedef: 1, birim: "", saat: "23:00", hatirlat: false, olasilik: 0.55, bugunDeger: 0 }
    ];
    var tohumSayi = 7;
    function rast() { tohumSayi = (tohumSayi * 16807) % 2147483647; return tohumSayi / 2147483647; }
    var kayit = {};
    l.forEach(function (a) {
      var k = (kayit[a.id] = {});
      for (var t = bas; t < bugun; t = gunEkle(t, 1)) {
        var gunFark = farkGun(t, bugun), wd = haftaGunu(t);
        if (a.tur === "gunler" && a.gunler.indexOf(wd) < 0) continue;
        var p = a.olasilik + (gunFark < 40 ? 0.08 : 0) - (wd === 6 || wd === 0 ? 0.08 : 0);
        if (a.seriSon && gunFark <= a.seriSon) p = 1;
        if (a.tur === "haftalik") p = wd === 2 || wd === 4 || wd === 6 ? 0.82 : 0.08;
        if (rast() < p) k[t] = a.hedef > 1 ? a.hedef : 1;
        else if (a.hedef > 1 && rast() < 0.6) k[t] = Math.max(1, Math.floor(a.hedef * (0.4 + rast() * 0.5)));
      }
      if (a.bugunDeger) k[bugun] = a.bugunDeger;
      delete a.olasilik; delete a.bugunDeger; delete a.seriSon;
      a.olusturma = bas; a.arsiv = false;
    });
    return { aliskanliklar: l, kayit: kayit, ad: "Elif" };
  }

  /* ── Tarih ve hesap yardımcıları ── */
  function farkGun(a, b) { return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 864e5); }
  function haftaBasi(t) { return gunEkle(t, -((haftaGunu(t) + 6) % 7)); }
  function aktifler() { return V.aliskanliklar.filter(function (a) { return !a.arsiv; }); }
  function bul(id) { for (var i = 0; i < V.aliskanliklar.length; i++) if (V.aliskanliklar[i].id === id) return V.aliskanliklar[i]; return null; }
  function renk(a) { return RENKLER[a.renk % RENKLER.length]; }
  function deger(a, t) { return ((V.kayit[a.id] || {})[t]) || 0; }
  function tamam(a, t) { return deger(a, t) >= a.hedef; }
  function planli(a, t) { return a.tur !== "gunler" || a.gunler.indexOf(haftaGunu(t)) >= 0; }
  function haftaTamam(a, t) { var b = haftaBasi(t), n = 0; for (var i = 0; i < 7; i++) if (tamam(a, gunEkle(b, i))) n++; return n; }
  function sayi(n) { return Number(n).toLocaleString("tr-TR"); }
  function simge(a, ek) { return S(IKONLAR[a.ikon] || IKONLAR.gunes, ek); }

  function seri(a) {
    var s = 0, t, sinir = a.olusturma || gunEkle(bugun, -800);
    if (a.tur === "haftalik") {
      t = haftaBasi(bugun);
      if (haftaTamam(a, t) >= a.haftalik) s = 1;
      t = gunEkle(t, -7);
      while (t >= haftaBasi(sinir) && haftaTamam(a, t) >= a.haftalik) { s++; t = gunEkle(t, -7); }
      return s;
    }
    t = bugun;
    if (!tamam(a, t)) t = gunEkle(t, -1);
    for (var i = 0; i < 900 && t >= sinir; i++, t = gunEkle(t, -1)) {
      if (!planli(a, t)) continue;
      if (tamam(a, t)) s++; else break;
    }
    return s;
  }
  function enUzun(a) {
    var en = 0, s = 0, t = a.olusturma || gunEkle(bugun, -365);
    if (a.tur === "haftalik") {
      for (t = haftaBasi(t); t <= bugun; t = gunEkle(t, 7)) { if (haftaTamam(a, t) >= a.haftalik) { s++; en = Math.max(en, s); } else if (t !== haftaBasi(bugun)) s = 0; }
      return en;
    }
    for (; t <= bugun; t = gunEkle(t, 1)) { if (!planli(a, t)) continue; if (tamam(a, t)) { s++; en = Math.max(en, s); } else if (t !== bugun) s = 0; }
    return en;
  }
  function toplam(a) { var k = V.kayit[a.id] || {}, n = 0; for (var t in k) if (k[t] >= a.hedef) n++; return n; }
  /* Son n günde planlı günlerin kaçı tamamlandı (haftada N kez: hedefe göre). Bugün henüz bitmediyse paydaya katılmaz. */
  function oran(a, n) {
    var p = 0, d = 0;
    if (a.tur === "haftalik") {
      var hafta = Math.max(1, Math.round(n / 7));
      for (var w = 0; w < hafta; w++) { var b = gunEkle(haftaBasi(bugun), -7 * w); if (b < haftaBasi(a.olusturma || b)) break; var x = haftaTamam(a, b); if (w === 0 && x < a.haftalik) continue; p++; d += Math.min(1, x / a.haftalik); }
      return p ? d / p : 0;
    }
    for (var i = 0; i < n; i++) { var t = gunEkle(bugun, -i); if (a.olusturma && t < a.olusturma) break; if (!planli(a, t)) continue; if (i === 0 && !tamam(a, t)) continue; p++; if (tamam(a, t)) d++; }
    return p ? d / p : 0;
  }
  function gunOzeti(t) {
    var l = aktifler().filter(function (a) { return a.tur !== "haftalik" && planli(a, t) && (!a.olusturma || t >= a.olusturma); });
    var d = l.filter(function (a) { return tamam(a, t); }).length;
    return { toplam: l.length, tamam: d };
  }
  function siklikYazi(a) {
    if (a.tur === "haftalik") return "Haftada " + a.haftalik + " kez";
    if (a.tur === "gunler") return a.gunler.length === 7 ? "Her gün" : [1, 2, 3, 4, 5, 6, 0].filter(function (g) { return a.gunler.indexOf(g) >= 0; }).map(function (g) { return GUN_KISA[g]; }).join(", ");
    return "Her gün";
  }
  function seriYazi(a) { var s = seri(a); return s ? '<span class="seri">' + ALEV + s + (a.tur === "haftalik" ? " hafta" : " gün") + '</span>' : ""; }

  /* ── Bildirim ── */
  function tost(m) { var t = $("#tost"); t.textContent = m; t.classList.add("acik"); clearTimeout(tost.z); tost.z = setTimeout(function () { t.classList.remove("acik"); }, 2600); }
  function titret(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  /* ── Bugün ── */
  function selamla() { var d = istanbul().dakika; return d < 300 ? "İyi geceler" : d < 720 ? "Günaydın" : d < 1080 ? "İyi günler" : "İyi akşamlar"; }
  function halkaSvg(r, kalinlik, oranDeger, sinif) {
    var c = 2 * Math.PI * r, b = r + kalinlik / 2 + 1;
    return '<svg viewBox="0 0 ' + 2 * b + ' ' + 2 * b + '" aria-hidden="true"><circle class="iz" cx="' + b + '" cy="' + b + '" r="' + r + '"/><circle class="dolgu ' + (sinif || "") + '" cx="' + b + '" cy="' + b + '" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - Math.min(1, oranDeger))).toFixed(1) + '"/></svg>';
  }
  function isaretHtml(a, t) {
    var v = deger(a, t), p = Math.min(1, v / a.hedef), dolu = v >= a.hedef;
    var etiket = a.hedef > 1 ? a.ad + ": " + v + " / " + a.hedef + " " + (a.birim || "") : a.ad + (dolu ? ", tamamlandı" : ", işaretle");
    return '<button type="button" class="isaret' + (dolu ? " dolu" : "") + '" data-isaret="' + a.id + '" style="--p:' + p + '" aria-label="' + kacir(etiket) + '" aria-pressed="' + dolu + '">' +
      '<svg class="halka" viewBox="0 0 52 52" aria-hidden="true"><circle class="iz" cx="26" cy="26" r="23"/><circle class="dolgu" cx="26" cy="26" r="23"/></svg>' +
      '<span class="ic"></span>' + (a.hedef > 1 ? '<span class="sayi">' + v + '</span>' : "") +
      '<svg class="tik" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>';
  }
  function kartHtml(a, t, uyku) {
    var v = deger(a, t), alt = [];
    if (a.tur === "haftalik") alt.push("Bu hafta " + haftaTamam(a, t) + " / " + a.haftalik);
    else if (a.hedef > 1) alt.push(v + " / " + a.hedef + " " + kacir(a.birim || "kez"));
    else alt.push(siklikYazi(a));
    if (a.hatirlat && a.saat && t === bugun && !tamam(a, t)) alt.push(a.saat.replace(":", "."));
    return '<article class="ak' + (tamam(a, t) ? " bitti" : "") + (uyku ? " uyku" : "") + '" style="--r:' + renk(a) + '" data-kart="' + a.id + '">' +
      '<button type="button" class="ak-govde" data-detay="' + a.id + '"><span class="ak-simge">' + simge(a) + '</span><span class="ak-yazi"><b>' + kacir(a.ad) + '</b><span class="ak-alt">' + seriYazi(a) + "<span>" + alt.join(" · ") + "</span></span></span></button>" +
      (a.hedef > 1 && v > 0 && v < a.hedef ? '<button type="button" class="azalt" data-azalt="' + a.id + '" aria-label="Bir azalt">' + EKSI + "</button>" : "") +
      isaretHtml(a, t) + "</article>";
  }
  function bugunEkrani() {
    var t = seciliGun, oz = gunOzeti(t), haftaBas = gunEkle(haftaBasi(bugun), -7 * haftaOfset);
    var planlilar = [], digerleri = [];
    aktifler().forEach(function (a) { if (a.olusturma && t < a.olusturma) return; (planli(a, t) ? planlilar : digerleri).push(a); });
    var gunler = "";
    for (var i = 0; i < 7; i++) {
      var g = gunEkle(haftaBas, i), go = gunOzeti(g), gelecek = g > bugun, tam = go.toplam && go.tamam === go.toplam && !gelecek;
      gunler += '<button type="button" class="gun' + (g === t ? " secili" : "") + (tam ? " tam" : "") + '" data-gun="' + g + '"' + (gelecek ? " disabled" : "") + ' aria-label="' + tarihYaz(g, { weekday: "long" }) + '"' + (g === t ? ' aria-current="date"' : "") + '><small>' + GUN_KISA[haftaGunu(g)] + '</small><span class="halkacik">' + halkaSvg(14, 3.5, gelecek || !go.toplam ? 0 : go.tamam / go.toplam) + '<i>' + Number(g.slice(8)) + '</i></span></button>';
    }
    var baslik = t === bugun ? selamla() + ", " + kacir(V.ad || "") : (t === gunEkle(bugun, -1) ? "Dün" : tarihYaz(t, { weekday: "long" }));
    var ozetMetin = !oz.toplam ? "Bu gün için planlı alışkanlık yok" : oz.tamam === oz.toplam ? "Hepsi tamam, harika bir gün" : (oz.toplam - oz.tamam) + " alışkanlık seni bekliyor";
    var h = '<div class="giris">' +
      '<header class="ust"><div><p class="tarih">' + tarihYaz(bugun, { weekday: "long" }) + '</p><h1>' + baslik + '</h1></div><button type="button" class="yuvarlak-dugme" data-yeni aria-label="Yeni alışkanlık">' + ARTI + '</button></header>' +
      '<section class="ozet" aria-label="Günün özeti"><div class="ozet-halka">' + halkaSvg(31, 8, oz.toplam ? oz.tamam / oz.toplam : 0) + '<b>' + oz.tamam + "/" + oz.toplam + '</b></div><div class="ozet-metin"><strong>' + ozetMetin + '</strong><span>' + (oz.toplam ? "Günün yüzde " + Math.round(100 * oz.tamam / oz.toplam) + " kadarı bitti" : "Dinlenme günü") + (t !== bugun ? " · " + tarihYaz(t) : "") + '</span></div></section>' +
      '<section class="hafta" aria-label="Hafta"><div class="hafta-ust"><b>' + (haftaOfset === 0 ? "Bu hafta" : haftaOfset === 1 ? "Geçen hafta" : tarihYaz(haftaBas) + " haftası") + '</b><div class="hafta-ok"><button type="button" data-hafta="1" aria-label="Önceki hafta">' + SOL + '</button><button type="button" data-hafta="-1" aria-label="Sonraki hafta"' + (haftaOfset === 0 ? " disabled" : "") + '>' + SAG + '</button></div></div><div class="gunler">' + gunler + '</div></section>';
    if (!aktifler().length) {
      h += '<div class="bos" style="margin-top:22px"><b>Henüz alışkanlık yok</b>Küçük bir adımla başla: su içmek, kitap okumak ya da kısa bir yürüyüş.<br /><button type="button" class="dugme imza" data-yeni>' + ARTI + 'İlk alışkanlığını ekle</button></div>';
    } else {
      h += '<div class="bolum"><h2>' + (t === bugun ? "Bugün" : tarihYaz(t, { weekday: "long" })) + '</h2><span>' + planlilar.length + ' alışkanlık</span></div><div class="liste">' + (planlilar.map(function (a) { return kartHtml(a, t); }).join("") || '<div class="bos">Bu gün için planlı alışkanlık yok.</div>') + '</div>';
      if (oz.toplam && oz.tamam === oz.toplam && t === bugun) h += '<div class="kutlama">' + S('<path d="M5 12.5l4.5 4.5L19 7.5"/>') + '<span>Bugünkü listenin tamamı bitti. Serin güvende, yarın görüşürüz.</span></div>';
      if (digerleri.length) h += '<div class="bolum"><h2>Bugün planlı değil</h2><span>İstersen yine işaretle</span></div><div class="liste">' + digerleri.map(function (a) { return kartHtml(a, t, true); }).join("") + "</div>";
    }
    return h + "</div>";
  }

  function isaretle(id, yon) {
    var a = bul(id); if (!a) return;
    var t = seciliGun, k = V.kayit[a.id] || (V.kayit[a.id] = {}), v = k[t] || 0, onceTamam = v >= a.hedef;
    if (yon < 0) v = Math.max(0, v - 1);
    else if (a.hedef > 1) v = v >= a.hedef ? 0 : v + 1;
    else v = v ? 0 : 1;
    if (v) k[t] = v; else delete k[t];
    kaydet();
    var simdiTamam = v >= a.hedef;
    titret(simdiTamam && !onceTamam ? [12, 40, 18] : 8);
    var oncekiOz = gunOzeti(t);
    goster("bugun", true);
    var d = $('[data-isaret="' + id + '"]');
    if (d) {
      d.classList.add("zipla");
      if (simdiTamam && !onceTamam) {
        var p = document.createElement("span"); p.className = "patla";
        for (var i = 0; i < 10; i++) { var x = document.createElement("i"); x.style.setProperty("--a", i * 36 + "deg"); p.appendChild(x); }
        d.appendChild(p);
        var s = seri(a);
        if (t === bugun && s > 1 && (s % 7 === 0 || s === 3 || s === 30 || s === 100)) tost(a.ad + ": " + s + (a.tur === "haftalik" ? " haftalık" : " günlük") + " seri!");
        else if (oncekiOz.toplam && oncekiOz.tamam === oncekiOz.toplam) tost("Günün tamamı bitti!");
      }
    }
  }

  /* ── İstatistik ── */
  function istatistikEkrani() {
    var l = aktifler(), n = istatAralik;
    var cub = "", toplamOran = 0, sayac = 0;
    for (var i = n - 1; i >= 0; i--) {
      var t = gunEkle(bugun, -i), oz = gunOzeti(t), r = oz.toplam ? oz.tamam / oz.toplam : 0;
      if (oz.toplam && (i > 0 || oz.tamam)) { toplamOran += r; sayac++; }
      var etiket = n <= 7 ? GUN_KISA[haftaGunu(t)] : n <= 14 || i % 5 === 0 ? String(Number(t.slice(8))) : "";
      cub += '<div class="cubuk' + (i === 0 ? " bugun" : r >= 0.8 ? " yuksek" : "") + '" title="' + tarihYaz(t) + ": yüzde " + Math.round(r * 100) + '"><div style="height:' + Math.max(3, Math.round(r * 100)) + '%"></div><small>' + etiket + '</small></div>';
    }
    var gunBazli = [0, 0, 0, 0, 0, 0, 0], gunSay = [0, 0, 0, 0, 0, 0, 0];
    for (var j = 1; j <= 84; j++) { var tt = gunEkle(bugun, -j), o = gunOzeti(tt); if (o.toplam) { gunBazli[haftaGunu(tt)] += o.tamam / o.toplam; gunSay[haftaGunu(tt)]++; } }
    var enIyiGun = 1, enIyiDeger = -1;
    var gunCub = [1, 2, 3, 4, 5, 6, 0].map(function (g) { var r = gunSay[g] ? gunBazli[g] / gunSay[g] : 0; if (r > enIyiDeger) { enIyiDeger = r; enIyiGun = g; } return '<div class="cubuk' + (r >= 0.8 ? " yuksek" : "") + '"><div style="height:' + Math.max(3, Math.round(r * 100)) + '%"></div><small>' + GUN_KISA[g] + '</small></div>'; }).join("");
    var isaretToplam = 0, enIyiSeri = 0, enIyiAd = "";
    l.forEach(function (a) { isaretToplam += toplam(a); var e = enUzun(a); if (e > enIyiSeri) { enIyiSeri = e; enIyiAd = a.ad; } });
    var bu = gunOzeti(bugun);
    var siralama = l.map(function (a) { return { a: a, r: oran(a, 30) }; }).sort(function (x, y) { return y.r - x.r; }).map(function (x) {
      return '<div class="sira-satir" style="--r:' + renk(x.a) + '"><span class="ak-simge">' + simge(x.a) + '</span><div class="sira-bilgi"><b><span>' + kacir(x.a.ad) + '</span><em>yüzde ' + Math.round(x.r * 100) + '</em></b><div class="cizgi-bar"><i style="width:' + Math.round(x.r * 100) + '%"></i></div></div></div>';
    }).join("");
    return '<div class="giris"><header class="ust"><div><p class="tarih">Son ' + n + ' gün</p><h1>İstatistik</h1></div></header>' +
      '<div class="olcu-izgara"><div class="olcu koyu"><span>Ortalama tamamlama</span><b>yüzde ' + (sayac ? Math.round(100 * toplamOran / sayac) : 0) + '</b><small>son ' + n + ' gün</small></div>' +
      '<div class="olcu"><span>Bugün</span><b>' + bu.tamam + " / " + bu.toplam + '</b><small>tamamlandı</small></div>' +
      '<div class="olcu"><span>Toplam işaret</span><b>' + sayi(isaretToplam) + '</b><small>tüm zamanlar</small></div>' +
      '<div class="olcu"><span>En uzun seri</span><b>' + enIyiSeri + '</b><small>' + kacir(enIyiAd || "henüz yok") + '</small></div></div>' +
      '<section class="kart" style="margin-top:12px"><div class="kart-ust"><h3>Günlük tamamlama</h3><div class="secici" role="group" aria-label="Aralık">' + [7, 14, 30].map(function (x) { return '<button type="button" data-aralik="' + x + '"' + (x === n ? ' class="secili" aria-pressed="true"' : ' aria-pressed="false"') + '>' + x + ' gün</button>'; }).join("") + '</div></div><div class="cubuklar">' + cub + '</div></section>' +
      '<section class="kart"><div class="kart-ust"><h3>Haftanın günleri</h3><span>En iyi gün ' + GUN_UZUN[enIyiGun] + '</span></div><div class="cubuklar" style="height:110px">' + gunCub + '</div></section>' +
      '<section class="kart"><div class="kart-ust"><h3>Alışkanlık başına</h3><span>son 30 gün</span></div>' + (siralama || '<p style="color:var(--soluk);margin:0">Alışkanlık ekleyince burada görünür.</p>') + '</section></div>';
  }

  /* ── Alışkanlıklar (yönet) ── */
  function yonetEkrani() {
    var l = aktifler(), ar = V.aliskanliklar.filter(function (a) { return a.arsiv; });
    var satir = function (a, arsiv) {
      return '<div class="yonet-satir" style="--r:' + renk(a) + '" data-sira="' + a.id + '">' + (arsiv ? '<span style="width:6px"></span>' : '<span class="tut" data-tut aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></span>') +
        '<span class="ak-simge">' + simge(a) + '</span><button type="button" class="yonet-bilgi" data-' + (arsiv ? "detay" : "duzenle") + '="' + a.id + '"><b>' + kacir(a.ad) + '</b><span>' + siklikYazi(a) + (a.hedef > 1 ? " · " + a.hedef + " " + kacir(a.birim || "kez") : "") + (a.hatirlat ? " · " + a.saat.replace(":", ".") : "") + '</span></button>' +
        (arsiv ? '<button type="button" class="metin-dugme" data-geri="' + a.id + '">Geri al</button>'
          : '<button type="button" class="mini" data-yukari="' + a.id + '" aria-label="Yukarı taşı">' + S('<path d="M6 15l6-6 6 6"/>') + '</button><button type="button" class="mini" data-asagi="' + a.id + '" aria-label="Aşağı taşı">' + S('<path d="M6 9l6 6 6-6"/>') + '</button>') + "</div>";
    };
    var bildirimDurum = typeof Notification === "undefined" ? "Bu tarayıcı bildirim desteklemiyor" : Notification.permission === "granted" ? "Bildirimler açık" : "Hatırlatma saatinde bildirim gönderir";
    return '<div class="giris"><header class="ust"><div><p class="tarih">' + l.length + " etkin, " + ar.length + ' arşivde</p><h1>Alışkanlıklar</h1></div><button type="button" class="yuvarlak-dugme" data-yeni aria-label="Yeni alışkanlık">' + ARTI + '</button></header>' +
      '<div class="bolum"><h2>Sıralama</h2><span>Tutup sürükle</span></div><div class="yonet" id="yonetListe">' + (l.map(function (a) { return satir(a); }).join("") || '<div class="bos">Etkin alışkanlık yok.</div>') + '</div>' +
      (ar.length ? '<div class="bolum"><h2>Arşiv</h2><span>Geçmişi saklanır</span></div><div class="yonet">' + ar.map(function (a) { return satir(a, true); }).join("") + "</div>" : "") +
      '<div class="bolum"><h2>Ayarlar</h2></div><section class="kart">' +
      '<label class="ayar-satir"><div><b>Adın</b><span>Selamlamada görünür</span></div><input class="girdi" id="adGirdi" style="max-width:150px;min-height:42px" maxlength="20" value="' + kacir(V.ad || "") + '" /></label>' +
      '<div class="ayar-satir"><div><b>Hatırlatma bildirimleri</b><span>' + bildirimDurum + '</span></div><button type="button" class="metin-dugme" data-bildirim>İzin ver</button></div>' +
      '<div class="ayar-satir"><div><b>Verileri dışa aktar</b><span>JSON dosyası olarak indir</span></div><button type="button" class="metin-dugme" data-disa>İndir</button></div>' +
      '<div class="ayar-satir"><div><b>Her şeyi sil</b><span>Alışkanlıklar ve geçmiş silinir</span></div><button type="button" class="metin-dugme" style="color:#c43b16" data-sifirla>Sil</button></div></section></div>';
  }
  function tasi(id, yon) {
    var l = V.aliskanliklar, i = l.findIndex(function (a) { return a.id === id; }), j = i;
    do { j += yon; } while (j >= 0 && j < l.length && l[j].arsiv);
    if (j < 0 || j >= l.length) return;
    var x = l[i]; l[i] = l[j]; l[j] = x; kaydet(); goster("yonet", true);
    var d = $('[data-' + (yon < 0 ? "yukari" : "asagi") + '="' + id + '"]'); if (d) d.focus();
  }
  /* Tutamakla sürükleyerek sıralama (dokunmatik ve fare). */
  document.addEventListener("pointerdown", function (e) {
    var tut = e.target.closest("[data-tut]"); if (!tut) return;
    var satir = tut.closest(".yonet-satir"), kap = $("#yonetListe"); if (!satir || !kap) return;
    e.preventDefault();
    var basY = e.clientY, satirlar = $$(".yonet-satir", kap), yuk = satir.offsetHeight + 8, i0 = satirlar.indexOf(satir), hedef = i0;
    satir.classList.add("surukleniyor"); titret(10);
    function hareket(ev) {
      var dy = ev.clientY - basY; satir.style.transform = "translateY(" + dy + "px) scale(1.02)";
      hedef = Math.max(0, Math.min(satirlar.length - 1, i0 + Math.round(dy / yuk)));
      satirlar.forEach(function (s, k) { if (s === satir) return; var kay = 0; if (k > i0 && k <= hedef) kay = -yuk; if (k < i0 && k >= hedef) kay = yuk; s.style.transition = "transform .2s"; s.style.transform = kay ? "translateY(" + kay + "px)" : ""; });
    }
    function bitir() {
      removeEventListener("pointermove", hareket); removeEventListener("pointerup", bitir); removeEventListener("pointercancel", bitir);
      if (hedef !== i0) {
        var etkin = aktifler(), x = etkin.splice(i0, 1)[0]; etkin.splice(hedef, 0, x);
        V.aliskanliklar = etkin.concat(V.aliskanliklar.filter(function (a) { return a.arsiv; })); kaydet(); titret(10);
      }
      goster("yonet", true);
    }
    addEventListener("pointermove", hareket); addEventListener("pointerup", bitir); addEventListener("pointercancel", bitir);
  });

  /* ── Alt sayfa ── */
  var sayfa = $("#sayfa"), perde = $("#perde"), oncekiOdak = null;
  function sayfaAc(html) {
    oncekiOdak = document.activeElement;
    sayfa.innerHTML = '<span class="tutamak" data-tutamak aria-hidden="true"></span>' + html;
    sayfa.classList.remove("kapaniyor"); sayfa.style.transform = "";
    sayfa.hidden = false; perde.hidden = false; document.body.style.overflow = "hidden";
    var o = sayfa.querySelector("h2"); if (o) { o.setAttribute("tabindex", "-1"); o.id = "sayfaBaslik"; o.focus({ preventScroll: true }); }
  }
  function sayfaKapat() {
    if (sayfa.hidden) return;
    sayfa.classList.add("kapaniyor"); perde.hidden = true; document.body.style.overflow = "";
    setTimeout(function () { sayfa.hidden = true; sayfa.innerHTML = ""; sayfa.classList.remove("kapaniyor"); sayfa.style.transform = ""; }, 240);
    if (oncekiOdak && oncekiOdak.focus && document.contains(oncekiOdak)) oncekiOdak.focus({ preventScroll: true });
  }
  perde.addEventListener("click", sayfaKapat);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") sayfaKapat(); });
  sayfa.addEventListener("pointerdown", function (e) {
    if (!e.target.closest("[data-tutamak]")) return;
    var y0 = e.clientY, dy = 0; sayfa.style.transition = "none";
    function m(ev) { dy = Math.max(0, ev.clientY - y0); sayfa.style.transform = "translate(-50%, " + dy + "px)"; }
    function b() { removeEventListener("pointermove", m); removeEventListener("pointerup", b); sayfa.style.transition = ""; if (dy > 110) sayfaKapat(); else sayfa.style.transform = ""; }
    addEventListener("pointermove", m); addEventListener("pointerup", b);
  });

  /* Detay: seriler, oran ve yıllık ısı haritası */
  function detayAc(id) {
    var a = bul(id); if (!a) return;
    var r = renk(a), s = seri(a), birim = a.tur === "haftalik" ? " hafta" : " gün";
    var bas = gunEkle(haftaBasi(bugun), -52 * 7), h = "", sonAy = -1;
    for (var w = 0; w < 53; w++) {
      var hb = gunEkle(bas, w * 7), ay = Number(hb.slice(5, 7)) - 1;
      h += '<span class="ay" style="grid-column:' + (w + 1) + '">' + (ay !== sonAy && w < 51 ? AY_KISA[ay] : "") + "</span>";
      sonAy = ay;
      for (var d = 0; d < 7; d++) {
        var t = gunEkle(hb, d), v = deger(a, t), oranD = Math.min(1, v / a.hedef);
        var stil = t > bugun ? "" : v ? "background:color-mix(in srgb," + r + " " + Math.round(25 + 75 * oranD) + "%,transparent)" : "";
        h += '<i class="h' + (t > bugun ? " gelecek" : v ? " p" : "") + '" style="grid-column:' + (w + 1) + ";grid-row:" + (d + 2) + ";" + stil + '" title="' + tarihYaz(t) + (v ? ": " + v + (a.hedef > 1 ? " / " + a.hedef : "") : "") + '"></i>';
      }
    }
    var gunSayisi = farkGun(a.olusturma || bugun, bugun) + 1;
    sayfaAc('<div class="sayfa-ust yuzen"><button type="button" class="kapat" data-kapat aria-label="Kapat">' + CARPI + '</button></div>' +
      '<div class="detay-bas" style="--r:' + r + '"><span class="ak-simge">' + simge(a) + '</span><div><h2>' + kacir(a.ad) + '</h2><p>' + siklikYazi(a) + (a.hedef > 1 ? " · günde " + a.hedef + " " + kacir(a.birim || "kez") : "") + (a.hatirlat ? " · " + a.saat.replace(":", ".") : "") + (a.arsiv ? " · Arşivde" : "") + '</p></div></div>' +
      '<div class="dortlu"><div><span>Mevcut seri</span><b>' + s + birim + '</b></div><div><span>En uzun seri</span><b>' + enUzun(a) + birim + '</b></div><div><span>Son 30 gün</span><b>yüzde ' + Math.round(oran(a, 30) * 100) + '</b></div><div><span>Toplam</span><b>' + sayi(toplam(a)) + ' kez</b></div></div>' +
      '<section class="kart" style="--r:' + r + '"><div class="kart-ust"><h3>Son bir yıl</h3><span>' + sayi(gunSayisi) + ' gündür takipte</span></div><div class="isi-kap" id="isiKap"><div class="isi">' + h + '</div></div>' +
      '<div class="isi-alt"><span>Her kare bir gün</span><span class="lejant">Az <i style="background:var(--yuzey-2);box-shadow:inset 0 0 0 1px var(--cizgi)"></i><i style="background:color-mix(in srgb,' + r + ' 45%,transparent)"></i><i style="background:color-mix(in srgb,' + r + ' 75%,transparent)"></i><i style="background:' + r + '"></i> Çok</span></div></section>' +
      '<div class="eylem-satir">' + (a.arsiv ? '<button type="button" class="dugme ikincil" data-geri="' + a.id + '">Arşivden çıkar</button>' : '<button type="button" class="dugme" data-duzenle="' + a.id + '">Düzenle</button><button type="button" class="dugme ikincil" data-arsivle="' + a.id + '">Arşivle</button>') + '</div>' +
      '<button type="button" class="dugme tehlike tam" style="margin-top:8px" data-sil="' + a.id + '">Alışkanlığı sil</button>');
    var k = $("#isiKap"); if (k) k.scrollLeft = k.scrollWidth;
  }

  /* Ekleme ve düzenleme formu */
  var F = null;
  function formAc(id) {
    var a = id ? bul(id) : null;
    F = a ? JSON.parse(JSON.stringify(a)) : { id: "", ad: "", ikon: "su", renk: 0, tur: "gunluk", gunler: [1, 2, 3, 4, 5], haftalik: 3, hedef: 1, birim: "", saat: "09:00", hatirlat: true };
    if (!F.gunler || !F.gunler.length) F.gunler = [1, 2, 3, 4, 5];
    sayfaAc('<div class="sayfa-ust"><h2>' + (a ? "Alışkanlığı düzenle" : "Yeni alışkanlık") + '</h2><button type="button" class="kapat" data-kapat aria-label="Kapat">' + CARPI + '</button></div><form id="form" novalidate></form>');
    formCiz(true);
  }
  function formCiz(ilk) {
    var f = $("#form"); if (!f) return;
    var r = RENKLER[F.renk];
    f.style.setProperty("--r", r);
    f.innerHTML = '<label class="alan"><span>Ad</span><input class="girdi" id="fAd" maxlength="40" required placeholder="Örneğin: Sabah esneme" value="' + kacir(F.ad) + '" /></label>' +
      (F.id ? "" : '<div class="oneriler" aria-label="Hazır öneriler">' + ONERI.map(function (o, i) { return '<button type="button" data-oneri="' + i + '">' + kacir(o.ad) + "</button>"; }).join("") + "</div>") +
      '<div class="alan"><span>Simge</span><div class="ikon-izgara">' + Object.keys(IKONLAR).map(function (k) { return '<button type="button" data-ikon="' + k + '"' + (k === F.ikon ? ' class="secili" aria-pressed="true"' : ' aria-pressed="false"') + ' aria-label="Simge ' + k + '">' + S(IKONLAR[k]) + "</button>"; }).join("") + "</div></div>" +
      '<div class="alan"><span>Renk</span><div class="renkler">' + RENKLER.map(function (c, i) { return '<button type="button" data-renk="' + i + '" style="--c:' + c + '"' + (i === F.renk ? ' class="secili" aria-pressed="true"' : ' aria-pressed="false"') + ' aria-label="Renk ' + (i + 1) + '"></button>'; }).join("") + "</div></div>" +
      '<div class="alan"><span>Sıklık</span><div class="parcali">' + [["gunluk", "Her gün"], ["gunler", "Belirli günler"], ["haftalik", "Haftada N"]].map(function (x) { return '<button type="button" data-tur="' + x[0] + '"' + (F.tur === x[0] ? ' class="secili"' : "") + ">" + x[1] + "</button>"; }).join("") + "</div>" +
      (F.tur === "gunler" ? '<div class="gun-cipleri">' + [1, 2, 3, 4, 5, 6, 0].map(function (g) { return '<button type="button" data-gunsec="' + g + '"' + (F.gunler.indexOf(g) >= 0 ? ' class="secili" aria-pressed="true"' : ' aria-pressed="false"') + ">" + GUN_KISA[g] + "</button>"; }).join("") + "</div>" : "") +
      (F.tur === "haftalik" ? '<div class="adimlayici"><b>Haftada kaç gün</b><div><button type="button" data-adim="haftalik" data-yon="-1" aria-label="Azalt">' + EKSI + '</button><output>' + F.haftalik + '</output><button type="button" data-adim="haftalik" data-yon="1" aria-label="Artır">' + ARTI + "</button></div></div>" : "") + "</div>" +
      '<div class="alan"><span>Günlük hedef</span><div class="adimlayici" style="margin-top:0"><b>' + (F.hedef > 1 ? "Günde " + F.hedef + " kez" : "Günde bir kez") + '</b><div><button type="button" data-adim="hedef" data-yon="-1" aria-label="Azalt">' + EKSI + '</button><output>' + F.hedef + '</output><button type="button" data-adim="hedef" data-yon="1" aria-label="Artır">' + ARTI + "</button></div></div>" +
      (F.hedef > 1 ? '<input class="girdi" id="fBirim" style="margin-top:8px" maxlength="16" placeholder="Birim, örneğin bardak" value="' + kacir(F.birim) + '" />' : "") + "</div>" +
      '<div class="alan"><span>Hatırlatma</span><div class="iki"><input class="girdi" type="time" id="fSaat" value="' + kacir(F.saat || "09:00") + '" aria-label="Hatırlatma saati"' + (F.hatirlat ? "" : " disabled") + ' /><label class="adimlayici" style="margin-top:0;padding-right:10px"><b>' + (F.hatirlat ? "Açık" : "Kapalı") + '</b><span class="anahtar"><input type="checkbox" id="fHatirlat"' + (F.hatirlat ? " checked" : "") + ' aria-label="Hatırlatma açık" /><i></i></span></label></div></div>' +
      '<button type="submit" class="dugme imza tam">' + (F.id ? "Değişiklikleri kaydet" : "Alışkanlığı ekle") + "</button>";
    if (ilk) { var g = $("#fAd"); if (g && !F.id) setTimeout(function () { g.focus({ preventScroll: true }); }, 350); }
  }
  function formOku() { var a = $("#fAd"), b = $("#fBirim"), s = $("#fSaat"); if (a) F.ad = a.value; if (b) F.birim = b.value; if (s) F.saat = s.value || F.saat; }

  /* ── Sekmeler ── */
  function goster(sekme, sessiz) {
    aktif = sekme;
    var e = $("#ekran"), y = sessiz ? scrollY : 0;
    e.innerHTML = sekme === "istatistik" ? istatistikEkrani() : sekme === "yonet" ? yonetEkrani() : bugunEkrani();
    if (sessiz) { var g = e.firstElementChild; if (g) g.classList.remove("giris"); scrollTo(0, y); } else { scrollTo(0, 0); }
    $$(".sekmeler button").forEach(function (b) { var s = b.getAttribute("data-sekme") === sekme; b.classList.toggle("secili", s); if (s) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    kenarGuncelle();
  }
  function kenarGuncelle() {
    var k = $("#kenarSag"); if (!k) return;
    var en = 0; aktifler().forEach(function (a) { en = Math.max(en, seri(a)); });
    var oz = gunOzeti(bugun);
    k.innerHTML = '<div><b>' + oz.tamam + " / " + oz.toplam + '</b><span>bugün tamamlanan</span></div><div><b>' + en + ' gün</b><span>süren en uzun serin</span></div><div><b>' + aktifler().length + '</b><span>etkin alışkanlık</span></div>';
  }

  /* ── Olaylar ── */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var d = b.dataset;
    if (d.sekme) { sayfaKapat(); return goster(d.sekme); }
    if (d.isaret) return isaretle(d.isaret, 1);
    if (d.azalt) return isaretle(d.azalt, -1);
    if (d.gun) { seciliGun = d.gun; return goster("bugun", true); }
    if (d.hafta) { haftaOfset = Math.max(0, haftaOfset + Number(d.hafta)); var hb = gunEkle(haftaBasi(bugun), -7 * haftaOfset); seciliGun = haftaOfset === 0 ? bugun : gunEkle(hb, 6); return goster("bugun", true); }
    if (d.aralik) { istatAralik = Number(d.aralik); return goster("istatistik", true); }
    if (d.detay) return detayAc(d.detay);
    if (d.kapat !== undefined) return sayfaKapat();
    if (d.yeni !== undefined) return formAc();
    if (d.duzenle) return formAc(d.duzenle);
    if (d.yukari) return tasi(d.yukari, -1);
    if (d.asagi) return tasi(d.asagi, 1);
    if (d.arsivle) { var a1 = bul(d.arsivle); a1.arsiv = true; kaydet(); sayfaKapat(); goster(aktif, true); return tost(a1.ad + " arşivlendi"); }
    if (d.geri) { var a2 = bul(d.geri); a2.arsiv = false; kaydet(); sayfaKapat(); goster(aktif, true); return tost(a2.ad + " yeniden etkin"); }
    if (d.sil) {
      if (b.dataset.onay !== "1") { b.dataset.onay = "1"; b.textContent = "Emin misin? Geçmişi de silinir, tekrar dokun"; return; }
      var a3 = bul(d.sil); V.aliskanliklar = V.aliskanliklar.filter(function (x) { return x.id !== d.sil; }); delete V.kayit[d.sil]; kaydet(); sayfaKapat(); goster(aktif, true); return tost(a3.ad + " silindi");
    }
    if (d.oneri !== undefined) { var o = ONERI[Number(d.oneri)]; formOku(); F.ad = o.ad; F.ikon = o.ikon; F.renk = o.renk; F.hedef = o.hedef || 1; F.birim = o.birim || ""; F.tur = o.tur || "gunluk"; if (o.haftalik) F.haftalik = o.haftalik; if (o.gunler) F.gunler = o.gunler.slice(); return formCiz(); }
    if (d.ikon) { formOku(); F.ikon = d.ikon; return formCiz(); }
    if (d.renk !== undefined) { formOku(); F.renk = Number(d.renk); return formCiz(); }
    if (d.tur) { formOku(); F.tur = d.tur; return formCiz(); }
    if (d.gunsec !== undefined) { formOku(); var g = Number(d.gunsec), i = F.gunler.indexOf(g); if (i >= 0) { if (F.gunler.length > 1) F.gunler.splice(i, 1); } else F.gunler.push(g); return formCiz(); }
    if (d.adim) { formOku(); var sin = d.adim === "haftalik" ? [1, 6] : [1, 30]; F[d.adim] = Math.max(sin[0], Math.min(sin[1], F[d.adim] + Number(d.yon))); return formCiz(); }
    if (d.bildirim !== undefined) {
      if (typeof Notification === "undefined") return tost("Bu tarayıcı bildirim desteklemiyor");
      try { Notification.requestPermission().then(function (p) { tost(p === "granted" ? "Bildirimler açıldı" : "Bildirim izni verilmedi; hatırlatmalar uygulama içinde görünür"); goster("yonet", true); }); } catch (x) { tost("Bildirim izni alınamadı"); }
      return;
    }
    if (d.disa !== undefined) {
      var blob = new Blob([JSON.stringify(V, null, 2)], { type: "application/json" }), u = URL.createObjectURL(blob), l = document.createElement("a");
      l.href = u; l.download = "ritim-" + bugun + ".json"; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); return tost("Veriler indirildi");
    }
    if (d.sifirla !== undefined) {
      if (b.dataset.onay !== "1") { b.dataset.onay = "1"; b.textContent = "Emin misin?"; return; }
      V = { aliskanliklar: [], kayit: {}, ad: V.ad }; kaydet(); goster("bugun"); return tost("Tüm veriler silindi");
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.id === "fHatirlat") { formOku(); F.hatirlat = e.target.checked; formCiz(); }
    if (e.target.id === "adGirdi") { V.ad = e.target.value.trim().slice(0, 20); kaydet(); tost("Adın kaydedildi"); }
  });
  document.addEventListener("submit", function (e) {
    if (e.target.id !== "form") return;
    e.preventDefault(); formOku();
    F.ad = F.ad.trim();
    if (!F.ad) { var g = $("#fAd"); g.focus(); g.style.borderColor = "#c43b16"; return tost("Alışkanlığa bir ad ver"); }
    if (F.hedef > 1 && !F.birim.trim()) F.birim = "kez";
    if (F.id) { var i = V.aliskanliklar.findIndex(function (a) { return a.id === F.id; }); V.aliskanliklar[i] = F; tost("Kaydedildi"); }
    else { F.id = kimlik(); F.olusturma = bugun; F.arsiv = false; V.aliskanliklar.push(F); tost(F.ad + " eklendi"); }
    kaydet(); sayfaKapat(); goster(aktif === "istatistik" ? "bugun" : aktif, aktif !== "istatistik");
  });

  /* Hatırlatmalar: dakikada bir bakılır; zamanı gelmiş ve bitmemiş alışkanlık için bildirim ya da uygulama içi not. */
  var hatirlatilan = {};
  function hatirlatmaKontrol() {
    var simdi = istanbul(), saat = String(Math.floor(simdi.dakika / 60)).padStart(2, "0") + ":" + String(simdi.dakika % 60).padStart(2, "0");
    aktifler().forEach(function (a) {
      if (!a.hatirlat || a.saat !== saat || !planli(a, simdi.tarih) || tamam(a, simdi.tarih) || hatirlatilan[a.id + simdi.tarih]) return;
      hatirlatilan[a.id + simdi.tarih] = 1;
      try { if (typeof Notification !== "undefined" && Notification.permission === "granted") { new Notification("Ritim", { body: a.ad + " zamanı", icon: "ikon.svg" }); return; } } catch (x) {}
      tost("Hatırlatma: " + a.ad);
    });
    if (simdi.tarih !== bugun) { bugun = simdi.tarih; seciliGun = bugun; haftaOfset = 0; goster(aktif, true); }
  }
  setInterval(hatirlatmaKontrol, 30000);

  goster("bugun");
})();
`;

const IKON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="116" fill="#1d1a16"/><circle cx="256" cy="256" r="150" fill="none" stroke="#3a342c" stroke-width="44"/><path d="M256 106a150 150 0 1 1-150 150" fill="none" stroke="#ff5b35" stroke-width="44" stroke-linecap="round"/><path d="M196 258l42 42 82-88" fill="none" stroke="#fffdf9" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#f3efe7" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="description" content="Ritim: alışkanlık takibi. Günlük ve haftalık hedefler, seriler, yıllık ısı haritası, istatistikler ve hatırlatmalar." />
  <title>Ritim · Alışkanlık Takibi</title>
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="ikon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,650;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="arka" aria-hidden="true"></div>
  <aside class="kenar" aria-hidden="true">
    <div class="logo">${IKON.replace('xmlns="http://www.w3.org/2000/svg" ', "")}Ritim</div>
    <p>Küçük adımlar, her gün. Alışkanlıklarını işaretle, serini koru, bir yılın nasıl geçtiğini tek bakışta gör.</p>
    <ul><li><i></i>Her gün, belirli günler ya da haftada N kez</li><li><i></i>Sayılı hedefler: 8 bardak su gibi</li><li><i></i>Ana ekrana ekle, uygulama gibi kullan</li></ul>
  </aside>
  <aside class="kenar sag" id="kenarSag" aria-hidden="true"></aside>
  <main id="ekran" tabindex="-1"></main>

  <nav class="sekmeler" aria-label="Ana menü">
    <button type="button" data-sekme="bugun" class="secili" aria-current="page">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M8 12.3l2.8 2.8L16.2 9.6"/></svg><span>Bugün</span>
    </button>
    <button type="button" data-sekme="istatistik">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V12M10 20V5M15 20v-9M20 20V8"/></svg><span>İstatistik</span>
    </button>
    <button type="button" data-sekme="yonet">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg><span>Alışkanlıklar</span>
    </button>
  </nav>

  <div id="perde" class="perde" hidden></div>
  <section id="sayfa" class="alt-sayfa" role="dialog" aria-modal="true" aria-labelledby="sayfaBaslik" hidden></section>
  <div id="tost" class="tost" role="status" aria-live="polite"></div>
  <script src="app.js"></script>
</body>
</html>
`;

export const ALISKANLIK = {
  id: "aliskanlik",
  ad: "Ritim · Alışkanlık Takibi",
  tur: "mobil" as const,
  aciklama: "Simgeli ve renkli alışkanlıklar, sayılı hedefler, haftalık şerit, seriler, yıllık ısı haritası, istatistik ve hatırlatmalar",
  kapak: "/gercek/build/sablon/aliskanlik.webp",
  dosyalar: {
    "index.html": HTML,
    "manifest.webmanifest": JSON.stringify({ name: "Ritim · Alışkanlık Takibi", short_name: "Ritim", description: "Alışkanlık takibi: seriler, ısı haritası, istatistik ve hatırlatmalar.", lang: "tr", start_url: "./index.html", scope: "./", display: "standalone", orientation: "portrait", background_color: "#f3efe7", theme_color: "#f3efe7", icons: [{ src: "ikon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }] }, null, 2),
    "ikon.svg": IKON,
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
