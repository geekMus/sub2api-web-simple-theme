import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const ROUTES = (process.argv[2] || '').split(',').filter(Boolean)
const THEMES = ['dark', 'light']
const SIZES = [[1440, 900], [390, 844]]
const AUTHED = process.argv[3] !== 'public'

const prof = mkdtempSync(path.join(tmpdir(), 'edge-sweep-'))
const port = 11600 + Math.floor(Math.random() * 80)
const p = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new','--disable-gpu','--hide-scrollbars','--remote-debugging-port='+port,'--user-data-dir='+prof,'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
let ws
for (let i=0;i<80;i++){ try { const l = await (await fetch('http://127.0.0.1:'+port+'/json/list')).json(); const pg = l.find(t=>t.type==='page'); if(pg){ws=pg.webSocketDebuggerUrl;break} } catch {} await sleep(200) }
const sock = new WebSocket(ws); let id=0; const pend=new Map(); const errs=[]
await new Promise(r=>sock.addEventListener('open',r))
sock.addEventListener('message', e=>{ const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id)} else if(m.method==='Runtime.exceptionThrown'){errs.push(String(m.params.exceptionDetails?.exception?.description||'').slice(0,160))} })
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);sock.send(JSON.stringify({id:i,method,params}))})
const evalx=(expr)=>send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})
await send('Page.enable'); await send('Runtime.enable')

let sess = null
try { sess = JSON.parse(readFileSync('.tmp-shots/session.json','utf8')) } catch {}

const report = []
for (const theme of THEMES) {
  for (const [w,h] of SIZES) {
    await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<600})
    await send('Page.navigate',{url:'http://localhost:3000/'}); await sleep(900)
    await evalx("localStorage.setItem('theme','" + theme + "');1")
    if (AUTHED && sess) {
      await evalx("localStorage.setItem('auth_token'," + JSON.stringify(sess.token) + ");localStorage.setItem('auth_user',JSON.stringify(" + JSON.stringify(sess.user) + "));localStorage.setItem('token_expires_at',String(Date.now()+86400000));1")
    }
    for (const route of ROUTES) {
      errs.length = 0
      await send('Page.navigate',{url:'http://localhost:3000' + route}); await sleep(2600)
      const m = await evalx("JSON.stringify({ovf: document.documentElement.scrollWidth > innerWidth + 2, w: document.documentElement.scrollWidth, iw: innerWidth, text: document.body.innerText.length})")
      const name = (route === '/' ? 'root' : route.replace(/\//g,'_').replace(/^_/,'')) + '-' + theme + '-' + w
      const shot = await send('Page.captureScreenshot',{format:'png'})
      mkdirSync('.tmp-shots/sweep',{recursive:true})
      writeFileSync('.tmp-shots/sweep/' + name + '.png', Buffer.from(shot.data,'base64'))
      report.push({ route, theme, w, ...JSON.parse(m.result?.value || '{}'), errs: errs.slice(0,2) })
    }
  }
}
console.log(JSON.stringify(report, null, 1))
sock.close(); p.kill(); process.exit(0)
