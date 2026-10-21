import { astanaToday, validateEnquiry, composeMessage, composeQuickMessage, whatsappUrl, getPlannerCopy } from './planner.mjs';
import { validateCostStep, estimateBudget, composeCostMessage, getCostCopy } from './cost.mjs';
import { LANGUAGES, normalizeLocale, numberFormatter, formatDate, preferredLocale } from './i18n.mjs';
import { PAGE_COPY } from './page-locales.mjs';
import { UI_COPY } from './ui-locales.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let savedLocale;
try { savedLocale = localStorage.getItem('royal-palace-language'); } catch { /* Storage can be disabled. */ }
let locale = preferredLocale(location.search, savedLocale);
const t = (key, values = {}) => UI_COPY[locale][key].replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
const form = $('#enquiry-form');
const formDetails = $('#form-details');
const dateField = $('#date');
const header = $('#header');
const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
const languageSelect = document.createElement('select');
languageSelect.id = 'language-select';
languageSelect.className = 'language-select';
Object.entries(LANGUAGES).forEach(([value, name]) => {
  const option = document.createElement('option');
  option.value = value; option.textContent = { ru: 'RU', kk: 'ҚАЗ', en: 'EN' }[value];
  option.lang = value; option.title = name;
  languageSelect.append(option);
});
header.insertBefore(languageSelect, menuToggle);
let focusedHeaderControl = null;
const topics = new Set();
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
dateField.min = astanaToday();

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', t('menuOpen'));
  mobileNav.hidden = true;
  header.classList.remove('menu-open');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', t(open ? 'menuClose' : 'menuOpen'));
  mobileNav.hidden = !open;
  header.classList.toggle('menu-open', open);
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('focusin', event => { focusedHeaderControl = header.contains(event.target) ? event.target : null; });
header.addEventListener('focusout', event => {
  if (event.relatedTarget && !header.contains(event.relatedTarget)) closeMenu();
});
document.addEventListener('pointerdown', event => {
  if (!header.contains(event.target)) focusedHeaderControl = null;
  if (!mobileNav.hidden && !header.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuToggle.focus(); }
});
window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
  // CSS can blur desktop links before the breakpoint event reaches this handler.
  const active = document.activeElement === document.body ? (focusedHeaderControl || document.body) : document.activeElement;
  if (event.matches) {
    const restoreFocus = mobileNav.contains(active) || active === menuToggle;
    const href = active.getAttribute('href');
    closeMenu();
    if (restoreFocus) ($$('.desktop-nav a').find(link => link.getAttribute('href') === href) || $('.desktop-nav a')).focus({ preventScroll: true });
  } else if (active.closest('.desktop-nav')) menuToggle.focus({ preventScroll: true });
});
function clearFieldError(name) {
  $(`#${name}`)?.removeAttribute('aria-invalid');
  const error = $(`#${name}-error`);
  if (error) error.textContent = '';
}
function updateWishesCount() { $('#wishes-count').textContent = `${$('#wishes').value.length} / 500`; }
form.addEventListener('input', event => {
  if (event.target.id) clearFieldError(event.target.id);
  $('#form-status').textContent = '';
  updateWishesCount();
});
$$('[data-hall]').forEach(link => link.addEventListener('click', () => {
  $('#hall').value = link.dataset.hall;
  clearFieldError('hall');
}));
function renderTopics() {
  $('#enquiry-context').hidden = topics.size === 0;
  $('#enquiry-question-text').textContent = topics.size ? t('topicsAdded', { topics: [...topics].map(topic => getPlannerCopy(locale).topics[topic]).join(' ') }) : '';
}
$$('[data-enquiry-topic]').forEach(link => link.addEventListener('click', () => {
  topics.add(link.dataset.enquiryTopic);
  if (link.dataset.enquiryTopic === 'guests') formDetails.open = true;
  renderTopics();
}));
$$('[data-form-details]').forEach(link => link.addEventListener('click', () => { formDetails.open = true; }));
$('#clear-enquiry-context').addEventListener('click', () => {
  topics.clear(); renderTopics(); $('#event').focus();
});

