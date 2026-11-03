import {test} from 'node:test';
import assert from 'node:assert/strict';
import {subjects,questionsFor} from '../frontend/assets/seed.js';
import {questionKk} from '../frontend/assets/question-locales.js';
import {localizeQuestion} from '../frontend/assets/i18n.js';

test('all 100 built-in questions and Russian options have Kazakh translations',()=>{
 assert.equal(Object.keys(questionKk).length,100);
 for(const [slug] of subjects){
  const questions=questionsFor(slug);
  assert.equal(questions.length,20);
  for(const question of questions){
   const before=structuredClone(question);
   const translated=localizeQuestion(question,'kk');
   assert.notEqual(translated.text,question.text);
   assert.equal(translated.correct,question.correct);
   assert.deepEqual(question,before);
   assert.equal(translated.options.length,4);
   question.options.forEach((option,index)=>{
    assert.ok(Object.hasOwn(questionKk[question.text].options,option));
    assert.equal(translated.options[index],questionKk[question.text].options[option]);
    if(/[А-Яа-яЁё]/u.test(option)&&!['Цикл','Стек','Скаляр'].includes(option))assert.notEqual(translated.options[index],option);
   });
   assert.strictEqual(localizeQuestion(question,'ru'),question);
  }
 }
});

test('saved shuffled attempts keep answer indices and switch back without changing data',()=>{
 const question=questionsFor('oop')[1];
 for(let shift=0;shift<4;shift++){
  const shuffled={...question,options:question.options.map((_,i)=>question.options[(i+shift)%4]),correct:(question.correct-shift+4)%4};
  const translated=localizeQuestion(shuffled,'kk');
  assert.equal(translated.options[shuffled.correct],'Класс данасы немесе қасиеттер мен әрекеттер жиынтығы');
  assert.equal(translated.correct,shuffled.correct);
  assert.strictEqual(localizeQuestion(shuffled,'ru'),shuffled);
 }
});

test('unknown teacher questions and added options remain intact',()=>{
 const custom={text:'Авторлық сұрақ?',options:['A','B'],correct:1};
 assert.strictEqual(localizeQuestion(custom,'kk'),custom);
 const known={...questionsFor('oop')[0],options:['Teacher option']};
 assert.deepEqual(localizeQuestion(known,'kk').options,['Teacher option']);
});
