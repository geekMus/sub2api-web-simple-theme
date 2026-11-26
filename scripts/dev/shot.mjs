#!/usr/bin/env node
/**
 * scripts/dev/shot.mjs
 * 无头 Edge 截图 + 登录态/主题注入工具（纯 Node，不引入任何新依赖）。
 *
 * 用法:
 *   node scripts/dev/shot.mjs --url http://localhost:3000/home --out .tmp-shots/home.png 
 *     [--width 1440] [--height 900] [--wait 1200] [--theme dark|light] [--token <jwt>] [--user <json>]
 *
 * 实现要点:
 *   - 用 msedge.exe --headless=new 起一个独立临时 profile，CDP over WebSocket（Node 全局 WebSocket）驱动；
 *     全程无窗口、不抢焦点、不置顶（绝不传 --headless=false）。
 *   - --token / --user / --theme 会先导航到同源根路径，用 Runtime.evaluate 写入 localStorage，再导航到 --url，
 *     这样应用启动时（src/main.ts initThemeClass、src/router/index.ts 的 checkAuth）就能读到注入值。
 *   - 登录态键名（见 src/stores/auth.ts）: auth_token / auth_user / token_expires_at（毫秒时间戳）。
 *     注意 auth.ts 的 checkAuth 要求 auth_token 与 auth_user 同时存在才恢复登录态，因此只给 --token 时脚本会补一个占位
 *     auth_user，真实用户信息随后由 /auth/me（authAPI.getCurrentUser）覆盖。
 *   - 主题键名（见 src/main.ts）: theme，取值 'dark' | 'light'。
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'

const EDGE_PATH = process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

const LS_TOKEN = 'auth_token'
const LS_USER = 'auth_user'
const LS_TOKEN_EXPIRES_AT = 'token_expires_at'
const LS_THEME = 'theme'
const TOKEN_LIFETIME_MS = 400 * 24 * 60 * 60 * 1000
const STUB_USER = { id: 0, username: 'dev-screenshot', email: 'dev@example.invalid', role: 'user' }

const DEFAULTS = { width: 1440, height: 900, wait: 1200 }

const USAGE = [
  '用法: node scripts/dev/shot.mjs --url <url> --out <png> [选项]',
  '',
  '必填:',
  '  --url <url>            要截图的页面，例如 http://localhost:3000/home',
  '  --out <path>           输出 PNG 路径，例如 .tmp-shots/home.png',
  '',
  '可选:',
  '  --width <px>           视口宽，默认 1440',
  '  --height <px>          视口高，默认 900',
  '  --wait <ms>            页面 load 之后再等多久，默认 1200',
  '  --theme dark|light     写入 localStorage.theme（src/main.ts 的键名）',
  '  --token <jwt>          写入 localStorage.auth_token（同时写入远期 token_expires_at）',
  '  --user <json|@file>    写入 localStorage.auth_user（用户对象 JSON；auth.ts 需要它才恢复登录态）',
  '',
  '环境变量:',
  '  EDGE_PATH              覆盖 msedge.exe 路径',
  '',
  '示例:',
  '  node scripts/dev/shot.mjs --url http://localhost:3000/home --out .tmp-shots/home.png --theme dark',
  '  node scripts/dev/shot.mjs --url http://localhost:3000/dashboard --out .tmp-shots/dash.png --token "$JWT" --user @user.json',
].join('\n')

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms) })
}

function fail(message) {
  throw new Error(message)
}

function parseArgs(argv) {
  const opts = {
    url: null,
    out: null,
    width: DEFAULTS.width,
    height: DEFAULTS.height,
    wait: DEFAULTS.wait,
    theme: null,
    token: null,
    user: null,
    help: false
  }

  const known = ['url', 'out', 'width', 'height', 'wait', 'theme', 'token', 'user']

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      opts.help = true
      continue
    }
    if (!arg.startsWith('--')) fail('无法识别的参数: ' + arg)

    let key
    let value
    const eq = arg.indexOf('=')
    if (eq !== -1) {
      key = arg.slice(2, eq)
      value = arg.slice(eq + 1)
    } else {
      key = arg.slice(2)
      const next = argv[i + 1]
      if (next === undefined || next.startsWith('--')) fail('参数 ' + arg + ' 缺少值')
      value = next
      i++
    }

    if (known.indexOf(key) === -1) fail('未知参数: --' + key + '（--help 查看用法）')
    opts[key] = value
  }

  if (opts.help) return opts

  if (!opts.url) fail('缺少 --url')
  if (!opts.out) fail('缺少 --out')

  opts.width = toPositiveInt(opts.width, '--width')
  opts.height = toPositiveInt(opts.height, '--height')
  opts.wait = toPositiveInt(opts.wait, '--wait', true)

  if (opts.theme !== null) {
    if (opts.theme !== 'dark' && opts.theme !== 'light') fail('--theme 只能是 dark 或 light')
  }

  if (opts.user !== null) {
    let raw = opts.user
    if (raw.startsWith('@')) {
      const file = raw.slice(1)
      try {
        raw = fs.readFileSync(file, 'utf8')
      } catch (error) {
        fail('读取 --user 文件失败: ' + file + ' (' + error.message + ')')
      }
    }
    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch (error) {
      fail('--user 不是合法 JSON: ' + error.message)
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      fail('--user 必须是 JSON 对象，例如 {"id":1,"username":"dev","role":"admin"}')
    }
    opts.user = parsed
  }

  return opts
}

function toPositiveInt(value, name, allowZero) {
  const n = Number(value)
  const min = allowZero ? 0 : 1
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < min) {
    fail(name + ' 需要' + (allowZero ? '非负' : '正') + '整数，收到: ' + value)
  }
  return n
}

function getFreePort() {
  return new Promise(function (resolve, reject) {
    const server = net.createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', function () {
      const address = server.address()
      const port = address && typeof address === 'object' ? address.port : null
      server.close(function () {
        if (!port) reject(new Error('无法分配调试端口'))
        else resolve(port)
      })
    })
  })
}

function removeProfileDir(dir) {
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch (error) {
      /* Windows 上 msedge 退出后文件句柄可能短暂占用，稍后重试 */
    }
    if (!fs.existsSync(dir)) return true
    // 同步轮询等待
    const until = Date.now() + 200
    while (Date.now() < until) {
      try {
        fs.statSync(dir)
      } catch (error) {
        return true
      }
    }
  }
  return !fs.existsSync(dir)
}

