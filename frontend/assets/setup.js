// Первичная настройка: создаёт демо-аккаунты и стартовые данные в Firebase.
import {configured,auth,db,secondaryAuth} from './firebase.js';
import {createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {doc,collection,getDoc,getDocs,setDoc} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import {subjects,questionsFor,practicals} from './seed.js';
const log=msg=>{const el=document.getElementById('log');el.textContent+=msg+'\n';};
const ADMIN_EMAIL='admin@bilim.local'; // должен совпадать с bootstrapEmail() в firestore.rules
const accounts={
 admin:{name:'Администратор',email:ADMIN_EMAIL,role:'admin'},
 teacher:{name:'Айдана Мұғалім',email:'teacher@bilim.local',role:'teacher'},
 student:{name:'Көркем Батырхан',email:'student@bilim.local',role:'student'}
};
async function ensureAdmin(password){
 let user;
 try{user=(await createUserWithEmailAndPassword(auth,ADMIN_EMAIL,password)).user;log('Аккаунт администратора создан.');}
 catch(e){
  if(e.code!=='auth/email-already-in-use')throw e;
  user=(await signInWithEmailAndPassword(auth,ADMIN_EMAIL,password)).user;log('Администратор уже существует — вход выполнен.');
 }
 const ref=doc(db,'users',user.uid);
 if(!(await getDoc(ref)).exists()){await setDoc(ref,{name:accounts.admin.name,email:ADMIN_EMAIL,role:'admin',blocked:false,subject_ids:[],created_at:Date.now()});log('Профиль администратора записан.');}
 return user.uid;
}
async function ensureUser(spec,password,extra={}){
 const sec=secondaryAuth();let uid;
 try{uid=(await createUserWithEmailAndPassword(sec,spec.email,password)).user.uid;log(`Создан: ${spec.email}`);}
 catch(e){
  if(e.code!=='auth/email-already-in-use')throw e;
  try{uid=(await signInWithEmailAndPassword(sec,spec.email,password)).user.uid;}catch{throw new Error(`${spec.email} уже есть в Firebase Auth, но пароль не подошёл. Введите его текущий пароль.`);}
  log(`Уже существует: ${spec.email}`);
 }
 await signOut(sec);
 const ref=doc(db,'users',uid);
 if(!(await getDoc(ref)).exists())await setDoc(ref,{name:spec.name,email:spec.email,role:spec.role,blocked:false,subject_ids:[],created_at:Date.now(),...extra});
 return uid;
}
async function seed(teacherUid){
 const have=await getDocs(collection(db,'subjects'));
 if(!have.empty){log('Предметы и тесты уже загружены — пропускаю.');return;}
 const base=Date.now();let n=0;
 for(const [i,[slug,name,description,number]] of subjects.entries()){
  const id=i+1;await setDoc(doc(db,'subjects',String(id)),{slug,name,description,number});
  const p=practicals[slug],common={subject_id:id,published:true,author_id:teacherUid};
  await setDoc(doc(collection(db,'tests')),{...common,kind:'theory',title:`${name} · Теория`,description:'20 вопросов · 30 минут',content:JSON.stringify({questions:questionsFor(slug)}),created_at:base+n,updated_at:base+n++});
  await setDoc(doc(collection(db,'tests')),{...common,kind:'practice',title:p.title,description:p.description,content:JSON.stringify({starter:p.starter,tests:p.tests}),created_at:base+n,updated_at:base+n++});
  log(`Предмет ${id}: ${name} — теория и практика загружены.`);
 }
}
document.getElementById('setup-form').onsubmit=async e=>{
 e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;document.getElementById('log').textContent='';
 try{
  if(!configured)throw new Error('Сначала вставьте ключи Firebase в frontend/assets/firebase-config.js.');
  await ensureAdmin(document.getElementById('admin-password').value);
  const teacherUid=await ensureUser(accounts.teacher,document.getElementById('teacher-password').value,{subject_ids:[1,2,3,4,5]});
  await ensureUser(accounts.student,document.getElementById('student-password').value);
  await seed(teacherUid);
  await signOut(auth);log('\nГотово. Можно входить.');
 }catch(err){log('\nОшибка: '+(err.code?`${err.code} — `:'')+err.message);}
 finally{button.disabled=false;}
};
