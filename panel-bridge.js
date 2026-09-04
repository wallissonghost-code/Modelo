(()=>{'use strict';
const C=window.LIVEPLUS_TEST_CONFIG||{},GAME_ID=C.gameId||'liveplus-test-game',VERSION=C.version||'1.0.0';
let session=null,panelPresent=false,lastSeen=0;
const $=id=>document.getElementById(id),clean=v=>String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8),format=v=>{const c=clean(v);return c.length>4?c.slice(0,4)+'-'+c.slice(4):c};
function traceId(d={}){return String(d.traceId||d.commandId||d.eventId||d.deliveryId||d.id||'').trim()}
function resolveConnection(raw=''){const text=String(raw||'').trim(),sdk=window.LivePlusGameSDK,ticket=sdk?.parseTicket?.(text)||null;if(ticket){sdk.configureRelay?.(ticket.endpoint);return{code:clean(ticket.code),value:text}}const code=clean(text);return{code,value:code}}
function status(text,kind=''){const a=$('panelStatus'),b=$('pairMessage');if(a)a.textContent=text;if(b){b.textContent=text;b.className='pair-message '+kind}}
function updateTransport(){const t=session?.getTransport?.()||'offline';const el=$('transportStatus');if(el)el.textContent=t;return t}
function manifest(){return{protocol:'liveplus-game-manifest-v1',gameId:GAME_ID,name:'Live+ Test Game',icon:'LT',version:VERSION,actions:[...(window.LivePlusTestGame?.actions||[])]}}
function sendState(extra={}){try{session?.sendState?.({scope:'game',gameId:GAME_ID,version:VERSION,panelPresent,transport:updateTransport(),game:window.LivePlusTestGame?.getState?.()||{},...extra})}catch{}}
function ack(phase,data={},extra={}){const id=traceId(data);try{session?.sendState?.({scope:'diagnostic',gameId:GAME_ID,version:VERSION,traceId:id,commandId:String(data.commandId||''),action:String(data.action||data.command||''),phase,at:Date.now(),...extra})}catch{}}
async function onCommand(data={}){
  panelPresent=true;lastSeen=Date.now();status('Conectado','ok');updateTransport();
  const action=String(data.action||data.command||'');
  ack('received',data);
  const started=performance.now();
  let ok=false,error='';
  try{ok=!!(await window.LivePlusTestGame?.execute?.(action,{...data,source:'live',traceId:traceId(data)}))}catch(err){error=String(err?.message||err)}
  ack(ok?'executed':'failed',data,{executionMs:Number((performance.now()-started).toFixed(2)),error});
  sendState({scope:'command',commandStatus:ok?'executed':'unsupported',action,traceId:traceId(data)});
}
async function connect(rawInput){
  if(!window.LivePlusGameSDK?.Session){status('SDK Live+ não carregou','err');return false}
  const input=$('panelCode'),target=resolveConnection(rawInput??input?.value??''),code=target.code;
  if(input)input.value=format(code);
  if(code.length!==8){status('Código inválido','err');return false}
  try{session?.disconnect?.()}catch{}
  panelPresent=false;lastSeen=0;status('Conectando…','warn');
  session=new LivePlusGameSDK.Session({storageKey:C.panelStorageKey||'liveplus-test-session',manifest:manifest()});
  session.addEventListener('connected',e=>{panelPresent=true;lastSeen=Date.now();status('Conectado','ok');updateTransport();sendState({scope:'initial'});setTimeout(()=>$('panelModal')?.classList.remove('show'),250)});
  session.addEventListener('command',e=>onCommand(e.detail||{}));
  session.addEventListener('message',e=>{const d=e.detail||{};panelPresent=true;lastSeen=Date.now();if(d.type!=='panel_heartbeat')sendState({scope:'message'})});
  session.addEventListener('transport',()=>{updateTransport();sendState({scope:'transport'})});
  session.addEventListener('reconnecting',()=>{status('Reconectando…','warn');updateTransport()});
  session.addEventListener('lost',()=>{panelPresent=false;status('Conexão perdida','err');updateTransport()});
  session.addEventListener('rejected',e=>{panelPresent=false;status(e.detail?.reason||'Sessão recusada','err');updateTransport()});
  try{localStorage.setItem(C.panelCodeKey||'liveplus-test-panel-code',format(code))}catch{}
  try{await session.connect(target.value);return true}catch(err){panelPresent=false;status(err?.message||'Falha ao conectar','err');updateTransport();return false}
}
function bind(){
  const modal=$('panelModal'),input=$('panelCode');
  $('panelButton')?.addEventListener('click',()=>modal?.classList.add('show'));
  $('closePanel')?.addEventListener('click',()=>modal?.classList.remove('show'));
  $('connectPanel')?.addEventListener('click',()=>connect());
  if(input){window.LivePlusGameSDK?.installPasteBridge?.(input);try{const saved=clean(localStorage.getItem(C.panelCodeKey||'liveplus-test-panel-code'));if(saved)input.value=format(saved)}catch{}input.addEventListener('input',e=>e.target.value=format(e.target.value));input.addEventListener('keydown',e=>{if(e.key==='Enter')connect()})}
}
bind();setInterval(()=>{updateTransport();if(panelPresent&&lastSeen&&Date.now()-lastSeen>30000&&session?.getTransport?.()==='offline'){panelPresent=false;status('Offline','')};sendState()},1000);
window.addEventListener('pageshow',()=>window.LivePlusGameSDK?.installPasteBridge?.($('panelCode')));
window.LivePlusTestBridge={connect,getSession:()=>session,getTransport:()=>session?.getTransport?.()||'offline',manifest,sendState};
})();