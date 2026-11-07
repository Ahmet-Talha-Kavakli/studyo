/** Sunucu açılışı: Node çalışma zamanında Vayra Build sistem zamanlayıcısını başlatır (edge derlemesine girmez). */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
