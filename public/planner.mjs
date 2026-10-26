import { normalizeLocale as normalizeModelLocale, formatDate, numberFormatter } from './i18n.mjs';
import { MENUS } from './menu-data.mjs';
import { getMenuTerms, getMenuNotes, getMenuTitle } from './menu-locales.mjs';

export const EVENTS = ['Свадьба', 'Қыз ұзату', 'Юбилей', 'Семейное торжество', 'Корпоративное событие', 'Новый год', 'Выпускной', 'Другое событие'];
export const HALLS = { help: 'Помогите выбрать зал', main: 'Большой зал', middle: 'Средний зал', small: 'Малый зал' };
export const ENQUIRY_TOPICS = {
  hall: 'Помогите, пожалуйста, подобрать зал для нашего праздника.',
  menu: 'Помогите, пожалуйста, выбрать меню для нашего праздника. Уточните итоговую стоимость и условия оплаты оборудования и оформления.',
  services: 'Хотим обсудить оборудование и оформление зала. Подскажите стоимость нужных нам услуг.',
  guests: 'Подскажите, какая рассадка подойдёт для нашего числа гостей.',
  visit: 'Хотим приехать посмотреть зал. Подскажите, когда это удобно?',
};

const COPY = {
  ru: {
    events: Object.fromEntries(EVENTS.map(event => [event, event])), halls: HALLS, topics: ENQUIRY_TOPICS,
    errors: {
      event: 'Выберите событие.', hall: 'Выберите зал из списка или «Помогите выбрать».',
      date: 'Проверьте дату: выберите её в календаре.', pastDate: 'Эта дата уже прошла. Выберите сегодняшнюю или будущую дату.',
      guests: 'Укажите целое число гостей от 1 до 5000.', wishes: 'Сократите пожелания до 500 символов.', quickTopic: 'Неизвестная тема быстрого запроса.',
    },
    greeting: 'Здравствуйте, Royal Palace!', labels: { event: 'Событие', hall: 'Зал', date: 'Дата', guests: 'Гостей', wishes: 'Пожелания' },
    dateUnknown: 'пока выбираем', hallUnknown: 'пока не выбрали', guestsUnknown: 'пока не знаем',
    conditions: 'Подскажите, пожалуйста, какие у вас условия?', availability: 'Подскажите, пожалуйста, свободна ли дата и какие у вас условия?',
    hallPhotos: hall => `Интересует ${hall}. Пришлите, пожалуйста, фото и варианты рассадки.`,
    smallCapacity: ' На сколько гостей он рассчитан?',
    allPhotos: halls => `Пришлите, пожалуйста, фото всех трёх залов: ${halls.join(', ')}. Подскажите вместимость и варианты рассадки каждого зала.`,
  },
  kk: {
    events: { 'Свадьба': 'Үйлену тойы', 'Қыз ұзату': 'Қыз ұзату', 'Юбилей': 'Мерейтой', 'Семейное торжество': 'Отбасылық мереке', 'Корпоративное событие': 'Корпоративтік іс-шара', 'Новый год': 'Жаңа жыл', 'Выпускной': 'Мектеп бітіру кеші', 'Другое событие': 'Басқа іс-шара' },
    halls: { help: 'Зал таңдауға көмектесіңіз', main: 'Үлкен зал', middle: 'Орта зал', small: 'Кіші зал' },
    topics: {
      hall: 'Мерекемізге лайық зал таңдауға көмектесіңізші.',
      menu: 'Мерекемізге мәзір таңдауға көмектесіңізші. Қорытынды соманы және жабдық пен безендіру ақысын нақтылаңызшы.',
      services: 'Залдың жабдығы мен безендірілуін талқылағымыз келеді. Бізге қажет қызметтердің бағасын айтып беріңізші.',
      guests: 'Қонақтарымыздың санына сай үстелдерді орналастыру нұсқаларын ұсыныңызшы.',
      visit: 'Залды көруге келгіміз келеді. Қай уақытта келуге болады?',
    },
    errors: {
      event: 'Іс-шара түрін таңдаңыз.', hall: 'Тізімнен залды немесе «Зал таңдауға көмектесіңіз» нұсқасын таңдаңыз.',
      date: 'Күнді тексеріп, күнтізбеден таңдаңыз.', pastDate: 'Бұл күн өтіп кетті. Бүгінгі немесе алдағы күнді таңдаңыз.',
      guests: 'Қонақтар санын 1 мен 5000 аралығындағы бүтін санмен көрсетіңіз.', wishes: 'Тілектеріңізді 500 таңбаға дейін қысқартыңыз.', quickTopic: 'Жылдам сұрау тақырыбы белгісіз.',
    },
    greeting: 'Сәлеметсіз бе, Royal Palace!', labels: { event: 'Іс-шара', hall: 'Зал', date: 'Күні', guests: 'Қонақтар саны', wishes: 'Тілектер' },
    dateUnknown: 'әзірге таңдап жатырмыз', hallUnknown: 'әзірге таңдамадық', guestsUnknown: 'әзірге белгісіз',
    conditions: 'Шарттарыңыз туралы айтып беріңізші.', availability: 'Осы күн бос па? Шарттарыңыз туралы айтып беріңізші.',
    hallPhotos: hall => `Бізді ${hall} қызықтырады. Фотосуреттерін және үстелдерді орналастыру нұсқаларын жіберіңізші.`,
    smallCapacity: ' Неше қонаққа арналған?',
    allPhotos: halls => `Үш залдың фотосуреттерін жіберіңізші: ${halls.join(', ')}. Әр залдың сыйымдылығы мен үстелдерді орналастыру нұсқаларын айтып беріңізші.`,
  },
  en: {
    events: { 'Свадьба': 'Wedding', 'Қыз ұзату': 'Qyz uzatu', 'Юбилей': 'Milestone celebration', 'Семейное торжество': 'Family celebration', 'Корпоративное событие': 'Corporate event', 'Новый год': 'New Year', 'Выпускной': 'Graduation', 'Другое событие': 'Other event' },
    halls: { help: 'Help us choose a hall', main: 'Large hall', middle: 'Medium hall', small: 'Small hall' },
    topics: {
      hall: 'Please help us choose a hall for our celebration.',
      menu: 'Please help us choose a menu for our celebration. Please confirm the final quote and the equipment and décor charges.',
      services: 'Please tell us about equipment and décor options and the cost of the services we need.',
      guests: 'Please suggest seating arrangements for our guest count.',
      visit: 'We would like to visit the venue. When would be convenient?',
    },
    errors: {
      event: 'Choose an event.', hall: 'Choose a hall from the list or select “Help us choose a hall”.',
      date: 'Check the date and choose it from the calendar.', pastDate: 'This date has passed. Choose today or a future date.',
      guests: 'Enter a whole number of guests from 1 to 5000.', wishes: 'Shorten your preferences to 500 characters.', quickTopic: 'Unknown quick enquiry topic.',
    },
    greeting: 'Hello, Royal Palace!', labels: { event: 'Event', hall: 'Hall', date: 'Date', guests: 'Guests', wishes: 'Preferences' },
    dateUnknown: 'still deciding', hallUnknown: 'not chosen yet', guestsUnknown: 'not known yet',
    conditions: 'Please tell us about your terms and options.', availability: 'Is this date available? Please tell us about your terms and options.',
    hallPhotos: hall => `We are interested in ${hall}. Please send photos and seating options.`,
    smallCapacity: ' How many guests can it accommodate?',
    allPhotos: halls => `Please send photos of all three halls: ${halls.join(', ')}. Please confirm the capacity and seating options for each hall.`,
  },
};

