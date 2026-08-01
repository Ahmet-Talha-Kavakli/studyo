import type { Metadata } from "next";
import { AdminKabuk } from "@/components/admin/Kabuk";
import { OnaySaglayici } from "@/components/admin/ui/Onay";

export const metadata: Metadata = {
  title: "Vayra Yönetim",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-kapsam">
      <OnaySaglayici>
        <AdminKabuk>{children}</AdminKabuk>
      </OnaySaglayici>
    </div>
  );
}
