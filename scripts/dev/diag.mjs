import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const url = process.argv[2] || 'http://localhost:3000/subscriptions'
const prof = mkdtempSync(path.join(tmpdir(), 'edge-diag-'))
const port = 9850 + Math.floor(Math.random() * 90)
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
const logs = []
await new Promise((r) => sock.addEventListener('open', r))
sock.addEventListener('message', (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) }
  else if (m.method === 'Runtime.consoleAPICalled') {
    logs.push('[' + m.params.type + '] ' + (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 400))
  } else if (m.method === 'Runtime.exceptionThrown') {
    logs.push('EXC: ' + String(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || '').slice(0, 700))
  }
})
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })) })

await send('Page.enable')
await send('Runtime.enable')
const s = JSON.parse(readFileSync('.tmp-shots/session.json', 'utf8'))
await send('Page.navigate', { url: 'http://localhost:3000/' })
await sleep(1500)
const inject = "localStorage.setItem('auth_token'," + JSON.stringify(s.token) + ");localStorage.setItem('auth_user',JSON.stringify(" + JSON.stringify(s.user) + "));localStorage.setItem('token_expires_at',String(Date.now()+86400000));localStorage.setItem('theme','dark');'ok'"
await send('Runtime.evaluate', { expression: inject })
await send('Page.navigate', { url })
await sleep(4500)
const dom = await send('Runtime.evaluate', { expression: 'document.body.innerText.slice(0,300)', returnByValue: true })
const html = await send('Runtime.evaluate', { expression: 'document.querySelector("#app")?.innerHTML.slice(0,500) || "EMPTY"', returnByValue: true })
console.log('--- console ---')
console.log(logs.slice(0, 15).join('\n') || '(none)')
console.log('--- text ---')
console.log(JSON.stringify(dom.result?.value || ''))
console.log('--- app html ---')
console.log(String(html.result?.value || '').slice(0, 500))
sock.close()
p.kill()
process.exit(0)
