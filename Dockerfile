# Vayra: sürekli çalışan Node sunucusu.
# Ajan turları dakikalarca sürer, sistem zamanlayıcısı arka planda çalışır ve bütün Build verisi diske yazılır;
# bu yüzden sunucusuz (serverless) değil, kalıcı diski olan tek bir kapsayıcı olarak çalıştırılır.

FROM node:24-bookworm-slim AS bagimlilik
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-bookworm-slim AS derleme
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=bagimlilik /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-bookworm-slim AS calisma
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    VAYRA_VERI_DIZINI=/veri \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY --from=derleme /app/package.json /app/package-lock.json ./
COPY --from=derleme /app/node_modules ./node_modules
COPY --from=derleme /app/.next ./.next
COPY --from=derleme /app/public ./public
COPY --from=derleme /app/next.config.mjs ./next.config.mjs
# Çalışma anında okunan kaynaklar: MCP ve CLI kurulum dosyaları (/cli/<dosya>).
COPY --from=derleme /app/src/lib/mcp/dosyalar ./src/lib/mcp/dosyalar
# Proje kapakları ve ajanın tarayıcı testi için Chromium (playwright-core ile aynı sürüm).
RUN node node_modules/playwright-core/cli.js install --with-deps chromium \
    && mkdir -p /veri && chown -R node:node /veri /app
USER node
VOLUME ["/veri"]
EXPOSE 3100
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3100/api/saglik').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "start"]
