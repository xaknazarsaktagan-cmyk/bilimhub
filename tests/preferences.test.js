import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {tr,markup,formatDate} from '../frontend/assets/i18n.js';
import {kk} from '../frontend/assets/locales.js';
const bootstrap=readFileSync(new URL('../frontend/assets/preferences.js',import.meta.url),'utf8');
function environment(saved={},blocked=false){
 const values=new Map(Object.entries(saved)),events=[],listeners={};
 const document={documentElement:{lang:'ru',dataset:{},style:{}},querySelector:()=>null,dispatchEvent:e=>events.push(e)};
 const window={addEventListener:(name,fn)=>listeners[name]=fn};
 const storage={getItem:key=>{if(blocked)throw new Error('disabled');return values.get(key)??null;},setItem:(key,value)=>{if(blocked)throw new Error('disabled');values.set(key,value);}};
 const context={window,document,localStorage:storage,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}};
 vm.runInNewContext(bootstrap,context);return {document,preferences:window.BilimPreferences,values,events,listeners};
}
test('preferences apply saved dark theme and Kazakh language before the page renders',()=>{
 const page=environment({'bilim-theme':'dark','bilim-language':'kk'});
 assert.equal(page.document.documentElement.dataset.theme,'dark');assert.equal(page.document.documentElement.style.colorScheme,'dark');assert.equal(page.document.documentElement.lang,'kk');
});
test('changing both settings persists and survives a fresh page instance',()=>{
 const page=environment();page.preferences.setTheme('dark');page.preferences.setLanguage('kk');
 assert.equal(page.values.get('bilim-theme'),'dark');assert.equal(page.values.get('bilim-language'),'kk');
 const reload=environment(Object.fromEntries(page.values));assert.equal(reload.preferences.getTheme(),'dark');assert.equal(reload.preferences.getLanguage(),'kk');
 page.preferences.setTheme('light');page.preferences.setLanguage('ru');assert.equal(page.preferences.getTheme(),'light');assert.equal(page.preferences.getLanguage(),'ru');
 assert.ok(page.events.some(e=>e.type==='bilim:language'));
});
test('invalid preferences are ignored and blocked storage does not prevent switching',()=>{
 const page=environment({'bilim-theme':'invalid','bilim-language':'invalid'});assert.equal(page.preferences.getTheme(),'light');assert.equal(page.preferences.getLanguage(),'ru');
 page.preferences.setLanguage('en');page.preferences.setTheme('neon');assert.equal(page.preferences.getLanguage(),'ru');assert.equal(page.preferences.getTheme(),'light');
 const privatePage=environment({},true);privatePage.preferences.setLanguage('kk');privatePage.preferences.setTheme('dark');assert.equal(privatePage.preferences.getLanguage(),'kk');assert.equal(privatePage.preferences.getTheme(),'dark');
});
test('storage events synchronize open tabs without a reload',()=>{
 const page=environment();page.listeners.storage({key:'bilim-theme',newValue:'dark'});page.listeners.storage({key:'bilim-language',newValue:'kk'});
 assert.equal(page.preferences.getTheme(),'dark');assert.equal(page.preferences.getLanguage(),'kk');
 page.listeners.storage({key:'bilim-language',newValue:null});assert.equal(page.preferences.getLanguage(),'ru');
});
test('translations cover interface phrases and validation errors while preserving unrelated content',()=>{
 assert.equal(tr('Мои предметы','kk'),'Менің пәндерім');assert.equal(tr('Мои предметы','ru'),'Мои предметы');assert.equal(tr('Мой авторский тест','kk'),'Мой авторский тест');
 assert.equal(tr('Имя: допустимо 2–80 символов.','kk'),'Аты: 2–80 таңба болуы керек.');assert.equal(tr(' Не сохранено: ','kk'),' Сақталмады: ');assert.ok(Object.keys(kk).length>350);
});
test('static markup localization changes labels but preserves field identifiers and form structure',()=>{
 const previous=globalThis.document;globalThis.document={documentElement:{lang:'kk'}};
 try{const html=markup('<label for="password">Пароль</label><input id="password" name="password" placeholder="Введите пароль">');assert.match(html,/Құпиясөз/);assert.match(html,/placeholder="Құпиясөзді енгізіңіз"/);assert.match(html,/id="password" name="password"/);}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});

test('Kazakh dates use real month names even when runtime locale data is incomplete',()=>{
 const timestamp=new Date(2026,9,29,9,15).getTime();
 assert.equal(formatDate(timestamp,true,'kk'),'29 қазан 2026 ж.');assert.equal(formatDate(timestamp,false,'kk'),'29 қазан, 09:15');
 assert.equal(formatDate('invalid',false,'kk'),'—');
});
