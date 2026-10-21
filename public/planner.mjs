export const EVENTS = ['Свадьба', 'Қыз ұзату', 'Юбилей', 'Семейное торжество', 'Корпоративное событие', 'Другое событие'];
export const HALLS = { help: 'Помогите выбрать зал', main: 'Основной зал', middle: 'Орта зал (средний)', small: 'Кіші зал (малый)' };
export const ENQUIRY_TOPICS = {
  hall: 'Помогите, пожалуйста, подобрать зал для нашего праздника.',
  menu: 'Пришлите, пожалуйста, актуальное меню с ценами. Что входит в стоимость банкета?',
  guests: 'Подскажите, какая рассадка подойдёт для нашего числа гостей.',
  visit: 'Хотим приехать посмотреть зал. Подскажите, когда это удобно?',
};

export function astanaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
}

function validCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateEnquiry(data, today = astanaToday()) {
  const errors = {};
  if (!EVENTS.includes(data.event)) errors.event = 'Выберите событие.';
  if (data.hall && !Object.hasOwn(HALLS, data.hall)) errors.hall = 'Выберите зал из списка или «Помогите выбрать».';
  const date = String(data.date ?? '').trim();
  if (!data.dateUndecided && date) {
    if (!validCalendarDate(date)) errors.date = 'Проверьте дату: выберите её в календаре.';
    else if (date < today) errors.date = 'Эта дата уже прошла. Выберите сегодняшнюю или будущую дату.';
  }
  const guests = String(data.guests ?? '').trim();
  if (!data.guestsUndecided && guests && (!/^\d{1,4}$/.test(guests) || Number(guests) < 1 || Number(guests) > 5000)) {
    errors.guests = 'Укажите целое число гостей от 1 до 5000.';
  }
  if (String(data.wishes ?? '').length > 500) errors.wishes = 'Сократите пожелания до 500 символов.';
  return errors;
}

export function composeMessage(data) {
  const dateValue = String(data.date ?? '').trim();
  const dateUnknown = data.dateUndecided || !dateValue;
  const date = dateUnknown ? 'пока выбираем' : new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Almaty',
  }).format(new Date(`${dateValue}T12:00:00Z`)).replace(/ г\.$/, '');
  const guests = String(data.guests ?? '').trim();
  const wishes = String(data.wishes ?? '').trim();
  const hall = data.hall !== 'help' && Object.hasOwn(HALLS, data.hall) ? HALLS[data.hall] : 'пока не выбрали';
  const questions = [...new Set(data.topics ?? [])].map(topic => ENQUIRY_TOPICS[topic]).filter(Boolean);
  return [
    'Здравствуйте, Royal Palace!',
    '',
    `Событие: ${data.event}`,
    `Зал: ${hall}`,
    `Дата: ${date}`,
    `Гостей: ${data.guestsUndecided || !guests ? 'пока не знаем' : Number(guests)}`,
    ...(wishes ? [`Пожелания: ${wishes}`] : []),
    '',
    ...(questions.length ? questions : [dateUnknown
      ? 'Подскажите, пожалуйста, какие у вас условия?'
      : 'Подскажите, пожалуйста, свободна ли дата и какие у вас условия?']),
  ].join('\n');
}

export function composeQuickMessage(topic, hall = 'help') {
  let question;
  if (topic === 'menu' || topic === 'visit') question = ENQUIRY_TOPICS[topic];
  else if (topic === 'hallPhotos') {
    if (hall !== 'help' && Object.hasOwn(HALLS, hall)) {
      question = `Интересует ${HALLS[hall]}. Пришлите, пожалуйста, фото и варианты рассадки.`;
      if (hall === 'small') question += ' На сколько гостей он рассчитан?';
    } else {
      question = `Пришлите, пожалуйста, фото всех трёх залов: ${[HALLS.main, HALLS.middle, HALLS.small].join(', ')}. Подскажите вместимость и варианты рассадки каждого зала.`;
    }
  } else throw new RangeError('Неизвестная тема быстрого запроса.');
  return `Здравствуйте, Royal Palace!\n\n${question}`;
}

export function whatsappUrl(message) {
  return `https://wa.me/77715790555?text=${encodeURIComponent(message)}`;
}
