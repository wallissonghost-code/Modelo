(()=>{'use strict';
const $=id=>document.getElementById(id),player=$('player'),toast=$('actionToast'),log=$('eventLog'),receivedEl=$('receivedCount'),executedEl=$('executedCount');
let x=50,received=0,executed=0,jumpLock=false,jumpTimer=null,bridgeClaimed=false;
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function now(){const d=new Date();return d.toLocaleTimeString('pt-BR',{hour12:false})+'.'+String(d.getMilliseconds()).padStart(3,'0')}
function viewerOf(meta={}){const raw=String(meta?.event?.user||meta?.payload?.event?.user||meta?.user||'').trim().replace(/^@/,'');return raw&&raw!=='viewer'?`@${raw}`:''}
function addLog(action,source='local',meta={}){if(log?.querySelector('.empty'))log.innerHTML='';const row=document.createElement('div');row.className='event-row';const trace=meta.traceId||meta.commandId||meta.eventId||'-',viewer=viewerOf(meta);const title=document.createElement('b'),sourceEl=document.createElement('span'),detail=document.createElement('small');title.textContent=viewer?`${viewer} → ${action}`:action;sourceEl.textContent=source;detail.textContent=`${now()} · ${trace}`;row.append(title,sourceEl,detail);log?.prepend(row);while(log&&log.children.length>30)log.lastElementChild.remove()}
function setToast(text){if(toast)toast.textContent=text}
function setX(next){x=clamp(next,8,92);if(player)player.style.left=x+'%'}
function applyAction(action){
  switch(action){
    case 'walk_left': player?.classList.add('walking');setX(x-10);setTimeout(()=>player?.classList.remove('walking'),220);return true;
    case 'walk_right': player?.classList.add('walking');setX(x+10);setTimeout(()=>player?.classList.remove('walking'),220);return true;
    case 'jump': if(jumpTimer){clearTimeout(jumpTimer);jumpTimer=null}jumpLock=true;player?.classList.remove('jumping');void player?.offsetWidth;player?.classList.add('jumping');jumpTimer=setTimeout(()=>{player?.classList.remove('jumping');jumpLock=false;jumpTimer=null},560);return true;
    case 'stop': if(jumpTimer){clearTimeout(jumpTimer);jumpTimer=null}player?.classList.remove('walking','jumping');jumpLock=false;return true;
    default:return false;
  }
}
async function executeRemote(action,meta={}){
  const normalized=String(action||'');
  received++;if(receivedEl)receivedEl.textContent=String(received);
  const ok=applyAction(normalized),viewer=viewerOf(meta);
  addLog(normalized,'live',meta);
  if(ok){setToast(`${viewer?viewer+' · ':''}Live+: ${normalized}`);executed++;if(executedEl)executedEl.textContent=String(executed)}else setToast(`Comando não executado: ${normalized}`);
  window.dispatchEvent(new CustomEvent('liveplus-test:execution',{detail:{action:normalized,ok,source:'live',user:viewer,traceId:meta.traceId||meta.commandId||meta.eventId||'',at:Date.now()}}));
  return ok;
}
const actions=Object.freeze([
  Object.freeze({id:'walk_left',label:'Andar para esquerda',description:'Move o boneco para a esquerda'}),
  Object.freeze({id:'walk_right',label:'Andar para direita',description:'Move o boneco para a direita'}),
  Object.freeze({id:'jump',label:'Pular',description:'Faz o boneco pular'}),
  Object.freeze({id:'stop',label:'Parar',description:'Interrompe o movimento visual'})
]);
function claimExecutor(){if(bridgeClaimed)return null;bridgeClaimed=true;return Object.freeze({execute:executeRemote})}
// Controles locais usam ações capturadas no bind. Nunca leem data-action em tempo de clique.
// Assim, adulterar dataset pelo DevTools não transforma um botão em roteador de comandos.
const localBindings=Object.freeze([
  ['walk_left','walk_left'],['jump','jump'],['walk_right','walk_right'],['stop','stop']
]);
for(const [selectorAction,fixedAction] of localBindings){
  const btn=document.querySelector(`[data-action="${selectorAction}"]`);
  btn?.addEventListener('click',()=>{
    const ok=applyAction(fixedAction);
    setToast(ok?`Local: ${fixedAction}`:`Comando local não executado: ${fixedAction}`);
  });
}
$('clearLog')?.addEventListener('click',()=>{if(log)log.innerHTML='<div class="empty">Nenhum comando recebido.</div>'});
window.addEventListener('resize',()=>setX(x));
const api={getState:()=>({x,received,executed,jumping:jumpLock}),actions};
Object.defineProperty(api,'claimExecutor',{value:claimExecutor,writable:false,configurable:false,enumerable:false});
Object.freeze(api);
Object.defineProperty(window,'LivePlusTestGame',{value:api,writable:false,configurable:false,enumerable:true});
})();