export function getPlannerCopy(locale = 'ru') {
  const { events, halls, topics } = COPY[normalizeModelLocale(locale)];
  return { events, halls, topics };
}

export function astanaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
}

function validCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateEnquiry(data, today = astanaToday(), locale = 'ru') {
  const copy = COPY[normalizeModelLocale(locale)].errors;
  const errors = {};
  if (!EVENTS.includes(data.event)) errors.event = copy.event;
  if (data.hall && !Object.hasOwn(HALLS, data.hall)) errors.hall = copy.hall;
  const date = String(data.date ?? '').trim();
  if (!data.dateUndecided && date) {
    if (!validCalendarDate(date)) errors.date = copy.date;
    else if (date < today) errors.date = copy.pastDate;
  }
  const guests = String(data.guests ?? '').trim();
  if (!data.guestsUndecided && guests && (!/^\d{1,4}$/.test(guests) || Number(guests) < 1 || Number(guests) > 5000)) {
    errors.guests = copy.guests;
  }
  if (String(data.wishes ?? '').length > 500) errors.wishes = copy.wishes;
  return errors;
}

export function composeMessage(data, locale = 'ru') {
  const copy = COPY[normalizeModelLocale(locale)];
  const dateValue = String(data.date ?? '').trim();
  const dateUnknown = data.dateUndecided || !dateValue;
  const date = dateUnknown ? copy.dateUnknown : formatDate(dateValue, locale);
  const guests = String(data.guests ?? '').trim();
  const wishes = String(data.wishes ?? '').trim();
  const hall = data.hall !== 'help' && Object.hasOwn(copy.halls, data.hall) ? copy.halls[data.hall] : copy.hallUnknown;
  const questions = [...new Set(data.topics ?? [])].filter(topic => Object.hasOwn(copy.topics, topic)).map(topic => copy.topics[topic]);
  const event = Object.hasOwn(copy.events, data.event) ? copy.events[data.event] : data.event;
  return [
    copy.greeting,
    '',
    `${copy.labels.event}: ${event}`,
    `${copy.labels.hall}: ${hall}`,
    `${copy.labels.date}: ${date}`,
    `${copy.labels.guests}: ${data.guestsUndecided || !guests ? copy.guestsUnknown : Number(guests)}`,
    ...(wishes ? [`${copy.labels.wishes}: ${wishes}`] : []),
    '',
    ...(questions.length ? questions : [dateUnknown
      ? copy.conditions
      : copy.availability]),
  ].join('\n');
}

