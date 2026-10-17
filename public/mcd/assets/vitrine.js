'use strict';
function renderDemo(mode) {
 const seq=mode==='alternar'?Array.from({length:20},(_,i)=>i%2?'V':'A'):[...Array(10).fill('A'),...Array(10).fill('V')];
 const el=document.getElementById('demoSequence');el.replaceChildren(...seq.map(color=>{const s=document.createElement('span');s.className=color==='V'?'red':'';s.textContent=color;s.title=color==='V'?'Vermelho':'Azul';return s;}));
 document.getElementById('demoReversals').textContent=mode==='alternar'?'19':'1';
 document.querySelectorAll('[data-sequence]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sequence===mode)));
}
document.querySelectorAll('[data-sequence]').forEach(b=>b.addEventListener('click',()=>renderDemo(b.dataset.sequence)));
renderDemo('blocos');
