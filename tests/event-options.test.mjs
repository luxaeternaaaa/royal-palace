import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {EVENTS,getPlannerCopy,composeMessage,validateEnquiry} from '../public/planner.mjs';
import {PAGE_COPY} from '../public/page-locales.mjs';

test('New Year and graduation can be requested through the ordinary form in every language',async()=>{
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 for(const [event,key]of [['Новый год','newyear'],['Выпускной','graduation']]) {
  assert.ok(EVENTS.includes(event));
  assert.ok(html.includes(`value="${event}" data-i18n="events.${key}"`));
  for(const locale of ['ru','kk','en']) {
   const copy=getPlannerCopy(locale),data={event,date:'',guests:'',hall:'help',wishes:'Әже <&> пожелание'};
   assert.equal(copy.events[event],PAGE_COPY[locale][`events.${key}`]);
   assert.deepEqual(validateEnquiry(data,'2026-10-25',locale),{});
   const message=composeMessage(data,locale);
   assert.ok(message.includes(copy.events[event]));assert.ok(message.includes(data.wishes));
  }
 }
});
