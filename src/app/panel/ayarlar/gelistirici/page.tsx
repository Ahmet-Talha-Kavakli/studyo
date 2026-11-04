"use client";

import Link from "next/link";
import { ArrowUpRight, KeyRound, Plus, Webhook } from "lucide-react";
import { useApiAnahtar, anahtarMaske } from "@/store/useApiAnahtar";
import { Grup, Hap, Satir, Sayfa, dugme } from "@/components/ayarlar/ui";
import { goreli } from "@/components/api/ui";
import { cn } from "@/lib/utils";
import { ApiKarti } from "@/components/ayarlar/YanPaneller";

const MCP = [
  { id: "claude-code", ad: "Claude Code", alt: "Terminalden tek komutla", logo: "/marka/renkli/claude-color.svg", zemin: "bg-[#f5f0e8]" },
  { id: "claude-desktop", ad: "Claude Desktop", alt: "Yapılandırma dosyasına ekle", logo: "/marka/renkli/claude-color.svg", zemin: "bg-[#f5f0e8]" },
  { id: "cursor", ad: "Cursor", alt: "Tek tıkla kur", logo: "/marka/renkli/cursor.svg", zemin: "bg-white" },
  { id: "vscode", ad: "VS Code", alt: "Copilot ajan modunda", logo: "/marka/renkli/vscode.svg", zemin: "bg-white" },
];

export default function Gelistirici() {
  const anahtarlar = useApiAnahtar((s) => s.anahtarlar);
  const webhooklar = useApiAnahtar((s) => s.webhooklar);
  const sirali = [...anahtarlar].sort((a, b) => (b.sonKullanim ?? b.olusturma) - (a.sonKullanim ?? a.olusturma));

  return (
    <Sayfa baslik="API ve bağlantılar" aciklama="Vayra'yı kendi uygulamandan ya da yapay zekâ asistanından kullan. Ayrıntılı yönetim API konsolunda." yan={<ApiKarti />}
      sag={<Link href="/panel/api" className={cn(dugme.hayalet, "h-8 text-[13px]")}>API konsolu<ArrowUpRight className="h-3.5 w-3.5" /></Link>}>
      <Grup id="anahtarlar" baslik={<span className="flex items-center gap-2">API anahtarları{anahtarlar.length > 0 && <Hap>{anahtarlar.length}</Hap>}</span>} aciklama="Anahtarın tamamı yalnız oluşturulurken bir kez gösterilir."
        sag={<Link href="/panel/api/anahtarlar" className={cn(dugme.ikincil, "h-8 text-[13px]")}><Plus className="h-3.5 w-3.5" />Yeni anahtar</Link>}>
        {sirali.length ? sirali.slice(0, 6).map((a) => (
          <Satir key={a.id} on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><KeyRound className="h-[17px] w-[17px] text-white/70" /></span>}
            ad={<span className="flex items-center gap-2">{a.ad}<Hap ton={a.ortam === "canli" ? "yesil" : "sari"}>{a.ortam === "canli" ? "Canlı" : "Test"}</Hap></span>}
            alt={<span className="flex flex-wrap gap-x-2"><span className="sc-kod">{anahtarMaske(a.tam)}</span><span>{a.sonKullanim ? `Son kullanım ${goreli(a.sonKullanim)}` : "Hiç kullanılmadı"}</span></span>}>
            <Link href="/panel/api/anahtarlar" className={dugme.hayalet}>Yönet</Link>
          </Satir>
        )) : (
          <Satir ad="Henüz anahtar yok" alt="Bir anahtar oluştur; Vayra'nın tüm modellerine REST API ile ulaş.">
            <Link href="/panel/api/anahtarlar" className={dugme.vurgu}><Plus className="h-4 w-4" />Anahtar oluştur</Link>
          </Satir>
        )}
      </Grup>

      <Grup baslik="Webhook'lar">
        <Satir on={<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><Webhook className="h-[17px] w-[17px] text-white/70" /></span>}
          ad="Olay bildirimleri" alt={webhooklar.length ? `${webhooklar.filter((w) => w.aktif).length} etkin uç nokta, ${webhooklar.length} toplam` : "Üretim bitince sunucuna haber gönder."}>
          <Link href="/panel/api/webhooklar" className={dugme.ikincil}>{webhooklar.length ? "Yönet" : "Ekle"}</Link>
        </Satir>
      </Grup>

      <Grup id="mcp" baslik="Yapay zekâ asistanları (MCP)" aciklama="Claude, Cursor gibi asistanlar Vayra ile doğrudan görsel, video ve ses üretebilir.">
        {MCP.map((m) => (
          <Satir key={m.id} on={<span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]", m.zemin)}><img src={m.logo} alt={`${m.ad} logosu`} className="h-[22px] w-[22px] object-contain" /></span>} ad={m.ad} alt={m.alt}>
            <Link href={`/panel/mcp?istemci=${m.id}`} className={dugme.ikincil}>Kur</Link>
          </Satir>
        ))}
      </Grup>

      <Grup baslik="Bağlı uygulamalar" aciklama="Üretimlerini doğrudan bulut depolamana gönder.">
        {[{ ad: "Google Drive", logo: "/marka/renkli/google-drive.svg" }, { ad: "Dropbox", logo: "/marka/renkli/dropbox.svg" }].map((u) => (
          <Satir key={u.ad} on={<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-white"><img src={u.logo} alt={`${u.ad} logosu`} className="h-[22px] w-[22px] object-contain" /></span>}
            ad={<span className="flex items-center gap-2">{u.ad}<Hap>Yakında</Hap></span>} alt="Bitince otomatik yükle, klasör seç">
            <button type="button" disabled className={dugme.ikincil}>Bağla</button>
          </Satir>
        ))}
      </Grup>
    </Sayfa>
  );
}
