"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ExternalLink, Smartphone, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Expo Snack'te çalışacak App.js: projenin adresini tam ekran, güvenli alanlı bir WebView içinde açar. */
function snackKodu(adres: string, ad: string) {
  return [
    "import * as React from 'react';",
    "import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';",
    "import { WebView } from 'react-native-webview';",
    "",
    `// ${ad.replace(/[\r\n]/g, " ").slice(0, 60)}: Vayra Build projesi, Expo Go içinde yerel bir kabukta açılır.`,
    `const ADRES = ${JSON.stringify(adres)};`,
    "",
    "export default function App() {",
    "  return (",
    "    <SafeAreaView style={styles.kok}>",
    "      <StatusBar barStyle=\"dark-content\" />",
    "      <WebView source={{ uri: ADRES }} style={styles.kok} allowsBackForwardNavigationGestures javaScriptEnabled domStorageEnabled />",
    "    </SafeAreaView>",
    "  );",
    "}",
    "",
    "const styles = StyleSheet.create({ kok: { flex: 1, backgroundColor: '#ffffff' } });",
    "",
  ].join("\n");
}

/**
 * Mobil projeyi Expo Go ile telefonda açma. Vayra mobil projeleri web teknolojisiyle (PWA) yazılır; React Native
 * kodu üretilmez. Bu yüzden Expo Snack'te projeyi WebView içinde açan küçük bir kabuk uygulaması kurulur: Snack
 * gömülü görünümünde "My Device" sekmesindeki QR, Expo Go ile taranır. Telefonun adrese ulaşabilmesi gerekir:
 * yerel geliştirme adresi (localhost) telefondan açılmaz, yayın adresi kullanılır.
 */
export function ExpoPaneli({ onizlemeAdresi, yayinAdresi, ad, kapat }: { onizlemeAdresi: string; yayinAdresi: string | null; ad: string; kapat: () => void }) {
  const [kaynak, setKaynak] = useState<"yayin" | "onizleme">(yayinAdresi ? "yayin" : "onizleme");
  const adres = kaynak === "yayin" && yayinAdresi ? yayinAdresi : onizlemeAdresi;
  const yerel = /^https?:\/\/(localhost|127\.|0\.0\.0\.0|\[::1\]|10\.|192\.168\.)/i.test(adres);
  const parametre = useMemo(() => {
    const q = new URLSearchParams({ code: snackKodu(adres, ad), dependencies: "react-native-webview", name: `${ad.slice(0, 40)} (Vayra)`, description: "Vayra Build projesini Expo Go içinde açar", platform: "mydevice", preview: "true", theme: "dark", supportedPlatforms: "ios,android" });
    return q.toString();
  }, [adres, ad]);
  return (
    <motion.aside initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
      className="absolute bottom-3 right-3 top-3 z-30 flex w-[min(880px,calc(100%-24px))] flex-col overflow-hidden rounded-[20px] bg-[#17181b] ring-1 ring-inset ring-white/[0.1]">
      <div className="flex items-start gap-2.5 border-b border-white/[0.06] px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-white/[0.06]"><Smartphone className="h-4 w-4 text-white/75" /></span>
        <div className="min-w-0 flex-1"><p className="text-[13.5px] font-semibold text-white">Expo Go ile telefonda aç</p><p className="text-[11.5px] leading-snug text-white/45">Expo Snack projeni yerel bir kabukta açar; QR'ı Expo Go ile tara.</p></div>
        <button type="button" onClick={kapat} aria-label="Kapat" className="flex h-8 w-8 items-center justify-center rounded-full text-white/55 hover:bg-white/[0.07] hover:text-white"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-2 border-b border-white/[0.06] px-4 py-3">
        <div className="flex rounded-full bg-white/[0.05] p-0.5">
          {([["yayin", "Yayın adresi"], ["onizleme", "Önizleme adresi"]] as const).map(([id, a]) => (
            <button key={id} type="button" disabled={id === "yayin" && !yayinAdresi} onClick={() => setKaynak(id)} className={cn("h-7 flex-1 rounded-full text-[12px] font-medium disabled:opacity-35", kaynak === id ? "bg-white text-black" : "text-white/60 hover:text-white")}>{a}</button>
          ))}
        </div>
        <p className="truncate font-mono text-[11.5px] text-white/45">{adres}</p>
        {!yayinAdresi && <p className="text-[11.5px] leading-snug text-white/45">Proje yayında değil; yayınlayınca telefon kalıcı adresi açar.</p>}
        {yerel && <p className="flex items-start gap-1.5 rounded-[12px] bg-amber-400/[0.07] px-2.5 py-2 text-[11.5px] leading-snug text-amber-100/85 ring-1 ring-inset ring-amber-300/15"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Bu adres yerel ağda; telefonun Expo Go içinden ulaşamaz. Projeyi yayınla ya da Vayra'yı herkese açık bir adreste çalıştır.</p>}
      </div>
      <div className="min-h-0 flex-1 bg-[#0e0f11]">
        <iframe key={parametre} title="Expo Snack" src={`https://snack.expo.dev/embedded?${parametre}`} className="h-full w-full border-0" allow="clipboard-write" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
      </div>
      <div className="flex items-center gap-2 border-t border-white/[0.06] px-4 py-2.5">
        <p className="min-w-0 flex-1 text-[11px] leading-snug text-white/40">Ekranlar web teknolojisiyle çizilir; yerel React Native bileşenine dönüştürülmez.</p>
        <a href={`https://snack.expo.dev/?${parametre}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white/[0.08] px-3 text-[12px] text-white hover:bg-white/[0.13]"><ExternalLink className="h-3.5 w-3.5" />Snack'te aç</a>
      </div>
    </motion.aside>
  );
}
