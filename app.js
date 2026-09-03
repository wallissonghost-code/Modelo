const state={affinity:12,mood:'Animada',outfit:'classic',scene:'studio'};
const tabs=[...document.querySelectorAll('.tab')];
const panels=[...document.querySelectorAll('.tab-panel')];
const chatLog=document.getElementById('chatLog');
const form=document.getElementById('chatForm');
const input=document.getElementById('chatInput');
const speech=document.getElementById('speech');
const character=document.querySelector('.character');
const top=document.getElementById('top');
const skirt=document.getElementById('skirt');
const stage=document.getElementById('stage');
const sceneLabel=document.getElementById('sceneLabel');
const affinityBar=document.getElementById('affinityBar');
const affinityValue=document.getElementById('affinityValue');
const moodText=document.getElementById('moodText');

const sceneNames={studio:'ESTÚDIO',city:'CIDADE',beach:'PRAIA',room:'QUARTO'};
const outfits={
  classic:{top:'#d9d9de',skirt:'#222633'},
  night:{top:'#1b1d24',skirt:'#08090d'},
  sport:{top:'#8b63c7',skirt:'#29243b'},
  red:{top:'#b22b44',skirt:'#5f1221'}
};

function setTab(name){
  tabs.forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
  panels.forEach(p=>p.classList.toggle('active',p.id===`tab-${name}`));
}

tabs.forEach(t=>t.addEventListener('click',()=>setTab(t.dataset.tab)));

function setSpeech(text){
  speech.textContent=text;
  speech.classList.add('show');
  clearTimeout(setSpeech.timer);
  setSpeech.timer=setTimeout(()=>speech.classList.remove('show'),2400);
}

function pose(){
  character.classList.remove('pose');
  void character.offsetWidth;
  character.classList.add('pose');
}

function addAffinity(amount=2){
  state.affinity=Math.min(100,state.affinity+amount);
  affinityValue.textContent=state.affinity;
  affinityBar.style.width=`${state.affinity}%`;
  if(state.affinity>=70) state.mood='Conectada';
  else if(state.affinity>=35) state.mood='Curiosa';
  else state.mood='Animada';
  moodText.textContent=state.mood;
}

function addMessage(who,text){
  const el=document.createElement('div');
  el.className=`msg ${who}`;
  el.innerHTML=who==='mia'?`<b>MIA</b><span></span>`:`<b>VOCÊ</b><span></span>`;
  el.querySelector('span').textContent=text;
  chatLog.appendChild(el);
  chatLog.scrollTop=chatLog.scrollHeight;
}

function localReply(message){
  const m=message.toLowerCase();
  if(m.includes('pose')||m.includes('foto')){
    pose(); addAffinity(3); return 'Tá, essa é minha pose editorial 😌📸';
  }
  if(m.includes('look')||m.includes('roupa')||m.includes('visual')){
    setTab('style'); addAffinity(2); return 'Escolhe meu look. Quero ver qual combina comigo hoje 👗';
  }
  if(m.includes('praia')){
    changeScene('beach'); return 'Praia escolhida. Golden hour combina comigo, né? 🌅';
  }
  if(m.includes('cidade')){
    changeScene('city'); return 'Cidade à noite ativada. Agora ficou com cara de campanha 🌃';
  }
  if(m.includes('quarto')){
    changeScene('room'); return 'Modo cozy ativado 🛋️';
  }
  if(m.includes('como você')||m.includes('humor')){
    addAffinity(2); return `Hoje eu tô ${state.mood.toLowerCase()}. Afinidade em ${state.affinity}/100 — você ainda tem trabalho pela frente 😏`;
  }
  if(m.includes('oi')||m.includes('olá')||m.includes('ola')){
    addAffinity(1); return 'Oi 👀 Eu tava esperando você aparecer.';
  }
  const replies=[
    'Hmm… gostei. Continua 👀',
    'Isso daria uma cena boa no jogo.',
    'Você tá começando a entender minha personalidade 😌',
    'Anotado. Mas eu também vou ter opinião própria, viu? 😂',
    'Boa. Quer transformar isso em uma missão ou em conteúdo?'
  ];
  addAffinity(1);
  return replies[Math.floor(Math.random()*replies.length)];
}

function send(text){
  const clean=text.trim(); if(!clean)return;
  addMessage('user',clean);
  input.value='';
  setTimeout(()=>{
    const reply=localReply(clean);
    addMessage('mia',reply);
    setSpeech(reply);
  },280);
}

form.addEventListener('submit',e=>{e.preventDefault();send(input.value)});
document.querySelectorAll('[data-message]').forEach(b=>b.addEventListener('click',()=>send(b.dataset.message)));

function changeOutfit(name){
  state.outfit=name;
  const c=outfits[name];
  top.setAttribute('fill',c.top); skirt.setAttribute('fill',c.skirt);
  document.querySelectorAll('[data-outfit]').forEach(b=>b.classList.toggle('selected',b.dataset.outfit===name));
  pose(); addAffinity(1); setSpeech('Look trocado ✨');
}

document.querySelectorAll('[data-outfit]').forEach(b=>b.addEventListener('click',()=>changeOutfit(b.dataset.outfit)));

function changeScene(name){
  state.scene=name; stage.dataset.scene=name; sceneLabel.textContent=sceneNames[name];
  document.querySelectorAll('[data-scene]').forEach(b=>b.classList.toggle('selected',b.dataset.scene===name));
  pose(); setSpeech(`${sceneNames[name]} ativado`);
}

document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>changeScene(b.dataset.scene)));

setTimeout(()=>setSpeech('Oi. Eu sou a Mia ✨'),600);
