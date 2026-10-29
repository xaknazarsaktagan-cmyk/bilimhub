import {tr} from './i18n.js';
const root=document.querySelector('.hero-stories');
if(root){
 const slides=[...root.querySelectorAll('.hero-story')];
 const dots=[...root.querySelectorAll('[data-story-index]')];
 const pause=root.querySelector('.story-pause');
 let index=0,timer,paused=false,visible=true,disposed=false;
 function schedule(){clearTimeout(timer);if(!disposed&&!paused&&visible&&!document.hidden)timer=setTimeout(()=>show((index+1)%slides.length),4000);}
 function show(next){index=next;slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===index);slide.setAttribute('aria-hidden',String(i!==index));});dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));schedule();}
 function label(){pause.setAttribute('aria-pressed',String(paused));pause.setAttribute('aria-label',tr(paused?'Продолжить смену текста':'Приостановить смену текста'));}
 pause.addEventListener('click',()=>{paused=!paused;label();schedule();});
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();});observer.observe(root);
 document.addEventListener('visibilitychange',schedule);
 const languageChange=()=>queueMicrotask(label);
 document.addEventListener('bilim:language',languageChange);
 window.addEventListener('pagehide',e=>{clearTimeout(timer);if(e.persisted)return;disposed=true;observer.disconnect();document.removeEventListener('visibilitychange',schedule);document.removeEventListener('bilim:language',languageChange);});
 window.addEventListener('pageshow',()=>schedule());
 label();schedule();
}
