// Слой данных на Firebase. Заменяет прежний Express + SQLite API: те же маршруты и те же формы ответов,
// поэтому остальной интерфейс работает без изменений. Работает в браузере: Firebase Auth + Cloud Firestore.
import {configured,auth,db,secondaryAuth} from './firebase.js';
import {signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,updatePassword,reauthenticateWithCredential,EmailAuthProvider,deleteUser} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {doc,collection,getDoc,getDocs,setDoc,updateDoc,deleteDoc,query,where} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {gradeCode} from './grader.js';

/* ---------- проверка входных данных (как на прежнем сервере) ---------- */
const fail=(status,message)=>{const e=new Error(message);e.status=status;throw e;};
const int=(v,min=1,max=Number.MAX_SAFE_INTEGER)=>{const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)fail(400,'Некорректное число.');return n;};
const str=(v,min,max,label)=>{if(typeof v!=='string'||v.trim().length<min||v.length>max)fail(400,`${label}: допустимо ${min}–${max} символов.`);return v.trim();};
const email=v=>{const s=str(v,5,254,'Email').toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))fail(400,'Введите корректный email.');return s;};
const password=v=>{if(typeof v!=='string'||v.length<10||v.length>128)fail(400,'Пароль: от 10 до 128 символов.');return v;};
const ROLES=['student','teacher','admin'];
export const publicUser=u=>({id:u.id,name:u.name,email:u.email,role:u.role,blocked:Boolean(u.blocked)});

/* ---------- текущий пользователь ---------- */
let profile=null,profileAt=0;
async function loadProfile(uid){const s=await getDoc(doc(db,'users',uid));return s.exists()?{id:uid,...s.data()}:null;}
async function requireUser(...roles){
 if(!configured)fail(503,'Firebase не настроен: вставьте ключи проекта в frontend/assets/firebase-config.js.');
 await auth.authStateReady();
 const u=auth.currentUser;if(!u)fail(401,'Войдите в аккаунт.');
 if(!profile||profile.id!==u.uid||Date.now()-profileAt>60000){profile=await loadProfile(u.uid);profileAt=Date.now();}
 if(!profile){profile=null;await signOut(auth);fail(401,'Войдите в аккаунт.');}
 if(profile.blocked){if(profile.role==='teacher')fail(403,'Заявка учителя ожидает одобрения администратора.');fail(403,'Аккаунт заблокирован.');}
 if(roles.length&&!roles.includes(profile.role))fail(403,'Недостаточно прав.');
 return profile;
}
const mine=u=>(u.subject_ids||[]).map(Number);
const canTeach=(u,subjectId)=>mine(u).includes(Number(subjectId));
const rows=snap=>snap.docs.map(d=>({id:d.id,...d.data()}));
async function getSubjects(){return rows(await getDocs(collection(db,'subjects'))).map(s=>({...s,id:Number(s.id)})).sort((a,b)=>a.id-b.id);}
// Запросы по предметам учителя выполняются по одному предмету: так их принимают правила Firestore.
async function bySubjects(name,ids,extra=[]){
 const parts=await Promise.all(ids.map(id=>getDocs(query(collection(db,name),where('subject_id','==',id),...extra))));
 return parts.flatMap(rows);
}

