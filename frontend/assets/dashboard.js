import {mountPreferences} from './settings.js';
import {tr,markup,locale,formatDate} from './i18n.js';
import {$,$$,esc,api,setCsrf,roles,icon,status,date,toast,busy} from './common.js';
import {studentPage} from './student.js';
import {teacherPage} from './teacher.js';
import {adminPage} from './admin.js';
export const state={user:null,subjects:[],tests:[],attempts:[],cleanup:()=>{}};
export function heading(title,subtitle,action=''){return `<div class="page-heading"><div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>${action}</div>`;}
export function stats(items){return `<div class="stats">${items.map(([label,value,foot,i])=>`<div class="card stat"><div class="stat-label">${esc(label)}${icon(i||'chart')}</div><div class="stat-value">${value}</div><div class="stat-foot">${esc(foot)}</div></div>`).join('')}</div>`;}
export const empty=(title,text)=>`<div class="empty"><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
export function attemptsTable(rows,teacher=false){
 if(!rows.length)return empty(tr("Пока нет результатов"),tr("Здесь появятся отправленные работы."));
 return `<div class="table-wrap"><table class="table"><thead><tr><th>${teacher?tr("Студент"):tr("Работа")}</th><th>${teacher?tr("Работа"):tr("Тип")}</th><th>${tr("Результат")}</th><th>${tr("Дата")}</th><th></th></tr></thead><tbody>${rows.map(a=>`<tr><td><strong>${esc(teacher?a.student_name:a.title)}</strong><small>${esc(teacher?a.student_email:a.subject_name)}</small></td><td>${teacher?`<strong>${esc(a.title)}</strong><small>${a.kind==='theory'?tr("Теория"):tr("Практика")}</small>`:`<span class="row">${icon(a.kind==='theory'?'book':'code')}${a.kind==='theory'?tr("Теория"):tr("Практика")}</span>`}</td><td>${status(a)}</td><td class="muted">${date(a.submitted_at||a.started_at)}</td><td><a class="btn small" href="#${a.status==='in_progress'?'quiz/'+a.id:'result/'+a.id}">${a.status==='in_progress'?tr("Продолжить"):teacher&&a.kind==='practice'?tr("Проверить"):tr("Открыть")}</a></td></tr>`).join('')}</tbody></table></div>`;
}
export function exportCSV(rows){
 const protect=v=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const content=[[tr("Студент"),'Email',tr("Предмет"),tr("Работа"),tr("Тип"),tr("Статус"),tr("Автобалл"),tr("Оценка"),tr("Комментарий"),tr("Дата")],...rows.map(a=>[a.student_name,a.student_email,a.subject_name,a.title,a.kind,a.status,a.auto_score,a.score,a.feedback,date(a.submitted_at)])].map(r=>r.map(protect).join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\uFEFF'+content],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='bilim-results.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function shell(){
 const r=state.user.role;
 const nav=r==='student'?[['home','home',tr("Обзор")],['subjects','grid',tr("Мои предметы")],['results','chart',tr("Результаты")]]:r==='teacher'?[['home','home',tr("Обзор")],['tests','book',tr("Управление тестами")],['reviews','code',tr("Работы студентов")]]:[['home','home',tr("Обзор")],['users','users',tr("Пользователи")],['results','chart',tr("Все результаты")]];
 nav.push(['profile','user',tr("Мой профиль")]);
 const initials=state.user.name.split(' ').map(n=>n[0]).slice(0,2).join('');
 $('#app').innerHTML=`<aside class="sidebar"><a class="brand" href="#home"><span class="logo">b</span>bilim</a><div class="workspace-label">${tr("Рабочее пространство")}</div><nav class="nav" aria-label="${tr("Главное меню")}">${nav.map(([v,i,n])=>`<a class="nav-link" href="#${v}" data-nav="${v}">${icon(i)}${n}</a>`).join('')}</nav><div class="sidebar-note">${tr("Учитесь осознанно.")}<br>${tr("Проверяйте знания на практике.")}<br><span style="display:block;margin-top:12px">Bilim / Assessment platform</span></div><div class="user-block"><span class="avatar">${esc(initials)}</span><div class="user-copy"><strong id="user-name">${esc(state.user.name)}</strong><small>${roles[r]}</small></div><button class="logout" title="${tr("Выйти")}" aria-label="${tr("Выйти")}" data-logout>${icon('logout')}</button></div></aside><div class="workspace"><header class="topbar"><div class="breadcrumb">${tr("Платформа")} <b id="crumb">${tr("Обзор")}</b></div><div class="top-right"><div data-preferences></div><span class="desktop">${formatDate(Date.now(),true)}</span><span class="badge"><i class="dot"></i>${roles[r]}</span><button class="btn small ghost" data-logout>${tr("Выйти")}</button></div></header><main id="main" class="content" tabindex="-1"></main></div>`;
 mountPreferences();
 $$('[data-logout]').forEach(b=>b.onclick=async()=>{try{await api('/auth/logout','POST',{});location.href='/';}catch(e){toast(e.message);}});
}
export async function refresh(){[state.subjects,state.tests,state.attempts]=await Promise.all([api('/subjects'),api('/tests'),api('/attempts')]);}
async function profile(main){
 main.innerHTML=heading(tr("Мой профиль"),tr("Личные данные и безопасность аккаунта"))+`<form id="profile-form" class="card pad profile-card"><div class="row mb"><span class="avatar">${esc(state.user.name[0])}</span><div><h3>${esc(state.user.name)}</h3><small>${esc(state.user.email)} · ${roles[state.user.role]}</small></div></div><div class="field"><label for="profile-name">${tr("Имя и фамилия")}</label><input class="input" id="profile-name" name="name" value="${esc(state.user.name)}" required minlength="2" maxlength="80"></div><div class="divider"></div><h3 style="margin-bottom:15px">${tr("Изменить пароль")}</h3><p class="caption mb">${tr("Оставьте поля пустыми, если пароль менять не нужно.")}</p><div class="field"><label for="currentPassword">${tr("Текущий пароль")}</label><input class="input" type="password" id="currentPassword" name="currentPassword" autocomplete="current-password" maxlength="128"></div><div class="field"><label for="newPassword">${tr("Новый пароль")}</label><input class="input" type="password" id="newPassword" name="newPassword" autocomplete="new-password" minlength="10" maxlength="128"></div><button class="btn primary">${tr("Сохранить изменения")}</button><p class="error hidden" id="form-error" role="alert"></p></form>`;
 $('#profile-form').onsubmit=async e=>{e.preventDefault();try{await busy($('button',e.target),async()=>{const r=await api('/profile','PATCH',Object.fromEntries(new FormData(e.target)));state.user=r.user;$('#user-name').textContent=r.user.name;toast(tr("Профиль сохранён"));await profile(main);});}catch(err){$('#form-error').textContent=err.message;$('#form-error').classList.remove('hidden');}};
}
async function resultPage(main,id){
 const a=await api('/attempts/'+id);if(a.status==='in_progress'){location.hash='quiz/'+id;return;}
 const teacher=state.user.role==='teacher'&&a.kind==='practice';
 main.innerHTML=`<a class="back" href="#${teacher?'reviews':'results'}">← ${tr("К результатам")}</a>`+heading(a.title,a.subject_name||tr("Результат работы"))+`<div class="grid two mb"><div class="card pad"><span class="eyebrow">${a.status==='pending'?tr("Предварительный результат"):tr("Итоговая оценка")}</span><div class="score-big">${a.status==='pending'?'—':a.score}<span style="font-size:18px;letter-spacing:0;color:#a1a1aa"> / 100</span></div>${status(a)}<p class="caption mt">${a.kind==='practice'?`${tr("Автопроверка:")} ${a.auto_score} / 100 · ${tr("оценку выставляет учитель")}`:tr("Каждый верный ответ — 5 баллов")}</p></div><div class="card pad"><h3>${tr("Информация о работе")}</h3><div class="divider"></div><p class="caption">${tr("Студент")}</p><p>${esc(a.student_name||state.user.name)}</p><p class="caption mt">${tr("Отправлено")}</p><p>${date(a.submitted_at)}</p>${a.feedback?`<p class="caption mt">${tr("Комментарий учителя")}</p><p style="white-space:pre-wrap">${esc(a.feedback)}</p>`:''}</div></div>`;
 if(a.kind==='theory'){
 main.insertAdjacentHTML('beforeend',`<div class="section-head"><h2>${tr("Разбор ответов")}</h2><small>${a.score/5} ${tr("из 20 верно")}</small></div><div class="card">${a.content.questions.map((q,i)=>`<div class="review-item ${a.answers[i]===q.correct?'correct':'wrong'}"><h3>${i+1}. ${esc(q.text)}</h3><p>${tr("Ваш ответ:")} ${a.answers[i]===null?tr("Не выбран"):esc(q.options[a.answers[i]])}</p>${a.answers[i]===q.correct?'':`<p style="color:var(--green)">${tr("Верный ответ:")} ${esc(q.options[q.correct])}</p>`}<small>${esc(q.explanation)}</small></div>`).join('')}</div>`);
 }else{
 main.insertAdjacentHTML('beforeend',`<div class="card pad mb"><h2>${tr("Отправленный код")}</h2><p class="task-description mt">${esc(a.content.description||'')}</p><pre class="code code-display mt">${esc(a.code)}</pre></div><div class="card mb"><div class="pad"><h2>${tr("Автоматическая проверка")}</h2><p class="caption">${a.checks.filter(c=>c.passed).length} ${tr("из")} ${a.checks.length} ${tr("примеров пройдено")}</p></div>${a.checks.map((c,i)=>`<div class="check-row"><span class="badge ${c.passed?'green':'red'}">${c.passed?tr("Пройден"):tr("Ошибка")}</span> ${tr("Пример")} ${i+1}<pre>${esc(c.error||tr("Получено: ")+JSON.stringify(c.actual))}</pre><pre>${tr("Ожидается:")} ${esc(JSON.stringify(a.content.tests[i].expected))}</pre></div>`).join('')}</div>`);
 if(teacher){main.insertAdjacentHTML('beforeend',`<form id="grade-form" class="card pad"><h2>${tr("Оценка преподавателя")}</h2><div class="field mt"><label for="score">${tr("Итоговая оценка (0–100)")}</label><input class="input" style="max-width:180px" id="score" name="score" type="number" min="0" max="100" step="1" required value="${a.score??a.auto_score}"></div><div class="field"><label for="feedback">${tr("Комментарий студенту")}</label><textarea id="feedback" name="feedback" rows="4" maxlength="3000" placeholder="${tr("Что получилось и что можно улучшить")}">${esc(a.feedback)}</textarea></div><button class="btn primary">${a.status==='graded'?tr("Обновить оценку"):tr("Выставить оценку")}</button><p id="grade-error" class="error hidden" role="alert"></p></form>`);$('#grade-form').onsubmit=async e=>{e.preventDefault();try{await busy($('button',e.target),async()=>{await api(`/attempts/${a.id}/grade`,'PATCH',{score:Number($('#score').value),feedback:$('#feedback').value});toast(tr("Оценка сохранена"));await refresh();await resultPage(main,id);});}catch(err){$('#grade-error').textContent=err.message;$('#grade-error').classList.remove('hidden');}};}
 }
}
function captureForms(){return [...document.querySelectorAll('#main input,#main select,#main textarea')].map((el,index)=>({id:el.id,index,value:el.value,checked:el.checked,type:el.type}));}
function restoreForms(fields){
 const kind=fields.find(f=>f.id==='kind'),kindInput=document.getElementById('kind');
 if(kind&&kindInput&&kindInput.value!==kind.value){kindInput.value=kind.value;kindInput.dispatchEvent(new Event('change',{bubbles:true}));}
 for(const field of fields){const el=field.id?document.getElementById(field.id):document.querySelectorAll('#main input,#main select,#main textarea')[field.index];if(!el)continue;if(field.type==='checkbox'||field.type==='radio')el.checked=field.checked;else el.value=field.value;}
 for(const id of ['subject-filter','status-filter','role-filter','block-filter'])document.getElementById(id)?.dispatchEvent(new Event('change',{bubbles:true}));
 document.getElementById('search')?.dispatchEvent(new Event('input',{bubbles:true}));
 if(state.preserveEditorDirty)document.getElementById('test-form')?.dispatchEvent(new Event('input',{bubbles:true}));state.preserveEditorDirty=false;
}
let languageQueue=Promise.resolve();
document.addEventListener('bilim:language',()=>{languageQueue=languageQueue.catch(()=>{}).then(async()=>{
 await state.beforeLanguageChange?.();const fields=captureForms();const scroll=window.scrollY;shell();await route();restoreForms(fields);window.scrollTo(0,scroll);
});});
let routeVersion=0;
export async function route(){
 const version=++routeVersion;state.cleanup();state.cleanup=()=>{};state.beforeLanguageChange=null;
 const [view,id]=(location.hash.slice(1)||'home').split('/');
 $$('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===view||(view==='subject'&&a.dataset.nav==='subjects')||(['quiz','practice'].includes(view)&&a.dataset.nav==='subjects')||(view==='result'&&a.dataset.nav===(state.user.role==='teacher'?'reviews':'results'))||(view==='edit'&&a.dataset.nav==='tests')));
 $('#crumb').textContent=({home:tr("Обзор"),subjects:tr("Мои предметы"),subject:tr("Предмет"),quiz:tr("Теоретический тест"),practice:tr("Практическое задание"),results:tr("Результаты"),result:tr("Работа"),tests:tr("Управление тестами"),edit:tr("Редактор теста"),reviews:tr("Работы студентов"),users:tr("Пользователи"),profile:tr("Профиль")})[view]||tr("Кабинет");
 const main=$('#main');main.innerHTML=markup("<div class=\"loading\"><span class=\"spinner\"></span><p>Загрузка…</p></div>");
 try{
  await refresh();if(version!==routeVersion)return;
  if(view==='profile')await profile(main);
  else if(view==='result')await resultPage(main,id);
  else if(state.user.role==='student')await studentPage(main,view,id);
  else if(state.user.role==='teacher')await teacherPage(main,view,id);
  else await adminPage(main,view,id);
 }catch(e){if(e.status===401){location.href='/';return;}main.innerHTML=`<div class="card pad"><h2>${tr("Не удалось открыть страницу")}</h2><p class="error">${esc(e.message)}</p><a href="#home" class="btn">${tr("Вернуться к обзору")}</a></div>`;}
}
try{
 const r=await api('/auth/me');setCsrf(r.csrf);state.user=r.user;
 if(document.body.dataset.role!==r.user.role)location.replace(`/${r.user.role}.dashboard.html`);
 else{shell();window.addEventListener('hashchange',route);await route();}
}catch(e){if(e.status===401)location.replace('/');else $('#app').innerHTML=`<div class="empty"><h2>${tr("Не удалось подключиться")}</h2><p>${esc(e.message)}</p><a href="/">${tr("Вернуться ко входу")}</a></div>`;}
