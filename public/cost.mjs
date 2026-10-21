import { EVENTS, astanaToday, validateEnquiry, composeMessage } from './planner.mjs';
import { normalizeLocale as normalizeModelLocale, numberFormatter } from './i18n.mjs';

export const COST_HELP = {
  banquet: 'Банкет и меню',
  planning: 'Помощь с организацией',
  program: 'Обсудить программу',
  own: 'Организуем сами',
  undecided: 'Пока не решили',
};

export const COST_PRIORITIES = {
  menu: 'Меню и подача',
  seating: 'Рассадка и удобство гостей',
  equipment: 'Звук и свет',
  timing: 'Программа и тайминг',
};

const COPY = {
  ru: {
    help: COST_HELP, priorities: COST_PRIORITIES,
    errors: {
      step: 'Неизвестный шаг расчёта.', guests: 'Укажите целое число гостей от 1 до 550.',
      budget: 'Укажите бюджет на гостя от 1 000 до 100 000 ₸ целым числом.', help: 'Выберите вариант из списка или пропустите вопрос.',
      priorities: 'Выберите пожелания из списка.', estimate: 'Проверьте число гостей и бюджет на гостя.', draft: 'Проверьте ответы перед подготовкой сообщения.',
    },
    budget: 'Наш бюджет на гостя', total: 'Ориентир по нашему бюджету', note: 'Сумма рассчитана по нашему бюджету. Стоимость ресторана нужно уточнить.',
    organisation: 'Пожелание по организации', important: 'Для нас важно', confirm: 'Уточните, пожалуйста, актуальное меню, итоговую стоимость и что в неё входит.',
  },
  kk: {
    help: { banquet: 'Банкет пен мәзір', planning: 'Ұйымдастыруға көмек', program: 'Бағдарламаны талқылау', own: 'Өзіміз ұйымдастырамыз', undecided: 'Әлі шешкен жоқпыз' },
    priorities: { menu: 'Мәзір және тағам ұсыну', seating: 'Қонақтардың жайлылығы мен отыру реті', equipment: 'Дыбыс пен жарық', timing: 'Бағдарлама мен уақыт кестесі' },
    errors: {
      step: 'Есептеу қадамы белгісіз.', guests: 'Қонақтар санын 1 мен 550 аралығындағы бүтін санмен көрсетіңіз.',
      budget: 'Бір қонаққа арналған бюджетті 1 000–100 000 ₸ аралығындағы бүтін санмен көрсетіңіз.', help: 'Тізімнен нұсқа таңдаңыз немесе сұрақты өткізіп жіберіңіз.',
      priorities: 'Тізімнен қалауларыңызды таңдаңыз.', estimate: 'Қонақтар саны мен бір қонаққа арналған бюджетті тексеріңіз.', draft: 'Хабарлама дайындамас бұрын жауаптарыңызды тексеріңіз.',
    },
    budget: 'Бір қонаққа арналған бюджетіміз', total: 'Бюджетіміз бойынша есептелген жалпы сома', note: 'Сома өз бюджетіміз бойынша есептелді. Мейрамхана бағасын нақтылау қажет.',
    organisation: 'Ұйымдастыру бойынша қалауымыз', important: 'Біз үшін маңызды', confirm: 'Қазіргі мәзірді, нақты жалпы құнын және оған не кіретінін айтып беріңізші.',
  },
  en: {
    help: { banquet: 'Banquet and menu', planning: 'Help with planning', program: 'Discuss the programme', own: 'We will organise it ourselves', undecided: 'Not decided yet' },
    priorities: { menu: 'Menu and food presentation', seating: 'Seating and guest comfort', equipment: 'Sound and lighting', timing: 'Programme and timing' },
    errors: {
      step: 'Unknown estimate step.', guests: 'Enter a whole number of guests from 1 to 550.',
      budget: 'Enter a whole-number budget per guest from 1,000 to 100,000 ₸.', help: 'Choose an option from the list or skip this question.',
      priorities: 'Choose preferences from the list.', estimate: 'Check the guest count and budget per guest.', draft: 'Check your answers before preparing the message.',
    },
    budget: 'Our budget per guest', total: 'Estimated total based on our budget', note: 'This amount is based on our budget. The venue price still needs confirmation.',
    organisation: 'Planning preference', important: 'What matters to us', confirm: 'Please confirm the current menu, final price and what it includes.',
  },
};

export function getCostCopy(locale = 'ru') {
  const { help, priorities } = COPY[normalizeModelLocale(locale)];
  return { help, priorities };
}

function integerInRange(value, min, max) {
  const text = String(value ?? '').trim();
  return /^\d+$/.test(text) && Number(text) >= min && Number(text) <= max;
}

export function validateCostStep(step, data, today = astanaToday(), locale = 'ru') {
  const copy = COPY[normalizeModelLocale(locale)].errors;
  if (!Number.isInteger(step) || step < 0 || step > 6) throw new RangeError(copy.step);
  const errors = {};
  if ((step === 0 || step === 6) && !EVENTS.includes(data.event)) errors.event = validateEnquiry({ event: data.event }, today, locale).event;
  if (step === 1 || step === 6) {
    const dateError = validateEnquiry({ event: EVENTS[0], date: data.date }, today, locale).date;
    if (dateError) errors.date = dateError;
  }
  if ((step === 2 || step === 6) && !integerInRange(data.guests, 1, 550)) errors.guests = copy.guests;
  if ((step === 3 || step === 6) && !integerInRange(data.budget, 1000, 100000)) errors.budget = copy.budget;
  if ((step === 4 || step === 6) && data.help != null && data.help !== '' && (typeof data.help !== 'string' || !Object.hasOwn(COST_HELP, data.help))) errors.help = copy.help;
  if ((step === 5 || step === 6) && data.priorities !== undefined && (!Array.isArray(data.priorities) || data.priorities.some(key => typeof key !== 'string' || !Object.hasOwn(COST_PRIORITIES, key)))) errors.priorities = copy.priorities;
  return errors;
}

export function estimateBudget(guests, budget, locale = 'ru') {
  if (!integerInRange(guests, 1, 550) || !integerInRange(budget, 1000, 100000)) throw new RangeError(COPY[normalizeModelLocale(locale)].errors.estimate);
  return Number(guests) * Number(budget);
}

export function composeCostMessage(data, locale = 'ru') {
  const copy = COPY[normalizeModelLocale(locale)];
  if (Object.keys(validateCostStep(6, data, undefined, locale)).length) throw new RangeError(copy.errors.draft);
  const total = estimateBudget(data.guests, data.budget, locale);
  const formatter = numberFormatter(locale);
  const format = value => formatter.format(value);
  const priorities = [...new Set(data.priorities ?? [])].map(key => copy.priorities[key]);
  return [
    composeMessage({ event: data.event, date: data.date, guests: data.guests, hall: 'help', wishes: '' }, locale),
    '',
    `${copy.budget}: ${format(Number(data.budget))} ₸.`,
    `${copy.total}: ${format(total)} ₸ (${format(Number(data.guests))} × ${format(Number(data.budget))} ₸).`,
    copy.note,
    ...(data.help ? [`${copy.organisation}: ${copy.help[data.help]}.`] : []),
    ...(priorities.length ? [`${copy.important}: ${priorities.join('; ')}.`] : []),
    '',
    copy.confirm,
  ].join('\n');
}