export function composeQuickMessage(topic, hall = 'help', locale = 'ru') {
  const copy = COPY[normalizeModelLocale(locale)];
  let question;
  if (topic === 'menu' || topic === 'services' || topic === 'visit') question = copy.topics[topic];
  else if (topic === 'hallPhotos') {
    if (hall !== 'help' && Object.hasOwn(copy.halls, hall)) {
      question = copy.hallPhotos(copy.halls[hall]);
      if (hall === 'small') question += copy.smallCapacity;
    } else {
      question = copy.allPhotos([copy.halls.main, copy.halls.middle, copy.halls.small]);
    }
  } else throw new RangeError(copy.errors.quickTopic);
  const hallContext = topic === 'services' && hall !== 'help' && Object.hasOwn(copy.halls, hall)
    ? `${copy.labels.hall}: ${copy.halls[hall]}\n\n` : '';
  return `${copy.greeting}\n\n${hallContext}${question}`;
}

export function composeMenuMessage(id, locale = 'ru') {
  const menu = MENUS.find(menu => menu.id === id);
  if (!menu) throw new RangeError('Unknown menu offer.');
  const lang = normalizeModelLocale(locale);
  const copy = COPY[lang];
  const terms = getMenuTerms(menu, lang);
  const labels = {
    ru: { menu: 'Меню', perGuest: 'на гостя', request: 'Хотим обсудить это меню.', quote: 'Подскажите итоговую стоимость и условия оплаты оборудования и оформления.', includedQuote: 'Подтвердите условия и состав включённых услуг.' },
    kk: { menu: 'Мәзір', perGuest: 'әр қонаққа', request: 'Осы мәзірді талқылағымыз келеді.', quote: 'Қорытынды соманы және жабдық пен безендіру ақысын нақтылаңызшы.', includedQuote: 'Шарттарды және бағаға кіретін қызметтерді нақтылаңызшы.' },
    en: { menu: 'Menu', perGuest: 'per guest', request: 'We would like to discuss this menu.', quote: 'Please confirm the final quote and the equipment and décor charges.', includedQuote: 'Please confirm the terms and the included services.' },
  }[lang];
  return [copy.greeting, '', labels.request,
    ...(menu.occasion || menu.hall === 'memorial' ? [] : [`${copy.labels.hall}: ${copy.halls[menu.hall]}`]),
    `${labels.menu}: ${menu.occasion || menu.hall === 'memorial' ? `${getMenuTitle(menu, lang)} · ` : ''}${numberFormatter(lang).format(menu.price)} ₸ ${labels.perGuest}`,
    ...[terms].filter(Boolean),
    ...(menu.occasion ? getMenuNotes(menu, lang).filter(note => !terms.includes(note)) : []), '', menu.servicesIncluded ? labels.includedQuote : labels.quote].join('\n');
}

export function whatsappUrl(message) {
  return `https://wa.me/77715790555?text=${encodeURIComponent(message)}`;
}
