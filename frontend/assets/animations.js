const header=document.querySelector('.site-header');
const motion=matchMedia('(prefers-reduced-motion:reduce)');
function headerScroll(){header.classList.toggle('scrolled',scrollY>20);}window.addEventListener('scroll',headerScroll,{passive:true});headerScroll();
let animationContext;let ownedTriggers=[];
function animate(){
 ownedTriggers.forEach(t=>t.kill());ownedTriggers=[];animationContext?.revert();
 const {gsap,ScrollTrigger}=window;
 if(!gsap||!ScrollTrigger||motion.matches)return;
 gsap.registerPlugin(ScrollTrigger);
 animationContext=gsap.context(()=>{
  gsap.from('.hero-copy > *',{y:20,opacity:0,duration:.8,stagger:.08,ease:'power2.out',clearProps:'transform,opacity'});
  document.querySelectorAll('.reveal').forEach(el=>gsap.from(el,{y:30,opacity:0,duration:.8,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 94%',once:true},clearProps:'transform,opacity'}));
  gsap.to('.hero-copy',{y:-45,opacity:.3,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom 25%',scrub:1}});
  gsap.fromTo('.preview-panel',{y:30,rotateX:5},{y:-12,rotateX:0,ease:'none',scrollTrigger:{trigger:'.platform-stage',start:'top bottom',end:'bottom top',scrub:1}});
  gsap.to('.achievement',{y:-32,ease:'none',scrollTrigger:{trigger:'.platform-stage',start:'top bottom',end:'bottom top',scrub:1}});
  gsap.to('.assignment',{y:24,ease:'none',scrollTrigger:{trigger:'.platform-stage',start:'top bottom',end:'bottom top',scrub:1}});
  ScrollTrigger.create({trigger:'.hero',start:'top top',end:'bottom top',onUpdate:self=>document.dispatchEvent(new CustomEvent('bilim:scene-scroll',{detail:self.progress}))});
 });
 ownedTriggers=ScrollTrigger.getAll();
}
// Defer scripts finish before load; if a vendor fails, all HTML remains usable.
if(document.readyState==='complete')animate();else window.addEventListener('load',animate,{once:true});
motion.addEventListener('change',animate);
const canHover=matchMedia('(hover:hover) and (pointer:fine)');
for(const card of document.querySelectorAll('.path-card')){
 card.addEventListener('pointermove',e=>{if(motion.matches||!canHover.matches)return;const b=card.getBoundingClientRect();card.querySelector('.path-art').style.transform=`perspective(1000px) rotateX(${-(e.clientY-b.top-b.height/2)/b.height*5}deg) rotateY(${(e.clientX-b.left-b.width/2)/b.width*5}deg)`;});
 card.addEventListener('pointerleave',()=>card.querySelector('.path-art').style.removeProperty('transform'));
}
window.addEventListener('pagehide',event=>{if(event.persisted)return;ownedTriggers.forEach(t=>t.kill());animationContext?.revert();window.removeEventListener('scroll',headerScroll);motion.removeEventListener('change',animate);});
