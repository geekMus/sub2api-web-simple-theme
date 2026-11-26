/**
 * 全量验收：所有用户端页面 × 暗/亮 × 桌面/移动
 * 用法: node scripts/dev/verify.mjs "/dashboard,/keys" [--themes=dark,light] [--sizes=1440x900,390x844]
 * 输出: 每页的关键指标 + 截图到 .tmp-shots/verify/
 */
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const routes = (process.argv[2] || '').split(',').filter(Boolean)
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith('--' + name + '='))
  return hit ? hit.split('=')[1] : fallback
}
const themes = arg('themes', 'dark,light').split(',')
const sizes = arg('sizes', '1440x900,390x844').split(',').map((s) => s.split('x').map(Number))
const prefix = arg('prefix', '')

const prof = mkdtempSync(path.join(tmpdir(), 'edge-verify-'))
const port = 12500 + Math.floor(Math.random() * 60)
const p = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new','--disable-gpu','--hide-scrollbars','--remote-debugging-port='+port,'--user-data-dir='+prof,'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let ws
for (let i = 0; i < 80; i++) {
  try { const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json(); const pg = list.find((t) => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break } } catch {}
  await sleep(200)
}
const sock = new WebSocket(ws)
let id = 0
const pend = new Map()
let errs = []
await new Promise((r) => sock.addEventListener('open', r))
sock.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) }
  else if (m.method === 'Runtime.exceptionThrown') { errs.push(String(m.params.exceptionDetails?.exception?.description || '').slice(0, 160)) }
  else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') { errs.push((m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 160)) }
})
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })) })
const ev = (expr) => send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })

await send('Page.enable')
await send('Runtime.enable')

let sess = null
try { sess = JSON.parse(readFileSync('.tmp-shots/session.json', 'utf8')) } catch {}

mkdirSync('.tmp-shots/verify', { recursive: true })
const report = []

for (const theme of themes) {
  for (const [width, height] of sizes) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
    await send('Page.navigate', { url: 'http://localhost:3000/' })
    await sleep(900)
    await ev("localStorage.setItem('theme','" + theme + "');1")
    if (sess) await ev("localStorage.setItem('auth_token'," + JSON.stringify(sess.token) + ");localStorage.setItem('auth_user',JSON.stringify(" + JSON.stringify(sess.user) + "));localStorage.setItem('token_expires_at',String(Date.now()+86400000));1")

    for (const route of routes) {
      errs = []
      await send('Page.navigate', { url: 'http://localhost:3000' + route })
      await sleep(2400)
      const m = await ev("(()=>{const d=document.documentElement;const b=document.body;const t=b.innerText.trim();const hero=b.querySelector('h1')?.innerText||'';return JSON.stringify({ovf:d.scrollWidth>innerWidth+2,sw:d.scrollWidth,iw:innerWidth,len:t.length,title:hero.replace(/\s+/g,' ').slice(0,40)})})()")
      const meta = JSON.parse(m.result?.value || '{}')
      const name = (prefix ? prefix + '-' : '') + theme + '-' + width + '-' + (route.replace(/\//g, '_').replace(/^_/, '') || 'root')
      const shot = await send('Page.captureScreenshot', { format: 'png' })
      writeFileSync('.tmp-shots/verify/' + name + '.png', Buffer.from(shot.data, 'base64'))
      report.push({ route, theme, width, ...meta, errs: errs.slice(0, 2) })
    }
  }
}

const bad = report.filter((r) => r.ovf || (r.errs && r.errs.length))
console.log(JSON.stringify({ total: report.length, bad: bad.length, issues: bad, thin: report.filter((r) => r.len < 120).map((r) => r.route + '@' + r.theme + '/' + r.width) }, null, 1))
sock.close()
p.kill()
process.exit(0)
