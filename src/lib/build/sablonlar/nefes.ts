/* Şablon: Derin · Nefes ve Meditasyon — mobil uygulama (PWA). Nefes kalıpları (kutu nefesi, 4-7-8, uyumlu nefes, özel),
 * büyüyüp küçülen nefes şekli, evre yazısı, titreşim ve isteğe bağlı yumuşak ton; gerçek doğa fotoğraflı zamanlı meditasyon,
 * ortam sesi ve aralık çanı (Web Audio ile üretilir, dosya gerekmez); öncesi ve sonrası ruh hâli, seans geçmişi, dakika ve
 * seri istatistikleri. Veriler cihazda (localStorage) saklanır. */
import { ORTAK_JS } from "./ortak";

const G = (d: string) => `/gercek/havuz/gorsel/${d}.webp`;
const SAHNELER = [
  { id: "orman", ad: "Çam ormanı", alt: "Toprak kokusu, dingin gölgeler", gorsel: G("mk-doga-50847"), ses: "ruzgar", sure: 10 },
  { id: "gol", ad: "Alacakaranlık gölü", alt: "Günün yükünü bırak", gorsel: G("mk-doga-4998"), ses: "ton", sure: 15 },
  { id: "dalga", ad: "Akşam dalgaları", alt: "Nefesin dalgalarla aynı ritimde", gorsel: G("mk-deniz-44496"), ses: "dalga", sure: 10 },
  { id: "iskele", ad: "Sessiz iskele", alt: "Sabah için hafif bir başlangıç", gorsel: G("mk-deniz-1197"), ses: "dalga", sure: 5 },
  { id: "selale", ad: "Orman şelalesi", alt: "Akışa bırak, düşünceler geçsin", gorsel: G("mk-doga-570"), ses: "yagmur", sure: 20 },
  { id: "sazlik", ad: "Sazlıkta gün batımı", alt: "Uyku öncesi yavaşlama", gorsel: G("mk-doga-5030"), ses: "ton", sure: 15 },
];

