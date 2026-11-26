import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
const ROUTES = (process.argv[2] || '').split(',').filter(Boolean)
const WIDTH = Number(process.argv[3] || 1440), HEIGHT = Number(process.argv[4] || 900)
const prof = mkdtempSync(path.join(tmpdir(), 'edge-sweep-'))
const port = 12400 + Math.floor(Math.random() * 60)
const p = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new','--disable-gpu','--hide-scrollbars','--window-size='+WIDTH+','+HEIGHT,'--remote-debugging-port='+port,'--user-data-dir='+prof,'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
let ws
for (let i=0;i<80;i++){ try { const l = await (await fetch('http://127.0.0.1:'+port+'/json/list')).json(); const pg = l.find(t=>t.type==='page'); if(pg){ws=pg.webSocketDebuggerUrl;break} } catch {} await sleep(200) }
const sock = new WebSocket(ws); let id=0; const pend=new Map(); const errs=[]
await new Promise(r=>sock.addEventListener('open',r))
sock.addEventListener('message', e=>{ const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id)} else if(m.method==='Runtime.exceptionThrown'){errs.push(String(m.params.exceptionDetails?.exception?.description||'').slice(0,140))} })
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);sock.send(JSON.stringify({id:i,method,params}))})
const ev=(expr)=>send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})
await send('Page.enable'); await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride',{width:WIDTH,height:HEIGHT,deviceScaleFactor:1,mobile:WIDTH<600})
let sess=null; try { sess = JSON.parse(readFileSync('.tmp-shots/session.json','utf8')) } catch {}
await send('Page.navigate',{url:'http://localhost:3000/'}); await sleep(1000)
await ev("localStorage.setItem('theme','dark');1")
if (sess) await ev("localStorage.setItem('auth_token'," + JSON.stringify(sess.token) + ");localStorage.setItem('auth_user',JSON.stringify(" + JSON.stringify(sess.user) + "));localStorage.setItem('token_expires_at',String(Date.now()+86400000));1")
const out=[]
for (const route of ROUTES) {
  errs.length=0
  await send('Page.navigate',{url:'http://localhost:3000'+route}); await sleep(2600)
  const m = await ev("(()=>{const d=document.documentElement;const t=document.body.innerText.trim();return JSON.stringify({ovf:d.scrollWidth>innerWidth+2,sw:d.scrollWidth,iw:innerWidth,len:t.length,head:t.slice(0,60).replace(/\s+/g,' ')})})()")
  const name = route.replace(/\//g,'_').replace(/^_/,'') || 'root'
  const s = await send('Page.captureScreenshot',{format:'png'})
  mkdirSync('.tmp-shots/sweep',{recursive:true})
  writeFileSync('.tmp-shots/sweep/' + WIDTH + name + '.png', Buffer.from(s.data,'base64'))
  out.push(route + ' ' + m.result?.value + (errs.length?(' ERR:'+errs[0]):''))
}
console.log(out.join('\n'))
sock.close(); p.kill(); process.exit(0)