const messageDialog = $('#message-dialog');
const dialogOpeners = new WeakMap();
let previewOrigin = 'form';
let editEnquiryOnClose = false;
let messageVersion = 0;
let messageFactory = null;
function openDialog(dialog, opener) {
  closeMenu();
  dialogOpeners.set(dialog, opener);
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add('dialog-open');
}
$$('dialog').forEach(dialog => {
  dialog.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (dialog === messageDialog) messageVersion++;
    document.body.classList.toggle('dialog-open', !!document.querySelector('dialog[open]'));
    if (dialog === messageDialog && editEnquiryOnClose) {
      editEnquiryOnClose = false;
      formDetails.open = true;
      $('#event').focus({ preventScroll: true });
      form.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' });
      return;
    }
    const opener = dialogOpeners.get(dialog);
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
});
function renderMessage() {
  messageVersion++;
  const message = messageFactory();
  $('#message-preview').textContent = message;
  $('#whatsapp-send').href = whatsappUrl(message);
  $('#copy-status').textContent = '';
  $('#copy-message').textContent = t('copy');
  $('#copy-message').disabled = false;
  $('.edit-message').textContent = t(previewOrigin === 'cost' ? 'editCost' : previewOrigin === 'quick' ? 'editQuick' : 'editForm');
}
function showMessage(createMessage, opener, origin = 'form') {
  messageFactory = createMessage;
  previewOrigin = origin;
  editEnquiryOnClose = false;
  renderMessage();
  openDialog(messageDialog, opener);
}
$('.edit-message').addEventListener('click', () => { editEnquiryOnClose = previewOrigin === 'form'; });
$$('[data-quick-topic]').forEach(link => {
  link.href = whatsappUrl(composeQuickMessage(link.dataset.quickTopic, link.dataset.quickHall, locale));
  link.addEventListener('click', event => {
    event.preventDefault();
    showMessage(() => composeQuickMessage(link.dataset.quickTopic, link.dataset.quickHall, locale), link, 'quick');
  });
});
form.addEventListener('submit', event => {
  event.preventDefault();
  dateField.min = astanaToday();
  const data = { event: $('#event').value, hall: $('#hall').value, date: dateField.value, guests: $('#guests').value, wishes: $('#wishes').value, topics: [...topics] };
  ['event', 'hall', 'date', 'guests', 'wishes'].forEach(clearFieldError);
  const errors = validateEnquiry(data, undefined, locale);
  if (dateField.validity.badInput) errors.date = t('badDate');
  if ($('#guests').validity.badInput) errors.guests = t('badGuests');
  if (Object.keys(errors).length) {
    if (Object.keys(errors).some(name => formDetails.contains($(`#${name}`)))) formDetails.open = true;
    Object.entries(errors).forEach(([name, text]) => { $(`#${name}`).setAttribute('aria-invalid', 'true'); $(`#${name}-error`).textContent = text; });
    $('#form-status').textContent = t('checkFields');
    const first = $(`#${Object.keys(errors)[0]}`);
    first.focus({ preventScroll: true });
    first.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'instant' : 'smooth' });
    return;
  }
  $('#form-status').textContent = '';
  showMessage(() => composeMessage(data, locale), form.querySelector('[type=submit]'));
});
$('#copy-message').addEventListener('click', async () => {
  const message = $('#message-preview').textContent;
  const version = messageVersion;
  const isCurrent = () => messageDialog.open && version === messageVersion;
  const button = $('#copy-message');
  const hadFocus = document.activeElement === button;
  button.disabled = true;
  button.textContent = t('copying');
  try {
    await navigator.clipboard.writeText(message);
    if (!isCurrent()) return;
    button.textContent = t('copied');
    $('#copy-status').textContent = t('copySuccess');
  } catch {
    if (!isCurrent()) return;
    button.textContent = t('copy');
    const preview = $('#message-preview');
    const range = document.createRange(); range.selectNodeContents(preview);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    preview.focus();
    $('#copy-status').textContent = t('copyFallback');
  } finally {
    if (isCurrent()) {
      button.disabled = false;
      if (hadFocus && document.activeElement === document.body) button.focus({ preventScroll: true });
    }
  }
});

const costDialog = $('#cost-dialog');
const costForm = $('#cost-form');
const costSteps = $$('[data-cost-step]');
const costFields = ['event', 'date', 'guests', 'budget', 'help', 'priorities'];
let costNumber = numberFormatter(locale);
let costStep = 0;