async function waitForDevToolsTarget(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  let lastError = null

  while (Date.now() < deadline) {
    try {
      const response = await fetch('http://127.0.0.1:' + port + '/json/list', { signal: AbortSignal.timeout(2000) })
      if (response.ok) {
        const targets = await response.json()
        const page = Array.isArray(targets)
          ? targets.find(function (t) { return t && t.type === 'page' && t.webSocketDebuggerUrl })
          : null
        if (page) return page
        lastError = new Error('DevTools 已就绪但没有可用的 page target')
      } else {
        lastError = new Error('GET /json/list -> HTTP ' + response.status)
      }
    } catch (error) {
      lastError = error
    }
    await sleep(200)
  }

  fail('等待 Edge DevTools 超时 (' + timeoutMs + 'ms): ' + (lastError ? lastError.message : '未知错误'))
}

class CdpSession {
  constructor(ws) {
    this.ws = ws
    this.nextId = 1
    this.pending = new Map()
    this.waiters = new Map()
    this.closed = false

    ws.addEventListener('message', (event) => this.onMessage(event.data))
    ws.addEventListener('close', () => {
      this.closed = true
      this.pending.forEach((entry) => entry.reject(new Error('CDP WebSocket 已关闭')))
      this.pending.clear()
    })
    ws.addEventListener('error', () => {
      this.closed = true
    })
  }

