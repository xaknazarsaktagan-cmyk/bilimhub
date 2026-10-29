import {tr,markup,locale} from './i18n.js';
import {$,$$,esc,api,icon,date,status,toast,busy,confirmAction} from './common.js';
import {state,heading,stats,empty,attemptsTable,exportCSV} from './dashboard.js';
const subjectIcons=['code','grid','mobile','database','book'];
function cards(){return `<div class="grid three">${state.subjects.map((s,i)=>{const tests=state.tests.filter(t=>t.subject_id===s.id),done=state.attempts.filter(a=>a.subject_id===s.id&&a.status==='graded');return `<a class="card subject-card" href="#subject/${s.id}"><div class="subject-top"><span class="subject-icon">${icon(subjectIcons[i])}</span><span class="subject-number">${s.number}</span></div><h3>${esc(s.name)}</h3><p>${esc(tr(s.description))}</p><div class="subject-bottom"><small>${tests.filter(t=>t.kind==='theory').length} ${tr("теория ·")} ${tests.filter(t=>t.kind==='practice').length} ${tr("практика")}${done.length?' · '+done.length+tr(" завершено"):''}</small><span class="arrow">↗</span></div></a>`;}).join('')}</div>`;}
function studentHome(main,subjectsOnly=false){
 const graded=state.attempts.filter(a=>a.status==='graded'),pending=state.attempts.filter(a=>a.status==='pending');
 const avg=graded.length?Math.round(graded.reduce((n,a)=>n+a.score,0)/graded.length):'—';
 main.innerHTML=heading(subjectsOnly?tr("Мои предметы"):`${tr("Сәлем,")} ${state.user.name.split(' ')[0]} 👋`,subjectsOnly?tr("Выберите дисциплину, чтобы перейти к теории и практике."):tr("Каждая попытка — шаг к уверенному владению профессией."),`<span class="badge purple">${icon('book')} 5 ${tr("дисциплин")}</span>`)+(subjectsOnly?'':stats([[tr("Средний результат"),`${avg}<span> / 100</span>`,tr("По завершённым работам"),'chart'],[tr("Завершено работ"),graded.length,tr("Теория и проверенная практика"),'check'],[tr("Ожидают проверки"),pending.length,tr("Практические работы"),'clock']]))+`<div class="section-head"><h2>${tr("Учебные дисциплины")}</h2><small>${tr("Программа / Разработка ПО")}</small></div>`+cards();
 if(!subjectsOnly)main.insertAdjacentHTML('beforeend',`<div class="section-head"><h2>${tr("Последние работы")}</h2><a class="text-button" href="#results">${tr("Все результаты →")}</a></div><div class="card">${attemptsTable(state.attempts.slice(0,4))}</div>`);
}
async function subject(main,id){
 const s=state.subjects.find(s=>s.id===Number(id));if(!s)throw new Error(tr("Предмет не найден."));
 const tests=state.tests.filter(t=>t.subject_id===s.id);
 main.innerHTML=`<a class="back" href="#subjects">← ${tr("Все предметы")}</a>`+heading(s.name,tr(s.description))+`<div class="note mb">${tr("Теория: 20 вопросов за 30 минут, проверка сразу. Практика: JavaScript, предварительная автопроверка и итоговая оценка учителя.")}</div>`+(tests.length?`<div class="grid two">${tests.map(t=>`<div class="card test-card"><span class="badge ${t.kind==='theory'?'purple':'green'}">${icon(t.kind==='theory'?'book':'code')}${t.kind==='theory'?tr("Теоретический тест"):tr("Практическое задание")}</span><h3>${esc(t.title)}</h3><p>${esc(t.kind==='theory'?tr("Проверьте понимание основных понятий. 20 вопросов с четырьмя вариантами ответа."):t.description)}</p><div class="row between"><small>${t.kind==='theory'?tr("30 минут · до 100 баллов"):tr("JavaScript · оценка учителя")}</small>${t.kind==='theory'?`<button class="btn primary" data-start="${t.id}">${tr("Начать тест")} ${icon('arrow')}</button>`:`<a class="btn primary" href="#practice/${t.id}">${tr("Открыть")} ${icon('arrow')}</a>`}</div></div>`).join('')}</div>`:empty(tr("Нет опубликованных заданий"),tr("Учитель ещё не опубликовал тесты по этому предмету.")))+`<div class="section-head"><h2>${tr("Ваши работы по предмету")}</h2></div><div class="card">${attemptsTable(state.attempts.filter(a=>a.subject_id===s.id))}</div>`;
 $$('[data-start]').forEach(b=>b.onclick=async()=>{try{await busy(b,async()=>{const a=await api('/theory/'+b.dataset.start+'/start','POST',{});location.hash='quiz/'+a.id;});}catch(e){toast(e.message);}});
}
function results(main){
 main.innerHTML=heading(tr("Мои результаты"),tr("История попыток, автоматическая проверка и обратная связь."),`<button class="btn" id="export">${tr("Экспорт CSV ↓")}</button>`)+`<div class="toolbar"><select id="subject-filter" aria-label="${tr("Предмет")}"><option value="">${tr("Все предметы")}</option>${state.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select><select id="status-filter" aria-label="${tr("Статус")}"><option value="">${tr("Все статусы")}</option><option value="graded">${tr("Оценено")}</option><option value="pending">${tr("На проверке")}</option><option value="in_progress">${tr("В процессе")}</option></select></div><div class="card" id="result-table"></div><p class="caption mt">${tr("Показаны последние 1000 работ.")}</p>`;
 const filtered=()=>state.attempts.filter(a=>(!$('#subject-filter').value||a.subject_id===Number($('#subject-filter').value))&&(!$('#status-filter').value||a.status===$('#status-filter').value));
 const draw=()=>$('#result-table').innerHTML=attemptsTable(filtered());$('#subject-filter').onchange=draw;$('#status-filter').onchange=draw;$('#export').onclick=()=>exportCSV(filtered());draw();
}
async function quiz(main,id){
 const a=await api('/attempts/'+id);if(a.kind!=='theory')throw new Error(tr("Это не теоретический тест."));if(a.status!=='in_progress'){location.hash='result/'+a.id;return;}
 let answers=(state.quizDraft?.id===a.id?state.quizDraft.answers:null)||a.answers||Array(20).fill(null),index=state.quizDraft?.id===a.id?state.quizDraft.index:0,saveQueue=Promise.resolve(),submitting=false,leaving=false;
 main.innerHTML=`<a class="back" href="#subject/${a.subject_id}">← ${tr("К предмету (прогресс сохранится)")}</a>`+heading(a.title,tr("Выберите один ответ. Ответы сохраняются автоматически."))+`<div class="quiz-layout"><section class="card question" id="question"></section><aside class="card pad quiz-sidebar"><span class="eyebrow">${tr("Осталось времени")}</span><div class="timer" id="timer">30:00</div><p class="caption" id="save-state">${tr("Ответы сохранены")}</p><div class="divider"></div><div class="row between mt"><h3>${tr("Вопросы")}</h3><small id="answer-count"></small></div><div class="quiz-map" id="question-map"></div><div class="progress"><span id="progress-bar"></span></div><button class="btn primary full mt" id="finish">${tr("Завершить тест")}</button><p class="caption mt">${tr("После завершения ответы изменить нельзя. При истечении времени учитываются сохранённые ответы.")}</p><p class="error hidden" id="quiz-error" role="alert"></p></aside></div>`;
 function map(){
  $('#answer-count').textContent=answers.filter(x=>x!==null).length+' / 20';$('#progress-bar').style.width=answers.filter(x=>x!==null).length*5+'%';
  $('#question-map').innerHTML=answers.map((v,i)=>`<button class="${v!==null?'done ':''}${i===index?'current':''}" aria-label="${tr("Вопрос")} ${i+1}" ${i===index?'aria-current="step"':''} data-question="${i}">${i+1}</button>`).join('');
  $$('[data-question]').forEach(b=>b.onclick=()=>{index=Number(b.dataset.question);draw();});
 }
 function save(){
  const snapshot=[...answers];$('#save-state').textContent=tr("Сохранение…");
  saveQueue=saveQueue.catch(()=>{}).then(()=>api(`/attempts/${a.id}/answers`,'PUT',{answers:snapshot})).then(()=>{if(!leaving)$('#save-state').textContent=tr("Ответы сохранены");}).catch(e=>{if(!leaving){$('#save-state').textContent=tr("Не сохранено: ")+e.message;$('#save-state').style.color='var(--red)';}throw e;});
  // Keep rejection handled when navigation happens before the request settles.
  saveQueue.catch(()=>{});
 }
 function draw(){
  state.quizDraft={id:a.id,answers,index};const q=a.content.questions[index];$('#question').innerHTML=`<span class="eyebrow">${tr("Вопрос")} ${index+1} ${tr("из 20")}</span><h2>${esc(q.text)}</h2><fieldset style="border:0;padding:0;margin:0"><legend class="hidden">${tr("Выберите ответ")}</legend>${q.options.map((o,j)=>`<label class="option"><input type="radio" name="answer" value="${j}" ${answers[index]===j?'checked':''}><span class="option-letter">${'ABCD'[j]}</span><span>${esc(o)}</span></label>`).join('')}</fieldset><div class="row between mt"><button class="btn" id="prev" ${index===0?'disabled':''}>← ${tr("Назад")}</button><button class="btn ${index===19?'accent':''}" id="next">${index===19?tr("К завершению"):tr("Далее →")}</button></div>`;
  $$('input[name=answer]').forEach(input=>input.onchange=()=>{answers[index]=Number(input.value);save();map();});
  $('#prev').onclick=()=>{if(index>0){index--;draw();}};
  $('#next').onclick=()=>{if(index<19){index++;draw();}else $('#finish').focus();};map();
 }
 async function finish(auto=false){
  if(submitting||leaving)return;
  if(!auto&&!await confirmAction(`${tr("Завершить тест? Вы ответили на")} ${answers.filter(x=>x!==null).length} ${tr("из 20 вопросов.")}`))return;
  submitting=true;$('#finish').disabled=true;$('#quiz-error').classList.add('hidden');
  try{await saveQueue.catch(()=>{});await api(`/attempts/${a.id}/submit`,'POST',{answers});location.hash='result/'+a.id;}
  catch(e){$('#quiz-error').textContent=e.message+tr(" Нажмите «Завершить тест», чтобы повторить.");$('#quiz-error').classList.remove('hidden');$('#finish').disabled=false;submitting=false;}
 }
 let autoTried=false;
 function tick(){if(leaving)return;const n=Math.max(0,Math.ceil((a.expires_at-Date.now())/1000));$('#timer').textContent=Math.floor(n/60).toString().padStart(2,'0')+':'+(n%60).toString().padStart(2,'0');if(n<60)$('#timer').style.color='var(--red)';if(n===0&&!autoTried){autoTried=true;finish(true);}}
 state.beforeLanguageChange=()=>saveQueue.catch(()=>{});$('#finish').onclick=()=>finish();draw();tick();const timer=setInterval(tick,1000);state.cleanup=()=>{leaving=true;clearInterval(timer);};
}
function storageGet(key,fallback){try{return localStorage.getItem(key)??fallback;}catch{return fallback;}}
async function practice(main,id){
 const t=await api('/tests/'+id);if(t.kind!=='practice')throw new Error(tr("Это не практическое задание."));
 const key=`bilim-code-${state.user.id}-${t.id}`;
 main.innerHTML=`<a class="back" href="#subject/${t.subject_id}">← ${tr("К предмету")}</a>`+heading(t.title,tr("Практическое задание · JavaScript"))+`<div class="practice-layout"><section class="card pad"><span class="badge green">${icon('code')} ${tr("Практика")}</span><h2 class="mt">${tr("Условие")}</h2><p class="task-description mt">${esc(t.description)}</p><div class="divider"></div><h3>${tr("Как сдавать")}</h3><p class="caption mt">${tr("Реализуйте обычную синхронную функцию solve. Доступны стандартные возможности JavaScript; Node.js, DOM, сеть и внешние библиотеки недоступны.")}</p><p class="caption mt">${tr("На пример: 400 мс и 16 МБ памяти. Проверка сравнивает возвращённое JSON-значение. Вывод console.log не нужен.")}</p><p class="caption mt">${tr("Автобалл — предварительный. После отправки учитель проверит код и выставит оценку.")}</p></section><div class="stack"><section class="card" style="overflow:hidden"><div class="editor-head row between"><span>solution.js</span><span>JavaScript / QuickJS</span></div><label class="hidden" for="code">${tr("Код решения")}</label><textarea id="code" class="editor code" spellcheck="false" maxlength="20000">${esc(storageGet(key,t.content.starter))}</textarea><div class="editor-foot"><button class="btn" id="reset-code">${tr("Сбросить")}</button><button class="btn" id="check-code">▷ ${tr("Проверить")}</button><button class="btn primary" id="submit-code">${tr("Отправить учителю ↑")}</button></div></section><p class="caption" id="draft-state">${tr("Черновик сохраняется в этом браузере.")}</p><p class="error hidden" id="code-error" role="alert"></p><div class="card" id="checks"><div class="pad"><h3>${tr("Проверочные примеры")}</h3><p class="caption">${tr("Все примеры открыты для подготовки решения.")}</p></div>${t.content.tests.map((c,i)=>`<div class="check-row">${tr("Пример")} ${i+1}<pre>solve(...${esc(JSON.stringify(c.args))})</pre><pre>${tr("Ожидается:")} ${esc(JSON.stringify(c.expected))}</pre></div>`).join('')}</div></div></div>`;
 const editor=$('#code');editor.oninput=()=>{try{localStorage.setItem(key,editor.value);}catch{$('#draft-state').textContent=tr("Не удалось сохранить черновик в браузере. Скопируйте код перед выходом.");}};
 editor.onkeydown=e=>{if(e.key==='Tab'){e.preventDefault();const start=editor.selectionStart,end=editor.selectionEnd;editor.setRangeText('  ',start,end,'end');editor.oninput();}};
 $('#reset-code').onclick=async()=>{if(await confirmAction(tr("Заменить черновик начальным кодом?"))){editor.value=t.content.starter;editor.oninput();}};
 let working=false;
 async function run(submit){
  if(working)return;if(submit&&!await confirmAction(tr("Отправить код на проверку учителю? Вы сможете отправить новую попытку позже.")))return;
  working=true;const buttons=[$('#check-code'),$('#submit-code')];buttons.forEach(b=>b.disabled=true);$('#code-error').classList.add('hidden');
  try{const r=await api(`/practice/${t.id}/${submit?'submit':'check'}`,'POST',{code:editor.value});if(submit){try{localStorage.removeItem(key);}catch{}toast(tr("Работа отправлена учителю"));location.hash='result/'+r.id;}else $('#checks').innerHTML=`<div class="pad row between"><h3>${tr("Результат проверки")}</h3><span class="badge ${r.score===100?'green':'amber'}">${r.score} / 100</span></div>${r.results.map((c,i)=>`<div class="check-row"><span class="badge ${c.passed?'green':'red'}">${c.passed?tr("Пройден"):tr("Ошибка")}</span> ${tr("Пример")} ${i+1}<pre>${esc(c.error||tr("Получено: ")+JSON.stringify(c.actual))}</pre><pre>${tr("Ожидается:")} ${esc(JSON.stringify(t.content.tests[i].expected))}</pre></div>`).join('')}`;
  }catch(e){$('#code-error').textContent=e.message;$('#code-error').classList.remove('hidden');}
  finally{working=false;buttons.forEach(b=>b.disabled=false);}
 }
 $('#check-code').onclick=()=>run(false);$('#submit-code').onclick=()=>run(true);
}
export async function studentPage(main,view,id){
 if(view==='home')studentHome(main);else if(view==='subjects')studentHome(main,true);else if(view==='subject')await subject(main,id);else if(view==='results')results(main);else if(view==='quiz')await quiz(main,id);else if(view==='practice')await practice(main,id);else main.innerHTML=empty(tr("Страница не найдена"),tr("Выберите раздел в меню."));
}
