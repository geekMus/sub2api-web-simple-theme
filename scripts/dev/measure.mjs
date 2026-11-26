import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
const prof = mkdtempSync(path.join(tmpdir(), 'edge-m-'))
const port = 9930 + Math.floor(Math.random() * 50)
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
await sleep(3500)
const r = await send('Runtime.evaluate',{expression:`(()=>{const b=document.querySelector('.band');const i=document.querySelector('.band__in');const m=document.querySelector('.band__mq');const t=document.querySelector('.st-marquee__track');const g=(e)=>e?{h:Math.round(e.getBoundingClientRect().height),cs:getComputedStyle(e).height,pb:getComputedStyle(e).paddingBottom,pt:getComputedStyle(e).paddingTop,disp:getComputedStyle(e).display,ai:getComputedStyle(e).alignItems}:null;return JSON.stringify({band:g(b),in:g(i),mq:g(m),track:g(t)})})()`,returnByValue:true})
console.log(r.result?.value || 'null')
sock.close(); p.kill(); process.exit(0)
