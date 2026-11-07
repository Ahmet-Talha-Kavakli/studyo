import "server-only";

/**
 * Build proje ajanının süren turları: proje kimliği → durdurucu. Ajan rotası ve paralel görev panosu aynı kaydı
 * okur; geliştirmede modül yeniden yüklense de kayıt kaybolmasın diye globalThis'te tutulur.
 */
const g = globalThis as unknown as { __vayraBuildCalisan?: Map<string, AbortController> };
export const calisanlar: Map<string, AbortController> = (g.__vayraBuildCalisan ??= new Map());

export const ajanCalisiyor = (projeId: string) => calisanlar.has(projeId);
