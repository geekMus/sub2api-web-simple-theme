import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
const prof = mkdtempSync(path.join(tmpdir(), 'edge-m2-'))
const port = 9990 + Math.floor(Math.random() * 40)
const p = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new','--disable-gpu','--remote-debugging-port='+port,'--user-data-dir='+prof,'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
let ws
for (let i=0;i<60;i++){ try { const l = await (await fetch('http://127.0.0.1:'+port+'/json/list')).json(); const pg = l.find(t=>t.type==='page'); if(pg){ws=pg.webSocketDebuggerUrl;break} } catch {} await sleep(200) }
const sock = new WebSocket(ws); let id=0; const pend=new Map()
await new Promise(r=>sock.addEventListener('open',r))
sock.addEventListener('message', e=>{ const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id)} })
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);sock.send(JSON.stringify({id:i,method,params}))})
await send('Page.enable')
await send('Page.navigate',{url:'http://localhost:3000/home'})
await sleep(4000)
const expr = `(()=>{const shots=[...document.querySelectorAll('.feat__shot')];const feats=[...document.querySelectorAll('.feat')];return JSON.stringify({featW:feats.map(f=>Math.round(f.getBoundingClientRect().width)),shotW:shots.map(s=>Math.round(s.getBoundingClientRect().width)),shotChildW:shots.map(s=>s.firstElementChild?Math.round(s.firstElementChild.getBoundingClientRect().width):0)})})()`
const r = await send('Runtime.evaluate',{expression:expr,returnByValue:true})
console.log(r.result?.value||'null')
sock.close(); p.kill(); process.exit(0)