function addCostChoices(container, name, choices, type = 'radio') {
  Object.entries(choices).forEach(([value, title]) => {
    const label = document.createElement('label');
    label.className = 'cost-choice';
    const input = document.createElement('input');
    input.type = type; input.name = name; input.value = value;
    input.setAttribute('aria-describedby', `cost-${name}-error`);
    const text = document.createElement('span'); text.textContent = title;
    label.append(input, text); container.append(label);
  });
}
addCostChoices($('#cost-events'), 'event', getPlannerCopy(locale).events);
addCostChoices($('#cost-help'), 'help', getCostCopy(locale).help);
addCostChoices($('#cost-priorities'), 'priorities', getCostCopy(locale).priorities, 'checkbox');
function costData() {
  const values = new FormData(costForm);
  return Object.fromEntries([...costFields.map(name => [name, values.get(name) ?? '']), ['priorities', values.getAll('priorities')]]);
}
function clearCostError(name) {
  costForm.querySelectorAll(`[name="${name}"]`).forEach(input => input.removeAttribute('aria-invalid'));
  $(`#cost-${name}-error`).textContent = '';
}
function renderCostText() {
  $('#cost-step-count').textContent = t('step', { step: costStep + 1 });
  $('#cost-progress').setAttribute('aria-valuetext', t('step', { step: costStep + 1 }));
  $('#cost-next-label').textContent = t(costStep === 6 ? 'discussCost' : costStep === 5 ? 'showCost' : 'next');
  if (costStep === 6) {
    const data = costData();
    $('#cost-total').textContent = `${costNumber.format(estimateBudget(data.guests, data.budget))} ₸`;
    $('#cost-formula').textContent = t('formula', { guests: costNumber.format(Number(data.guests)), budget: costNumber.format(Number(data.budget)) });
    $('#cost-summary-event').textContent = getPlannerCopy(locale).events[data.event];
    $('#cost-summary-date').textContent = data.date ? formatDate(data.date, locale) : t('dateUndecided');
    $('#cost-summary-help').textContent = getCostCopy(locale).help[data.help] || t('helpUndecided');
    $('#cost-summary-priorities').textContent = data.priorities.map(key => getCostCopy(locale).priorities[key]).join(', ') || t('prioritiesUndecided');
  }
}
function renderCostStep(index, focus = true) {
  costStep = index;
  costSteps.forEach((step, i) => { step.hidden = i !== index; });
  $('#cost-progress').setAttribute('aria-valuenow', String(index + 1));
  $('#cost-progress-fill').style.width = `${(index + 1) / 7 * 100}%`;
  $('#cost-back').hidden = index === 0;
  renderCostText();
  costDialog.scrollTop = 0;
  if (focus) costSteps[index].querySelector('.cost-question').focus({ preventScroll: true });
}
$$('[data-cost-open]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); $('#cost-date').min = astanaToday();
  openDialog(costDialog, link); renderCostStep(costStep);
}));
$('#cost-back').addEventListener('click', () => renderCostStep(costStep - 1));
const rangeUpdaters = [];
$$('[data-cost-range]').forEach(range => {
  const number = $(`#cost-${range.dataset.costRange}`);
  const syncRange = () => {
    if (number.value !== '' && number.validity.valid) range.value = number.value;
    range.style.setProperty('--range-fill', `${(Number(range.value) - Number(range.min)) / (Number(range.max) - Number(range.min)) * 100}%`);
    range.setAttribute('aria-valuetext', t(range.dataset.costRange === 'budget' ? 'rangeBudget' : 'rangeGuests', { value: costNumber.format(Number(range.value)) }));
  };
  rangeUpdaters.push(syncRange);
  range.addEventListener('input', () => { number.value = range.value; clearCostError(number.name); syncRange(); });
  number.addEventListener('input', syncRange); syncRange();
});
costForm.addEventListener('input', event => { if (costFields.includes(event.target.name)) clearCostError(event.target.name); });
costForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = costData();
  const errors = validateCostStep(costStep, data, undefined, locale);
  if (costStep === 5) Object.assign(errors, validateCostStep(6, data, undefined, locale));
  if ((costStep === 1 || costStep >= 5) && $('#cost-date').validity.badInput) errors.date = t('badDate');
  costFields.forEach(clearCostError);
  const firstError = Object.keys(errors)[0];
  if (firstError) {
    renderCostStep(costFields.indexOf(firstError), false);
    Object.entries(errors).forEach(([name, text]) => {
      $(`#cost-${name}-error`).textContent = text;
      costForm.querySelectorAll(`[name="${name}"]`).forEach(input => input.setAttribute('aria-invalid', 'true'));
    });
    const input = costForm.querySelector(`[name="${firstError}"]`);
    input.focus({ preventScroll: true }); input.scrollIntoView({ block: 'center', behavior: 'instant' });
    return;
  }
  if (costStep < 6) renderCostStep(costStep + 1);
  else showMessage(() => composeCostMessage(data, locale), $('#cost-next'), 'cost');
});

