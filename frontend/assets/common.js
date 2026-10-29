import {tr,markup,locale,formatDate} from './i18n.js';
import {api as backendApi} from './backend.js';
export const $=(s,root=document)=>root.querySelector(s);
export const $$=(s,root=document)=>[...root.querySelectorAll(s)];
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const roles={get student(){return tr("Студент");},get teacher(){return tr("Учитель");},get admin(){return tr("Администратор");}};
export let csrf='';
export function setCsrf(v){csrf=v;}
export async function api(path,method='GET',body){
 try{return await backendApi(path,method,body);}
 catch(e){e.message=tr(e.message||"Ошибка запроса.");throw e;}
}
export function toast(message){const el=$('#toast');if(!el)return;el.textContent=message;el.classList.remove('hidden');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>el.classList.add('hidden'),4500);}
export const date=v=>v?formatDate(v):'—';
export function status(a){if(a.status==='in_progress')return markup("<span class=\"badge\">В процессе</span>");if(a.status==='pending')return markup("<span class=\"badge amber\"><i class=\"dot\"></i>На проверке</span>");return `<span class="badge ${a.score>=70?'green':a.score>=50?'amber':'red'}">${a.score} / 100</span>`;}
const paths={home:'M3 10 12 3l9 7M5 9v12h14V9M9 21v-7h6v7',book:'M4 3h13a3 3 0 0 1 3 3v15H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM7 3v14M3 17h17',chart:'M4 20h16M7 16v-5M12 16V5M17 16v-8',code:'m8 7-5 5 5 5m8-10 5 5-5 5m-5 3 2-16',user:'M20 21v-2a7 7 0 0 0-14 0v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',users:'M16 21v-2a5 5 0 0 0-10 0v2M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0M20 21v-2a5 5 0 0 0-3-4M18 4a3 3 0 0 1 0 6',check:'m5 12 4 4L19 6',logout:'M9 3H4v18h5M13 7l5 5-5 5M8 12h13',clock:'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',arrow:'M4 12h16m-6-6 6 6-6 6',plus:'M12 5v14M5 12h14',database:'M20 6c0 2-4 3-8 3S4 8 4 6s4-3 8-3 8 1 8 3ZM4 6v12c0 2 4 3 8 3s8-1 8-3V6M4 12c0 2 4 3 8 3s8-1 8-3',mobile:'M7 2h10v20H7zM11 18h2',grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'};
export const icon=n=>`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n]||paths.book}"/></svg>`;
export async function busy(button,fn){const old=button.innerHTML;button.disabled=true;button.innerHTML=markup("<span class=\"spinner\"></span> Подождите");try{return await fn();}finally{button.disabled=false;button.innerHTML=old;}}
export async function confirmAction(message){
 const dialog=document.createElement('dialog');dialog.className='modal';dialog.innerHTML=`<h2>${tr("Подтверждение")}</h2><p class="muted mt">${esc(message)}</p><div class="row mt" style="justify-content:flex-end"><button class="btn" data-no>${tr("Отмена")}</button><button class="btn primary" data-yes>${tr("Подтвердить")}</button></div>`;document.body.append(dialog);
 return new Promise(resolve=>{let done=false;const end=v=>{if(done)return;done=true;dialog.close();dialog.remove();resolve(v);};$('[data-no]',dialog).onclick=()=>end(false);$('[data-yes]',dialog).onclick=()=>end(true);dialog.addEventListener('cancel',e=>{e.preventDefault();end(false);});dialog.showModal();});
}
