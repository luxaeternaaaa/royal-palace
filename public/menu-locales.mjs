// Exact menu translations; the verified Russian source stays in menu-data.mjs.
import { PAGE_COPY } from './page-locales.mjs';
import { OCCASION_TRANSLATIONS } from './occasion-menu-locales.mjs';

const translations = new Map([
  ['Рыбное плато', 'Балық ассортиі', 'Fish platter'],
  ['Лосось, эсколар, угорь', 'Албырт, эсколар, жыланбалық', 'Salmon, escolar, eel'],
  ['Ассорти «Казахстан»', '«Қазақстан» ет ассортиі', 'Kazakhstan meat platter'],
  ['Казы, шужык, жая', 'Қазы, шұжық, жая', 'Kazy, shuzhyk, zhaya'],
  ['Кавказская закуска', 'Кавказ тіскебасары', 'Caucasian vegetable platter'],
  ['Огурцы, помидоры, редис, болгарский перец, брынза, зелень', 'Қияр, қызанақ, шалғам, болгар бұрышы, брынза, көк', 'Cucumber, tomatoes, radishes, bell pepper, brynza cheese, herbs'],
  ['Капрезе', 'Капрезе', 'Caprese'],
  ['Помидоры, моцарелла, соус песто', 'Қызанақ, моцарелла, песто тұздығы', 'Tomatoes, mozzarella, pesto'],
  ['«Цезарь» с курицей', 'Тауық еті қосылған «Цезарь»', 'Chicken Caesar salad'],
  ['Айсберг, черри, перепелиное яйцо, сухари, пармезан, авторский соус', 'Айсберг салаты, черри қызанағы, бөдене жұмыртқасы, кепкен нан, пармезан, арнайы тұздық', 'Iceberg lettuce, cherry tomatoes, quail egg, croutons, parmesan, house dressing'],
  ['Салат с маринованной сёмгой', 'Маринадталған албырт қосылған салат', 'Marinated salmon salad'],
  ['Микс салата, туркестанские томаты, творог, авторский соус', 'Салат жапырақтары, Түркістан қызанағы, сүзбе, арнайы тұздық', 'Mixed leaves, Turkestan tomatoes, cottage cheese, house dressing'],
  ['Запечённая тыква со свёклой', 'Қызылша қосылған пеште піскен асқабақ', 'Roasted pumpkin and beetroot'],
  ['Творожный мусс, миндальный слайс', 'Сүзбе муссы, бадам тілімдері', 'Cottage-cheese mousse, flaked almonds'],
  ['Говядина «Royal»', '«Royal» сиыр еті', 'Royal beef salad'],
  ['Шпинат, киноа, черри, проросший маш, авторский соус', 'Шпинат, киноа, черри қызанағы, өнген маш, арнайы тұздық', 'Spinach, quinoa, cherry tomatoes, mung-bean sprouts, house dressing'],
  ['Хлеб и гриссини', 'Нан және гриссини', 'Bread and grissini'],
  ['Бауырсаки', 'Бауырсақ', 'Baursak'],
  ['Самса с мясом', 'Етті самса', 'Meat samsa'],
  ['1 шт. на гостя', 'Әр қонаққа 1 дана', '1 piece per guest'],
  ['Бореки с картофелем', 'Картопты бөрек', 'Potato börek'],
  ['Бешбармак', 'Бесбармақ', 'Beshbarmak'],
  ['Мясо заказчика', 'Етті тапсырыс беруші әкеледі', 'Meat supplied by the customer'],
  ['Запечённый судак', 'Пеште піскен көксерке', 'Baked pike-perch'],
  ['Овощная капоната, соус из цукини', 'Көкөніс капонатасы, цукини тұздығы', 'Vegetable caponata, zucchini sauce'],
  ['Профитроли и трубочки', 'Профитроль және түтікше тәттілері', 'Profiteroles and pastry rolls'],
  ['Ассорти мини-пирожных', 'Шағын тәттілер ассортиі', 'Assorted mini pastries'],
  ['Фруктовая ваза', 'Жеміс ассортиі', 'Fruit platter'],
  ['Конфеты', 'Кәмпит', 'Sweets'],
  ['Сладкая композиция', 'Тәттілер композициясы', 'Sweet arrangement'],
  ['Чай с молоком или без', 'Сүт қосылған немесе сүтсіз шай', 'Tea with or without milk'],
  ['без ограничений', 'шектеусіз', 'unlimited'],
  ['Клюквенный морс', 'Мүкжидек морсы', 'Cranberry fruit drink'],
  ['6 л', '6 л', '6 L'],
  ['Рыбная нарезка', 'Балық тілімдері', 'Sliced fish platter'],
  ['Баллотин из куриной грудки', 'Тауықтың төс етінен баллотин', 'Chicken breast ballotine'],
  ['С курагой и фисташками', 'Кептірілген өрік пен пісте қосылған', 'With dried apricots and pistachios'],
  ['Салат с ягодным соусом', 'Жидек тұздығы қосылған салат', 'Salad with berry dressing'],
  ['Филе утки, микс зелени, черри, апельсины, грейпфрут', 'Үйрек еті, көк жапырақтар, черри қызанағы, апельсин, грейпфрут', 'Duck fillet, mixed leaves, cherry tomatoes, oranges, grapefruit'],
  ['Буррата с креветками', 'Асшаян қосылған буррата', 'Burrata with prawns'],
  ['Руккола, соус песто', 'Руккола, песто тұздығы', 'Rocket, pesto'],
  ['Салат с курицей и черносливом', 'Тауық еті мен қара өрік қосылған салат', 'Chicken and prune salad'],
  ['Шампиньоны, цветная капуста, черри, бейби-картофель, майонез с трюфельной пастой', 'Қозықұйрық, гүлді қырыққабат, черри қызанағы, шағын картоп, трюфель пастасы қосылған майонез', 'Mushrooms, cauliflower, cherry tomatoes, baby potatoes, mayonnaise with truffle paste'],
  ['Лосось', 'Албырт', 'Salmon'],
  ['Пюре из сельдерея, икорный соус', 'Балдыркөк езбесі, уылдырық тұздығы', 'Celery purée, roe sauce'],
  ['6 л на стол', 'Әр үстелге 6 л', '6 L per table'],
  ['Мясная нарезка', 'Ет тілімдері', 'Sliced meat platter'],
  ['Ассорти сыров', 'Ірімшік ассортиі', 'Cheese platter'],
  ['Бри, пармезан, эмменталь, чеддер, виноград, мёд, орехи', 'Бри, пармезан, эмменталь, чеддер, жүзім, бал, жаңғақ', 'Brie, parmesan, emmental, cheddar, grapes, honey, nuts'],
  ['Мусс из страчателлы с томатами черри', 'Черри қызанағы қосылған страчателла муссы', 'Stracciatella mousse with cherry tomatoes'],
  ['Греческий салат с сыром «Салакис»', '«Салакис» ірімшігі қосылған грек салаты', 'Greek salad with Salakis cheese'],
  ['Брокколи, цветная капуста, эдамаме, томаты, цитрусовый соус', 'Брокколи, гүлді қырыққабат, эдамаме, қызанақ, цитрус тұздығы', 'Broccoli, cauliflower, edamame, tomatoes, citrus dressing'],
  ['Нисуаз со свежим тунцом', 'Балғын тунец қосылған нисуаз', 'Niçoise with fresh tuna'],
  ['Авокадо, болгарский перец, эдамаме, соус унаги', 'Авокадо, болгар бұрышы, эдамаме, унаги тұздығы', 'Avocado, bell pepper, edamame, unagi sauce'],
  ['Самса с мясом и грибами', 'Ет пен саңырауқұлақ қосылған самса', 'Meat and mushroom samsa'],
  ['Палтус', 'Палтус', 'Halibut'],
  ['Мусс из цветной капусты, шпинат, сливочно-шафрановый соус', 'Гүлді қырыққабат муссы, шпинат, кілегейлі шафран тұздығы', 'Cauliflower mousse, spinach, saffron cream sauce'],
  ['Мясная «Казахстан»', '«Қазақстан» ет ассортиі', 'Kazakhstan meat platter'],
  ['Самса с мясом и с грибами', 'Етті самса және саңырауқұлақты самса', 'Meat samsa and mushroom samsa'],
  ['Лосось, эсколар', 'Албырт, эсколар', 'Salmon, escolar'],
  ['Овощное ассорти', 'Көкөніс ассортиі', 'Vegetable platter'],
  ['Куриный салат', 'Тауық еті қосылған салат', 'Chicken salad'],
  ['Грибы, овощи', 'Саңырауқұлақ, көкөніс', 'Mushrooms, vegetables'],
  ['Фунчоза по-азиатски', 'Азиялық фунчоза', 'Asian-style glass-noodle salad'],
  ['Хрустящие баклажаны', 'Қытырлақ баялды', 'Crispy aubergines'],
  ['Кисло-сладкий соус', 'Қышқыл-тәтті тұздық', 'Sweet-and-sour sauce'],
  ['Хлебная корзина', 'Нан себеті', 'Bread basket'],
  ['Шелпеки', 'Шелпек', 'Shelpek'],
  ['Вода', 'Су', 'Water'],
  ['Запечённый судак с овощной капонатой и соусом из цукини', 'Көкөніс капонатасы және цукини тұздығымен пеште піскен көксерке', 'Baked pike-perch with vegetable caponata and zucchini sauce'],
  ['Лосось на пюре из сельдерея под икорным соусом', 'Балдыркөк езбесі және уылдырық тұздығымен албырт', 'Salmon with celery purée and roe sauce'],
  ['Палтус с муссом из цветной капусты и шпинатом в сливочно-шафрановом соусе', 'Гүлді қырыққабат муссы, шпинат және кілегейлі шафран тұздығымен палтус', 'Halibut with cauliflower mousse, spinach and saffron cream sauce'],
  ...OCCASION_TRANSLATIONS,
].map(([ru, kk, en]) => [ru, { ru, kk, en }]));

