export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 py-10">
      {/* Aurora arka plan */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-vayra-600/20 blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/3 h-80 w-80 rounded-full bg-cyan-glow/12 blur-[120px]" />
      </div>
      {children}
    </div>
  );
}