/* ---------- тесты ---------- */
const fix=t=>({...t,published:Boolean(t.published)});
async function getTest(id){const s=await getDoc(doc(db,'tests',String(id)));return s.exists()?fix({id:s.id,...s.data()}):null;}
async function teacherTest(u,id){const t=await getTest(id);if(!t)fail(404,'Тест не найден.');if(!canTeach(u,t.subject_id))fail(403,'Этот предмет вам не назначен.');return t;}
async function studentTest(id,kind){const t=await getTest(id);if(!t||!t.published||(kind&&t.kind!==kind))fail(404,'Опубликованный тест не найден.');return t;}
function safeContent(t,teacher=false){const content=JSON.parse(t.content);if(t.kind==='theory'&&!teacher)content.questions=content.questions.map(({text,options},index)=>({index,text,options}));return {...t,content};}
function validateTest(b){
 const subjectId=int(b.subject_id,1,5),kind=b.kind;if(!['theory','practice'].includes(kind))fail(400,'Выберите тип теста.');
 const title=str(b.title,3,150,'Название'),description=str(b.description||'',0,6000,'Описание');if(typeof b.published!=='boolean')fail(400,'Укажите состояние публикации.');
 const c=b.content;if(!c||typeof c!=='object')fail(400,'Нет содержимого теста.');let content;
 if(kind==='theory'){
  if(!Array.isArray(c.questions)||c.questions.length!==20)fail(400,'Тест должен содержать ровно 20 вопросов.');
  content={questions:c.questions.map(q=>{if(!q||!Array.isArray(q.options)||q.options.length!==4)fail(400,'Нужны 4 варианта ответа.');const options=q.options.map(o=>str(o,1,500,'Вариант'));if(new Set(options).size!==4)fail(400,'Варианты должны отличаться.');if(typeof q.correct!=='number')fail(400,'Укажите верный ответ.');return {text:str(q.text,3,1000,'Вопрос'),options,correct:int(q.correct,0,3),explanation:str(q.explanation||'',0,1500,'Объяснение')};})};
 }else{
  const starter=str(c.starter||'',0,20000,'Начальный код');if(!Array.isArray(c.tests)||c.tests.length<1||c.tests.length>20)fail(400,'Нужно от 1 до 20 проверочных примеров.');
  const tests=c.tests.map(t=>{if(!t||!Array.isArray(t.args)||!Object.hasOwn(t,'expected'))fail(400,'Пример должен содержать args (массив) и expected.');return {args:t.args,expected:t.expected};});if(JSON.stringify(tests).length>30000)fail(400,'Проверочные данные слишком большие.');content={starter,tests};
 }
 return {subjectId,kind,title,description,content:JSON.stringify(content),published:b.published};
}

/* ---------- работы студентов ---------- */
function attemptView(a,detail=false){
 const out={id:a.id,test_id:a.test_id??null,subject_id:a.subject_id,kind:a.kind,title:a.title,subject_name:a.subject_name,student_name:a.student_name,student_email:a.student_email,status:a.status,score:a.score??null,auto_score:a.auto_score??null,feedback:a.feedback||'',started_at:a.started_at,expires_at:a.expires_at??null,submitted_at:a.submitted_at??null,graded_at:a.graded_at??null};
 if(detail){out.code=a.code??null;out.checks=a.checks?JSON.parse(a.checks):null;out.answers=a.answers?JSON.parse(a.answers):null;const snapshot=JSON.parse(a.snapshot);out.content=a.kind==='theory'&&a.status==='in_progress'?{questions:snapshot.questions.map(({text,options},index)=>({text,options,index}))}:snapshot;}
 return out;
}
async function getAttempt(id){const s=await getDoc(doc(db,'attempts',String(id)));return s.exists()?{id:s.id,...s.data()}:null;}
function validateAnswers(a){if(!Array.isArray(a)||a.length!==20||a.some(x=>x!==null&&(!Number.isInteger(x)||x<0||x>3)))fail(400,'Ожидаются 20 ответов: null или индекс 0–3.');return a;}
async function newAttempt(u,t,fields){
 const subject=(await getSubjects()).find(s=>s.id===t.subject_id);
 const ref=doc(collection(db,'attempts'));
 const data={user_id:u.id,test_id:t.id,subject_id:t.subject_id,subject_name:subject?.name||'',student_name:u.name,student_email:u.email,kind:t.kind,title:t.title,answers:null,code:null,auto_score:null,score:null,feedback:'',checks:null,reviewer_id:null,expires_at:null,submitted_at:null,graded_at:null,...fields};
 await setDoc(ref,data);return {id:ref.id,...data};
}
async function runGrade(b,t){const code=str(b.code,1,20000,'Код');return {code,...await gradeCode(code,JSON.parse(t.content).tests)};}

/* ---------- пользователи (администратор) ---------- */
const subjectIds=b=>{if(!Array.isArray(b)||!b.every(x=>Number.isInteger(x)&&x>=1&&x<=5))fail(400,'Выберите предметы учителя.');return [...new Set(b)];};
const activeAdmins=async()=>rows(await getDocs(query(collection(db,'users'),where('role','==','admin')))).filter(u=>!u.blocked).length;
export async function createAccount({name,email:mail,password:pw,role,subject_ids=[]}){
 const sec=secondaryAuth();let cred;
 try{cred=await createUserWithEmailAndPassword(sec,mail,pw);}catch(e){if(e.code==='auth/email-already-in-use')fail(409,'Email уже используется.');throw e;}
 try{await setDoc(doc(db,'users',cred.user.uid),{name,email:mail,role,blocked:false,subject_ids,created_at:Date.now()});}
 catch(e){await deleteUser(cred.user).catch(()=>{});throw e;}
 finally{await signOut(sec).catch(()=>{});}
 return cred.user.uid;
}