  onMessage(data) {
    let message
    try {
      message = JSON.parse(typeof data === 'string' ? data : String(data))
    } catch (error) {
      return
    }

    if (message && message.id !== undefined) {
      const entry = this.pending.get(message.id)
      if (!entry) return
      this.pending.delete(message.id)
      if (message.error) {
        entry.reject(new Error('CDP ' + entry.method + ' 失败: ' + (message.error.message || JSON.stringify(message.error))))
      } else {
        entry.resolve(message.result || {})
      }
      return
    }

    if (message && message.method) {
      const queue = this.waiters.get(message.method)
      if (queue && queue.length > 0) {
        const waiter = queue.shift()
        waiter.resolve(message.params || {})
      }
    }
  }

  send(method, params, timeoutMs) {
    const timeout = timeoutMs || 30000
    return new Promise((resolve, reject) => {
      if (this.closed) {
        reject(new Error('CDP 连接已关闭'))
        return
      }
      const id = this.nextId++
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error('CDP 调用超时 (' + timeout + 'ms): ' + method))
      }, timeout)
      this.pending.set(id, {
        method: method,
        resolve: (value) => {
          clearTimeout(timer)
          resolve(value)
        },
        reject: (error) => {
          clearTimeout(timer)
          reject(error)
        }
      })
      try {
        this.ws.send(JSON.stringify({ id: id, method: method, params: params || {} }))
      } catch (error) {
        clearTimeout(timer)
        this.pending.delete(id)
        reject(error)
      }
    })
  }

  waitEvent(method, timeoutMs) {
    const timeout = timeoutMs || 30000
    return new Promise((resolve, reject) => {
      const queue = this.waiters.get(method) || []
      const waiter = {
        resolve: (params) => {
          clearTimeout(timer)
          resolve(params)
        }
      }
      const timer = setTimeout(() => {
        const current = this.waiters.get(method) || []
        const index = current.indexOf(waiter)
        if (index !== -1) current.splice(index, 1)
        reject(new Error('等待事件超时 (' + timeout + 'ms): ' + method))
      }, timeout)
      queue.push(waiter)
      this.waiters.set(method, queue)
    })
  }

  close() {
    try {
      this.ws.close()
    } catch (error) {
      /* ignore */
    }
  }
}
function connectCdp(wsUrl, timeoutMs) {
  return new Promise(function (resolve, reject) {
    let settled = false
    let ws
    try {
      ws = new WebSocket(wsUrl)
    } catch (error) {
      reject(error)
      return
    }
    const timer = setTimeout(function () {
      if (settled) return
      settled = true
      try { ws.close() } catch (error) { /* ignore */ }
      reject(new Error('CDP WebSocket 连接超时 (' + timeoutMs + 'ms)'))
    }, timeoutMs)

    ws.addEventListener('open', function () {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(new CdpSession(ws))
    }, { once: true })

    ws.addEventListener('error', function () {
      if (settled) return
      settled = true
      clearTimeout(timer)
      reject(new Error('CDP WebSocket 连接失败: ' + wsUrl))
    }, { once: true })
  })
}

function launchEdge(options) {
  if (!fs.existsSync(EDGE_PATH)) {
    fail('找不到 msedge.exe: ' + EDGE_PATH + '（可用 EDGE_PATH 环境变量覆盖）')
  }
  fs.mkdirSync(options.profileDir, { recursive: true })

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    '--no-first-run',
    '--no-default-browser-check',
    '--no-sandbox',
    '--disable-extensions',
    '--disable-sync',
    '--disable-background-networking',
    '--disable-features=Translate,MediaRouter,OptimizationHints',
    '--remote-allow-origins=*',
    '--remote-debugging-port=' + options.port,
    '--user-data-dir=' + options.profileDir,
    '--window-size=' + options.width + ',' + options.height,
    'about:blank'
  ]

  const child = spawn(EDGE_PATH, args, { stdio: 'ignore', windowsHide: true, detached: false })
  child.on('error', function () { /* 捕获在 waitForDevToolsTarget 的超时里 */ })
  return child
}

