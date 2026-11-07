import { gecitBaglanmaAdresi } from "@/lib/build/baglantiGecit";

export const dynamic = "force-dynamic";

/** Ağ geçidi anahtarıyla, uygulamanın kendi kullanıcısı için 4 saat geçerli bağlanma adresi üretir. */
export const POST = (req: Request) => gecitBaglanmaAdresi(req);
