(()=>{'use strict';
const $=id=>document.getElementById(id),player=$('player'),area=$('gameArea'),toast=$('actionToast'),log=$('eventLog'),receivedEl=$('receivedCount'),executedEl=$('executedCount');
let x=50,received=0,executed=0,jumpLock=false,jumpTimer=null;
function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function now(){const d=new Date();return d.toLocaleTimeString('pt-BR',{hour12:false})+'.'+String(d.getMilliseconds()).padStart(3,'0')}
function addLog(action,source='local',meta={}){if(log?.querySelector('.empty'))log.innerHTML='';const row=document.createElement('div');row.className='event-row';const trace=meta.traceId||meta.commandId||meta.eventId||'-';row.innerHTML=`<b>${action}</b><span>${source}</span><small>${now()} · ${trace}</small>`;log?.prepend(row);while(log&&log.children.length>30)log.lastElementChild.remove()}
function setToast(text){if(toast)toast.textContent=text}
function setX(next){x=clamp(next,8,92);if(player)player.style.left=x+'%'}
async function execute(action,meta={}){
  const source=meta.source||'local';
  if(source==='live'){received++;if(receivedEl)receivedEl.textContent=String(received)}
  let ok=true;
  switch(String(action||'')){
    case 'walk_left': player?.classList.add('walking');setX(x-10);setTimeout(()=>player?.classList.remove('walking'),220);break;
    case 'walk_right': player?.classList.add('walking');setX(x+10);setTimeout(()=>player?.classList.remove('walking'),220);break;
    case 'jump':
      if(jumpTimer){clearTimeout(jumpTimer);jumpTimer=null}
      jumpLock=true;player?.classList.remove('jumping');void player?.offsetWidth;player?.classList.add('jumping');jumpTimer=setTimeout(()=>{player?.classList.remove('jumping');jumpLock=false;jumpTimer=null},560);break;
    case 'stop': if(jumpTimer){clearTimeout(jumpTimer);jumpTimer=null}player?.classList.remove('walking','jumping');jumpLock=false;break;
    default: ok=false;
  }
  addLog(action,source,meta);
  if(ok){setToast(`${source==='live'?'Live+':'Local'}: ${action}`);if(source==='live'){executed++;if(executedEl)executedEl.textContent=String(executed)}}else setToast(`Comando não executado: ${action}`);
  window.dispatchEvent(new CustomEvent('liveplus-test:execution',{detail:{action,ok,source,traceId:meta.traceId||meta.commandId||meta.eventId||'',at:Date.now()}}));
  return ok;
}
document.querySelectorAll('[data-action]').forEach(btn=>btn.addEventListener('click',()=>execute(btn.dataset.action,{source:'local'})));
$('clearLog')?.addEventListener('click',()=>{if(log)log.innerHTML='<div class="empty">Nenhum comando recebido.</div>'});
window.addEventListener('resize',()=>setX(x));
window.LivePlusTestGame={execute,getState:()=>({x,received,executed,jumping:jumpLock}),actions:[
  {id:'walk_left',label:'Andar para esquerda',description:'Move o boneco para a esquerda'},
  {id:'walk_right',label:'Andar para direita',description:'Move o boneco para a direita'},
  {id:'jump',label:'Pular',description:'Faz o boneco pular'},
  {id:'stop',label:'Parar',description:'Interrompe o movimento visual'}
]};
})();