async function evaluate(session, expression, timeoutMs) {
  const result = await session.send(
    'Runtime.evaluate',
    { expression: expression, awaitPromise: true, returnByValue: true, userGesture: true },
    timeoutMs || 15000
  )
  if (result && result.exceptionDetails) {
    const detail = result.exceptionDetails
    const text = (detail.exception && (detail.exception.description || detail.exception.value)) || detail.text || '未知异常'
    fail('页面内脚本执行失败: ' + text)
  }
  return result && result.result ? result.result.value : undefined
}

async function waitForDocumentReady(session, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const state = await evaluate(session, 'document.readyState', 5000)
      if (state === 'complete') return
    } catch (error) {
      if (error && /CDP 连接已关闭/.test(error.message)) throw error
    }
    await sleep(100)
  }
  fail('页面在 ' + timeoutMs + 'ms 内未进入 readyState=complete')
}

async function navigate(session, url, timeoutMs) {
  const loaded = session.waitEvent('Page.loadEventFired', timeoutMs).catch(function () { return null })
  const result = await session.send('Page.navigate', { url: url }, timeoutMs)
  if (result && result.errorText) fail('导航失败: ' + result.errorText + ' (' + url + ')')
  await loaded
  await waitForDocumentReady(session, timeoutMs)
}

async function settlePage(session) {
  try {
    await evaluate(
      session,
      'new Promise(function (resolve) { function done() { requestAnimationFrame(function () { requestAnimationFrame(function () { resolve(true) }) }) } if (document.fonts && document.fonts.ready) { document.fonts.ready.then(done, done) } else { done() } })',
      10000
    )
  } catch (error) {
    /* 字体/动画收敛失败不应阻断截图 */
  }
}

async function captureScreenshot(session, timeoutMs) {
  let lastError = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const shot = await session.send(
        'Page.captureScreenshot',
        { format: 'png', fromSurface: true, captureBeyondViewport: false },
        timeoutMs
      )
      if (shot && shot.data) return shot.data
      lastError = new Error('截图返回为空')
    } catch (error) {
      lastError = error
    }
    await sleep(300)
  }
  throw lastError || new Error('截图失败')
}

function buildInjectExpression(options) {
  const statements = []

  if (options.token) {
    statements.push('localStorage.setItem(' + JSON.stringify(LS_TOKEN) + ', ' + JSON.stringify(options.token) + ')')
    statements.push(
      'localStorage.setItem(' + JSON.stringify(LS_TOKEN_EXPIRES_AT) + ', String(Date.now() + ' + TOKEN_LIFETIME_MS + '))'
    )
  }

  if (options.userJson) {
    statements.push(
      'localStorage.setItem(' + JSON.stringify(LS_USER) + ', ' + JSON.stringify(options.userJson) + ')'
    )
  }

  if (options.theme) {
    statements.push('localStorage.setItem(' + JSON.stringify(LS_THEME) + ', ' + JSON.stringify(options.theme) + ')')
  }

  if (statements.length === 0) return null
  return '(function () { ' + statements.join('; ') + '; return true })()'
}

function buildReadBackExpression() {
  return (
    '(function () { return { ' +
    'token: localStorage.getItem(' + JSON.stringify(LS_TOKEN) + '), ' +
    'user: localStorage.getItem(' + JSON.stringify(LS_USER) + '), ' +
    'theme: localStorage.getItem(' + JSON.stringify(LS_THEME) + '), ' +
    'expiresAt: localStorage.getItem(' + JSON.stringify(LS_TOKEN_EXPIRES_AT) + ')' +
    ' } })()'
  )
}

function killProcessTree(child) {
  if (!child || !child.pid) return
  try {
    spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true })
  } catch (error) {
    /* ignore */
  }
  try {
    child.kill()
  } catch (error) {
    /* ignore */
  }
}

