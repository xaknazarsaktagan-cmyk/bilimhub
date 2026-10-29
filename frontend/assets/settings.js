import {tr,language} from './i18n.js';
const sun='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>';
const moon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/></svg>';
export function mountPreferences(){
 const dark=document.documentElement.dataset.theme==='dark',lang=language();
 document.title='Bilim — '+tr('Проверка знаний');
 for(const host of document.querySelectorAll('[data-preferences]')){
  host.innerHTML=`<div class="preferences" role="group" aria-label="${tr('Настройки интерфейса')}"><div class="language-switch" role="group" aria-label="${tr('Язык интерфейса')}"><button type="button" data-language="ru" lang="ru" aria-label="Русский" aria-pressed="${lang==='ru'}">RU</button><button type="button" data-language="kk" lang="kk" aria-label="Қазақша" aria-pressed="${lang==='kk'}">ҚАЗ</button></div><button type="button" class="theme-switch" data-toggle-theme aria-pressed="${dark}" aria-label="${tr(dark?'Включить светлую тему':'Включить тёмную тему')}" title="${tr(dark?'Включить светлую тему':'Включить тёмную тему')}">${dark?moon:sun}<span>${tr(dark?'Тёмная':'Светлая')}</span></button></div>`;
  host.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>window.BilimPreferences.setLanguage(b.dataset.language)));
  host.querySelector('[data-toggle-theme]').addEventListener('click',()=>window.BilimPreferences.setTheme(dark?'light':'dark'));
 }
}
document.addEventListener('bilim:theme',mountPreferences);
