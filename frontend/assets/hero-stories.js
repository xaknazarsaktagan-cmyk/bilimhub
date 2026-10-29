import {tr} from './i18n.js';
const root=document.querySelector('.hero-stories');
if(root){
 const slides=[...root.querySelectorAll('.hero-story')];
 const dots=[...root.querySelectorAll('[data-story-index]')];
 const pause=root.querySelector('.story-pause');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let index=0,timer,paused=false,hovered=false,focused=false,visible=true,disposed=false;
 function schedule(){clearTimeout(timer);if(!disposed&&!paused&&!hovered&&!focused&&visible&&!document.hidden&&!reduced.matches)timer=setTimeout(()=>show((index+1)%slides.length),4000);}
 function show(next){index=next;slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===index);slide.setAttribute('aria-hidden',String(i!==index));});dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));schedule();}
 function label(){pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',tr(paused?'Продолжить смену текста':'Приостановить смену текста'));}
 pause.addEventListener('click',()=>{paused=!paused;label();schedule();});
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
 root.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovered=true;schedule();}});
 root.addEventListener('pointerleave',()=>{hovered=false;schedule();});
 root.addEventListener('focusin',()=>{focused=true;schedule();});
 root.addEventListener('focusout',e=>{focused=root.contains(e.relatedTarget);schedule();});
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();});observer.observe(root);
 document.addEventListener('visibilitychange',schedule);
 const languageChange=()=>queueMicrotask(label);
 document.addEventListener('bilim:language',languageChange);
 reduced.addEventListener('change',schedule);
 window.addEventListener('pagehide',e=>{clearTimeout(timer);if(e.persisted)return;disposed=true;observer.disconnect();document.removeEventListener('visibilitychange',schedule);document.removeEventListener('bilim:language',languageChange);reduced.removeEventListener('change',schedule);});
 window.addEventListener('pageshow',()=>schedule());
 label();schedule();
}
