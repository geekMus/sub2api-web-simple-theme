#!/usr/bin/env bash
# 重置并启动开发服务器。
# 坑：vite 由 pnpm 的 node 子进程持有 3000 端口，只杀 vite 会留孤儿进程继续提供旧模块图，
#     表现为「改了代码页面不变」。必须按端口查归属进程整棵杀掉，确认端口释放再启动。
set -u
cd "$(dirname "$0")/../.."

powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev/kill-dev.ps1

if netstat -ano | grep ':3000 ' | grep LISTENING >/dev/null 2>&1; then
  echo '[dev-reset] 3000 端口仍被占用' >&2
  exit 1
fi

exec npx --yes pnpm@10.15.0 dev
