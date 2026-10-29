import {kk} from './locales.js';
export function language(){return typeof document!=='undefined'&&document.documentElement.lang==='kk'?'kk':'ru';}
export function locale(){return language()==='kk'?'kk-KZ':'ru-RU';}
export function tr(value,lang=language()){
 const text=String(value??''),key=text.trim();
 if(lang==='ru')return key==='Сәлем,'?text.replace(key,'Привет,'):text;
 let translation=Object.hasOwn(kk,key)?kk[key]:key;
 if(translation===key){
  const validation=key.match(/^(.+): допустимо (\d+)–(\d+) символов\.$/);
  if(validation)translation=`${tr(validation[1],'kk')}: ${validation[2]}–${validation[3]} таңба болуы керек.`;
 }
 return text.slice(0,text.indexOf(key))+translation+text.slice(text.indexOf(key)+key.length);
}
// Only static HTML literals use this helper. Fetched content and code are not passed here.
export function markup(html){
 return html.split(/(<[^>]*>)/g).map(part=>part.startsWith('<')?
  part.replace(/(placeholder|title|aria-label)="([^"]*)"/g,(_,name,value)=>`${name}="${translateFragment(value)}"`):translateFragment(part)).join('');
}
function translateFragment(value){return value.replace(/[\p{Script=Cyrillic}][^<>"\r\n]*/gu,part=>tr(part));}
const originalText=new WeakMap(),originalAttributes=new WeakMap();
export function localizeStatic(root){
 if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){
  if(node.parentElement?.closest('script,style,code,pre,textarea'))continue;
  if(!originalText.has(node))originalText.set(node,node.nodeValue);
  node.nodeValue=translateFragment(originalText.get(node));
 }
 for(const el of root.querySelectorAll('[placeholder],[title],[aria-label]')){
  if(!originalAttributes.has(el)){const attrs={};for(const name of ['placeholder','title','aria-label'])if(el.hasAttribute(name))attrs[name]=el.getAttribute(name);originalAttributes.set(el,attrs);}
  for(const [name,value]of Object.entries(originalAttributes.get(el)))el.setAttribute(name,translateFragment(value));
 }
}

export function formatDate(value,full=false,lang=language()){
 const date=new Date(value);if(Number.isNaN(date.getTime()))return '—';
 if(lang==='kk'){
  const months=['қаңтар','ақпан','наурыз','сәуір','мамыр','маусым','шілде','тамыз','қыркүйек','қазан','қараша','желтоқсан'];
  const day=date.getDate(),month=months[date.getMonth()];
  return full?`${day} ${month} ${date.getFullYear()} ж.`:`${day} ${month}, ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
 }
 return full?date.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}):date.toLocaleString('ru-RU',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
}
