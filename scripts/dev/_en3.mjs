import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
const prof = mkdtempSync(path.join(tmpdir(), 'edge-en3-'))
const port = 10620 + Math.floor(Math.random() * 40)
const p = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new','--disable-gpu','--hide-scrollbars','--window-size=1440,900','--remote-debugging-port='+port,'--user-data-dir='+prof,'about:blank'], { stdio: 'ignore' })
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
const sess = JSON.parse(require('node:fs').readFileSync('.tmp-shots/session.json','utf8'))
await send('Page.navigate',{url:'http://localhost:3000/'}); await sleep(1500)
const inject = "localStorage.setItem('theme','dark');localStorage.setItem('auth_token'," + JSON.stringify(sess.token) + ");localStorage.setItem('auth_user',JSON.stringify(" + JSON.stringify(sess.user) + "));localStorage.setItem('token_expires_at',String(Date.now()+86400000));1"
await evalx(inject)
await send('Page.navigate',{url:'http://localhost:3000/dashboard'}); await sleep(3200)
await evalx("document.querySelector('.ls__btn')?.dispatchEvent(new MouseEvent('click',{bubbles:true})); 1")
await sleep(300)
await evalx("(()=>{const it=[...document.querySelectorAll('.ls__item')].find(i=>/English/.test(i.textContent));if(it){it.dispatchEvent(new MouseEvent('click',{bubbles:true}));return 1}return 0})()")
await sleep(1500)
const shot = await send('Page.captureScreenshot',{format:'png'})
mkdirSync('.tmp-shots/v34',{recursive:true})
writeFileSync('.tmp-shots/v34/dash-en.png', Buffer.from(shot.data,'base64'))
const txt = await evalx("document.body.innerText.slice(0,120)")
console.log(JSON.stringify(txt.result?.value))
sock.close(); p.kill(); process.exit(0)
