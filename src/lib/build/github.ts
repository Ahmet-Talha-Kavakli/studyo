import "server-only";

/**
 * GitHub entegrasyonu (REST API, bağımlılıksız): kullanıcının kişisel erişim anahtarıyla depo oluşturma, projenin
 * bütün dosyalarını tek commit olarak gönderme (Git Data API), depodan çekme; herkese açık depoyu anahtarsız okuma.
 */
const API = "https://api.github.com";
const METIN = /\.(html?|css|m?js|json|svg|md|txt|webmanifest|xml|ts|tsx|jsx)$/i;
const ATLA = /(^|\/)(node_modules|\.git|dist|build|\.next|\.vercel|coverage)\//;

export class GitHubHatasi extends Error { constructor(m: string, public durum = 400) { super(m); } }

async function gh<T>(yol: string, anahtar: string | null, ayar: { method?: string; govde?: unknown } = {}): Promise<T> {
  const r = await fetch(`${API}${yol}`, {
    method: ayar.method ?? "GET",
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "Vayra-Build", ...(anahtar ? { Authorization: `Bearer ${anahtar}` } : {}), ...(ayar.govde ? { "Content-Type": "application/json" } : {}) },
    body: ayar.govde ? JSON.stringify(ayar.govde) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  if (r.status === 204) return undefined as T;
  const j = await r.json().catch(() => ({})) as { message?: string };
  if (!r.ok) {
    const m = j.message ?? "";
    if (r.status === 401) throw new GitHubHatasi("GitHub anahtarı geçersiz ya da süresi dolmuş.", 401);
    if (r.status === 403 && /rate limit/i.test(m)) throw new GitHubHatasi("GitHub istek sınırına takıldı; biraz sonra yeniden dene.", 429);
    if (r.status === 403) throw new GitHubHatasi("Bu anahtarın bu işlem için izni yok. Anahtara depo (repo, contents) yazma izni ver.", 403);
    if (r.status === 404) throw new GitHubHatasi("Depo ya da dal bulunamadı.", 404);
    throw new GitHubHatasi(`GitHub: ${m || r.status}`, r.status);
  }
  return j as T;
}

export async function ghKullanici(anahtar: string): Promise<{ login: string; avatar_url: string; name: string | null }> {
  return gh("/user", anahtar);
}

/** Depo yoksa oluşturur (ilk commit README ile); varsa bilgisini döner. */
export async function ghDepoHazirla(anahtar: string, sahip: string, ad: string, ozel: boolean): Promise<{ full_name: string; html_url: string; default_branch: string; private: boolean }> {
  try { return await gh(`/repos/${sahip}/${ad}`, anahtar); }
  catch (e) {
    if (!(e instanceof GitHubHatasi) || e.durum !== 404) throw e;
    return gh("/user/repos", anahtar, { method: "POST", govde: { name: ad, private: ozel, auto_init: true, description: "Vayra Build ile yapıldı" } });
  }
}

/** Bütün dosyaları tek commit olarak dala yazar (depodaki diğer dosyalar silinir; depo projeyle birebir aynı olur). */
export async function ghGonder(anahtar: string, depo: string, dal: string, dosyalar: Record<string, string>, mesaj: string): Promise<{ sha: string; url: string }> {
  const ref = await gh<{ object: { sha: string } }>(`/repos/${depo}/git/ref/heads/${encodeURIComponent(dal)}`, anahtar);
  const girdiler = Object.entries(dosyalar).slice(0, 400);
  const agac: { path: string; mode: "100644"; type: "blob"; sha: string }[] = [];
  // Blob'ları 6'şar paralel oluştur.
  for (let i = 0; i < girdiler.length; i += 6) {
    const parca = await Promise.all(girdiler.slice(i, i + 6).map(async ([yol, icerik]) => {
      const b = await gh<{ sha: string }>(`/repos/${depo}/git/blobs`, anahtar, { method: "POST", govde: { content: icerik, encoding: "utf-8" } });
      return { path: yol, mode: "100644" as const, type: "blob" as const, sha: b.sha };
    }));
    agac.push(...parca);
  }
  const t = await gh<{ sha: string }>(`/repos/${depo}/git/trees`, anahtar, { method: "POST", govde: { tree: agac } });
  const c = await gh<{ sha: string; html_url: string }>(`/repos/${depo}/git/commits`, anahtar, { method: "POST", govde: { message: mesaj, tree: t.sha, parents: [ref.object.sha] } });
  await gh(`/repos/${depo}/git/refs/heads/${encodeURIComponent(dal)}`, anahtar, { method: "PATCH", govde: { sha: c.sha, force: false } });
  return { sha: c.sha, url: c.html_url };
}

/** Depodaki metin dosyalarını okur (en çok 300 dosya, dosya başı 400 KB). anahtar yoksa yalnız herkese açık depolar. */
export async function ghCek(anahtar: string | null, depo: string, dal?: string, altKlasor = ""): Promise<{ dosyalar: Record<string, string>; atlanan: number; dal: string; sha: string; ikili: string[] }> {
  const bilgi = await gh<{ default_branch: string }>(`/repos/${depo}`, anahtar);
  const d = dal || bilgi.default_branch;
  const agac = await gh<{ sha: string; tree: { path: string; type: string; sha: string; size?: number }[]; truncated: boolean }>(`/repos/${depo}/git/trees/${encodeURIComponent(d)}?recursive=1`, anahtar);
  const onek = altKlasor.replace(/^\/+|\/+$/g, "");
  const adaylar = agac.tree.filter((x) => x.type === "blob" && (!onek || x.path.startsWith(`${onek}/`)) && !ATLA.test(`${x.path}`));
  const metin = adaylar.filter((x) => METIN.test(x.path) && (x.size ?? 0) <= 400_000).slice(0, 300);
  const dosyalar: Record<string, string> = {};
  for (let i = 0; i < metin.length; i += 8) {
    await Promise.all(metin.slice(i, i + 8).map(async (x) => {
      const b = await gh<{ content: string; encoding: string }>(`/repos/${depo}/git/blobs/${x.sha}`, anahtar);
      const yol = onek ? x.path.slice(onek.length + 1) : x.path;
      dosyalar[yol] = b.encoding === "base64" ? Buffer.from(b.content, "base64").toString("utf8") : b.content;
    }));
  }
  const ikili = adaylar.filter((x) => VARLIK.test(x.path)).map((x) => (onek ? x.path.slice(onek.length + 1) : x.path));
  return { dosyalar, atlanan: adaylar.length - metin.length, dal: d, sha: agac.sha, ikili };
}

const VARLIK = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|mp4|webm|mp3|wav)$/i;

