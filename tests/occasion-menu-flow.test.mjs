import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MENUS} from '../public/menu-data.mjs';
import {getMenuKind,getMenuCollection,getMenuTitle,getMenuSections,getMenuNotes,getMenuTerms} from '../public/menu-locales.mjs';
import {composeMenuMessage,whatsappUrl} from '../public/planner.mjs';

test('same hall and price never mix banquet, New Year and graduation offers',()=>{
  assert.equal(MENUS.length,21);
  assert.equal(new Set(MENUS.map(m=>m.id)).size,21);
  const collections=new Map();
  for(const menu of MENUS){const key=getMenuCollection(menu);if(!collections.has(key))collections.set(key,[]);collections.get(key).push(menu);}
  assert.deepEqual([...collections.values()].map(menus=>menus.length),[3,3,3,1,3,3,3,2]);
  const banquet=MENUS.find(m=>m.id==='main-40000'),seasonal=MENUS.find(m=>m.id==='newyear-middle-40000');
  assert.equal(banquet.price,seasonal.price);
  assert.notEqual(getMenuCollection(banquet),getMenuCollection(seasonal));
  for(const menu of MENUS.filter(m=>m.occasion==='graduation')){assert.equal(menu.hall,null);assert.equal(getMenuKind(menu),'graduation');}
});

test('translated enquiries identify the event and included services without inventing a hall or meat condition',()=>{
  for(const menu of MENUS.filter(m=>m.occasion))for(const locale of ['ru','kk','en']){
    const title=getMenuTitle(menu,locale),message=composeMenuMessage(menu.id,locale);
    assert.ok(title&&!title.includes('undefined'));
    assert.ok(message.includes(title));
    assert.ok(getMenuTerms(menu,locale).includes(menu.servicesIncluded ? getMenuNotes(menu,locale)[1] : getMenuNotes(menu,locale).at(-1)));
    assert.equal(new URL(whatsappUrl(message)).searchParams.get('text'),message);
    assert.doesNotMatch(message,/undefined|null|заказчик|customer.*meat|48–60.*500/);
    if(menu.servicesIncluded){assert.ok(message.includes(getMenuNotes(menu,locale)[1]));assert.doesNotMatch(message,/1[\s,]000[\s,]000|equipment and décor charges/);}
    if(menu.hall===null)assert.doesNotMatch(message,/Большой зал|Үлкен зал|Large hall/);
    if(locale==='en')assert.doesNotMatch(title+message,/[А-Яа-яӘәҒғҚқҢңӨөҰұҮүІі]/);
  }
});

test('new dishes and explicit alternatives remain present in every language without raw descriptions',()=>{
  for(const menu of MENUS.filter(m=>m.occasion))for(const locale of ['ru','kk','en']){
    const sections=getMenuSections(menu,locale);
    assert.equal(sections.flatMap(s=>s.items).length,menu.columns.flat().flatMap(s=>s.items).length);
    assert.ok(sections.every(s=>s.items.every(item=>item.detail==='')));
  }
  const invalid={...MENUS[0],columns:[[{title:'Unknown category',items:[]}]]};
  assert.throws(()=>getMenuSections(invalid),/Unknown menu section/);
});

test('native menu categories retain the complete Russian no-JavaScript fallback',async()=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  for(const kind of ['banquet','newyear','graduation','memorial'])assert.ok(html.includes(`option value="${kind}"`));
  for(const menu of MENUS)assert.equal([...html.matchAll(new RegExp(`data-menu-id="${menu.id}"`,'g'))].length,1,menu.id);
  assert.match(html,/id="menu-kind-control" hidden/);
  assert.doesNotMatch(html,/data-menu-filter="memorial"|href="[^"]+\.pdf"/);
});