/* ---------- маршруты ---------- */
const routes=[];
const on=(method,pattern,handler)=>routes.push([method,new RegExp('^'+pattern.replace(/:\w+/g,'([^/]+)')+'$'),handler]);

on('POST','/auth/login',async({body})=>{
 const e=email(body.email),p=body.password;if(typeof p!=='string'||p.length<1||p.length>128)fail(400,'Введите пароль.');
 if(!configured)fail(503,'Firebase не настроен: вставьте ключи проекта в frontend/assets/firebase-config.js.');
 let cred;try{cred=await signInWithEmailAndPassword(auth,e,p);}catch(err){
  if(err.code==='auth/too-many-requests')fail(429,'Слишком много запросов. Повторите позже.');
  if(String(err.code).startsWith('auth/')&&err.code!=='auth/network-request-failed')fail(401,'Неверный email или пароль, либо аккаунт заблокирован.');throw err;}
 profile=await loadProfile(cred.user.uid);profileAt=Date.now();
 if(!profile||profile.blocked){profile=null;await signOut(auth);fail(401,'Неверный email или пароль, либо аккаунт заблокирован.');}
 return {user:publicUser(profile),csrf:''};
});
on('POST','/auth/register',async({body})=>{
 const name=str(body.name,2,80,'Имя'),e=email(body.email),p=password(body.password);
 const requestedRole=body.role||'student';if(!['student','teacher'].includes(requestedRole))fail(403,'Регистрация этой роли запрещена.');
 if(!configured)fail(503,'Firebase не настроен: вставьте ключи проекта в frontend/assets/firebase-config.js.');
 let cred;try{cred=await createUserWithEmailAndPassword(auth,e,p);}catch(err){
  if(err.code==='auth/email-already-in-use')fail(409,'Этот email уже зарегистрирован.');
  if(err.code==='auth/weak-password')fail(400,'Пароль слишком простой.');throw err;}
 const data={name,email:e,role:requestedRole,blocked:requestedRole==='teacher',subject_ids:[],created_at:Date.now()};
 try{await setDoc(doc(db,'users',cred.user.uid),data);}catch(err){await deleteUser(cred.user).catch(()=>{});throw err;}
 profile={id:cred.user.uid,...data};profileAt=Date.now();return {user:publicUser(profile),csrf:''};
});
on('GET','/auth/me',async()=>{if(!configured)fail(503,'Firebase не настроен: вставьте ключи проекта в frontend/assets/firebase-config.js.');profileAt=0;const u=await requireUser();return {user:publicUser(u),csrf:''};});
on('POST','/auth/logout',async()=>{await signOut(auth);profile=null;return {ok:true};});
on('PATCH','/profile',async({body})=>{
 const u=await requireUser(),name=str(body.name,2,80,'Имя');
 if(body.newPassword){
  const p=password(body.newPassword);if(typeof body.currentPassword!=='string')fail(400,'Текущий пароль неверен.');
  try{await reauthenticateWithCredential(auth.currentUser,EmailAuthProvider.credential(u.email,body.currentPassword));}catch(err){fail(400,'Текущий пароль неверен.');}
  await updatePassword(auth.currentUser,p);
 }
 await updateDoc(doc(db,'users',u.id),{name});profile={...u,name};profileAt=Date.now();return {user:publicUser(profile)};
});
on('GET','/subjects',async()=>{const u=await requireUser(),all=await getSubjects();return u.role==='teacher'?all.filter(s=>canTeach(u,s.id)):all;});
on('GET','/tests',async({q})=>{
 const u=await requireUser();let list;
 if(u.role==='teacher')list=await bySubjects('tests',mine(u));
 else if(u.role==='student')list=rows(await getDocs(query(collection(db,'tests'),where('published','==',true))));
 else list=rows(await getDocs(collection(db,'tests')));
 const subjects=await getSubjects(),names=new Map(subjects.map(s=>[s.id,s.name]));
 if(q.get('subject'))list=list.filter(t=>t.subject_id===int(q.get('subject')));
 return list.sort((a,b)=>(a.created_at||0)-(b.created_at||0)||a.id.localeCompare(b.id)).map(t=>({id:t.id,subject_id:t.subject_id,subject_name:names.get(t.subject_id)||'',kind:t.kind,title:t.title,description:t.description,published:Boolean(t.published),updated_at:t.updated_at}));
});
on('GET','/tests/:id',async({params})=>{const u=await requireUser(),t=u.role==='teacher'?await teacherTest(u,params[0]):await studentTest(params[0]);return safeContent(t,u.role==='teacher');});
on('POST','/tests',async({body})=>{
 const u=await requireUser('teacher'),t=validateTest(body);if(!canTeach(u,t.subjectId))fail(403,'Предмет вам не назначен.');
 const ref=doc(collection(db,'tests')),now=Date.now();
 await setDoc(ref,{subject_id:t.subjectId,kind:t.kind,title:t.title,description:t.description,content:t.content,published:t.published,author_id:u.id,created_at:now,updated_at:now});return {id:ref.id};
});
on('PUT','/tests/:id',async({params,body})=>{
 const u=await requireUser('teacher'),old=await teacherTest(u,params[0]),t=validateTest(body);
 if(t.subjectId!==old.subject_id||t.kind!==old.kind)fail(400,'Предмет и тип менять нельзя.');
 await updateDoc(doc(db,'tests',old.id),{title:t.title,description:t.description,content:t.content,published:t.published,updated_at:Date.now()});return {ok:true};
});
on('DELETE','/tests/:id',async({params})=>{const u=await requireUser('teacher'),t=await teacherTest(u,params[0]);await deleteDoc(doc(db,'tests',t.id));return {ok:true};});

