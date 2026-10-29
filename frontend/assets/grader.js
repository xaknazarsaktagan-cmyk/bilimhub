// Проверка кода студента в браузере: каждый пример выполняется в отдельном Web Worker.
// Worker не имеет доступа к DOM, cookie и localStorage; сеть отключена, зависшие примеры принудительно завершаются.
const workerSource=`(()=>{
const post=self.postMessage.bind(self);
for(const k of ['fetch','XMLHttpRequest','WebSocket','EventSource','importScripts','indexedDB','caches','BroadcastChannel','Worker','SharedWorker','postMessage']){try{Object.defineProperty(self,k,{value:undefined,configurable:false,writable:false});}catch(e){}}
self.onmessage=e=>{
 const {code,args}=e.data;
 try{
  const solve=new Function('"use strict";\\n'+code+'\\n;if(typeof solve!=="function")throw new ReferenceError("solve is not defined");return solve;')();
  const encoded=JSON.stringify(solve(...args));
  if(typeof encoded!=='string')throw new Error('solve должна возвращать JSON-совместимое значение.');
  post({ok:true,encoded});
 }catch(error){post({ok:false,error:String(error&&error.message||error).slice(0,500)});}
};
post({ready:true});
})();`;
const workerUrl=URL.createObjectURL(new Blob([workerSource],{type:'text/javascript'}));
export function deepEqual(a,b){
 if(a===b)return true;
 if(typeof a!=='object'||typeof b!=='object'||a===null||b===null)return false;
 if(Array.isArray(a)!==Array.isArray(b))return false;
 const ka=Object.keys(a),kb=Object.keys(b);
 return ka.length===kb.length&&ka.every(k=>Object.hasOwn(b,k)&&deepEqual(a[k],b[k]));
}
function runOne(code,args,limit=400){
 return new Promise(resolve=>{
  const worker=new Worker(workerUrl);let timer,done=false;
  const finish=r=>{if(done)return;done=true;clearTimeout(timer);worker.terminate();resolve(r);};
  timer=setTimeout(()=>finish({ok:false,error:'Проверка превысила лимит времени.'}),limit+4000);
  worker.onmessage=e=>{
   if(e.data?.ready){clearTimeout(timer);worker.postMessage({code,args});timer=setTimeout(()=>finish({ok:false,error:'Проверка превысила лимит времени.'}),limit);return;}
   finish(e.data);
  };
  worker.onerror=e=>{e.preventDefault();finish({ok:false,error:String(e.message||'Ошибка выполнения').replace(/^Uncaught /,'').slice(0,500)});};
 });
}
export async function gradeCode(code,tests){
 const results=[];
 for(const test of tests){
  const r=await runOne(code,test.args);
  if(!r.ok){results.push({passed:false,error:r.error});continue;}
  let actual;try{actual=JSON.parse(r.encoded);}catch{results.push({passed:false,error:'solve должна возвращать JSON-совместимое значение.'});continue;}
  results.push({passed:deepEqual(actual,test.expected),actual});
 }
 return {score:Math.round(results.filter(x=>x.passed).length/results.length*100),results};
}
