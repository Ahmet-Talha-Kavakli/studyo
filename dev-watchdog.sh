#!/bin/bash
# Vayra dev server watchdog — çökerse otomatik yeniden başlatır.
cd "$(dirname "$0")"
LOG=/private/tmp/claude-501/-Users-aysegulcadircioglu-Desktop-atlas/500fa0da-24bb-44d5-9ee1-ef7f68761a18/scratchpad/dev.log
while true; do
  echo "[watchdog] dev server başlatılıyor $(date)" >> "$LOG"
  NODE_OPTIONS=--max-http-header-size=80000 node_modules/.bin/next dev -H 0.0.0.0 -p 3100 >> "$LOG" 2>&1
  echo "[watchdog] dev server durdu, 2sn sonra yeniden başlıyor" >> "$LOG"
  sleep 2
done
