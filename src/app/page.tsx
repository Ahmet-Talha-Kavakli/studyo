import { redirect } from "next/navigation";

/**
 * Kök `/` → doğrudan panele girer (Higgsfield gibi uygulama-önce deneyim).
 * Landing artık kullanılmıyor; kullanıcı hemen ürünü gezer, üretmek/kaydetmek
 * gibi bir aksiyona kalkışınca giriş/kayıt pop-up'ı açılır (bkz. useAuthKapi).
 *
 * (Eski pazarlama landing bileşenleri src/components/site/* içinde duruyor;
 *  gerekirse ayrı bir rotada geri getirilebilir.)
 */
export default function Home() {
  redirect("/panel");
}