on('POST','/theory/:id/start',async({params})=>{
 const u=await requireUser('student'),t=await studentTest(params[0],'theory');
 const mineNow=rows(await getDocs(query(collection(db,'attempts'),where('user_id','==',u.id))));
 let a=mineNow.find(x=>x.test_id===t.id&&x.status==='in_progress');
 if(!a)a=await newAttempt(u,t,{snapshot:t.content,status:'in_progress',started_at:Date.now(),expires_at:Date.now()+30*60000});
 return attemptView(a,true);
});
on('PUT','/attempts/:id/answers',async({params,body})=>{
 const u=await requireUser('student'),a=await getAttempt(params[0]);
 if(!a||a.user_id!==u.id||a.kind!=='theory')fail(404,'Попытка не найдена.');
 if(a.status!=='in_progress')fail(409,'Тест уже завершён.');if(Date.now()>a.expires_at)fail(409,'Время вышло. Отправьте работу для завершения.');
 await updateDoc(doc(db,'attempts',a.id),{answers:JSON.stringify(validateAnswers(body.answers))});return {ok:true};
});
on('POST','/attempts/:id/submit',async({params,body})=>{
 const u=await requireUser('student');let a=await getAttempt(params[0]);
 if(!a||a.user_id!==u.id||a.kind!=='theory')fail(404,'Попытка не найдена.');
 if(a.status==='in_progress'){
  const answers=Date.now()>a.expires_at?(a.answers?JSON.parse(a.answers):Array(20).fill(null)):validateAnswers(body.answers);
  const score=JSON.parse(a.snapshot).questions.reduce((n,q,i)=>n+(q.correct===answers[i]?5:0),0),now=Date.now();
  const patch={answers:JSON.stringify(answers),score,auto_score:score,status:'graded',submitted_at:now,graded_at:now};
  await updateDoc(doc(db,'attempts',a.id),patch);a={...a,...patch};
 }
 return attemptView(a,true);
});
on('POST','/practice/:id/check',async({params,body})=>{const u=await requireUser('student');return runGrade(body,await studentTest(params[0],'practice'));});
on('POST','/practice/:id/submit',async({params,body})=>{
 const u=await requireUser('student'),t=await studentTest(params[0],'practice'),r=await runGrade(body,t),now=Date.now();
 const a=await newAttempt(u,t,{snapshot:JSON.stringify({...JSON.parse(t.content),description:t.description}),code:r.code,auto_score:r.score,checks:JSON.stringify(r.results),status:'pending',started_at:now,submitted_at:now});
 return attemptView(a,true);
});
on('GET','/attempts',async()=>{
 const u=await requireUser();let list;
 if(u.role==='student')list=rows(await getDocs(query(collection(db,'attempts'),where('user_id','==',u.id))));
 else if(u.role==='teacher')list=await bySubjects('attempts',mine(u));
 else list=rows(await getDocs(collection(db,'attempts')));
 return list.sort((a,b)=>b.started_at-a.started_at).slice(0,1000).map(a=>attemptView(a));
});
on('GET','/attempts/:id',async({params})=>{
 const u=await requireUser(),a=await getAttempt(params[0]);if(!a)fail(404,'Работа не найдена.');
 if(u.role==='student'&&a.user_id!==u.id)fail(403,'Доступ запрещён.');
 if(u.role==='teacher'&&!canTeach(u,a.subject_id))fail(403,'Предмет вам не назначен.');
 if(a.status==='in_progress'&&u.role!=='student')fail(403,'Попытка ещё не завершена.');
 return attemptView(a,true);
});
on('PATCH','/attempts/:id/grade',async({params,body})=>{
 const u=await requireUser('teacher'),a=await getAttempt(params[0]);
 if(!a||a.kind!=='practice')fail(404,'Практическая работа не найдена.');if(!canTeach(u,a.subject_id))fail(403,'Предмет вам не назначен.');
 if(typeof body.score!=='number')fail(400,'Оценка должна быть числом.');
 await updateDoc(doc(db,'attempts',a.id),{score:int(body.score,0,100),feedback:str(body.feedback||'',0,3000,'Комментарий'),status:'graded',reviewer_id:u.id,graded_at:Date.now()});return {ok:true};
});

