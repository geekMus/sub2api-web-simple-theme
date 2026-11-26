import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
const prof = mkdtempSync(path.join(tmpdir(), 'edge-md2-'))
const port = 12040 + Math.floor(Math.random() * 40)
const p = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new','--disable-gpu','--hide-scrollbars','--window-size=1440,900','--remote-debugging-port='+port,'--user-data-dir='+prof,'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
let ws
for (let i=0;i<60;i++){ try { const l = await (await fetch('http://127.0.0.1:'+port+'/json/list')).json(); const pg = l.find(t=>t.type==='page'); if(pg){ws=pg.webSocketDebuggerUrl;break} } catch {} await sleep(200) }
const sock = new WebSocket(ws); let id=0; const pend=new Map()
await new Promise(r=>sock.addEventListener('open',r))
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);sock.send(JSON.stringify({id:i,method,params}))})
sock.addEventListener('message', async e=>{ const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m.result);pend.delete(m.id)} else if(m.method==='Fetch.requestPaused'){
  const mk=(n,pl,i,o)=>({name:n,platform:pl,pricing:null,official_pricing:{input_price:i,output_price:o,cache_write_price:null,cache_read_price:null}})
  const g=(id,name,pl,rate,models)=>({id,name,description:'',platform:pl,subscription_type:'standard',rate_multiplier:rate,peak_rate_enabled:false,peak_start:'',peak_end:'',peak_rate_multiplier:1,is_exclusive:false,image_rate_independent:false,image_rate_multiplier:1,video_rate_independent:false,video_rate_multiplier:1,long_context_pricing_enabled:false,models})
  const body={code:0,message:'success',data:{description:'',groups:[
    g(1,'Claude','anthropic',0.8,[mk('claude-opus-4-5','anthropic',0.000015,0.000075),mk('claude-sonnet-4-5','anthropic',0.000003,0.000015),mk('claude-haiku-4-5','anthropic',0.000001,0.000005)]),
    g(2,'OpenAI','openai',0.9,[mk('gpt-5.2','openai',0.0000025,0.00001),mk('gpt-5-mini','openai',0.0000005,0.000002),mk('o4-mini','openai',0.0000011,0.0000044)]),
    g(3,'Gemini','gemini',0.7,[mk('gemini-3-pro','gemini',0.000002,0.000012),mk('gemini-2.5-flash','gemini',0.0000003,0.0000025),mk('gemini-2.5-pro','gemini',0.00000125,0.00001)]),
    g(4,'DeepSeek','deepseek',0.5,[mk('deepseek-v3.2','deepseek',0.00000027,0.0000011),mk('qwen3-max','qwen',0.0000012,0.000006),mk('glm-4.6','glm',0.0000006,0.0000022)]),
  ]}}
  await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(body)).toString('base64')})
}})
await send('Page.enable'); await send('Runtime.enable')
await send('Fetch.enable',{patterns:[{urlPattern:'*model-plaza*',requestStage:'Request'}]})
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false})
await send('Page.navigate',{url:'http://localhost:3000/home'}); await sleep(6000)
const ev=(expr)=>send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})
mkdirSync('.tmp-shots/v64',{recursive:true})
for (const [sel,name] of [['.models','models'],['.cta','cta']]) {
  await ev(`(()=>{const el=document.querySelector('${sel}');if(!el)return 'none';const y=el.getBoundingClientRect().top+scrollY-90;scrollTo(0,y);return 'ok'})()`)
  await sleep(900)
  const s = await send('Page.captureScreenshot',{format:'png'})
  writeFileSync('.tmp-shots/v64/' + name + '.png', Buffer.from(s.data,'base64'))
}
const t = await ev("document.querySelector('.models')?.innerText?.slice(0,80)")
console.log(JSON.stringify(t.result?.value))
sock.close(); p.kill(); process.exit(0)
