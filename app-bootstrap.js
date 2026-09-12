(()=>{'use strict';
const mount=document.getElementById('protectedAppMount');
const template=document.getElementById('protectedAppTemplate');
let started=false;

function loadScript(src){
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=src;
    script.async=false;
    script.onload=()=>resolve();
    script.onerror=()=>reject(new Error(`Falha ao carregar ${src}`));
    document.body.appendChild(script);
  });
}

async function startProtectedApp(){
  if(started||!window.NOT_LICENSE?.authorized||!mount||!template)return;
  started=true;
  mount.replaceChildren(template.content.cloneNode(true));
  try{
    await loadScript('./security-lab.js?v=2');
    await loadScript('./config.js?v=1');
    await loadScript('https://cdn.jsdelivr.net/gh/wallissonghost-code/projeto-daniel@229421e058f09626e95ef4eab1582569a5d6ec1a/sdk/liveplus-game-sdk-v1.js');
    await loadScript('./game.js?v=4');
    await loadScript('./panel-bridge.js?v=7');
  }catch(error){
    console.error('[Modelo] Falha ao iniciar conteúdo protegido.',error);
    mount.replaceChildren();
    started=false;
  }
}

window.addEventListener('not-license-authorized',startProtectedApp);
window.addEventListener('not-license-locked',()=>{
  if(started){
    mount.replaceChildren();
    location.reload();
  }
});

if(window.NOT_LICENSE?.authorized)startProtectedApp();
})();