const sectionGroups = [
  { titles: ['Холодные закуски'], ru: 'Закуски', kk: 'Тіскебасарлар', en: 'Starters' },
  { titles: ['Салаты'], ru: 'Салаты', kk: 'Салаттар', en: 'Salads' },
  { titles: ['Выпечка', 'Горячие закуски', 'Горячая закуска'], ru: 'Выпечка', kk: 'Нан және қамыр тағамдары', en: 'Bread & pastries' },
  { titles: ['Основное блюдо', 'Второе горячее'], ru: 'Горячее', kk: 'Ыстық тағамдар', en: 'Main courses' },
  { titles: ['Десерты'], ru: 'Десерты', kk: 'Тәттілер', en: 'Desserts' },
  { titles: ['Напитки'], ru: 'Напитки', kk: 'Сусындар', en: 'Drinks' },
];
const terms = new Map([
  ['Понедельник–четверг', { ru: 'Понедельник–четверг', kk: 'Дүйсенбі–бейсенбі', en: 'Monday–Thursday' }],
  ['Пятница–воскресенье', { ru: 'Пятница–воскресенье', kk: 'Жұма–жексенбі', en: 'Friday–Sunday' }],
  ['200–500 гостей', { ru: '200–500 гостей', kk: '200–500 қонақ', en: '200–500 guests' }],
  ['250–500 гостей', { ru: '250–500 гостей', kk: '250–500 қонақ', en: '250–500 guests' }],
  ['До 500 гостей', { ru: 'До 500 гостей', kk: '500 қонаққа дейін', en: 'Up to 500 guests' }],
  ['84–144 гостя', { ru: '84–144 гостя', kk: '84–144 қонақ', en: '84–144 guests' }],
  ['48–60 гостей', { ru: '48–60 гостей', kk: '48–60 қонақ', en: '48–60 guests' }],
  ['11:00–14:00', { ru: '11:00–14:00', kk: '11:00–14:00', en: '11:00–14:00' }],
]);
const language = locale => ['ru', 'kk', 'en'].includes(locale) ? locale : 'ru';
function translate(text, locale) {
  if (!text) return '';
  const entry = translations.get(text);
  if (!entry) throw new Error(`Missing menu translation: ${text}`);
  return entry[language(locale)];
}

