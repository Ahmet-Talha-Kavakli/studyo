import { create } from "zustand";
import { persist } from "zustand/middleware";
import { alanlariKoru } from "@/store/gocHelper";

/**
 * Özel MCP bağlayıcıları — uzak MCP sunucuları (URL + isteğe bağlı erişim anahtarı).
 * "Sohbette kullan" açık olanlar her sohbet isteğinde Claude'a MCP sunucusu olarak verilir
 * (Messages API mcp_servers + mcp_toolset); model gerektiğinde bu sunucuların araçlarını çağırır.
 * Anahtar bu tarayıcıda saklanır ve yalnız istek sırasında kendi sunucumuza gönderilir.
 */
export type ScMcp = { id: string; ad: string; url: string; token?: string; acik: boolean; eklendi: number };

interface ScMcpState {
  sunucular: ScMcp[];
  ekle: (s: Omit<ScMcp, "id" | "eklendi" | "acik">) => void;
  guncelle: (id: string, p: Partial<ScMcp>) => void;
  sil: (id: string) => void;
}

export const mcpUrlGecerli = (u: string) => { try { const x = new URL(u.trim()); return x.protocol === "https:"; } catch { return false; } };

export const useScMcp = create<ScMcpState>()(
  persist(
    (set) => ({
      sunucular: [],
      ekle: (s) => set((x) => ({ sunucular: [{ ...s, id: `mcp-${Date.now().toString(36)}`, acik: true, eklendi: Date.now() }, ...x.sunucular] })),
      guncelle: (id, p) => set((x) => ({ sunucular: x.sunucular.map((s) => (s.id === id ? { ...s, ...p } : s)) })),
      sil: (id) => set((x) => ({ sunucular: x.sunucular.filter((s) => s.id !== id) })),
    }),
    {
      name: "vayra-sc-mcp", version: 1, migrate: alanlariKoru,
      // Eski sürüm özel MCP'leri "vayra-ozel-mcp" anahtarında (url `kisa` alanında) tutuyordu — bir kez taşınır.
      onRehydrateStorage: () => (durum) => {
        try {
          const ham = localStorage.getItem("vayra-ozel-mcp");
          if (!durum || !ham) return;
          const eski = JSON.parse(ham) as { id: string; ad: string; kisa: string }[];
          const yeni = eski.filter((e) => mcpUrlGecerli(e.kisa) && !durum.sunucular.some((s) => s.url === e.kisa)).map((e) => ({ id: e.id, ad: e.ad, url: e.kisa, acik: false, eklendi: Date.now() }));
          if (yeni.length) useScMcp.setState({ sunucular: [...durum.sunucular, ...yeni] });
          localStorage.removeItem("vayra-ozel-mcp");
        } catch { /* bozuk eski kayıt → yoksay */ }
      },
    },
  ),
);

/** Sohbet isteğine eklenecek açık sunucular. */
export const acikMcp = () => useScMcp.getState().sunucular.filter((s) => s.acik && mcpUrlGecerli(s.url)).slice(0, 5).map((s) => ({ ad: s.ad, url: s.url, ...(s.token ? { token: s.token } : {}) }));
