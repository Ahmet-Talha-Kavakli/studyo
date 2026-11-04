import { cn } from "@/lib/utils";

/** Birincil / beyaz / ikincil buton sınıfı — sunucu ve istemci bileşenlerinde ortak. */
export function butonSinif(varyant: "birincil" | "ikincil" | "beyaz" = "birincil") {
  return cn(
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-semibold transition-[transform,background-color,border-color,opacity] active:scale-[0.97]",
    varyant === "birincil" && "bg-aksan text-zemin hover:opacity-90",
    varyant === "beyaz" && "bg-white text-zemin hover:bg-white/90",
    varyant === "ikincil" && "border border-white/[0.14] text-white hover:border-white/25 hover:bg-white/[0.05]",
  );
}