const gallery = [
  { src: '/assets/venue-celebration.jpg' },
  { src: '/assets/venue-hall.jpg' },
  { src: '/assets/venue-room.jpg' },
  { src: '/assets/venue-hero.jpg' },
];
let galleryIndex = 0;
let galleryZoomed = false;
let galleryState = 'loading';
const galleryImage = $('#lightbox-image');
const stage = $('#lightbox-stage');
function setGalleryZoom(zoomed) {
  // Measure the fitted photo: a portrait occupies much less width than its stage.
  if (zoomed) galleryImage.style.width = `${galleryImage.getBoundingClientRect().width * 2}px`;
  else galleryImage.style.removeProperty('width');
  galleryZoomed = zoomed;
  stage.classList.toggle('is-zoomed', zoomed);
  $('#gallery-zoom').setAttribute('aria-pressed', String(zoomed));
  $('#gallery-zoom').textContent = t(zoomed ? 'zoomOut' : 'zoomIn');
  $('#gallery-zoom-hint').hidden = !zoomed;
  stage.scrollTop = 0; stage.scrollLeft = 0;
  if (zoomed) stage.focus({ preventScroll: true });
}
function renderGallery(index, retry = false) {
  galleryIndex = (index + gallery.length) % gallery.length;
  const item = gallery[galleryIndex];
  setGalleryZoom(false);
  galleryImage.hidden = true;
  $('#gallery-image-status').hidden = false;
  galleryState = 'loading';
  $('#gallery-image-message').textContent = t('photoLoading');
  $('#gallery-retry').hidden = true;
  $('#gallery-zoom').disabled = true;
  galleryImage.onload = () => {
    galleryState = 'ready';
    galleryImage.hidden = false;
    $('#gallery-image-status').hidden = true;
    $('#gallery-zoom').disabled = false;
    $$(`[data-gallery="${galleryIndex}"] img`).forEach(thumbnail => {
      if (thumbnail.parentElement.classList.contains('photo-unavailable')) {
        thumbnail.removeAttribute('srcset');
        thumbnail.removeAttribute('sizes');
        thumbnail.src = galleryImage.src;
      }
    });
  };
  galleryImage.onerror = () => {
    galleryState = 'error';
    galleryImage.hidden = true;
    $('#gallery-image-message').textContent = t('photoError');
    $('#gallery-retry').hidden = false;
  };
  galleryImage.alt = t(`gallery.alt.${galleryIndex}`);
  galleryImage.src = `${item.src}${retry ? `?retry=${Date.now()}` : ''}`;
  $('#gallery-original').href = item.src;
  $('#lightbox-caption').textContent = t(`gallery.caption.${galleryIndex}`);
  $('#gallery-count').textContent = `${galleryIndex + 1} / ${gallery.length}`;
}
$$('[data-gallery]').forEach(button => button.addEventListener('click', event => {
  event.preventDefault();
  renderGallery(Number(button.dataset.gallery), button.classList.contains('photo-unavailable'));
  openDialog($('#gallery-dialog'), button);
}));
$('#gallery-prev').addEventListener('click', () => renderGallery(galleryIndex - 1));
$('#gallery-next').addEventListener('click', () => renderGallery(galleryIndex + 1));
$('#gallery-retry').addEventListener('click', () => renderGallery(galleryIndex, true));
$('#gallery-zoom').addEventListener('click', () => setGalleryZoom(!galleryZoomed));
$('#gallery-dialog').addEventListener('keydown', event => {
  if (galleryZoomed && event.target === stage) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); renderGallery(galleryIndex + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); renderGallery(galleryIndex - 1); }
});
$$('.gallery-item img, .hall-photo img').forEach(img => {
  const showFailure = () => { img.parentElement.classList.add('photo-unavailable'); img.parentElement.querySelector('.photo-fallback').hidden = false; };
  img.addEventListener('load', () => {
    img.parentElement.classList.remove('photo-unavailable');
    img.parentElement.querySelector('.photo-fallback').hidden = true;
  });
  img.addEventListener('error', showFailure);
  if (img.complete && !img.naturalWidth) showFailure();
});
window.addEventListener('resize', () => { if (galleryZoomed) setGalleryZoom(false); });