export function getMenuSections(menu, locale = 'ru') {
  const lang = language(locale);
  const sections = menu.columns.flat();
  const knownTitles = new Set(sectionGroups.flatMap(group => group.titles));
  for (const section of sections) if (!knownTitles.has(section.title)) throw new Error(`Unknown menu section: ${section.title}`);
  return sectionGroups.map(group => ({
    title: group[lang],
    items: sections.filter(section => group.titles.includes(section.title)).flatMap(section => section.items.map(item => ({
      name: translate(section.title === 'Второе горячее' ? item.name : item.label ?? item.name, lang),
      detail: translate(item.detail ?? item.ingredients, lang),
    }))),
  })).filter(section => section.items.length);
}

export function getMenuTerms(menu, locale = 'ru') {
  const lang = language(locale);
  if (menu.id === 'middle-38000') return { ru: 'Условия этого меню уточняются.', kk: 'Бұл мәзірдің шарттары нақтыланады.', en: 'Terms for this menu are to be confirmed.' }[lang];
  const fragments = [menu.days, menu.guests].filter(Boolean).map(text => {
    if (!terms.has(text)) throw new Error(`Missing menu terms: ${text}`);
    return terms.get(text)[lang];
  });
  if (menu.serviceTerms) fragments.push(translate(menu.serviceTerms, lang));
  return fragments.join(' · ');
}

