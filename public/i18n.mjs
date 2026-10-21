export const LANGUAGES = { ru: 'Русский', kk: 'Қазақша', en: 'English' };

export function normalizeLocale(locale) {
  return typeof locale === 'string' && Object.hasOwn(LANGUAGES, locale) ? locale : 'ru';
}

export function intlLocale(locale) {
  return { ru: 'ru-RU', kk: 'kk-KZ', en: 'en-GB' }[normalizeLocale(locale)];
}

export function numberFormatter(locale) {
  // Chrome can omit Kazakh locale data; Russian uses the same numeric separators.
  return new Intl.NumberFormat(normalizeLocale(locale) === 'kk' ? 'ru-RU' : intlLocale(locale));
}

const KAZAKH_MONTHS = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым', 'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];
export function formatDate(value, locale) {
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid calendar date.');
  if (normalizeLocale(locale) === 'kk') return `${date.getUTCFullYear()} ж. ${date.getUTCDate()} ${KAZAKH_MONTHS[date.getUTCMonth()]}`;
  return new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Almaty' }).format(date).replace(/ г\.$/, '');
}

export function preferredLocale(search, saved) {
  const query = new URLSearchParams(search);
  return normalizeLocale(query.has('lang') ? query.get('lang') : saved);
}
