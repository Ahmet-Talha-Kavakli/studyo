import { Iskelet } from "@/components/ui/Iskelet";

export default function AdminLoading() {
  return (
    <div className="admin-kapsam min-h-screen bg-[color:var(--ad-zemin)] p-6">
      <Iskelet className="h-7 w-48" />
      <Iskelet className="mt-2 h-4 w-64" />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ad-glass p-4">
            <Iskelet className="h-3 w-20" />
            <Iskelet className="mt-3 h-7 w-28" />
            <Iskelet className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