on('GET','/users',async()=>{
 await requireUser('admin');
 return rows(await getDocs(collection(db,'users'))).sort((a,b)=>(a.created_at||0)-(b.created_at||0)).map(u=>({id:u.id,name:u.name,email:u.email,role:u.role,blocked:Boolean(u.blocked),created_at:u.created_at,subject_ids:mine(u)}));
});
on('POST','/users',async({body})=>{
 await requireUser('admin');
 const name=str(body.name,2,80,'Имя'),e=email(body.email),p=password(body.password),r=body.role;if(!ROLES.includes(r))fail(400,'Неверная роль.');
 const ids=r==='teacher'?subjectIds(body.subject_ids):[];
 return {id:await createAccount({name,email:e,password:p,role:r,subject_ids:ids})};
});
on('PATCH','/users/:id',async({params,body})=>{
 const me=await requireUser('admin'),id=params[0],s=await getDoc(doc(db,'users',id));if(!s.exists())fail(404,'Пользователь не найден.');
 const u={id,...s.data()},r=body.role,b=body.blocked;
 if(!ROLES.includes(r)||typeof b!=='boolean')fail(400,'Укажите роль и блокировку.');
 if(id===me.id&&(r!=='admin'||b))fail(400,'Нельзя заблокировать себя или изменить свою роль.');
 const ids=r==='teacher'?subjectIds(body.subject_ids):[];
 if(u.role==='admin'&&!u.blocked&&(r!=='admin'||b)&&await activeAdmins()<=1)fail(409,'Нужен активный администратор.');
 await updateDoc(doc(db,'users',id),{role:r,blocked:b,subject_ids:ids});return {ok:true};
});
on('DELETE','/users/:id',async({params})=>{
 const me=await requireUser('admin'),id=params[0];if(id===me.id)fail(400,'Нельзя удалить свой аккаунт.');
 const s=await getDoc(doc(db,'users',id));if(!s.exists())fail(404,'Пользователь не найден.');const u=s.data();
 if(u.role==='admin'&&!u.blocked&&await activeAdmins()<=1)fail(409,'Нельзя удалить последнего администратора.');
 const theirs=rows(await getDocs(query(collection(db,'attempts'),where('user_id','==',id))));
 await Promise.all(theirs.map(a=>deleteDoc(doc(db,'attempts',a.id))));
 await deleteDoc(doc(db,'users',id));return {ok:true};
});

function describe(e){
 if(e.status)return e;
 const c=String(e.code||'');
 if(c==='permission-denied'||c==='firestore/permission-denied'){e.status=403;e.message='Недостаточно прав.';}
 else if(c==='unavailable'||c==='auth/network-request-failed'){e.status=503;e.message='Нет связи с Firebase. Проверьте интернет.';}
 else if(c==='auth/too-many-requests'){e.status=429;e.message='Слишком много запросов. Повторите позже.';}
 else{console.error(e);e.status=500;e.message='Ошибка сервера. Повторите попытку.';}
 return e;
}
/** Совместимый с прежним клиентом вызов: api('/tests','POST',{...}). */
export async function api(path,method='GET',body){
 const [p,qs]=path.split('?'),q=new URLSearchParams(qs||'');
 for(const [m,re,handler] of routes){
  if(m!==method)continue;const hit=re.exec(p);if(!hit)continue;
  try{return await handler({params:hit.slice(1).map(decodeURIComponent),body:body||{},q});}catch(e){throw describe(e);}
 }
 const e=new Error('API-маршрут не найден.');e.status=404;throw e;
}
