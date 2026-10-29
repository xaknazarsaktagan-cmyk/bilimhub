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
  dialog.showModal();document.documentElement.classList.add('auth-is-open');
  if(!reduced.matches)animation=shell.animate([{opacity:0,transform:'perspective(1100px) rotateX(34deg) translateY(38px) scale(.9)',filter:'blur(6px)'},{opacity:1,transform:'perspective(1100px) rotateX(0) translateY(0) scale(1)',filter:'blur(0)'}],{duration:720,easing:'cubic-bezier(.16,1,.3,1)'});
 }
 async function close(){
  if(!dialog.open||closing)return;closing=true;animation?.cancel();
  if(!reduced.matches){animation=shell.animate([{opacity:1,transform:'perspective(1100px) rotateX(0) scale(1)'},{opacity:0,transform:'perspective(1100px) rotateX(16deg) translateY(20px) scale(.96)'}],{duration:260,easing:'ease-in',fill:'forwards'});try{await animation.finished;}catch{}}
  dialog.close();animation?.cancel();closing=false;
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