const sticky = $('.mobile-enquire');
const watched = { hero: true, enquiry: false, contacts: false };
function updateSticky() {
  const visible = !watched.hero && !watched.enquiry && !watched.contacts;
  sticky.classList.toggle('is-visible', visible);
  sticky.tabIndex = visible ? 0 : -1;
  sticky.setAttribute('aria-hidden', String(!visible));
}
if (window.IntersectionObserver) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target.id === 'home') watched.hero = entry.isIntersecting;
      if (entry.target.id === 'enquiry') watched.enquiry = entry.isIntersecting;
      if (entry.target.id === 'contacts') watched.contacts = entry.isIntersecting;
    });
    updateSticky();
  }, { threshold: 0 });
  [$('#home'), $('#enquiry'), $('#contacts')].forEach(element => observer.observe(element));
}
updateWishesCount();
form.querySelector('[type=submit]').disabled = false;
$('#form-fallback').hidden = true;
$('#fallback-nav').hidden = true;
closeMenu();
menuToggle.hidden = false;

function applyLanguage(nextLocale) {
  locale = normalizeLocale(nextLocale);
  document.documentElement.lang = locale;
  languageSelect.value = locale;
  languageSelect.setAttribute('aria-label', t('language'));
  languageSelect.title = t('language');
  const copy = PAGE_COPY[locale];
  $$('[data-i18n]').forEach(element => { element.textContent = copy[element.dataset.i18n]; });
  ['placeholder', 'aria-label', 'alt', 'title', 'content'].forEach(attribute => {
    $$(`[data-i18n-${attribute}]`).forEach(element => {
      element.setAttribute(attribute, copy[element.getAttribute(`data-i18n-${attribute}`)]);
    });
  });
  const plannerCopy = getPlannerCopy(locale);
  const costCopy = getCostCopy(locale);
  $$('#event option').forEach(option => { if (Object.hasOwn(plannerCopy.events, option.value)) option.textContent = plannerCopy.events[option.value]; });
  [['event', plannerCopy.events], ['help', costCopy.help], ['priorities', costCopy.priorities]].forEach(([name, labels]) => {
    costForm.querySelectorAll(`input[name="${name}"]`).forEach(input => { input.nextElementSibling.textContent = labels[input.value]; });
  });
  menuToggle.setAttribute('aria-label', t(mobileNav.hidden ? 'menuOpen' : 'menuClose'));
  renderTopics();
  updateWishesCount();
  costNumber = numberFormatter(locale);
  renderCostText();
  rangeUpdaters.forEach(update => update());

  // Refresh existing errors without validating untouched fields or changing drafts.
  const enquiryErrors = validateEnquiry({ event: $('#event').value, hall: $('#hall').value, date: dateField.value, guests: $('#guests').value, wishes: $('#wishes').value }, undefined, locale);
  if (dateField.validity.badInput) enquiryErrors.date = t('badDate');
  if ($('#guests').validity.badInput) enquiryErrors.guests = t('badGuests');
  form.querySelectorAll('[aria-invalid="true"]').forEach(input => {
    if (enquiryErrors[input.id]) $(`#${input.id}-error`).textContent = enquiryErrors[input.id];
    else clearFieldError(input.id);
  });
  if ($('#form-status').textContent) $('#form-status').textContent = t('checkFields');
  const costErrors = validateCostStep(6, costData(), undefined, locale);
  if ($('#cost-date').validity.badInput) costErrors.date = t('badDate');
  costFields.forEach(name => {
    if (!costForm.querySelector(`[name="${name}"][aria-invalid="true"]`)) return;
    if (costErrors[name]) $(`#cost-${name}-error`).textContent = costErrors[name];
    else clearCostError(name);
  });
  $$('[data-quick-topic]').forEach(link => { link.href = whatsappUrl(composeQuickMessage(link.dataset.quickTopic, link.dataset.quickHall, locale)); });
  if (messageDialog.open && messageFactory) renderMessage();
  galleryImage.alt = t(`gallery.alt.${galleryIndex}`);
  $('#lightbox-caption').textContent = t(`gallery.caption.${galleryIndex}`);
  $('#gallery-count').textContent = `${galleryIndex + 1} / ${gallery.length}`;
  $('#gallery-zoom').textContent = t(galleryZoomed ? 'zoomOut' : 'zoomIn');
  $('#gallery-image-message').textContent = t(galleryState === 'error' ? 'photoError' : 'photoLoading');
}
languageSelect.addEventListener('change', () => {
  applyLanguage(languageSelect.value);
  try { localStorage.setItem('royal-palace-language', locale); } catch { /* The current page still works without storage. */ }
  const url = new URL(location.href);
  url.searchParams.set('lang', locale);
  history.replaceState(null, '', url);
});
applyLanguage(locale);
