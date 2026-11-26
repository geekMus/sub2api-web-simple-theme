#!/usr/bin/env bash
# 重置并启动开发服务器。
# 关键：vite 实际由 pnpm 的 node 子进程持有 3000 端口；只杀 vite 会留下孤儿进程继续占用端口，
# 并且它的模块图不会感知到「原子替换」式写入的新文件，导致改代码后页面不变。
# 所以必须按端口 PID 整棵进程树杀掉（taskkill /T），确认端口释放后再启动。
set -u
cd "$(dirname "$0")/../.."

for i in 1 2 3; do
  PID=$(netstat -ano | grep ':3000 ' | grep LISTENING | awk '{print $5}' | head -1)
  [ -z "$PID" ] && break
  cmd //c "taskkill /F /T /PID $PID" >/dev/null 2>&1 || true
  sleep 2
done

if netstat -ano | grep ':3000 ' | grep LISTENING >/dev/null 2>&1; then
  echo "[dev-reset] 3000 端口仍被占用，请手动检查" >&2
  exit 1
fi

exec npx --yes pnpm@10.15.0 dev --force
