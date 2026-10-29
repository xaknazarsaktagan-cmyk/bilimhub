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
 });
 ownedTriggers=ScrollTrigger.getAll();
}
// Defer scripts finish before load; if a vendor fails, all HTML remains usable.
if(document.readyState==='complete')animate();else window.addEventListener('load',animate,{once:true});
motion.addEventListener('change',animate);
window.addEventListener('pagehide',event=>{if(event.persisted)return;ownedTriggers.forEach(t=>t.kill());animationContext?.revert();window.removeEventListener('scroll',headerScroll);motion.removeEventListener('change',animate);});
