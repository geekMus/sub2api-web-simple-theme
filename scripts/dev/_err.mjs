import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
const prof = mkdtempSync(path.join(tmpdir(), 'edge-err-'))
const port = 10900 + Math.floor(Math.random() * 40)
const p = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new','--disable-gpu','--window-size=1440,900','--remote-debugging-port='+port,'--user-data-dir='+prof,'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
let ws
for (let i=0;i<60;i++){ try { const l = await (await fetch('http://127.0.0.1:'+port+'/json/list')).json(); const pg = l.find(t=>t.type==='page'); if(pg){ws=pg.webSocketDebuggerUrl;break} } catch {} await sleep(200) }
const sock = new WebSocket(ws); let id=0; const pend=new Map(); const errs=[]
await new Promise(r=>sock.addEventListener('open',r))
sock.addEventListener('message', e=>{ const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id)} else if(m.method==='Runtime.exceptionThrown'){errs.push(String(m.params.exceptionDetails?.exception?.description||'').slice(0,300))} else if(m.method==='Runtime.consoleAPICalled'&&(m.params.type==='error'||m.params.type==='warning')){errs.push((m.params.args||[]).map(a=>a.value??a.description??'').join(' ').slice(0,250))} })
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);sock.send(JSON.stringify({id:i,method,params}))})
const evalx=(expr)=>send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})
await send('Page.enable'); await send('Runtime.enable')
await send('Page.navigate',{url:'http://localhost:3000/dashboard'}); await sleep(4000)
const t = await evalx("JSON.stringify({app: !!document.querySelector('#app')?.children.length, text: document.body.innerText.slice(0,60)})")
console.log(t.result?.value)
console.log('errors=' + JSON.stringify(errs.slice(0,4)))
sock.close(); p.kill(); process.exit(0)
