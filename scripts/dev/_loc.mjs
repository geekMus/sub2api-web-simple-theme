import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
const prof = mkdtempSync(path.join(tmpdir(), 'edge-loc-'))
const port = 10420 + Math.floor(Math.random() * 40)
const p = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new','--disable-gpu','--window-size=1440,900','--remote-debugging-port='+port,'--user-data-dir='+prof,'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
let ws
for (let i=0;i<60;i++){ try { const l = await (await fetch('http://127.0.0.1:'+port+'/json/list')).json(); const pg = l.find(t=>t.type==='page'); if(pg){ws=pg.webSocketDebuggerUrl;break} } catch {} await sleep(200) }
const sock = new WebSocket(ws); let id=0; const pend=new Map()
await new Promise(r=>sock.addEventListener('open',r))
sock.addEventListener('message', e=>{ const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id)} })
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);sock.send(JSON.stringify({id:i,method,params}))})
const evalx=(expr)=>send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})
await send('Page.enable'); await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
await send('Page.navigate',{url:'http://localhost:3000/home'})
await sleep(3500)
await evalx("window.__marker='kept'; localStorage.setItem('locale','zh'); 1")
await send('Page.navigate',{url:'http://localhost:3000/home'}); await sleep(2500)
await evalx("window.__marker='kept'; 1")
const before = await evalx("document.querySelector('.nv__login,.st-btn--primary')?.textContent?.trim() + '|' + document.documentElement.lang + '|' + (window.__marker||'') ")
await evalx("document.querySelector('.ls__btn').dispatchEvent(new MouseEvent('click',{bubbles:true})); 1")
await sleep(300)
await evalx("(()=>{const items=[...document.querySelectorAll('.ls__item')];const en=items.find(i=>/English/.test(i.textContent));if(en){en.dispatchEvent(new MouseEvent('click',{bubbles:true}));return 'clicked-en'}return 'no-item'})()")
await sleep(1200)
const after = await evalx("document.querySelector('.nv__login,.st-btn--primary')?.textContent?.trim() + '|' + document.documentElement.lang + '|' + (window.__marker||'missing') + '|' + (localStorage.getItem('locale')||'') ")
const navCount = await evalx("performance.getEntriesByType('navigation').length")
console.log(JSON.stringify({before:before.result?.value, after:after.result?.value, navigations:navCount.result?.value}))
sock.close(); p.kill(); process.exit(0)
