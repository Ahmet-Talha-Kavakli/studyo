/**
 * Önizleme düzenleyicisi (Lovable "Select / Edit text", v0 Design Mode): kum havuzundaki iframe'e küçük bir betik eklenir;
 * ebeveynle postMessage ile konuşur. Kayıt canlı DOM'dan değil, ÖZGÜN HTML'den yapılır: değişen metinler DOMParser ile
 * özgün belgede aynı yoldaki öğeye uygulanır (betikle üretilen içerik kopyalanmaz).
 */
const BETIK = `(function(){
var mod='onizle',son=null,sec=null,odak=null;
var st=document.createElement('style');st.id='vy-stil';
st.textContent='.vy-uz{outline:2px solid #55d6fd!important;outline-offset:2px!important;cursor:pointer!important}.vy-sec{outline:2px solid #55d6fd!important;outline-offset:2px!important;box-shadow:0 0 0 6px rgba(85,214,253,.2)!important}[data-vy-ed]{outline:1px dashed rgba(85,214,253,.55)!important;outline-offset:3px!important;cursor:text!important}[data-vy-ed]:focus{outline:2px solid #55d6fd!important}';
(document.head||document.documentElement).appendChild(st);
function yol(el){var p=[];while(el&&el.nodeType===1&&el!==document.body&&el!==document.documentElement){var t=el.tagName.toLowerCase(),i=1,s=el;while((s=s.previousElementSibling))if(s.tagName===el.tagName)i++;p.unshift(t+':nth-of-type('+i+')');el=el.parentElement}return 'body'+(p.length?'>'+p.join('>'):'')}
function temizle(){if(son){son.classList.remove('vy-uz');son=null}}
document.addEventListener('mouseover',function(e){if(mod!=='sec')return;temizle();son=e.target;if(son&&son.classList)son.classList.add('vy-uz')},true);
document.addEventListener('click',function(e){if(mod==='onizle')return;var a=e.target.closest&&e.target.closest('a,button');if(mod==='sec'){e.preventDefault();e.stopPropagation();if(sec)sec.classList.remove('vy-sec');sec=e.target;sec.classList.add('vy-sec');var r=sec.getBoundingClientRect();parent.postMessage({vy:'secildi',etiket:sec.tagName.toLowerCase(),metin:(sec.innerText||sec.getAttribute('alt')||sec.getAttribute('aria-label')||'').trim().replace(/\\s+/g,' ').slice(0,160),yol:yol(sec),x:r.left,y:r.bottom,g:r.width},'*')}else if(mod==='metin'&&a){e.preventDefault()}},true);
document.addEventListener('focusin',function(e){if(mod==='metin'&&e.target.hasAttribute&&e.target.hasAttribute('data-vy-ed')){odak={el:e.target,eski:e.target.innerHTML}}});
document.addEventListener('focusout',function(e){if(odak&&odak.el===e.target){var y=e.target.innerHTML;if(y!==odak.eski)parent.postMessage({vy:'duzenle',yol:yol(e.target),eski:odak.eski,yeni:y},'*');odak=null}});
document.addEventListener('keydown',function(e){if(mod==='metin'&&e.key==='Enter'&&!e.shiftKey&&e.target.hasAttribute&&e.target.hasAttribute('data-vy-ed')){e.preventDefault();e.target.blur()}},true);
var ETK='h1,h2,h3,h4,h5,h6,p,li,a,button,span,td,th,label,blockquote,figcaption,small,strong,em,dt,dd,div';
window.addEventListener('message',function(e){var d=e.data||{};if(d.vy!=='mod')return;mod=d.mod;temizle();if(sec&&mod!=='sec'){sec.classList.remove('vy-sec');sec=null}
document.querySelectorAll('[data-vy-ed]').forEach(function(x){x.removeAttribute('contenteditable');x.removeAttribute('data-vy-ed')});
if(mod==='metin'){document.querySelectorAll(ETK).forEach(function(x){if(x.closest('[data-vy-ed]'))return;var yaprak=[].every.call(x.children,function(c){return /^(B|I|EM|STRONG|BR|SMALL|SUP|SUB|MARK|U)$/.test(c.tagName)});if(yaprak&&(x.textContent||'').trim()&&x.offsetParent!==null){x.setAttribute('contenteditable','true');x.setAttribute('data-vy-ed','')}})}});
parent.postMessage({vy:'hazir'},'*');
})();`;

/** Önizleme için betik eklenmiş HTML (betik yalnız önizlemede; indirilen/yayınlanan HTML'e girmez). */
export function duzenleyiciEkle(html: string) {
  const etiket = `<script id="vy-betik">${BETIK}</script>`;
  return /<\/body>/i.test(html) ? html.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${etiket}</body>`) : html + etiket;
}

export type MetinDuzenleme = { yol: string; eski: string; yeni: string };

/** Metin düzenlemelerini özgün HTML'e uygular. Bulunamayan (betikle üretilmiş) öğeler atlanır. */
export function duzenlemeleriUygula(html: string, duzenler: MetinDuzenleme[]): { html: string; uygulanan: number; atlanan: number } {
  const doc = new DOMParser().parseFromString(html, "text/html");
  let uygulanan = 0, atlanan = 0;
  for (const d of duzenler) {
    let el: Element | null = null;
    try { el = doc.querySelector(d.yol.replace(/^body/, "body")); } catch { el = null; }
    if (el && el.innerHTML.trim() === d.eski.trim()) { el.innerHTML = d.yeni; uygulanan++; } else atlanan++;
  }
  const doctype = /^\s*<!doctype/i.test(html) ? "<!doctype html>\n" : "";
  return { html: doctype + doc.documentElement.outerHTML, uygulanan, atlanan };
}

/** Yayın öncesi hızlı kontrol (Lovable güvenlik taraması karşılığı; istemcide, kural tabanlı). */
export function yayinKontrol(html: string): { tur: "uyari" | "bilgi"; metin: string }[] {
  const l: { tur: "uyari" | "bilgi"; metin: string }[] = [];
  if (/(sk-[A-Za-z0-9]{20,}|sk-ant-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}|xox[bp]-[A-Za-z0-9-]{20,})/.test(html)) l.push({ tur: "uyari", metin: "Kodda gizli anahtara benzeyen bir değer var; yayınlarsan herkes görebilir." });
  if (/<form[^>]+action=["']http:\/\//i.test(html)) l.push({ tur: "uyari", metin: "Bir form verileri şifresiz (http) bir adrese gönderiyor." });
  if (/type=["']password["']/i.test(html)) l.push({ tur: "uyari", metin: "Sayfada şifre alanı var; gerçek şifre toplama amacıyla kullanma." });
  const dis = (html.match(/<script[^>]+src=["']https?:\/\/[^"']+/gi) ?? []).length;
  if (dis) l.push({ tur: "bilgi", metin: `${dis} dış betik yükleniyor; o sitelere bağımlı çalışır.` });
  if (!/<title>[^<]{2,}<\/title>/i.test(html)) l.push({ tur: "bilgi", metin: "Sayfa başlığı (<title>) yok; paylaşınca sekmede adı görünmez." });
  if (!/name=["']viewport["']/i.test(html)) l.push({ tur: "bilgi", metin: "Mobil görünüm etiketi (viewport) yok; telefonda küçük görünebilir." });
  return l;
}