async function waitForExit(child, timeoutMs) {
  if (!child || child.exitCode !== null) return true
  return new Promise(function (resolve) {
    let timer = null
    function finish(value) {
      if (timer) clearTimeout(timer)
      resolve(value)
    }
    child.once('exit', function () { finish(true) })
    timer = setTimeout(function () { finish(false) }, timeoutMs)
  })
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  if (opts.help) {
    console.log(USAGE)
    return 0
  }

  const targetUrl = new URL(opts.url)
  const origin = targetUrl.origin
  const outPath = path.resolve(process.cwd(), opts.out)

  const userJson = opts.user
    ? JSON.stringify(opts.user)
    : opts.token
      ? JSON.stringify(STUB_USER)
      : null

  if (opts.token && !opts.user) {
    console.error(
      '[shot] 提示: 未提供 --user，已注入占位 auth_user（src/stores/auth.ts 的 checkAuth 需要 auth_token 与 auth_user 同时存在才会恢复登录态；真实用户信息随后由 /auth/me 覆盖）'
    )
  }

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-shot-'))
  const port = await getFreePort()
  const startedAt = Date.now()

  let child = null
  let session = null
  let storage = null
  let finalUrl = null
  let layout = null
  let bytes = 0

  try {
    child = launchEdge({ port: port, profileDir: profileDir, width: opts.width, height: opts.height })
    const targetInfo = await waitForDevToolsTarget(port, 30000)
    session = await connectCdp(targetInfo.webSocketDebuggerUrl, 15000)
    await session.send('Page.enable', {}, 10000)
    await session.send('Runtime.enable', {}, 10000)
    await session.send(
      'Emulation.setDeviceMetricsOverride',
      { width: opts.width, height: opts.height, deviceScaleFactor: 1, mobile: false },
      10000
    )

    const injectExpression = buildInjectExpression({ token: opts.token, userJson: userJson, theme: opts.theme })
    if (injectExpression) {
      await navigate(session, origin + '/', 30000)
      await evaluate(session, injectExpression, 10000)
      storage = await evaluate(session, buildReadBackExpression(), 10000)
      if (opts.token && storage && storage.token !== opts.token) {
        fail('localStorage.auth_token 写入校验失败，实际值: ' + String(storage.token))
      }
      if (opts.theme && storage && storage.theme !== opts.theme) {
        fail('localStorage.theme 写入校验失败，实际值: ' + String(storage.theme))
      }
    }

    await navigate(session, opts.url, 30000)
    if (opts.wait > 0) await sleep(opts.wait)
    await settlePage(session)

    finalUrl = await evaluate(session, 'location.href', 10000)
    layout = await evaluate(
      session,
      '(function () { var d = document.documentElement; return { innerWidth: window.innerWidth, innerHeight: window.innerHeight, clientWidth: d.clientWidth, scrollWidth: d.scrollWidth, scrollHeight: d.scrollHeight, devicePixelRatio: window.devicePixelRatio, readyState: document.readyState } })()',
      10000
    )
    const data = await captureScreenshot(session, 60000)
    const buffer = Buffer.from(data, 'base64')
    if (buffer.length < 100) fail('截图内容异常，字节数: ' + buffer.length)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, buffer)
    bytes = buffer.length
  } finally {
    if (session) {
      try {
        await session.send('Browser.close', {}, 3000)
      } catch (error) {
        /* Edge 可能已自行退出 */
      }
      session.close()
    }
    if (child) {
      const exited = await waitForExit(child, 4000)
      if (!exited) {
        killProcessTree(child)
        await waitForExit(child, 2000)
      }
    }
    if (!removeProfileDir(profileDir)) {
      console.error('[shot] 警告: 临时 profile 未完全清理: ' + profileDir)
    }
  }

  const summary = {
    ok: true,
    url: opts.url,
    finalUrl: finalUrl,
    out: outPath,
    width: opts.width,
    height: opts.height,
    theme: opts.theme,
    tokenInjected: Boolean(opts.token),
    userInjected: Boolean(userJson),
    storage: storage,
    layout: layout,
    bytes: bytes,
    elapsedMs: Date.now() - startedAt
  }
  console.log(JSON.stringify(summary, null, 2))
  return 0
}

main().then(
  function (code) {
    process.exitCode = code || 0
  },
  function (error) {
    console.error('[shot] 失败: ' + (error && error.stack ? error.stack : error))
    process.exitCode = 1
  }
)