export function getMenuNotes(menu, locale = 'ru') {
  const lang = language(locale);
  if (menu.notes) return menu.notes.map(note => translate(note, lang));
  const copy = {
    ru: { meat: 'Мясо для бешбармака предоставляет заказчик.', portions: 'Самса и бореки — по 1 шт. на гостя.', tea: 'Чай — без ограничений.', cranberry: amount => `Клюквенный морс — ${amount}.` },
    kk: { meat: 'Бесбармаққа етті тапсырыс беруші әкеледі.', portions: 'Самса мен бөрек — әр қонаққа 1 данадан.', tea: 'Шай — шектеусіз.', cranberry: amount => `Мүкжидек морсы — ${amount}.` },
    en: { meat: 'Beshbarmak meat is supplied by the customer.', portions: 'Samsa and börek: 1 piece of each per guest.', tea: 'Unlimited tea.', cranberry: amount => `Cranberry fruit drink: ${amount}.` },
  }[lang];
  const items = menu.columns.flat().flatMap(section => section.items);
  const notes = items.some(item => item.ingredients === 'Мясо предоставляет заказчик') ? [copy.meat] : [];
  if (items.some(item => item.ingredients === '1 шт. на гостя')) notes.push(copy.portions);
  if (items.some(item => item.name.startsWith('Чай') && item.ingredients === 'Без ограничений')) notes.push(copy.tea);
  const cranberry = items.find(item => item.name === 'Клюквенный морс');
  if (cranberry) notes.push(copy.cranberry(translate(cranberry.ingredients, lang)));
  return notes;
}

export function getMenuFooterNotes(menu, locale = 'ru') {
  const notes = getMenuNotes(menu, locale);
  const terms = getMenuTerms(menu, locale).split(' · ').filter(term => term && !notes.includes(term));
  return [...notes, terms.join(' · ')].filter(Boolean);
}

export function menuHall(hall, locale = 'ru') {
  return PAGE_COPY[language(locale)][hall === 'memorial' ? 'menu.asBeru' : `halls.${hall}`];
}

export function getMenuKind(menu) {
  return menu.occasion ?? (menu.hall === 'memorial' ? 'memorial' : 'banquet');
}

export function getMenuCollection(menu) {
  return `${getMenuKind(menu)}-${menu.hall ?? 'venue'}`;
}

export function getMenuTitle(menu, locale = 'ru') {
  const lang = language(locale);
  if (menu.occasion === 'graduation') return PAGE_COPY[lang]['menu.graduation'];
  if (menu.occasion === 'newyear') return `${PAGE_COPY[lang]['menu.newyear']} · ${menuHall(menu.hall, lang)}`;
  return menuHall(menu.hall, lang);
}

export function getMenuAsset(menu, locale = 'ru', variant = 'full') {
  if (!['full', 'preview'].includes(variant)) throw new RangeError(`Unknown menu image variant: ${variant}`);
  const lang = language(locale);
  return `/assets/menus/${lang === 'ru' ? '' : `${lang}/`}${menu.id}${variant === 'preview' ? '-preview' : ''}.webp`;
}
