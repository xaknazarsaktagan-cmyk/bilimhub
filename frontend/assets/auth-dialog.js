import {tr} from './i18n.js';
const dialog=document.getElementById('auth-dialog');
if(dialog){
 const shell=dialog.querySelector('.auth-dialog-shell');
 const closeButton=dialog.querySelector('.auth-dialog-close');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let opener,animation,closing=false;
 function labels(){dialog.setAttribute('aria-label',tr('Вход и регистрация'));closeButton.setAttribute('aria-label',tr('На главную'));}
 function open(link){
  if(dialog.open)return;
  opener=link;closing=false;animation?.cancel();
  dialog.classList.remove('is-closing');dialog.showModal();document.documentElement.classList.add('auth-is-open');
  if(!reduced.matches)animation=shell.animate([{opacity:0,transform:'translateY(18px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:560,easing:'cubic-bezier(.22,1,.36,1)'});
 }
 async function close(){
  if(!dialog.open||closing)return;closing=true;const current=getComputedStyle(shell);const start={opacity:current.opacity,transform:current.transform};animation?.cancel();dialog.classList.add('is-closing');
  if(!reduced.matches){animation=shell.animate([start,{opacity:0,transform:'translateY(10px) scale(.98)'}],{duration:220,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});try{await animation.finished;}catch{}}
  dialog.close();animation?.cancel();dialog.classList.remove('is-closing');closing=false;
 }
 // Capture prevents anchor scrolling; the existing login.js still selects the mode.
 document.addEventListener('click',event=>{const link=event.target.closest('[data-auth]');if(!link)return;event.preventDefault();open(link);},true);
 closeButton.addEventListener('click',close);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 let pressedBackdrop=false;
 dialog.addEventListener('pointerdown',event=>{pressedBackdrop=event.target===dialog;});
 dialog.addEventListener('click',event=>{if(pressedBackdrop&&event.target===dialog)close();pressedBackdrop=false;});
 dialog.addEventListener('close',()=>{document.documentElement.classList.remove('auth-is-open');opener?.focus({preventScroll:true});});
 document.addEventListener('bilim:language',labels);
 window.addEventListener('pagehide',()=>{animation?.cancel();});
 labels();
}
