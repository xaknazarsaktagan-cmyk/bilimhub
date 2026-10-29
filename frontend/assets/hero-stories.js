const root=document.querySelector('.hero-stories');
if(root){
 const slides=[...root.querySelectorAll('.hero-story')];
 const dots=[...root.querySelectorAll('[data-story-index]')];
 let index=0,timer,visible=true,disposed=false;
 function schedule(){clearTimeout(timer);if(!disposed&&visible&&!document.hidden)timer=setTimeout(()=>show((index+1)%slides.length),4000);}
 function show(next){index=next;slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===index);slide.setAttribute('aria-hidden',String(i!==index));});dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===index)));schedule();}
 dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();});observer.observe(root);
 document.addEventListener('visibilitychange',schedule);
 window.addEventListener('pagehide',e=>{clearTimeout(timer);if(e.persisted)return;disposed=true;observer.disconnect();document.removeEventListener('visibilitychange',schedule);});
 window.addEventListener('pageshow',()=>schedule());
 schedule();
}