const STIL = String.raw`/* Derin — gece mavisi ve mor zemin, şeftali ve lavanta ışık; Fraunces ve Manrope. */
:root {
  --gece: #0c0f1d;
  --gece-2: #141a30;
  --metin: #f3f0ff;
  --soluk: #aeb0cc;
  --soluk-2: #868aa8;
  --seftali: #ffb59a;
  --lavanta: #b9a8ff;
  --nane: #8ee6d0;
  --kart: rgba(255, 255, 255, 0.06);
  --kart-2: rgba(255, 255, 255, 0.1);
  --cizgi: rgba(255, 255, 255, 0.1);
  --cizgi-2: rgba(255, 255, 255, 0.18);
  --serif: "Fraunces", Georgia, serif;
  --yazi: "Manrope", system-ui, -apple-system, "Segoe UI", sans-serif;
  --egri: cubic-bezier(0.22, 1, 0.36, 1);
  --sutun: 480px;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
[hidden] { display: none !important; }
html { background: var(--gece); color-scheme: dark; }
body { margin: 0; min-height: 100vh; min-height: 100dvh; color: var(--metin); font-family: var(--yazi); font-size: 15px; line-height: 1.5; -webkit-font-smoothing: antialiased; overflow-x: hidden; }
button, input { font: inherit; color: inherit; }
button { cursor: pointer; border: 0; background: none; padding: 0; }
:focus-visible { outline: 2px solid var(--seftali); outline-offset: 3px; border-radius: 14px; }
h1, h2, h3 { margin: 0; font-weight: 500; letter-spacing: -0.02em; }
h1, h2 { font-family: var(--serif); font-optical-sizing: auto; }
svg { display: block; }
.arka { position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(70% 45% at 15% 0%, rgba(185, 168, 255, 0.22), rgba(185, 168, 255, 0) 70%),
    radial-gradient(60% 40% at 100% 30%, rgba(255, 181, 154, 0.14), rgba(255, 181, 154, 0) 70%),
    radial-gradient(70% 50% at 50% 110%, rgba(142, 230, 208, 0.10), rgba(142, 230, 208, 0) 70%),
    linear-gradient(180deg, #121633 0%, var(--gece) 60%); }

#ekran { max-width: var(--sutun); margin: 0 auto; padding: calc(env(safe-area-inset-top) + 22px) 20px calc(env(safe-area-inset-bottom) + 116px); outline: none; }
.giris { animation: belir 0.5s var(--egri); }
@keyframes belir { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

.ust { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.ust p { margin: 0; color: var(--soluk); font-size: 13.5px; font-weight: 600; }
.ust h1 { font-size: 34px; line-height: 1.08; margin-top: 4px; font-weight: 400; }
.ust h1 em { font-style: italic; color: var(--seftali); }
.hedef-halka { position: relative; flex: none; width: 58px; height: 58px; }
.hedef-halka svg { width: 58px; height: 58px; transform: rotate(-90deg); }
.hedef-halka circle { fill: none; stroke-width: 5; }
.hedef-halka .iz { stroke: var(--cizgi); }
.hedef-halka .dolgu { stroke: var(--seftali); stroke-linecap: round; transition: stroke-dashoffset 0.8s var(--egri); }
.hedef-halka span { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; font-size: 11px; line-height: 1.05; color: var(--soluk); font-weight: 600; }
.hedef-halka b { display: block; color: var(--metin); font-size: 16px; }

.bolum { display: flex; align-items: baseline; justify-content: space-between; margin: 26px 2px 12px; gap: 10px; }
.bolum h2 { font-size: 21px; }
.bolum span { color: var(--soluk); font-size: 13px; font-weight: 600; }

/* Kalıp kartları */
.kaliplar { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; margin-top: 20px; }
.kalip { position: relative; text-align: left; padding: 16px 14px 14px; border-radius: 24px; background: var(--kart); border: 1px solid var(--cizgi); overflow: hidden; transition: border-color 0.25s, background 0.25s, transform 0.2s var(--egri); min-height: 132px; display: flex; flex-direction: column; }
.kalip:active { transform: scale(0.97); }
.kalip.secili { border-color: rgba(255, 181, 154, 0.6); background: linear-gradient(160deg, rgba(255, 181, 154, 0.16), rgba(185, 168, 255, 0.10)); }
.kalip .sekil { width: 34px; height: 34px; margin-bottom: auto; color: var(--lavanta); }
.kalip.secili .sekil { color: var(--seftali); }
.kalip .sekil svg { width: 34px; height: 34px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.kalip b { display: block; margin-top: 14px; font-size: 15.5px; font-weight: 700; }
.kalip small { display: block; color: var(--soluk); font-size: 12.5px; font-weight: 600; margin-top: 1px; }
.kalip .ritim { position: absolute; right: 12px; top: 14px; font-size: 12px; font-weight: 700; color: var(--soluk); letter-spacing: 0.04em; }

/* Önizleme küresi */
.onizleme { position: relative; display: grid; place-items: center; height: 220px; margin: 4px 0 12px; }
.onizleme .kure { width: 150px; height: 150px; }
.onizleme p { position: absolute; bottom: 10px; margin: 0; color: var(--soluk); font-size: 13.5px; font-weight: 600; text-align: center; }

/* Küre (seans ve önizleme) */
.kure { position: relative; border-radius: 50%; transform: scale(0.62); transition-property: transform; transition-timing-function: cubic-bezier(0.45, 0, 0.55, 1); }
.kure i { position: absolute; inset: 0; border-radius: 46% 54% 52% 48% / 50% 46% 54% 50%; opacity: 0.9; }
.kure i:nth-child(1) { background: radial-gradient(circle at 35% 30%, rgba(232, 122, 112, 0.95), rgba(168, 70, 110, 0.8) 50%, rgba(168, 70, 110, 0) 74%); animation: don 14s linear infinite; }
.kure i:nth-child(2) { background: radial-gradient(circle at 68% 42%, rgba(118, 92, 236, 0.9), rgba(70, 50, 176, 0.75) 48%, rgba(70, 50, 176, 0) 74%); animation: don 19s linear infinite reverse; inset: -4%; }
.kure i:nth-child(3) { background: radial-gradient(circle at 50% 75%, rgba(70, 190, 165, 0.7), rgba(40, 130, 120, 0.4) 40%, rgba(40, 130, 120, 0) 70%); animation: don 23s linear infinite; inset: 4%; opacity: 0.75; }
.kure::after { content: ""; position: absolute; inset: -18%; border-radius: 50%; background: radial-gradient(circle, rgba(255, 190, 170, 0.22), rgba(255, 190, 170, 0) 65%); z-index: -1; }
@keyframes don { to { transform: rotate(360deg); } }
.onizleme .kure { animation: soluk 10s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
@keyframes soluk { 0%, 100% { transform: scale(0.62); } 40%, 55% { transform: scale(1); } }

/* Ayar satırları */
.panel { margin-top: 16px; padding: 6px 16px; border-radius: 24px; background: var(--kart); border: 1px solid var(--cizgi); }
.satir { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; }
.satir + .satir { border-top: 1px solid var(--cizgi); }
.satir b { display: block; font-size: 14.5px; font-weight: 700; }
.satir span { display: block; color: var(--soluk); font-size: 12.5px; font-weight: 500; }
.parcali { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 4px; padding: 4px; border-radius: 16px; background: rgba(0, 0, 0, 0.22); border: 1px solid var(--cizgi); }
.parcali button { min-height: 40px; padding: 0 10px; border-radius: 12px; font-size: 13.5px; font-weight: 700; color: var(--soluk); white-space: nowrap; }
.parcali button.secili { background: var(--metin); color: var(--gece); }
.sure-satir { padding: 14px 0 12px; display: block; }
.sure-satir .parcali { margin-top: 10px; }
.anahtar { position: relative; flex: none; width: 50px; height: 30px; }
.anahtar input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; z-index: 1; }
.anahtar i { position: absolute; inset: 0; border-radius: 99px; background: var(--cizgi-2); transition: background 0.2s; pointer-events: none; }
.anahtar i::after { content: ""; position: absolute; left: 3px; top: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; transition: transform 0.25s var(--egri); }
.anahtar input:checked + i { background: var(--seftali); }
.anahtar input:checked + i::after { transform: translateX(20px); }
.ozel { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 12px; }
.ozel div { border: 1px solid var(--cizgi); }
.ozel div { display: grid; justify-items: center; gap: 6px; padding: 10px 4px; border-radius: 18px; background: rgba(0, 0, 0, 0.2); }
.ozel small { font-size: 11.5px; color: var(--soluk); font-weight: 700; white-space: nowrap; }
.ozel output { font: 500 24px var(--serif); }
.ozel .ad { display: flex; gap: 6px; }
.ozel .ad button { width: 30px; height: 30px; border-radius: 10px; background: var(--kart-2); display: grid; place-items: center; }
.ozel .ad svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }

.dugme { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 56px; padding: 0 26px; border-radius: 999px; font-weight: 800; font-size: 16px; background: linear-gradient(120deg, #ffc6b0, #ffa58c); color: #2a1410; transition: transform 0.18s var(--egri), filter 0.2s; }
.dugme:hover { filter: brightness(1.05); }
.dugme:active { transform: scale(0.97); }
.dugme.tam { width: 100%; margin-top: 16px; }
.dugme.ikincil { background: var(--kart-2); color: var(--metin); border: 1px solid var(--cizgi-2); }
.dugme svg { width: 20px; height: 20px; fill: currentColor; }

/* Meditasyon sahneleri */
.sahneler { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
.sahne { position: relative; aspect-ratio: 3 / 4; border-radius: 24px; overflow: hidden; text-align: left; isolation: isolate; border: 1px solid var(--cizgi); }
.sahne:first-child { grid-column: 1 / -1; aspect-ratio: 16 / 10; }
.sahne img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; transition: transform 0.8s var(--egri); }
.sahne:hover img { transform: scale(1.04); }
.sahne::after { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, rgba(12, 15, 29, 0) 35%, rgba(12, 15, 29, 0.85) 100%); }
.sahne-yazi { position: absolute; left: 14px; right: 14px; bottom: 13px; }
.sahne-yazi b { display: block; font: 500 19px/1.15 var(--serif); }
.sahne-yazi span { display: block; color: rgba(243, 240, 255, 0.78); font-size: 12.5px; font-weight: 600; margin-top: 3px; }
.sahne .rozet { position: absolute; top: 12px; left: 12px; padding: 5px 10px; border-radius: 99px; font-size: 12px; font-weight: 700; background: rgba(12, 15, 29, 0.55); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); }
.serbest { display: flex; align-items: center; gap: 14px; width: 100%; text-align: left; margin-top: 10px; padding: 14px; border-radius: 22px; background: var(--kart); border: 1px solid var(--cizgi); }
.serbest .ikon { width: 46px; height: 46px; border-radius: 15px; display: grid; place-items: center; background: rgba(185, 168, 255, 0.16); color: var(--lavanta); flex: none; }
.serbest .ikon svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; }
.serbest b { display: block; font-weight: 700; }
.serbest span { display: block; color: var(--soluk); font-size: 13px; }

/* Günlük */
.olculer { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-top: 20px; }
.olcu { padding: 14px 12px; border-radius: 22px; background: var(--kart); border: 1px solid var(--cizgi); }
.olcu b { display: block; font: 400 28px/1.1 var(--serif); }
.olcu span { display: block; color: var(--soluk); font-size: 12px; font-weight: 600; margin-top: 2px; }
.kart { margin-top: 12px; padding: 16px; border-radius: 24px; background: var(--kart); border: 1px solid var(--cizgi); }
.kart-ust { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.kart-ust h3 { font-size: 15.5px; font-weight: 700; }
.kart-ust span { color: var(--soluk); font-size: 12.5px; font-weight: 600; }
.cubuklar { display: flex; align-items: flex-end; gap: 8px; height: 130px; margin-top: 26px; }
.cubuk { flex: 1; min-width: 0; height: 100%; display: grid; grid-template-rows: 1fr auto; gap: 6px; position: relative; }
.cubuk div { align-self: end; border-radius: 10px 10px 5px 5px; min-height: 4px; background: linear-gradient(180deg, var(--lavanta), rgba(185, 168, 255, 0.35)); }
.cubuk.bugun div { background: linear-gradient(180deg, var(--seftali), rgba(255, 181, 154, 0.4)); }
.cubuk small { text-align: center; font-size: 11px; color: var(--soluk-2); font-weight: 700; }
.cubuk em { position: absolute; left: 0; right: 0; text-align: center; font-style: normal; font-size: 10.5px; color: var(--soluk); font-weight: 700; }
.hedef-cizgi { position: absolute; left: 0; right: 0; border-top: 1.5px dashed rgba(255, 181, 154, 0.5); pointer-events: none; }
.cubuk-kap { position: relative; }
.ruh-ozet { display: flex; align-items: center; gap: 14px; }
.ruh-ozet .yuz { width: 46px; height: 46px; flex: none; }
.ruh-ozet p { margin: 0; color: var(--soluk); font-size: 13.5px; }
.ruh-ozet p b { color: var(--metin); }
.gecmis { display: grid; gap: 8px; }
.kayit { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 20px; background: var(--kart); border: 1px solid var(--cizgi); }
.kayit .kucuk { flex: none; width: 46px; height: 46px; border-radius: 14px; overflow: hidden; display: grid; place-items: center; background: rgba(255, 181, 154, 0.14); color: var(--seftali); }
.kayit .kucuk img { width: 100%; height: 100%; object-fit: cover; }
.kayit .kucuk svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.kayit-bilgi { flex: 1; min-width: 0; }
.kayit-bilgi b { display: block; font-size: 14.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kayit-bilgi span { display: block; color: var(--soluk); font-size: 12.5px; }
.kayit .ruh { flex: none; display: flex; align-items: center; gap: 2px; }
.kayit .ruh .yuz { width: 24px; height: 24px; }
.kayit .ruh i { width: 8px; height: 1.5px; background: var(--soluk-2); display: block; }
.sil { flex: none; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; color: var(--soluk-2); }
.sil:hover { background: var(--kart-2); color: var(--metin); }
.sil svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.bos { text-align: center; padding: 30px 16px; border-radius: 22px; border: 1.5px dashed var(--cizgi-2); color: var(--soluk); }

/* Ruh hâli seçici */
.yuz { display: block; }
.yuz circle { fill: var(--yr, #b9a8ff); }
.yuz path { fill: none; stroke: #1a1530; stroke-width: 2.4; stroke-linecap: round; }
.yuz .goz { fill: #1a1530; }
.ruhlar { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; margin: 18px 0 6px; }
.ruhlar button { display: grid; justify-items: center; gap: 6px; padding: 10px 2px; border-radius: 18px; border: 1.5px solid transparent; transition: background 0.2s, border-color 0.2s, transform 0.2s var(--egri); }
.ruhlar button .yuz { width: 44px; height: 44px; transition: transform 0.3s var(--egri); }
.ruhlar button small { font-size: 12px; font-weight: 700; color: var(--soluk); }
.ruhlar button.secili { background: var(--kart-2); border-color: var(--cizgi-2); }
.ruhlar button.secili .yuz { transform: scale(1.12); }
.ruhlar button.secili small { color: var(--metin); }

/* Sekmeler */
.sekmeler { position: fixed; z-index: 30; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 12px); transform: translateX(-50%); width: min(calc(100% - 28px), 380px); display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; padding: 6px; border-radius: 26px; background: rgba(20, 24, 46, 0.78); border: 1px solid var(--cizgi); -webkit-backdrop-filter: blur(18px) saturate(1.4); backdrop-filter: blur(18px) saturate(1.4); }
.sekmeler button { min-height: 52px; border-radius: 20px; display: grid; justify-items: center; align-content: center; gap: 2px; color: var(--soluk-2); font-size: 11.5px; font-weight: 700; transition: background 0.2s, color 0.2s; }
.sekmeler svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.sekmeler button.secili { background: rgba(255, 255, 255, 0.1); color: var(--metin); }
.sekmeler button.secili svg { stroke: var(--seftali); }

/* Seans ekranı */
.seans { position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: calc(env(safe-area-inset-top) + 18px) 22px calc(env(safe-area-inset-bottom) + 26px); background: radial-gradient(80% 60% at 50% 40%, #1d2148, var(--gece)); overflow: hidden; animation: perde 0.5s; }
.seans .foto { position: absolute; inset: 0; z-index: -2; background-size: cover; background-position: center; animation: yakin 60s ease-in-out infinite alternate; }
@keyframes yakin { from { transform: scale(1.02); } to { transform: scale(1.14) translate(-1.5%, -1%); } }
.seans.fotolu::before { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, rgba(8, 10, 22, 0.55), rgba(8, 10, 22, 0.25) 40%, rgba(8, 10, 22, 0.75)); }
.seans-ust { width: 100%; max-width: 480px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.seans-ust b { font-size: 14px; font-weight: 700; }
.seans-ust span { display: block; color: var(--soluk); font-size: 12.5px; font-weight: 600; }
.yuvarlak { flex: none; width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.1); border: 1px solid var(--cizgi); -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
.yuvarlak svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.seans-orta { position: relative; flex: 1; width: 100%; display: grid; place-items: center; }
.alan-kure { position: relative; width: min(78vw, 340px); aspect-ratio: 1; display: grid; place-items: center; }
.alan-kure .kure { position: absolute; inset: 9%; }
.alan-kure svg.ilerleme { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.ilerleme circle { fill: none; stroke-width: 1.6; }
.ilerleme .iz { stroke: rgba(255, 255, 255, 0.12); }
.ilerleme .dolgu { stroke: rgba(255, 255, 255, 0.85); stroke-linecap: round; transition: stroke-dashoffset 1s linear; }
.evre { position: relative; z-index: 2; text-align: center; pointer-events: none; }
.evre b { display: block; font: 400 36px/1.1 var(--serif); color: #fff; text-shadow: 0 1px 14px rgba(30, 10, 50, 0.5); }
.evre span { display: block; margin-top: 6px; font: 400 26px var(--serif); color: rgba(255, 255, 255, 0.9); text-shadow: 0 1px 10px rgba(30, 10, 50, 0.5); font-variant-numeric: tabular-nums; }
.saat-buyuk { position: relative; z-index: 2; text-align: center; }
.saat-buyuk b { display: block; font: 300 72px/1 var(--serif); font-variant-numeric: tabular-nums; letter-spacing: -0.03em; }
.saat-buyuk span { display: block; margin-top: 10px; color: rgba(243, 240, 255, 0.8); font-size: 14px; font-weight: 600; }
.yonerge { min-height: 52px; max-width: 340px; text-align: center; font: italic 300 19px/1.4 var(--serif); color: rgba(255, 255, 255, 0.9); transition: opacity 0.8s; }
.seans-alt { width: 100%; max-width: 480px; display: flex; align-items: center; justify-content: center; gap: 18px; }
.seans-alt .ana { width: 74px; height: 74px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.92); color: var(--gece); }
.seans-alt .ana svg { width: 28px; height: 28px; fill: currentColor; }
.dongu { color: var(--soluk); font-size: 13px; font-weight: 600; text-align: center; margin-top: 10px; }

/* Alt sayfa */
.perde { position: fixed; inset: 0; z-index: 60; background: rgba(5, 6, 15, 0.55); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); animation: perde 0.25s; }
@keyframes perde { from { opacity: 0; } }
.alt-sayfa { position: fixed; z-index: 61; left: 50%; bottom: 0; transform: translateX(-50%); width: min(100%, var(--sutun)); max-height: 92vh; max-height: 92dvh; overflow-y: auto; overscroll-behavior: contain; background: #181d36; border: 1px solid var(--cizgi); border-bottom: 0; border-radius: 30px 30px 0 0; padding: 8px 22px calc(env(safe-area-inset-bottom) + 24px); animation: yukari 0.4s var(--egri); }
@keyframes yukari { from { transform: translate(-50%, 100%); } }
.alt-sayfa.kapaniyor { transition: transform 0.25s ease-in; transform: translate(-50%, 100%) !important; }
.tutamak { display: block; height: 24px; position: relative; touch-action: none; cursor: grab; }
.tutamak::before { content: ""; position: absolute; left: 50%; top: 9px; width: 42px; height: 5px; margin-left: -21px; border-radius: 9px; background: var(--cizgi-2); }
.alt-sayfa h2 { font-size: 26px; font-weight: 400; }
.alt-sayfa .aciklama { color: var(--soluk); margin: 6px 0 0; font-size: 14px; }
.sayfa-foto { height: 150px; margin: 4px -6px 16px; border-radius: 22px; background-size: cover; background-position: center; }
.ikili { display: flex; gap: 8px; margin-top: 16px; }
.ikili .dugme { flex: 1; }
.metin-dugme { display: block; margin: 12px auto 0; color: var(--soluk); font-weight: 700; font-size: 14px; padding: 8px 12px; }
.sonuc { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 16px; }
.sonuc div { padding: 12px 14px; border-radius: 18px; background: rgba(0, 0, 0, 0.22); }
.sonuc b { display: block; font: 400 24px var(--serif); }
.sonuc span { color: var(--soluk); font-size: 12.5px; font-weight: 600; }

.tost { position: fixed; z-index: 80; left: 50%; bottom: calc(env(safe-area-inset-bottom) + 96px); transform: translate(-50%, 20px); opacity: 0; pointer-events: none; max-width: calc(100% - 40px); padding: 12px 18px; border-radius: 16px; background: #f3f0ff; color: var(--gece); font-weight: 700; font-size: 14px; transition: opacity 0.25s, transform 0.3s var(--egri); text-align: center; }
.tost.acik { opacity: 1; transform: translate(-50%, 0); }

.kenar { display: none; }
@media (min-width: 760px) {
  #ekran { margin-top: 28px; margin-bottom: 28px; background: rgba(20, 24, 48, 0.5); border: 1px solid var(--cizgi); border-radius: 36px; padding-left: 28px; padding-right: 28px; min-height: calc(100vh - 56px); }
  .sekmeler { bottom: 40px; }
  .sahneler { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1180px) {
  .kenar { display: block; position: fixed; top: 64px; width: 270px; left: calc(50% - 570px); }
  .kenar .logo { display: flex; align-items: center; gap: 12px; font: 500 26px var(--serif); }
  .kenar .logo svg { width: 42px; height: 42px; }
  .kenar blockquote { margin: 26px 0 0; font: italic 300 22px/1.4 var(--serif); color: rgba(243, 240, 255, 0.86); }
  .kenar cite { display: block; margin-top: 12px; font: 600 13px var(--yazi); color: var(--soluk); font-style: normal; }
  .kenar.sag { left: auto; right: calc(50% - 570px); }
  .kenar.sag div + div { margin-top: 24px; }
  .kenar.sag b { display: block; font: 300 46px/1 var(--serif); }
  .kenar.sag span { color: var(--soluk); font-size: 13.5px; font-weight: 600; }
}
@media (max-width: 360px) {
  #ekran { padding-left: 14px; padding-right: 14px; }
  .ust h1 { font-size: 29px; }
  .parcali button { padding: 0 6px; font-size: 12.5px; }
  .evre b { font-size: 29px; }
}
@media (prefers-reduced-motion: reduce) {
  .kure i, .seans .foto, .onizleme .kure { animation: none !important; }
}
`;

