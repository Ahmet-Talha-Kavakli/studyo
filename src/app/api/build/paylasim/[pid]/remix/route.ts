import { PaylasimHatasi, paylasimRemix } from "@/lib/build/paylasim";
import { hata, sahipAl } from "@/lib/build/sunucu";

export const dynamic = "force-dynamic";

/** Paylaşılan sürümün dosyalarını isteği yapanın (sahip anahtarı) projelerine kopyalar. */
export async function POST(req: Request, { params }: { params: Promise<{ pid: string }> }) {
  const sahip = sahipAl(req);
  if (!sahip) return hata("Oturum anahtarı eksik; sayfayı yenile.", 401);
  try { return Response.json({ ok: true, id: await paylasimRemix((await params).pid, sahip) }); }
  catch (e) { return e instanceof PaylasimHatasi ? hata(e.message, e.durum) : hata((e as Error).message || "Remix yapılamadı.", 500); }
}
