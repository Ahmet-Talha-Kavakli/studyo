/* İş (job) türü ve durumu etiketleri: liste ve ayrıntı sayfası ortak kullanır. */
export const JOB_TUR: Record<string, string> = { studyo: "Stüdyo", api: "API", build: "Build kredisi", ajan: "Build ajanı", sistem: "Build sistemi" };
export const JOB_DURUM: Record<string, { ad: string; ton: "basari" | "tehlike" | "uyari" | "aksan" | "notr" }> = {
  tamam: { ad: "Tamamlandı", ton: "basari" }, iade: { ad: "Hata, kredi iade", ton: "tehlike" }, hata: { ad: "Hata", ton: "tehlike" },
  suruyor: { ad: "Sürüyor", ton: "aksan" }, bekliyor: { ad: "Sonuç bekliyor", ton: "uyari" }, durdu: { ad: "Durduruldu", ton: "notr" },
};
