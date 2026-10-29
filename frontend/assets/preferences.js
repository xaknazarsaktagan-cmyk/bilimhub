// Runs in <head> before styles are painted. No network requests or server changes are needed.
(()=>{
 const keys={theme:'bilim-theme',language:'bilim-language'};
 const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
 const write=(key,value)=>{try{localStorage.setItem(key,value);}catch{/* Preferences still work for the current page. */}};
 const validTheme=value=>['light','dark'].includes(value);
 const validLanguage=value=>['ru','kk'].includes(value);
 function theme(value,persist=true){
  if(!validTheme(value))return;
  document.documentElement.dataset.theme=value;document.documentElement.style.colorScheme=value;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',value==='dark'?'#15151b':'#fafafa');
  if(persist)write(keys.theme,value);
  document.dispatchEvent(new CustomEvent('bilim:theme',{detail:{theme:value}}));
 }
 function language(value,persist=true){
  if(!validLanguage(value)||document.documentElement.lang===value)return;
  document.documentElement.lang=value;if(persist)write(keys.language,value);
  document.dispatchEvent(new CustomEvent('bilim:language',{detail:{language:value}}));
 }
 theme(validTheme(read(keys.theme))?read(keys.theme):'light',false);
 document.documentElement.lang=validLanguage(read(keys.language))?read(keys.language):'ru';
 window.BilimPreferences={setTheme:theme,setLanguage:language,getTheme:()=>document.documentElement.dataset.theme,getLanguage:()=>document.documentElement.lang};
 window.addEventListener('storage',event=>{if(event.key===keys.theme)theme(validTheme(event.newValue)?event.newValue:'light',false);if(event.key===keys.language)language(validLanguage(event.newValue)?event.newValue:'ru',false);});
})();
