/* Durum sayfası RSS ve Atom akışları — olay kayıtlarından üretilir. */
import { EVRE_AD, OLAYLAR, TUM_BILESENLER } from "@/lib/durum";

const kac = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const tarih = (gun: string) => new Date(`${gun}T12:00:00Z`);
const icerik = (o: (typeof OLAYLAR)[number]) => {
  const etkilenen = o.bilesenler.map((id) => TUM_BILESENLER.find((b) => b.id === id)?.ad ?? id).join(", ");
  return [...o.guncellemeler.map((g) => `<p><strong>${EVRE_AD[g.evre]}</strong> — ${kac(g.metin)}</p>`), `<p>Etkilenen: ${kac(etkilenen)}</p>`].join("");
};

export function rss(origin: string) {
  const ogeler = OLAYLAR.map((o) => `<item><title>${kac(o.baslik)}</title><link>${origin}/durum/olay/${o.id}</link><guid isPermaLink="true">${origin}/durum/olay/${o.id}</guid><pubDate>${tarih(o.bitis).toUTCString()}</pubDate><description><![CDATA[${icerik(o)}]]></description></item>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Vayra Durum — olay geçmişi</title><link>${origin}/durum</link><atom:link href="${origin}/durum/rss" rel="self" type="application/rss+xml"/><description>Vayra servislerindeki olaylar ve bakımlar</description><language>tr</language>${ogeler}</channel></rss>`;
}

export function atom(origin: string) {
  const guncel = OLAYLAR[0] ? tarih(OLAYLAR[0].bitis).toISOString() : new Date().toISOString();
  const ogeler = OLAYLAR.map((o) => `<entry><id>${origin}/durum/olay/${o.id}</id><title>${kac(o.baslik)}</title><link href="${origin}/durum/olay/${o.id}"/><published>${tarih(o.baslangic).toISOString()}</published><updated>${tarih(o.bitis).toISOString()}</updated><content type="html">${kac(icerik(o))}</content></entry>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><feed xmlns="http://www.w3.org/2005/Atom" xml:lang="tr"><id>${origin}/durum</id><title>Vayra Durum — olay geçmişi</title><link href="${origin}/durum"/><link rel="self" href="${origin}/durum/atom"/><updated>${guncel}</updated><author><name>Vayra</name></author>${ogeler}</feed>`;
}
