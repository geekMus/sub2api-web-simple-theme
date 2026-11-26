#!/usr/bin/env bash
# dev 守护：vite 监听器偶尔会因编辑器原子替换的 .*.tmpdir 报 EBUSY 退出，这里自动重启
cd "$(dirname "$0")/../.."
while true; do
  npx --yes pnpm@10.15.0 dev
  code=$?
  echo "[dev-guard] vite 退出 code=$code，2 秒后重启"
  sleep 2
done