const UYGULAMA = ORTAK_JS + String.raw`
/* ── Derin · Nefes ve Meditasyon — veriler bu cihazda (localStorage). Sekmeler: Nefes, Meditasyon, Günlük. ── */
(function () {
  var ANAHTAR = "derin-nefes-v1";
  var SAHNELER = window.DERIN_SAHNELER || [];
  var GUN_KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  var KALIPLAR = {
    kutu: { ad: "Kutu nefesi", alt: "Odak ve sakinlik", evreler: [4, 4, 4, 4], sekil: '<rect x="5" y="5" width="24" height="24" rx="4"/><circle cx="5" cy="5" r="2" fill="currentColor"/>' },
    dort: { ad: "4-7-8 nefesi", alt: "Uykuya hazırlık", evreler: [4, 7, 8, 0], sekil: '<path d="M4 26c6 0 6-18 13-18s7 18 13 18"/><path d="M4 30h26"/>' },
    uyum: { ad: "Uyumlu nefes", alt: "Kalp ritmi dengesi", evreler: [5, 0, 5, 0], sekil: '<path d="M3 17c3.5-8 7-8 10.5 0s7 8 10.5 0 5-6 7-3"/>' },
    ozel: { ad: "Kendi ritmin", alt: "Süreleri sen seç", evreler: [4, 2, 6, 0], sekil: '<circle cx="17" cy="17" r="12"/><path d="M17 9v8l5 3"/>' }
  };
  var EVRE_AD = ["Nefes al", "Tut", "Nefes ver", "Bekle"];
  var EVRE_KISA = ["Al", "Tut", "Ver", "Bekle"];
  var RUH = [
    { ad: "Gergin", renk: "#ff8f8f", agiz: "M15 31c3-3 11-3 14 0" },
    { ad: "Yorgun", renk: "#c9a6ff", agiz: "M16 30h12" },
    { ad: "Dalgın", renk: "#9fb6ff", agiz: "M15 30c3 1.5 6-1.5 9 0s4 0 5 0" },
    { ad: "Sakin", renk: "#8ee6d0", agiz: "M15 28c3 3 11 3 14 0" },
    { ad: "Huzurlu", renk: "#ffcf8a", agiz: "M14 27c3 5.5 13 5.5 16 0" }
  ];
  var YONERGELER = ["Omuzlarını kulaklarından uzaklaştır.", "Nefesin kendi ritmini bulsun, zorlama.", "Bir düşünce gelirse fark et ve bırak.", "Çenendeki gerginliği yumuşat.", "Nefesin burnundan girişini hisset.", "Bedeninin yere değdiği yerleri fark et.", "Her nefes verişte biraz daha ağırlaş.", "Şu ana, sadece bu nefese dön."];
  var SES_AD = { sessiz: "Sessiz", dalga: "Dalga", yagmur: "Yağmur", ruzgar: "Rüzgâr", ton: "Derin ton" };
  var S = function (yol) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + yol + "</svg>"; };
  var OYNAT = S('<path d="M8 5.5v13l11-6.5z"/>'), DURAKLAT = S('<rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/>');
  var CARPI = S('<path d="M6 6l12 12M18 6L6 18"/>');

  var bugun = istanbul().tarih;
  var V = yukle();
  var aktif = "nefes";

  function yukle() {
    try { var j = JSON.parse(localStorage.getItem(ANAHTAR) || "null"); if (j && Array.isArray(j.gecmis)) return j; } catch (e) {}
    var t = tohum(); try { localStorage.setItem(ANAHTAR, JSON.stringify(t)); } catch (e) {}
    return t;
  }
  function kaydet() { try { localStorage.setItem(ANAHTAR, JSON.stringify(V)); } catch (e) {} }
  function tohum() {
    var g = [], plan = [[0, "nefes", "kutu", 3, 1, 3, 8], [1, "meditasyon", "orman", 10, 0, 3, 21], [1, "nefes", "dort", 5, 1, 4, 23], [2, "meditasyon", "dalga", 10, 2, 4, 7], [3, "nefes", "uyum", 5, 0, 3, 13], [4, "meditasyon", "gol", 15, 1, 4, 22], [5, "nefes", "kutu", 3, 2, 3, 9], [6, "meditasyon", "iskele", 5, 2, 3, 7], [6, "nefes", "dort", 5, 1, 3, 23], [8, "meditasyon", "selale", 20, 0, 3, 19], [9, "nefes", "kutu", 5, 0, 2, 12], [10, "meditasyon", "sazlik", 15, 1, 4, 22], [12, "nefes", "uyum", 10, 2, 3, 8]];
    plan.forEach(function (p, i) { g.push({ id: "t" + i, tarih: gunEkle(bugun, -p[0]), saat: String(p[6]).padStart(2, "0") + ":" + (i % 2 ? "15" : "40"), tur: p[1], kalip: p[1] === "nefes" ? p[2] : null, sahne: p[1] === "meditasyon" ? p[2] : null, sn: p[3] * 60, once: p[4], sonra: p[5] }); });
    return { gecmis: g, kalip: "kutu", ozel: [4, 2, 6, 0], sure: 3, ses: true, titresim: true, hedef: 10 };
  }

  /* ── Yardımcılar ── */
  function tost(m) { var t = $("#tost"); t.textContent = m; t.classList.add("acik"); clearTimeout(tost.z); tost.z = setTimeout(function () { t.classList.remove("acik"); }, 2600); }
  function titret(d) { if (!V.titresim) return; try { if (navigator.vibrate) navigator.vibrate(d); } catch (e) {} }
  function dk(sn) { return Math.round(sn / 60); }
  function sureYaz(sn) { var m = Math.floor(sn / 60), s = Math.floor(sn % 60); return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0"); }
  function gunDakika(t) { return V.gecmis.filter(function (k) { return k.tarih === t; }).reduce(function (a, k) { return a + k.sn; }, 0) / 60; }
  function seri() {
    var t = bugun, s = 0;
    if (!gunDakika(t)) t = gunEkle(t, -1);
    while (gunDakika(t) > 0 && s < 1000) { s++; t = gunEkle(t, -1); }
    return s;
  }
  function sahne(id) { for (var i = 0; i < SAHNELER.length; i++) if (SAHNELER[i].id === id) return SAHNELER[i]; return null; }
  function evreler() { return V.kalip === "ozel" ? V.ozel : KALIPLAR[V.kalip].evreler; }
  function donguSn(e) { return e[0] + e[1] + e[2] + e[3]; }
  function yuz(i, boyut) { var r = RUH[i]; return '<svg class="yuz" viewBox="0 0 44 44" aria-hidden="true" style="--yr:' + r.renk + (boyut ? ";width:" + boyut + "px;height:" + boyut + "px" : "") + '"><circle cx="22" cy="22" r="20"/><circle class="goz" cx="15.5" cy="19" r="2"/><circle class="goz" cx="28.5" cy="19" r="2"/><path d="' + r.agiz + '"/></svg>'; }
  function halka(r, k, oran) { var c = 2 * Math.PI * r, b = r + k; return '<svg viewBox="0 0 ' + 2 * b + " " + 2 * b + '" aria-hidden="true"><circle class="iz" cx="' + b + '" cy="' + b + '" r="' + r + '"/><circle class="dolgu" cx="' + b + '" cy="' + b + '" r="' + r + '" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + (c * (1 - Math.min(1, oran))).toFixed(1) + '"/></svg>'; }
  function selam() { var d = istanbul().dakika; return d < 300 ? "Gece sessizliği" : d < 720 ? "Günaydın" : d < 1080 ? "İyi günler" : "İyi akşamlar"; }
  function ustHtml(baslik) {
    var b = gunDakika(bugun);
    return '<header class="ust"><div><p>' + selam() + " · " + tarihYaz(bugun, { weekday: "long" }) + '</p><h1>' + baslik + '</h1></div><div class="hedef-halka" title="Günlük hedef">' + halka(26, 3, b / V.hedef) + '<span><span><b>' + Math.round(b) + '</b>/' + V.hedef + ' dk</span></span></div></header>';
  }

  /* ── Nefes ekranı ── */
  function nefesEkrani() {
    var e = evreler(), k = KALIPLAR[V.kalip];
    var kart = Object.keys(KALIPLAR).map(function (id) {
      var x = KALIPLAR[id], ev = id === "ozel" ? V.ozel : x.evreler;
      return '<button type="button" class="kalip' + (id === V.kalip ? " secili" : "") + '" data-kalip="' + id + '" aria-pressed="' + (id === V.kalip) + '"><span class="sekil"><svg viewBox="0 0 34 34" aria-hidden="true">' + x.sekil + '</svg></span><span class="ritim">' + ev.filter(function (v, i) { return v || i % 2 === 0; }).join(" ") + '</span><b>' + x.ad + '</b><small>' + x.alt + "</small></button>";
    }).join("");
    var ozel = V.kalip === "ozel" ? '<div class="ozel">' + [0, 1, 2, 3].map(function (i) {
      return '<div><small>' + EVRE_AD[i] + '</small><output>' + V.ozel[i] + '</output><span class="ad"><button type="button" data-ozel="' + i + '" data-yon="-1" aria-label="' + EVRE_AD[i] + ' azalt">' + S('<path d="M5 12h14"/>') + '</button><button type="button" data-ozel="' + i + '" data-yon="1" aria-label="' + EVRE_AD[i] + ' artır">' + S('<path d="M12 5v14M5 12h14"/>') + "</button></span></div>";
    }).join("") + "</div>" : "";
    var dongu = donguSn(e), dakikadaki = Math.round(600 / dongu) / 10;
    return '<div class="giris">' + ustHtml("Bir an <em>dur</em>,<br />nefesini izle") +
      '<div class="kaliplar">' + kart + "</div>" +
      '<div class="onizleme" aria-hidden="true"><div class="kure" style="animation-duration:' + dongu + 's"><i></i><i></i><i></i></div><p>' + e.map(function (v, i) { return v ? EVRE_KISA[i] + " " + v : ""; }).filter(Boolean).join(" · ") + " · dakikada " + String(dakikadaki).replace(".", ",") + ' nefes</p></div>' +
      ozel + '<div class="parcali" role="group" aria-label="Seans süresi">' + [1, 3, 5, 10].map(function (d) { return '<button type="button" data-sure="' + d + '"' + (d === V.sure ? ' class="secili" aria-pressed="true"' : ' aria-pressed="false"') + ">" + d + " dakika</button>"; }).join("") + "</div>" +
      '<button type="button" class="dugme tam" data-basla="nefes">' + OYNAT + k.ad + ", " + V.sure + " dakika</button>" +
      '<section class="panel">' +
      '<label class="satir"><div><b>Yumuşak ton</b><span>Nefes alırken yükselen, verirken alçalan ses</span></div><span class="anahtar"><input type="checkbox" id="sesAc"' + (V.ses ? " checked" : "") + ' /><i></i></span></label>' +
      '<label class="satir"><div><b>Titreşim</b><span>Her evre değişiminde kısa titreşim</span></div><span class="anahtar"><input type="checkbox" id="titresimAc"' + (V.titresim ? " checked" : "") + ' /><i></i></span></label></section></div>';
  }

  /* ── Meditasyon ekranı ── */
  function meditasyonEkrani() {
    return '<div class="giris">' + ustHtml("Sessiz bir <em>yer</em> seç") +
      '<div class="bolum"><h2>Sahneler</h2><span>Ses ve süre önerili</span></div><div class="sahneler">' +
      SAHNELER.map(function (s) { return '<button type="button" class="sahne" data-sahne="' + s.id + '"><img src="' + s.gorsel + '" alt="" loading="lazy" /><span class="rozet">' + s.sure + " dk · " + SES_AD[s.ses] + '</span><span class="sahne-yazi"><b>' + s.ad + "</b><span>" + s.alt + "</span></span></button>"; }).join("") + "</div>" +
      '<button type="button" class="serbest" data-sahne="serbest"><span class="ikon">' + S('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v4.5l3 2"/>') + '</span><span><b>Sessiz zamanlayıcı</b><span>Görsel yok, yalnız başlangıç ve bitiş çanı</span></span></button></div>';
  }

  /* ── Günlük ekranı ── */
  function gunlukEkrani() {
    var toplamSn = V.gecmis.reduce(function (a, k) { return a + k.sn; }, 0);
    var cub = "", enCok = V.hedef;
    for (var i = 6; i >= 0; i--) enCok = Math.max(enCok, gunDakika(gunEkle(bugun, -i)));
    for (var j = 6; j >= 0; j--) {
      var t = gunEkle(bugun, -j), m = gunDakika(t), h = Math.round(100 * m / enCok);
      cub += '<div class="cubuk' + (j === 0 ? " bugun" : "") + '"><div style="height:' + Math.max(3, h) + '%"></div><em style="bottom:calc(' + Math.max(3, h) + '% * 108 / 130 + 26px)">' + (m ? Math.round(m) : "") + '</em><small>' + (j === 0 ? "Bugün" : GUN_KISA[haftaGunu(t)]) + "</small></div>";
    }
    var hedefYuz = Math.round(100 * V.hedef / enCok);
    var olcu = V.gecmis.filter(function (k) { return k.once != null && k.sonra != null; });
    var fark = olcu.length ? olcu.reduce(function (a, k) { return a + (k.sonra - k.once); }, 0) / olcu.length : 0;
    var sakinlesen = olcu.filter(function (k) { return k.sonra > k.once; }).length;
    var liste = V.gecmis.slice().sort(function (a, b) { return (b.tarih + b.saat).localeCompare(a.tarih + a.saat); }).slice(0, 30).map(function (k) {
      var s = k.sahne ? sahne(k.sahne) : null, ad = k.tur === "nefes" ? (KALIPLAR[k.kalip] || KALIPLAR.kutu).ad : s ? s.ad : "Sessiz zamanlayıcı";
      var gun = k.tarih === bugun ? "Bugün" : k.tarih === gunEkle(bugun, -1) ? "Dün" : tarihYaz(k.tarih, { weekday: "short" });
      return '<div class="kayit"><span class="kucuk">' + (s ? '<img src="' + s.gorsel + '" alt="" />' : S('<path d="M3 12c3-6 6-6 9 0s6 6 9 0"/>')) + '</span><div class="kayit-bilgi"><b>' + ad + '</b><span>' + gun + " " + k.saat.replace(":", ".") + " · " + Math.max(1, dk(k.sn)) + " dk " + (k.tur === "nefes" ? "nefes" : "meditasyon") + "</span></div>" +
        (k.once != null && k.sonra != null ? '<span class="ruh" title="' + RUH[k.once].ad + ", sonra " + RUH[k.sonra].ad + '">' + yuz(k.once) + "<i></i>" + yuz(k.sonra) + "</span>" : "") +
        '<button type="button" class="sil" data-sil="' + k.id + '" aria-label="Kaydı sil">' + CARPI + "</button></div>";
    }).join("");
    return '<div class="giris">' + ustHtml("Günlüğün") +
      '<div class="olculer"><div class="olcu"><b>' + seri() + '</b><span>gün seri</span></div><div class="olcu"><b>' + Math.round(toplamSn / 60) + '</b><span>toplam dakika</span></div><div class="olcu"><b>' + V.gecmis.length + '</b><span>seans</span></div></div>' +
      '<section class="kart"><div class="kart-ust"><h3>Son 7 gün</h3><span>Hedef günde ' + V.hedef + ' dakika</span></div><div class="cubuk-kap"><div class="cubuklar">' + cub + '</div><span class="hedef-cizgi" style="bottom:calc(' + hedefYuz + '% * (130 - 22) / 130 + 22px)"></span></div></section>' +
      (olcu.length ? '<section class="kart"><div class="ruh-ozet">' + yuz(fark >= 0 ? 4 : 1) + '<p>Seansların <b>' + sakinlesen + ' tanesinde</b> ruh hâlin iyileşti. Ortalama değişim <b>' + (fark >= 0 ? "artı " : "eksi ") + String(Math.abs(Math.round(fark * 10) / 10)).replace(".", ",") + ' basamak</b>.</p></div></section>' : "") +
      '<section class="kart"><div class="kart-ust"><h3>Günlük hedef</h3><span>' + V.hedef + ' dakika</span></div><div class="parcali" role="group" aria-label="Günlük hedef">' + [5, 10, 15, 20, 30].map(function (d) { return '<button type="button" data-hedef="' + d + '"' + (d === V.hedef ? ' class="secili" aria-pressed="true"' : ' aria-pressed="false"') + ">" + d + "</button>"; }).join("") + "</div></section>" +
      '<div class="bolum"><h2>Geçmiş</h2><span>' + V.gecmis.length + ' seans</span></div><div class="gecmis">' + (liste || '<div class="bos">Henüz seans yok. İlk nefesin bir dakika sürer.</div>') + "</div></div>";
  }

  function goster(s, sessiz) {
    aktif = s;
    var e = $("#ekran"), y = scrollY;
    e.innerHTML = s === "meditasyon" ? meditasyonEkrani() : s === "gunluk" ? gunlukEkrani() : nefesEkrani();
    if (sessiz) { e.firstElementChild.classList.remove("giris"); scrollTo(0, y); } else scrollTo(0, 0);
    $$(".sekmeler button").forEach(function (b) { var a = b.dataset.sekme === s; b.classList.toggle("secili", a); if (a) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    var k = $("#kenarSag");
    if (k) k.innerHTML = '<div><b>' + Math.round(gunDakika(bugun)) + ' dk</b><span>bugün, hedef ' + V.hedef + ' dk</span></div><div><b>' + seri() + ' gün</b><span>kesintisiz seri</span></div><div><b>' + V.gecmis.length + '</b><span>tamamlanan seans</span></div>';
  }

  /* ── Alt sayfa ── */
  var sayfa = $("#sayfa"), perde = $("#perde"), oncekiOdak = null, kapaninca = null;
  function sayfaAc(html, kapanis) {
    oncekiOdak = document.activeElement; kapaninca = kapanis || null;
    sayfa.innerHTML = '<span class="tutamak" data-tutamak aria-hidden="true"></span>' + html;
    sayfa.classList.remove("kapaniyor"); sayfa.style.transform = ""; sayfa.hidden = false; perde.hidden = false;
    var h = sayfa.querySelector("h2"); if (h) { h.id = "sayfaBaslik"; h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  function sayfaKapat(iptal) {
    if (sayfa.hidden) return;
    sayfa.classList.add("kapaniyor"); perde.hidden = true;
    var k = kapaninca; kapaninca = null;
    setTimeout(function () { sayfa.hidden = true; sayfa.innerHTML = ""; sayfa.classList.remove("kapaniyor"); sayfa.style.transform = ""; }, 240);
    if (oncekiOdak && oncekiOdak.focus && document.contains(oncekiOdak)) oncekiOdak.focus({ preventScroll: true });
    if (k && iptal !== false) k();
  }
  perde.addEventListener("click", function () { sayfaKapat(); });
  sayfa.addEventListener("pointerdown", function (e) {
    if (!e.target.closest("[data-tutamak]")) return;
    var y0 = e.clientY, dy = 0; sayfa.style.transition = "none";
    function m(ev) { dy = Math.max(0, ev.clientY - y0); sayfa.style.transform = "translate(-50%, " + dy + "px)"; }
    function b() { removeEventListener("pointermove", m); removeEventListener("pointerup", b); sayfa.style.transition = ""; if (dy > 110) sayfaKapat(); else sayfa.style.transform = ""; }
    addEventListener("pointermove", m); addEventListener("pointerup", b);
  });

  /* Ruh hâli sorusu (seans öncesi ve sonrası) */
  function ruhSor(baslik, aciklama, ust, sonra, dugmeYazi, ek, iptal) {
    var secim = null;
    sayfaAc((ust || "") + '<h2>' + baslik + '</h2><p class="aciklama">' + aciklama + '</p><div class="ruhlar" role="radiogroup" aria-label="Ruh hâli">' + RUH.map(function (r, i) { return '<button type="button" role="radio" aria-checked="false" data-ruh="' + i + '">' + yuz(i) + "<small>" + r.ad + "</small></button>"; }).join("") + '</div>' + (ek || "") + '<button type="button" class="dugme tam" data-ruh-tamam>' + dugmeYazi + '</button><button type="button" class="metin-dugme" data-ruh-atla>Atla</button>', iptal);
    ruhSor.sec = function (i) { secim = i; $$("[data-ruh]", sayfa).forEach(function (b) { var s = Number(b.dataset.ruh) === i; b.classList.toggle("secili", s); b.setAttribute("aria-checked", String(s)); }); };
    ruhSor.bitir = function (atla) { var s = atla ? null : secim; kapaninca = null; sayfaKapat(false); sonra(s); };
  }

  /* ── Ses (Web Audio; dosya gerekmez) ── */
  var AC = null, tonDugum = null, ortam = null;
  function ses() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } if (AC && AC.state === "suspended") AC.resume(); return AC; }
  function tonKur() {
    var a = ses(); if (!a || tonDugum) return;
    var g = a.createGain(), f = a.createBiquadFilter(), o1 = a.createOscillator(), o2 = a.createOscillator();
    f.type = "lowpass"; f.frequency.value = 900; g.gain.value = 0;
    o1.type = "sine"; o2.type = "triangle"; o1.frequency.value = 174; o2.frequency.value = 174 * 1.5; o2.detune.value = 4;
    var g2 = a.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(f); o1.connect(f); f.connect(g); g.connect(a.destination);
    o1.start(); o2.start(); tonDugum = { g: g, o1: o1, o2: o2 };
  }
  function tonEvre(i, sn) {
    if (!V.ses || !tonDugum) return;
    var a = AC, t = a.currentTime, g = tonDugum.g.gain, f1 = tonDugum.o1.frequency, f2 = tonDugum.o2.frequency;
    g.cancelScheduledValues(t); f1.cancelScheduledValues(t); f2.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t); f1.setValueAtTime(f1.value, t); f2.setValueAtTime(f2.value, t);
    if (i === 0) { g.linearRampToValueAtTime(0.07, t + sn * 0.6); f1.exponentialRampToValueAtTime(233, t + sn); f2.exponentialRampToValueAtTime(349, t + sn); }
    else if (i === 2) { g.linearRampToValueAtTime(0.05, t + 0.3); g.linearRampToValueAtTime(0.004, t + sn); f1.exponentialRampToValueAtTime(174, t + sn); f2.exponentialRampToValueAtTime(261, t + sn); }
    else g.linearRampToValueAtTime(i === 1 ? 0.035 : 0.002, t + 0.6);
  }
  function tonKapat() { if (!tonDugum) return; var t = AC.currentTime; tonDugum.g.gain.cancelScheduledValues(t); tonDugum.g.gain.setTargetAtTime(0, t, 0.3); var d = tonDugum; tonDugum = null; setTimeout(function () { try { d.o1.stop(); d.o2.stop(); } catch (e) {} }, 1500); }
  function can(guc) {
    var a = ses(); if (!a) return; var t = a.currentTime;
    [[528, 1], [1056, 0.42], [1584, 0.2], [2112, 0.12]].forEach(function (p) {
      var o = a.createOscillator(), g = a.createGain(); o.type = "sine"; o.frequency.value = p[0];
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16 * p[1] * (guc || 1), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5 / (1 + p[1] * 0.3));
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 5);
    });
  }
  function ortamBaslat(tur) {
    ortamDurdur(); var a = ses(); if (!a || tur === "sessiz") return;
    var cikis = a.createGain(); cikis.gain.value = 0; cikis.connect(a.destination);
    var dugumler = [];
    if (tur === "ton") {
      [110, 164.8, 220.4].forEach(function (f, i) { var o = a.createOscillator(), g = a.createGain(); o.type = "sine"; o.frequency.value = f; o.detune.value = i * 3; g.gain.value = [0.5, 0.25, 0.12][i]; o.connect(g); g.connect(cikis); o.start(); dugumler.push(o); });
      var l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 0.07; lg.gain.value = 0.15; l.connect(lg); lg.connect(cikis.gain); l.start(); dugumler.push(l);
      cikis.gain.setTargetAtTime(0.09, a.currentTime, 2);
    } else {
      var uz = a.sampleRate * 4, tampon = a.createBuffer(1, uz, a.sampleRate), d = tampon.getChannelData(0), son = 0;
      for (var i = 0; i < uz; i++) { var b = Math.random() * 2 - 1; son = (son + 0.02 * b) / 1.02; d[i] = tur === "yagmur" ? b * 0.5 : son * 3.5; }
      var kaynak = a.createBufferSource(); kaynak.buffer = tampon; kaynak.loop = true;
      var f = a.createBiquadFilter(); f.type = tur === "yagmur" ? "highpass" : "lowpass"; f.frequency.value = tur === "yagmur" ? 1200 : tur === "ruzgar" ? 520 : 750;
      kaynak.connect(f); f.connect(cikis); kaynak.start(); dugumler.push(kaynak);
      var lfo = a.createOscillator(), lfoG = a.createGain(); lfo.frequency.value = tur === "dalga" ? 0.09 : 0.05; lfoG.gain.value = tur === "yagmur" ? 0.02 : 0.12;
      lfo.connect(lfoG); lfoG.connect(cikis.gain); lfo.start(); dugumler.push(lfo);
      if (tur === "ruzgar") { var l2 = a.createOscillator(), l2g = a.createGain(); l2.frequency.value = 0.03; l2g.gain.value = 260; l2.connect(l2g); l2g.connect(f.frequency); l2.start(); dugumler.push(l2); }
      cikis.gain.setTargetAtTime(tur === "yagmur" ? 0.1 : 0.16, a.currentTime, 2);
    }
    ortam = { cikis: cikis, dugumler: dugumler };
  }
  function ortamDurdur() { if (!ortam) return; var o = ortam; ortam = null; try { o.cikis.gain.setTargetAtTime(0, AC.currentTime, 0.4); } catch (e) {} setTimeout(function () { o.dugumler.forEach(function (n) { try { n.stop(); } catch (e) {} }); o.cikis.disconnect(); }, 2000); }

  /* ── Seans ── */
  var seans = $("#seans"), S0 = null, rafNo = 0;
  function seansAc(ayar, once) {
    S0 = { ayar: ayar, once: once, gecen: 0, son: performance.now(), durdu: false, evre: -1, evreBas: 0, dongu: 0, yonerge: 0, sonCan: 0 };
    var nefes = ayar.tur === "nefes", s = ayar.sahne ? sahne(ayar.sahne) : null, toplam = ayar.sn;
    seans.className = "seans" + (s ? " fotolu" : "");
    seans.innerHTML = (s ? '<div class="foto" style="background-image:url(' + s.gorsel + ')"></div>' : "") +
      '<div class="seans-ust"><div><b>' + (nefes ? KALIPLAR[ayar.kalip].ad : s ? s.ad : "Sessiz zamanlayıcı") + '</b><span id="seansAlt">' + (nefes ? Math.round(toplam / 60) + " dakika" : SES_AD[ayar.ses] + " · " + Math.round(toplam / 60) + " dakika") + '</span></div><button type="button" class="yuvarlak" data-bitir aria-label="Seansı bitir">' + CARPI + '</button></div>' +
      '<div class="seans-orta"><div class="alan-kure">' + (nefes ? '<div class="kure" id="kure"><i></i><i></i><i></i></div>' : "") +
      '<svg class="ilerleme" viewBox="0 0 200 200" aria-hidden="true"><circle class="iz" cx="100" cy="100" r="98"/><circle class="dolgu" id="ilerleme" cx="100" cy="100" r="98" stroke-dasharray="615.8" stroke-dashoffset="615.8"/></svg>' +
      (nefes ? '<div class="evre" aria-live="polite"><b id="evreAd">Hazırlan</b><span id="evreSayi">3</span></div>' : '<div class="saat-buyuk"><b id="kalan">' + sureYaz(toplam) + '</b><span>kaldı</span></div>') + '</div></div>' +
      (nefes ? '<p class="dongu" id="donguYazi">Rahat bir oturuş bul</p>' : '<p class="yonerge" id="yonerge">Gözlerini kapat ve üç derin nefes al.</p>') +
      '<div class="seans-alt"><button type="button" class="ana" data-duraklat aria-label="Duraklat">' + DURAKLAT + "</button></div>";
    seans.hidden = false; document.body.style.overflow = "hidden";
    if (nefes) { if (V.ses) tonKur(); S0.hazir = 3; }
    else { ortamBaslat(ayar.ses); can(1); }
    $("[data-duraklat]").focus({ preventScroll: true });
    cancelAnimationFrame(rafNo); rafNo = requestAnimationFrame(tik);
  }
  function tik(z) {
    if (!S0) return;
    var dt = (z - S0.son) / 1000; S0.son = z;
    if (!S0.durdu) S0.gecen += Math.min(dt, 0.25);
    var a = S0.ayar, g = S0.gecen;
    if (a.tur === "nefes") nefesTik(g); else medTik(g);
    if (S0) rafNo = requestAnimationFrame(tik);
  }
  function nefesTik(g) {
    var e = evreler(), hazir = 3;
    if (g < hazir) { $("#evreSayi").textContent = Math.ceil(hazir - g); return; }
    var t = g - hazir, d = donguSn(e), dongu = Math.floor(t / d), ic = t - dongu * d, i = 0, bas = 0;
    while (i < 4 && (e[i] === 0 || ic >= bas + e[i])) { bas += e[i]; i++; }
    if (i > 3) i = 3;
    if (t >= Math.max(1, Math.ceil(S0.ayar.sn / d)) * d) return seansBitti();
    var kure = $("#kure");
    if (i !== S0.evre || dongu !== S0.dongu) {
      S0.evre = i; S0.dongu = dongu;
      $("#evreAd").textContent = EVRE_AD[i];
      kure.style.transitionDuration = e[i] + "s";
      kure.style.transform = i === 0 || i === 1 ? "scale(1)" : "scale(0.62)";
      titret(i === 0 ? 40 : i === 2 ? [20, 60, 20] : 15);
      tonEvre(i, e[i]);
      var kalanDongu = Math.max(0, Math.ceil((S0.ayar.sn - t) / d));
      $("#donguYazi").textContent = (dongu + 1) + ". nefes · " + (kalanDongu > 0 ? "yaklaşık " + Math.ceil(Math.max(0, S0.ayar.sn - t) / 60) + " dakika kaldı" : "son nefes");
    }
    $("#evreSayi").textContent = Math.max(1, Math.ceil(bas + e[i] - ic));
    ilerle(t / S0.ayar.sn);
  }
  function medTik(g) {
    var kalan = Math.max(0, S0.ayar.sn - g);
    $("#kalan").textContent = sureYaz(Math.ceil(kalan));
    ilerle(g / S0.ayar.sn);
    var y = Math.floor((g - 15) / 45);
    if (g > 15 && y !== S0.yonerge && kalan > 20) { S0.yonerge = y; var el = $("#yonerge"); el.style.opacity = 0; setTimeout(function () { if (el) { el.textContent = YONERGELER[y % YONERGELER.length]; el.style.opacity = 1; } }, 800); }
    if (S0.ayar.aralik) { var c = Math.floor(g / (S0.ayar.aralik * 60)); if (c > S0.sonCan && kalan > 5) { S0.sonCan = c; can(0.6); titret(30); } }
    if (kalan <= 0) { can(1.2); seansBitti(); }
  }
  function ilerle(o) { var c = $("#ilerleme"); if (c) c.setAttribute("stroke-dashoffset", (615.8 * (1 - Math.min(1, o))).toFixed(1)); }
  function duraklat() {
    if (!S0) return; S0.durdu = !S0.durdu;
    var b = $("[data-duraklat]"); b.innerHTML = S0.durdu ? OYNAT : DURAKLAT; b.setAttribute("aria-label", S0.durdu ? "Devam et" : "Duraklat");
    var k = $("#kure"); if (k && S0.durdu) { k.style.transitionDuration = "0.8s"; k.style.transform = "scale(0.8)"; S0.evre = -1; }
    if (S0.durdu) { if (tonDugum) tonDugum.g.gain.setTargetAtTime(0, AC.currentTime, 0.2); if (ortam) ortam.cikis.gain.setTargetAtTime(0, AC.currentTime, 0.3); if (S0.ayar.tur === "nefes") $("#evreAd").textContent = "Duraklatıldı"; }
    else if (ortam) ortam.cikis.gain.setTargetAtTime(S0.ayar.ses === "yagmur" ? 0.1 : S0.ayar.ses === "ton" ? 0.09 : 0.16, AC.currentTime, 0.6);
  }
  function seansKapat() { cancelAnimationFrame(rafNo); tonKapat(); ortamDurdur(); seans.hidden = true; seans.innerHTML = ""; document.body.style.overflow = ""; }
  function seansBitti(erken) {
    if (!S0) return;
    var x = S0; S0 = null; var sn = Math.round(Math.min(x.gecen - (x.ayar.tur === "nefes" ? 3 : 0), x.ayar.sn + 60));
    seansKapat();
    if (sn < 20) { tost("Seans kaydedilmedi, 20 saniyeden kısaydı"); return; }
    titret([30, 80, 30]);
    var s = x.ayar.sahne ? sahne(x.ayar.sahne) : null;
    var simdi = istanbul(), kayit = { id: "k" + Date.now().toString(36), tarih: simdi.tarih, saat: String(Math.floor(simdi.dakika / 60)).padStart(2, "0") + ":" + String(simdi.dakika % 60).padStart(2, "0"), tur: x.ayar.tur, kalip: x.ayar.kalip || null, sahne: x.ayar.sahne || null, sn: sn, once: x.once, sonra: null };
    var ek = '<div class="sonuc"><div><b>' + sureYaz(sn) + '</b><span>' + (erken ? "erken bitirdin" : "tamamlandı") + '</span></div><div><b>' + Math.round(gunDakika(bugun) + sn / 60) + " / " + V.hedef + '</b><span>bugünkü dakika</span></div></div>';
    ruhSor(erken ? "Yine de güzel bir mola" : "Seans tamamlandı", "Şimdi nasıl hissediyorsun?", s ? '<div class="sayfa-foto" style="background-image:url(' + s.gorsel + ')"></div>' : "", function (r) {
      kayit.sonra = r; V.gecmis.push(kayit); kaydet();
      var msg = r != null && x.once != null && r > x.once ? "Kaydedildi. Ruh hâlin " + RUH[x.once].ad.toLocaleLowerCase("tr") + " durumundan " + RUH[r].ad.toLocaleLowerCase("tr") + " durumuna geçti." : "Seans günlüğüne eklendi";
      goster(aktif, true); tost(msg);
    }, "Günlüğe kaydet", ek, function () { kayit.sonra = null; V.gecmis.push(kayit); kaydet(); goster(aktif, true); tost("Seans günlüğüne eklendi"); });
  }

  /* Meditasyon kurulumu */
  var M = null;
  function sahneAc(id) {
    var s = sahne(id);
    M = { sahne: s ? s.id : null, sure: s ? s.sure : 10, ses: s ? s.ses : "sessiz", aralik: 0 };
    sahneCiz(true);
  }
  function sahneCiz(ilk) {
    var s = M.sahne ? sahne(M.sahne) : null;
    var html = (s ? '<div class="sayfa-foto" style="background-image:url(' + s.gorsel + ')"></div>' : "") + '<h2>' + (s ? s.ad : "Sessiz zamanlayıcı") + '</h2><p class="aciklama">' + (s ? s.alt : "Görsel ve ses olmadan, yalnız çanla.") + '</p>' +
      '<div class="panel" style="margin-top:16px"><div class="sure-satir"><b>Süre</b><div class="parcali" role="group" aria-label="Süre">' + [5, 10, 15, 20].map(function (d) { return '<button type="button" data-msure="' + d + '"' + (d === M.sure ? ' class="secili" aria-pressed="true"' : ' aria-pressed="false"') + ">" + d + " dk</button>"; }).join("") + "</div></div>" +
      '<div class="sure-satir"><b>Ortam sesi</b><div class="parcali" role="group" aria-label="Ortam sesi" style="grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-flow:row">' + ["sessiz", "dalga", "yagmur", "ruzgar", "ton"].map(function (k) { return '<button type="button" data-mses="' + k + '"' + (k === M.ses ? ' class="secili" aria-pressed="true"' : ' aria-pressed="false"') + ">" + SES_AD[k] + "</button>"; }).join("") + '<button type="button" data-dinle aria-label="Sesi dinle">Dinle</button></div></div>' +
      '<div class="sure-satir"><b>Aralık çanı</b><div class="parcali" role="group" aria-label="Aralık çanı">' + [[0, "Yok"], [2, "2 dk"], [5, "5 dk"]].map(function (x) { return '<button type="button" data-maralik="' + x[0] + '"' + (x[0] === M.aralik ? ' class="secili" aria-pressed="true"' : ' aria-pressed="false"') + ">" + x[1] + "</button>"; }).join("") + "</div></div></div>" +
      '<button type="button" class="dugme tam" data-basla="meditasyon">' + OYNAT + M.sure + " dakika başla</button>";
    if (ilk) sayfaAc(html, function () { ortamDurdur(); }); else { var y = sayfa.scrollTop; sayfa.innerHTML = '<span class="tutamak" data-tutamak aria-hidden="true"></span>' + html; sayfa.scrollTop = y; }
  }

  function baslat(tur) {
    var ayar = tur === "nefes" ? { tur: "nefes", kalip: V.kalip, sn: V.sure * 60 } : { tur: "meditasyon", sahne: M.sahne, ses: M.ses, aralik: M.aralik, sn: M.sure * 60 };
    ses();
    if (tur === "meditasyon") { ortamDurdur(); kapaninca = null; sayfaKapat(false); }
    setTimeout(function () {
      ruhSor("Başlamadan önce", "Şu an nasıl hissediyorsun? Sonunda tekrar soracağız.", "", function (r) { seansAc(ayar, r); }, "Başla");
    }, tur === "meditasyon" ? 260 : 0);
  }

  /* ── Olaylar ── */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var d = b.dataset;
    if (d.sekme) return goster(d.sekme);
    if (d.kalip) { V.kalip = d.kalip; kaydet(); return goster("nefes", true); }
    if (d.ozel) { var i = Number(d.ozel), min = i % 2 === 0 ? 2 : 0; V.ozel[i] = Math.max(min, Math.min(12, V.ozel[i] + Number(d.yon))); kaydet(); return goster("nefes", true); }
    if (d.sure) { V.sure = Number(d.sure); kaydet(); return goster("nefes", true); }
    if (d.hedef) { V.hedef = Number(d.hedef); kaydet(); return goster("gunluk", true); }
    if (d.basla) return baslat(d.basla);
    if (d.sahne) return sahneAc(d.sahne);
    if (d.msure) { M.sure = Number(d.msure); return sahneCiz(); }
    if (d.mses) { M.ses = d.mses; if (ortam) ortamBaslat(M.ses); return sahneCiz(); }
    if (d.maralik !== undefined) { M.aralik = Number(d.maralik); return sahneCiz(); }
    if (d.dinle !== undefined) { if (ortam) { ortamDurdur(); b.textContent = "Dinle"; } else { ortamBaslat(M.ses === "sessiz" ? "dalga" : M.ses); b.textContent = "Durdur"; } return; }
    if (d.ruh !== undefined) return ruhSor.sec(Number(d.ruh));
    if (d.ruhTamam !== undefined) return ruhSor.bitir(false);
    if (d.ruhAtla !== undefined) return ruhSor.bitir(true);
    if (d.duraklat !== undefined) return duraklat();
    if (d.bitir !== undefined) { if (S0 && S0.gecen > 23) return seansBitti(true); seansKapat(); S0 = null; return tost("Seans iptal edildi"); }
    if (d.sil) {
      if (b.dataset.onay !== "1") { b.dataset.onay = "1"; b.style.color = "#ff8f8f"; b.setAttribute("aria-label", "Silmek için tekrar dokun"); return tost("Silmek için tekrar dokun"); }
      V.gecmis = V.gecmis.filter(function (k) { return k.id !== d.sil; }); kaydet(); goster("gunluk", true); return tost("Kayıt silindi");
    }
  });
  document.addEventListener("change", function (e) {
    if (e.target.id === "sesAc") { V.ses = e.target.checked; kaydet(); }
    if (e.target.id === "titresimAc") { V.titresim = e.target.checked; kaydet(); if (V.titresim) titret(30); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (!sayfa.hidden) sayfaKapat(); else if (S0) { if (S0.gecen > 23) seansBitti(true); else { seansKapat(); S0 = null; } } }
    if (e.key === " " && S0 && e.target === document.body) { e.preventDefault(); duraklat(); }
  });
  document.addEventListener("visibilitychange", function () { if (document.hidden && S0 && !S0.durdu) duraklat(); });

  goster("nefes");
})();
`;

