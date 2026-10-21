import { EVENTS, astanaToday, validateEnquiry, composeMessage } from './planner.mjs';

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

function integerInRange(value, min, max) {
  const text = String(value ?? '').trim();
  return /^\d+$/.test(text) && Number(text) >= min && Number(text) <= max;
}

export function validateCostStep(step, data, today = astanaToday()) {
  if (!Number.isInteger(step) || step < 0 || step > 6) throw new RangeError('Неизвестный шаг расчёта.');
  const errors = {};
  if ((step === 0 || step === 6) && !EVENTS.includes(data.event)) errors.event = 'Выберите событие.';
  if (step === 1 || step === 6) {
    const dateError = validateEnquiry({ event: EVENTS[0], date: data.date }, today).date;
    if (dateError) errors.date = dateError;
  }
  if ((step === 2 || step === 6) && !integerInRange(data.guests, 1, 550)) errors.guests = 'Укажите целое число гостей от 1 до 550.';
  if ((step === 3 || step === 6) && !integerInRange(data.budget, 1000, 100000)) errors.budget = 'Укажите бюджет на гостя от 1 000 до 100 000 ₸ целым числом.';
  if ((step === 4 || step === 6) && data.help != null && data.help !== '' && (typeof data.help !== 'string' || !Object.hasOwn(COST_HELP, data.help))) errors.help = 'Выберите вариант из списка или пропустите вопрос.';
  if ((step === 5 || step === 6) && data.priorities !== undefined && (!Array.isArray(data.priorities) || data.priorities.some(key => typeof key !== 'string' || !Object.hasOwn(COST_PRIORITIES, key)))) errors.priorities = 'Выберите пожелания из списка.';
  return errors;
}

export function estimateBudget(guests, budget) {
  if (!integerInRange(guests, 1, 550) || !integerInRange(budget, 1000, 100000)) throw new RangeError('Проверьте число гостей и бюджет на гостя.');
  return Number(guests) * Number(budget);
}

export function composeCostMessage(data) {
  if (Object.keys(validateCostStep(6, data)).length) throw new RangeError('Проверьте ответы перед подготовкой сообщения.');
  const total = estimateBudget(data.guests, data.budget);
  const format = value => new Intl.NumberFormat('ru-RU').format(value);
  const priorities = [...new Set(data.priorities ?? [])].map(key => COST_PRIORITIES[key]);
  return [
    composeMessage({ event: data.event, date: data.date, guests: data.guests, hall: 'help', wishes: '' }),
    '',
    `Наш бюджет на гостя: ${format(Number(data.budget))} ₸.`,
    `Ориентир по нашему бюджету: ${format(total)} ₸ (${format(Number(data.guests))} × ${format(Number(data.budget))} ₸).`,
    'Сумма рассчитана по нашему бюджету. Стоимость ресторана нужно уточнить.',
    ...(data.help ? [`Пожелание по организации: ${COST_HELP[data.help]}.`] : []),
    ...(priorities.length ? [`Для нас важно: ${priorities.join('; ')}.`] : []),
    '',
    'Уточните, пожалуйста, актуальное меню, итоговую стоимость и что в неё входит.',
  ].join('\n');
}
