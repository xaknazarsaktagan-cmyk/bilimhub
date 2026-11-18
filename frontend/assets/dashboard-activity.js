import {formatCalendarDay,tr} from './i18n.js';
import {esc,icon} from './common.js';

export function mountActivity(after, attempts) {
 const panel=document.createElement('section');
 panel.className='card dashboard-activity';
 panel.innerHTML=`
  <div class="activity-heading">
   <div><h2>${tr("Работы по дням")}</h2><p>${tr("Нажмите на день, чтобы открыть работы.")}</p></div>
   <div class="activity-period" role="group" aria-label="${tr("Период")}">
    <button class="btn small" type="button" data-days="7">${tr("7 дней")}</button>
    <button class="btn small" type="button" data-days="30">${tr("30 дней")}</button>
   </div>
  </div>
  <div class="activity-total" aria-live="polite"></div>
  <div class="activity-scroll"><div class="activity-bars"></div></div>
  <div class="activity-detail">
   <div class="activity-summary" aria-live="polite"></div>
   <div class="activity-works"></div>
  </div>`;
 after.after(panel);

 const scroll=panel.querySelector('.activity-scroll');
 const bars=panel.querySelector('.activity-bars');
 const total=panel.querySelector('.activity-total');
 const summary=panel.querySelector('.activity-summary');
 const works=panel.querySelector('.activity-works');
 const periods=[...panel.querySelectorAll('[data-days]')];
 const today=new Date();
 today.setHours(0,0,0,0);
 const days=Array.from({length:31},(_,i)=>new Date(today.getFullYear(),today.getMonth(),today.getDate()+i-29));
 const records=days.slice(0,-1).map((day,i)=>({
  day,
  items:attempts.filter(attempt=>attempt.status!=='in_progress' && attempt.submitted_at>=day.getTime() && attempt.submitted_at<days[i+1].getTime())
 }));

 function selectDay(index, visible) {
  for(const bar of bars.children)bar.setAttribute('aria-pressed',String(Number(bar.dataset.day)===index));
  const {day,items}=visible[index];
  summary.innerHTML=`<span class="activity-selected-label">${tr("Выбранный день")}</span><strong>${esc(formatCalendarDay(day))}</strong><span>${tr("Отправленные работы")}: ${items.length}</span>`;
  works.innerHTML=items.length
   ? items.slice(0,3).map(attempt=>`<a class="activity-work" href="#result/${esc(attempt.id)}"><span>${esc(attempt.title)}</span>${icon('arrow')}</a>`).join('')
   : `<p>${tr("В этот день работы не отправляли.")}</p>`;
  if(items.length>3)works.insertAdjacentHTML('beforeend',`<a class="activity-work" href="#${document.body.dataset.role==='teacher'?'reviews':'results'}">${tr("Все работы →")}</a>`);
 }

 function draw(period) {
  const visible=records.slice(-period);
  const count=visible.reduce((sum,day)=>sum+day.items.length,0);
  const label=tr(period===7?"За последние 7 дней":"За последние 30 дней");
  total.innerHTML=`<strong>${count}</strong><span>${tr("Отправленные работы")}<small>${label}</small></span>`;
  const max=Math.max(1,...visible.map(record=>record.items.length));
  for(const button of periods)button.setAttribute('aria-pressed',String(Number(button.dataset.days)===period));
  bars.style.setProperty('--days',period);
  bars.innerHTML=visible.map(({day,items},index)=>`<button class="activity-day" type="button" data-day="${index}" aria-label="${esc(formatCalendarDay(day))}. ${tr("Отправленные работы")}: ${items.length}">
   <span class="activity-count" aria-hidden="true">${items.length}</span>
   <span class="activity-bar-track" aria-hidden="true">${items.length?`<span style="--fill:${items.length/max}"></span>`:''}</span>
   <span class="activity-date" aria-hidden="true">${day.getDate()}.${String(day.getMonth()+1).padStart(2,'0')}</span>
  </button>`).join('');
  for(const button of bars.children)button.onclick=()=>selectDay(Number(button.dataset.day),visible);
  const last=visible.findLastIndex(record=>record.items.length>0);
  const selected=last<0 ? visible.length-1 : last;
  selectDay(selected,visible);
  scroll.scrollLeft=bars.children[selected].offsetLeft-scroll.clientWidth/2;
 }

 for(const button of periods)button.onclick=()=>draw(Number(button.dataset.days));
 draw(7);
}
