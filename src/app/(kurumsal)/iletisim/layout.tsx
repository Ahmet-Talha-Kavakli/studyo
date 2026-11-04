import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Vayra ile iletişime geç: satış ve kurumsal, destek, basın, iş ortaklığı, güvenlik ve KVKK talepleri için doğru ekibe ulaş.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
