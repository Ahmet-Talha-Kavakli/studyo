/* ============================================================
   AVATAR KATALOĞU — referanslar/marketing/eksikler birebir.
   Avatar Seç modalındaki 5 sütunlu ızgarayı besler.
   ============================================================ */

export interface PazAvatar {
  id: string;
  ad: string;
  cinsiyet: "erkek" | "kadin";
  tohum: string;
  /** Kullanıcının kendi ürettiği/yüklediği avatar mı ("Avatarlarım"). */
  benim?: boolean;
}

/* Referans ızgarasındaki isimler, görülen sırayla. */
export const PAZ_AVATARLAR: PazAvatar[] = [
  { id: "a1", ad: "Emma", cinsiyet: "kadin", tohum: "av-emma", benim: true },
  { id: "a2", ad: "Jayden", cinsiyet: "erkek", tohum: "av-jayden" },
  { id: "a3", ad: "Stefan", cinsiyet: "erkek", tohum: "av-stefan" },
  { id: "a4", ad: "Mei", cinsiyet: "kadin", tohum: "av-mei" },
  { id: "a5", ad: "Yuna", cinsiyet: "kadin", tohum: "av-yuna" },
  { id: "a6", ad: "Adriana", cinsiyet: "kadin", tohum: "av-adriana" },
  { id: "a7", ad: "Clara", cinsiyet: "kadin", tohum: "av-clara" },
  { id: "a8", ad: "Maria", cinsiyet: "kadin", tohum: "av-maria" },
  { id: "a9", ad: "Sofia", cinsiyet: "kadin", tohum: "av-sofia" },
  { id: "a10", ad: "Valentina", cinsiyet: "kadin", tohum: "av-valentina" },
  { id: "a11", ad: "Jia", cinsiyet: "kadin", tohum: "av-jia" },
  { id: "a12", ad: "Lily", cinsiyet: "kadin", tohum: "av-lily" },
  { id: "a13", ad: "Tae", cinsiyet: "erkek", tohum: "av-tae" },
  { id: "a14", ad: "Felix", cinsiyet: "erkek", tohum: "av-felix" },
  { id: "a15", ad: "Malik", cinsiyet: "erkek", tohum: "av-malik" },
  { id: "a16", ad: "Liam", cinsiyet: "erkek", tohum: "av-liam" },
  { id: "a17", ad: "Joon", cinsiyet: "erkek", tohum: "av-joon" },
  { id: "a18", ad: "Erik", cinsiyet: "erkek", tohum: "av-erik" },
  { id: "a19", ad: "Nia", cinsiyet: "kadin", tohum: "av-nia" },
  { id: "a20", ad: "Hana", cinsiyet: "kadin", tohum: "av-hana" },
  { id: "a21", ad: "Ryu", cinsiyet: "erkek", tohum: "av-ryu" },
  { id: "a22", ad: "Priya", cinsiyet: "kadin", tohum: "av-priya" },
  { id: "a23", ad: "Elena", cinsiyet: "kadin", tohum: "av-elena" },
  { id: "a24", ad: "Kai", cinsiyet: "erkek", tohum: "av-kai" },
  { id: "a25", ad: "Sora", cinsiyet: "kadin", tohum: "av-sora" },
  { id: "a26", ad: "Minji", cinsiyet: "kadin", tohum: "av-minji" },
  { id: "a27", ad: "Margot", cinsiyet: "kadin", tohum: "av-margot" },
  { id: "a28", ad: "Niko", cinsiyet: "erkek", tohum: "av-niko" },
  { id: "a29", ad: "Jin", cinsiyet: "erkek", tohum: "av-jin" },
  { id: "a30", ad: "Yuki", cinsiyet: "kadin", tohum: "av-yuki" },
  { id: "a31", ad: "Marco", cinsiyet: "erkek", tohum: "av-marco" },
  { id: "a32", ad: "Ren", cinsiyet: "erkek", tohum: "av-ren" },
  { id: "a33", ad: "Lucas", cinsiyet: "erkek", tohum: "av-lucas" },
  { id: "a34", ad: "Zara", cinsiyet: "kadin", tohum: "av-zara" },
  { id: "a35", ad: "Naomi", cinsiyet: "kadin", tohum: "av-naomi" },
  { id: "a36", ad: "Omar", cinsiyet: "erkek", tohum: "av-omar" },
  { id: "a37", ad: "Miso", cinsiyet: "kadin", tohum: "av-miso" },
  { id: "a38", ad: "Scarlett", cinsiyet: "kadin", tohum: "av-scarlett" },
  { id: "a39", ad: "Amara", cinsiyet: "kadin", tohum: "av-amara" },
  { id: "a40", ad: "Audrey", cinsiyet: "kadin", tohum: "av-audrey" },
];

/** Avatar üretimi kredi maliyeti — referansta "GENERATE ✦ 0.5". */
export const AVATAR_KREDI = 0.5;
