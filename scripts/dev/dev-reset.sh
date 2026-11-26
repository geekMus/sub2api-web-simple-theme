#!/usr/bin/env bash
# 先杀掉 3000 端口占用者与所有本项目的 vite/esbuild，再启动唯一实例。
# 背景：多个 vite 实例抢同一端口时，HMR 会把旧模块留在内存里，改文件不生效。
set -u
cd "$(dirname "$0")/../.."

PIDS=$(netstat -ano | grep ':3000 ' | grep LISTENING | awk '{print $5}' | sort -u)
for pid in $PIDS; do
  [ -n "$pid" ] && taskkill /PID "$pid" /T /F >/dev/null 2>&1 || true
done
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { (\$_.Name -eq 'node.exe' -or \$_.Name -eq 'esbuild.exe') -and \$_.CommandLine -like '*sub2api-web-simple-theme*' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }" >/dev/null 2>&1 || true
sleep 2

exec npx --yes pnpm@10.15.0 dev --force
