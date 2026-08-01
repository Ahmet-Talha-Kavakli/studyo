import "server-only";
import { PipedreamClient } from "@pipedream/sdk";

/**
 * Pipedream Connect — sunucu tarafı client (SADECE server-side, secret'lar burada kalır).
 * Bağlayıcılar (connectors) için gerçek OAuth: kullanıcı adına 2000+ uygulamaya bağlanır.
 * .env.local: PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET, PIPEDREAM_PROJECT_ID, PIPEDREAM_ENVIRONMENT
 */

let _client: PipedreamClient | null = null;

export function pdClient(): PipedreamClient {
  if (_client) return _client;
  const clientId = process.env.PIPEDREAM_CLIENT_ID;
  const clientSecret = process.env.PIPEDREAM_CLIENT_SECRET;
  const projectId = process.env.PIPEDREAM_PROJECT_ID;
  if (!clientId || !clientSecret || !projectId) {
    throw new Error("PIPEDREAM_YAPILANDIRILMADI");
  }
  _client = new PipedreamClient({
    clientId,
    clientSecret,
    projectId,
    projectEnvironment: (process.env.PIPEDREAM_ENVIRONMENT as "development" | "production") ?? "development",
  });
  return _client;
}

/** Pipedream yapılandırılmış mı (anahtarlar var mı)? */
export function pdHazir(): boolean {
  return Boolean(
    process.env.PIPEDREAM_CLIENT_ID &&
    process.env.PIPEDREAM_CLIENT_SECRET &&
    process.env.PIPEDREAM_PROJECT_ID,
  );
}
