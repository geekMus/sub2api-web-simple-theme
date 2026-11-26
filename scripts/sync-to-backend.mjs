#!/usr/bin/env node
/**
 * 把 sub2api-web-simple-theme 的构建产物同步到 sub2api 后端的 embed 目录。
 *
 * 后端 internal/web/embed_on.go 里有 `//go:embed all:dist`，
 * 只有 backend/internal/web/dist/ 存在内容时，`go build -tags embed` 才能把前端打进二进制。
 *
 * 用法：
 *   node scripts/sync-to-backend.mjs                        # 默认 ../sub2api-beichen
 *   node scripts/sync-to-backend.mjs --backend ../xxx       # 指定后端仓库路径
 *   node scripts/sync-to-backend.mjs --dry-run              # 只校验不写入
 *
 * 环境变量：
 *   BACKEND_DIR   后端仓库根目录（默认 ../sub2api-beichen）
 *   VITE_OUT_DIR  前端产物目录（默认 dist）
 */
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const argv = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = argv.indexOf(name)
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[i + 1] : fallback
}
const dryRun = argv.includes('--dry-run')

const distDir = path.resolve(projectRoot, process.env.VITE_OUT_DIR || 'dist')
const backendDir = path.resolve(projectRoot, flag('--backend', process.env.BACKEND_DIR || '../sub2api-beichen'))
const targetDir = path.join(backendDir, 'backend', 'internal', 'web', 'dist')

function die(message) {
  console.error('[sync-to-backend] ' + message)
  process.exit(1)
}

if (!existsSync(path.join(distDir, 'index.html'))) {
  die('找不到构建产物：' + distDir + '/index.html，请先运行 pnpm build')
}
if (!existsSync(path.join(backendDir, 'backend', 'go.mod'))) {
  die('目标不像 sub2api 后端仓库：' + backendDir + '（缺少 backend/go.mod）')
}

async function treeStats(dir) {
  let files = 0
  let bytes = 0
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await treeStats(full)
      files += nested.files
      bytes += nested.bytes
    } else {
      files += 1
      bytes += (await stat(full)).size
    }
  }
  return { files, bytes }
}

const summary = await treeStats(distDir)
console.log('[sync-to-backend] 产物：' + distDir + '（' + summary.files + ' 个文件，' + (summary.bytes / 1024 / 1024).toFixed(2) + ' MiB）')
console.log('[sync-to-backend] 目标：' + targetDir)

if (dryRun) {
  console.log('[sync-to-backend] --dry-run，未写入')
  process.exit(0)
}

// 清空目标目录，但保留后端仓库里可能被 git 跟踪的 .keep 占位文件
await mkdir(targetDir, { recursive: true })
for (const entry of await readdir(targetDir)) {
  if (entry === '.keep') continue
  await rm(path.join(targetDir, entry), { recursive: true, force: true })
}
await cp(distDir, targetDir, { recursive: true })

const written = await treeStats(targetDir)
console.log('[sync-to-backend] 已写入 ' + written.files + ' 个文件（' + (written.bytes / 1024 / 1024).toFixed(2) + ' MiB）')
console.log('[sync-to-backend] 下一步：cd ' + backendDir + '/backend && go build -tags embed -o bin/server-embed ./cmd/server')
