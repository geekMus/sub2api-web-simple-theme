#!/usr/bin/env bash
# 带登录态截图：读取 .tmp-shots/session.json，把 --token/--user 传给 shot.mjs
# 用法: bash scripts/dev/shot.sh --url http://localhost:3000/dashboard --out .tmp-shots/x.png --theme dark
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SESSION="$ROOT/.tmp-shots/session.json"
if [ ! -f "$SESSION" ]; then echo "[shot.sh] 缺少 $SESSION（先由 lead 生成）" >&2; exit 1; fi
TOKEN=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).token)" "$SESSION")
USERJSON=$(node -e "process.stdout.write(JSON.stringify(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).user))" "$SESSION")
exec node "$ROOT/scripts/dev/shot.mjs" --token "$TOKEN" --user "$USERJSON" "$@"