/**
 * Metin dosyalarındaki ikili varlık bağlantılarını (görsel, yazı tipi, ses) deponun ham adreslerine çevirir;
 * böylece herkese açık depodan gelen site, görseller indirilmeden çalışır. Değiştirilen bağlantı sayısını döner.
 */
export function hamAdreseCevir(dosyalar: Record<string, string>, ikili: string[], depo: string, dal: string, onek = ""): number {
  let sayi = 0;
  const dizin = (y: string) => (y.includes("/") ? y.slice(0, y.lastIndexOf("/")) : "");
  const goreli = (kimden: string, hedef: string) => {
    const a = kimden ? kimden.split("/") : [], b = hedef.split("/");
    let i = 0;
    while (i < a.length && i < b.length - 1 && a[i] === b[i]) i++;
    return [...Array(a.length - i).fill(".."), ...b.slice(i)].join("/");
  };
  const kac = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const [yol, icerik] of Object.entries(dosyalar)) {
    if (!/\.(html?|css)$/i.test(yol)) continue;
    let yeni = icerik;
    for (const v of ikili) {
      const ham = `https://raw.githubusercontent.com/${depo}/${dal}/${onek ? `${onek}/` : ""}${v.split("/").map(encodeURIComponent).join("/")}`;
      const r = goreli(dizin(yol), v);
      for (const aday of [r, `./${r}`]) {
        const re = new RegExp(`(["'(=])${kac(aday)}(["') ])`, "g");
        yeni = yeni.replace(re, (_m, a: string, b: string) => { sayi++; return a + ham + b; });
      }
    }
    dosyalar[yol] = yeni;
  }
  return sayi;
}

/** github.com/sahip/depo[/tree/dal/klasor] adresini çözer. */
export function ghAdresCoz(url: string): { depo: string; dal?: string; klasor?: string } | null {
  const m = url.trim().match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.+))?)?\/?$/);
  return m ? { depo: `${m[1]}/${m[2]}`, dal: m[3], klasor: m[4] } : null;
}
