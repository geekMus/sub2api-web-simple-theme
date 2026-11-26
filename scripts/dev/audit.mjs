import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const routes = (process.argv[2] || '').split(',').filter(Boolean)
const authed = process.argv[3] !== 'public'
const prof = mkdtempSync(path.join(tmpdir(), 'edge-audit-'))
const port = 9700 + Math.floor(Math.random() * 120)
const p = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + port, '--user-data-dir=' + prof, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
for (let i = 0; i < 60; i++) {
  try {
    const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()
    const pg = list.find((t) => t.type === 'page')
    if (pg) { ws = pg.webSocketDebuggerUrl; break }
  } catch {}
  await sleep(200)
}
const sock = new WebSocket(ws)
let id = 0
const pend = new Map()
let logs = []
await new Promise((r) => sock.addEventListener('open', r))
sock.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) }
  else if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
    logs.push('[' + m.params.type + '] ' + (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 260))
  } else if (m.method === 'Runtime.exceptionThrown') {
    logs.push('EXC: ' + String(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || '').slice(0, 300))
  }
})
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })) })
await send('Page.enable')
await send('Runtime.enable')
if (authed) {
  const s = JSON.parse(readFileSync('.tmp-shots/session.json', 'utf8'))
  await send('Page.navigate', { url: 'http://localhost:3000/' })
  await sleep(1400)
  const inject = "localStorage.setItem('auth_token'," + JSON.stringify(s.token) + ");localStorage.setItem('auth_user',JSON.stringify(" + JSON.stringify(s.user) + "));localStorage.setItem('token_expires_at',String(Date.now()+86400000));localStorage.setItem('theme','dark');'ok'"
  await send('Runtime.evaluate', { expression: inject })
}
const report = []
for (const route of routes) {
  logs = []
  await send('Page.navigate', { url: 'http://localhost:3000' + route })
  await sleep(3000)
  const dom = await send('Runtime.evaluate', { expression: 'document.body.innerText.trim().length', returnByValue: true })
  report.push({ route, textLen: dom.result?.value ?? 0, errors: logs.slice(0, 6) })
}
console.log(JSON.stringify(report, null, 1))
sock.close()
p.kill()
process.exit(0)
