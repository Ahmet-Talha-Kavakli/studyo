/**
 * Yönetim menüsü (gruplu). Bütün yöneticiler bütün bölümleri görür; yetki sunucuda denetlenir.
 */
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Users, LineChart, Wallet, ListChecks, Boxes,
  ShieldAlert, TrendingUp, FileText, LifeBuoy, Server, Lock, Code2, Scale, Sparkles, Activity, ServerCog, Rocket,
} from "lucide-react";
import type { Modul } from "./guvenlik/roller";

export interface NavOge {
  ad: string;
  yol: string;
  ikon: LucideIcon;
  modul: Modul;
}

export interface NavGrup {
  grup: string;
  ogeler: NavOge[];
}

export const NAV: NavGrup[] = [
  {
    grup: "Genel",
    ogeler: [
      { ad: "Genel bakış", yol: "/admin", ikon: LayoutDashboard, modul: "genel" },
      { ad: "Yapay zekâ asistanı", yol: "/admin/ai", ikon: Sparkles, modul: "ai" },
    ],
  },
  {
    grup: "Kullanıcı ve analiz",
    ogeler: [
      { ad: "Kullanıcılar", yol: "/admin/kullanicilar", ikon: Users, modul: "kullanicilar" },
      { ad: "Davranış", yol: "/admin/davranis", ikon: Activity, modul: "analitik" },
      { ad: "Analitik", yol: "/admin/analitik", ikon: LineChart, modul: "analitik" },
    ],
  },
  {
    grup: "Gelir ve üretim",
    ogeler: [
      { ad: "Finans", yol: "/admin/finans", ikon: Wallet, modul: "finans" },
      { ad: "İşler", yol: "/admin/joblar", ikon: ListChecks, modul: "joblar" },
      { ad: "Modeller", yol: "/admin/modeller", ikon: Boxes, modul: "modeller" },
      { ad: "Sağlayıcı", yol: "/admin/saglayici", ikon: ServerCog, modul: "modeller" },
    ],
  },
  {
    grup: "Güven ve büyüme",
    ogeler: [
      { ad: "Moderasyon", yol: "/admin/moderasyon", ikon: ShieldAlert, modul: "moderasyon" },
      { ad: "Büyüme", yol: "/admin/buyume", ikon: TrendingUp, modul: "buyume" },
      { ad: "İçerik", yol: "/admin/icerik", ikon: FileText, modul: "icerik" },
      { ad: "Destek", yol: "/admin/destek", ikon: LifeBuoy, modul: "destek" },
    ],
  },
  {
    grup: "Sistem ve güvenlik",
    ogeler: [
      { ad: "Yayın hazırlığı", yol: "/admin/yayin", ikon: Rocket, modul: "sistem" },
      { ad: "Sistem", yol: "/admin/sistem", ikon: Server, modul: "sistem" },
      { ad: "Geliştirici", yol: "/admin/gelistirici", ikon: Code2, modul: "gelistirici" },
      { ad: "Güvenlik", yol: "/admin/guvenlik", ikon: Lock, modul: "guvenlik" },
      { ad: "KVKK", yol: "/admin/kvkk", ikon: Scale, modul: "kvkk" },
    ],
  },
];
