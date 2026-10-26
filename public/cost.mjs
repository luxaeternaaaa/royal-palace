import { normalizeLocale, numberFormatter } from './i18n.mjs';

const COPY = {
  ru: {
    errors: {
      guests: 'Укажите целое число гостей от 1 до 550.',
      budget: 'Укажите бюджет на гостя от 1 000 до 100 000 ₸ целым числом.',
      estimate: 'Проверьте число гостей и бюджет на гостя.',
      draft: 'Проверьте ответы перед подготовкой сообщения.',
    },
    greeting: 'Здравствуйте, Royal Palace!', guests: 'Гостей',
    budget: 'Наш бюджет на гостя', total: 'Ориентир по нашему бюджету',
    note: 'Сумма рассчитана по нашему бюджету. Стоимость ресторана нужно уточнить.',
    confirm: 'Уточните, пожалуйста, актуальное меню, итоговую стоимость и что в неё входит.',
  },
  kk: {
    errors: {
      guests: 'Қонақтар санын 1 мен 550 аралығындағы бүтін санмен көрсетіңіз.',
      budget: 'Бір қонаққа арналған бюджетті 1 000–100 000 ₸ аралығындағы бүтін санмен көрсетіңіз.',
      estimate: 'Қонақтар саны мен бір қонаққа арналған бюджетті тексеріңіз.',
      draft: 'Хабарлама дайындамас бұрын жауаптарыңызды тексеріңіз.',
    },
    greeting: 'Сәлеметсіз бе, Royal Palace!', guests: 'Қонақтар саны',
    budget: 'Бір қонаққа арналған бюджетіміз', total: 'Бюджетіміз бойынша есептелген жалпы сома',
    note: 'Сома өз бюджетіміз бойынша есептелді. Мейрамхана бағасын нақтылау қажет.',
    confirm: 'Қазіргі мәзірді, нақты жалпы құнын және оған не кіретінін айтып беріңізші.',
  },
  en: {
    errors: {
      guests: 'Enter a whole number of guests from 1 to 550.',
      budget: 'Enter a whole-number budget per guest from 1,000 to 100,000 ₸.',
      estimate: 'Check the guest count and budget per guest.',
      draft: 'Check your answers before preparing the message.',
    },
    greeting: 'Hello, Royal Palace!', guests: 'Guests',
    budget: 'Our budget per guest', total: 'Estimated total based on our budget',
    note: 'This amount is based on our budget. The venue price still needs confirmation.',
    confirm: 'Please confirm the current menu, final price and what it includes.',
  },
};

function integerInRange(value, min, max) {
  if (typeof value !== 'string' && typeof value !== 'number') return false;
  const text = String(value).trim();
  return /^\d+$/.test(text) && Number(text) >= min && Number(text) <= max;
}

export function validateBudget(data, locale = 'ru') {
  const copy = COPY[normalizeLocale(locale)].errors;
  const errors = {};
  if (!integerInRange(data.guests, 1, 550)) errors.guests = copy.guests;
  if (!integerInRange(data.budget, 1000, 100000)) errors.budget = copy.budget;
  return errors;
}

export function estimateBudget(guests, budget, locale = 'ru') {
  if (!integerInRange(guests, 1, 550) || !integerInRange(budget, 1000, 100000)) throw new RangeError(COPY[normalizeLocale(locale)].errors.estimate);
  return Number(guests) * Number(budget);
}

export function composeCostMessage(data, locale = 'ru') {
  const copy = COPY[normalizeLocale(locale)];
  if (Object.keys(validateBudget(data, locale)).length) throw new RangeError(copy.errors.draft);
  const total = estimateBudget(data.guests, data.budget, locale);
  const formatter = numberFormatter(locale);
  const format = value => formatter.format(Number(value));
  return [
    copy.greeting,
    '',
    `${copy.guests}: ${format(data.guests)}.`,
    `${copy.budget}: ${format(data.budget)} ₸.`,
    `${copy.total}: ${format(total)} ₸ (${format(data.guests)} × ${format(data.budget)} ₸).`,
    copy.note,
    '',
    copy.confirm,
  ].join('\n');
}
