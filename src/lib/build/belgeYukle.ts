import "server-only";
import path from "path";

/**
 * Paketlenmeden çalışma anında yüklenen Node kütüphaneleri (docx, exceljs, pptxgenjs, sharp). Sunucu derleyicisi
 * createRequire'ı kendi işleviyle değiştirdiği için Node'un modül yükleyicisi doğrudan alınır.
 */
type Yukleyici = (ad: string) => unknown;
let yukleyici: Yukleyici | null = null;
export function nodeYukle<T>(ad: string): T {
  if (!yukleyici) {
    const m = (process as unknown as { getBuiltinModule?: (ad: string) => { createRequire: (y: string) => Yukleyici } }).getBuiltinModule?.("module");
    yukleyici = m ? m.createRequire(path.join(process.cwd(), "package.json")) : (0, eval)("require") as Yukleyici;
  }
  return yukleyici(ad) as T;
}
