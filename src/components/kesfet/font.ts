import { Geist } from "next/font/google";

/** Keşfet başlık fontu — Türkçe karakterler için latin-ext dahil. */
export const kesfetFont = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-kesfet",
  display: "swap",
});