const IKON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="a" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#ffd2bf"/><stop offset=".55" stop-color="#ff9e85"/><stop offset="1" stop-color="#9d86ff"/></radialGradient></defs><rect width="512" height="512" rx="116" fill="#121633"/><circle cx="256" cy="256" r="170" fill="none" stroke="#b9a8ff" stroke-opacity=".25" stroke-width="10"/><circle cx="256" cy="256" r="122" fill="url(#a)"/></svg>';

const HTML = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#121633" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="description" content="Derin: nefes egzersizleri ve doğa sahneli meditasyon. Kutu nefesi, 4-7-8, uyumlu nefes, ruh hâli takibi ve seans günlüğü." />
  <title>Derin · Nefes ve Meditasyon</title>
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" href="ikon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="ikon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=Manrope:wght@400;500;600;700;800&display=swap" />
  <link rel="stylesheet" href="stil.css" />
</head>
<body>
  <div class="arka" aria-hidden="true"></div>
  <aside class="kenar" aria-hidden="true">
    <div class="logo">${IKON.replace('xmlns="http://www.w3.org/2000/svg" ', "")}Derin</div>
    <blockquote>Nefes, bedenle zihin arasındaki köprüdür. Bir dakika bile yeter.<cite>Telefonunda ana ekrana ekle, her an yanında olsun.</cite></blockquote>
  </aside>
  <aside class="kenar sag" id="kenarSag" aria-hidden="true"></aside>
  <main id="ekran" tabindex="-1"></main>

  <nav class="sekmeler" aria-label="Ana menü">
    <button type="button" data-sekme="nefes" class="secili" aria-current="page">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="8.5" stroke-dasharray="2 3"/></svg><span>Nefes</span>
    </button>
    <button type="button" data-sekme="meditasyon">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18l5.5-8 4 5.5 2.5-3 6 5.5"/><circle cx="16.5" cy="6.5" r="2"/></svg><span>Meditasyon</span>
    </button>
    <button type="button" data-sekme="gunluk">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 15v-3M12 15V9M16 15v-5"/></svg><span>Günlük</span>
    </button>
  </nav>

  <section id="seans" class="seans" role="dialog" aria-modal="true" aria-label="Seans" hidden></section>
  <div id="perde" class="perde" hidden></div>
  <section id="sayfa" class="alt-sayfa" role="dialog" aria-modal="true" aria-labelledby="sayfaBaslik" hidden></section>
  <div id="tost" class="tost" role="status" aria-live="polite"></div>
  <script>window.DERIN_SAHNELER = ${JSON.stringify(SAHNELER)};</script>
  <script src="app.js"></script>
</body>
</html>
`;

export const NEFES = {
  id: "nefes-meditasyon",
  ad: "Derin · Nefes ve Meditasyon",
  tur: "mobil" as const,
  aciklama: "Kutu nefesi, 4-7-8 ve uyumlu nefes kalıpları, doğa sahneli zamanlı meditasyon, ortam sesi, ruh hâli ve seans günlüğü",
  kapak: "/gercek/build/sablon/nefes-meditasyon.webp",
  dosyalar: {
    "index.html": HTML,
    "manifest.webmanifest": JSON.stringify({ name: "Derin · Nefes ve Meditasyon", short_name: "Derin", description: "Nefes egzersizleri, doğa sahneli meditasyon ve seans günlüğü.", lang: "tr", start_url: "./index.html", scope: "./", display: "standalone", orientation: "portrait", background_color: "#0c0f1d", theme_color: "#121633", icons: [{ src: "ikon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }] }, null, 2),
    "ikon.svg": IKON,
    "stil.css": STIL,
    "app.js": UYGULAMA,
  },
};
