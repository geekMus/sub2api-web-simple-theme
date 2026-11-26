import { spawn } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
const prof = mkdtempSync(path.join(tmpdir(), 'edge-dbg-'))
const port = 10740 + Math.floor(Math.random() * 40)
const p = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new','--disable-gpu','--window-size=1440,900','--remote-debugging-port='+port,'--user-data-dir='+prof,'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
let ws
for (let i=0;i<60;i++){ try { const l = await (await fetch('http://127.0.0.1:'+port+'/json/list')).json(); const pg = l.find(t=>t.type==='page'); if(pg){ws=pg.webSocketDebuggerUrl;break} } catch {} await sleep(200) }
const sock = new WebSocket(ws); let id=0; const pend=new Map(); const errs=[]
await new Promise(r=>sock.addEventListener('open',r))
sock.addEventListener('message', e=>{ const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id)} else if(m.method==='Runtime.exceptionThrown'){errs.push(String(m.params.exceptionDetails?.exception?.description||'').slice(0,180))} else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error'){errs.push((m.params.args||[]).map(a=>a.value??a.description??'').join(' ').slice(0,180))} })
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);sock.send(JSON.stringify({id:i,method,params}))})
const evalx=(expr)=>send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})
await send('Page.enable'); await send('Runtime.enable')
const sess = JSON.parse(readFileSync('.tmp-shots/session.json','utf8'))
await send('Page.navigate',{url:'http://localhost:3000/'}); await sleep(1500)
await evalx("localStorage.setItem('theme','dark');localStorage.setItem('auth_token'," + JSON.stringify(sess.token) + ");localStorage.setItem('auth_user',JSON.stringify(" + JSON.stringify(sess.user) + "));localStorage.setItem('token_expires_at',String(Date.now()+86400000));1")
await send('Page.navigate',{url:'http://localhost:3000/dashboard'}); await sleep(4000)
const s1 = await evalx("JSON.stringify({btn: !!document.querySelector('.ls__btn'), label: document.querySelector('.ls__btn')?.textContent?.trim(), lang: document.documentElement.lang})")
await evalx("document.querySelector('.ls__btn').click(); 1")
await sleep(500)
const s2 = await evalx("JSON.stringify({items: [...document.querySelectorAll('.ls__item')].map(i=>i.textContent.trim())})")
await evalx("(()=>{const it=[...document.querySelectorAll('.ls__item')].find(i=>/English/.test(i.textContent)); if(it){it.click(); return 1} return 0})()")
await sleep(1800)
const s3 = await evalx("JSON.stringify({lang: document.documentElement.lang, label: document.querySelector('.ls__btn')?.textContent?.trim(), h1: document.querySelector('h1')?.innerText?.slice(0,40)})")
console.log('s1=' + s1.result?.value)
console.log('s2=' + s2.result?.value)
console.log('s3=' + s3.result?.value)
console.log('errs=' + JSON.stringify(errs.slice(0,3)))
sock.close(); p.kill(); process.exit(0)
