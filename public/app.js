import { astanaToday, validateEnquiry, composeMessage, composeQuickMessage, whatsappUrl, ENQUIRY_TOPICS } from './planner.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const form = $('#enquiry-form');
const formDetails = $('#form-details');
const dateField = $('#date');
const header = $('#header');
const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
let focusedHeaderControl = null;
const topics = new Set();
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
dateField.min = astanaToday();

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
  mobileNav.hidden = true;
  header.classList.remove('menu-open');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
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
const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

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
  $('#enquiry-question-text').textContent = topics.size ? `В сообщение добавим: ${[...topics].map(topic => ENQUIRY_TOPICS[topic]).join(' ')}` : '';
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
let dialogOpener = null;
let previewIsQuick = false;
let editEnquiryOnClose = false;
let messageVersion = 0;
function openDialog(dialog, opener) {
  closeMenu();
  dialogOpener = opener;
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
    document.body.classList.remove('dialog-open');
    if (dialog === messageDialog && editEnquiryOnClose) {
      editEnquiryOnClose = false;
      formDetails.open = true;
      $('#event').focus({ preventScroll: true });
      form.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' });
      return;
    }
    if (dialogOpener?.isConnected) dialogOpener.focus({ preventScroll: true });
  });
});
function showMessage(message, opener, quick = false) {
  messageVersion++;
  previewIsQuick = quick;
  editEnquiryOnClose = false;
  $('#message-preview').textContent = message;
  $('#whatsapp-send').href = whatsappUrl(message);
  $('#copy-status').textContent = '';
  $('#copy-message').textContent = 'Скопировать текст';
  $('#copy-message').disabled = false;
  $('.edit-message').textContent = quick ? 'Вернуться на сайт' : 'Изменить детали';
  openDialog(messageDialog, opener);
}
$('.edit-message').addEventListener('click', () => { editEnquiryOnClose = !previewIsQuick; });
$$('[data-quick-topic]').forEach(link => {
  const message = composeQuickMessage(link.dataset.quickTopic, link.dataset.quickHall);
  link.href = whatsappUrl(message);
  link.addEventListener('click', event => {
    event.preventDefault();
    showMessage(message, link, true);
  });
});
form.addEventListener('submit', event => {
  event.preventDefault();
  dateField.min = astanaToday();
  const data = { event: $('#event').value, hall: $('#hall').value, date: dateField.value, guests: $('#guests').value, wishes: $('#wishes').value, topics: [...topics] };
  ['event', 'hall', 'date', 'guests', 'wishes'].forEach(clearFieldError);
  const errors = validateEnquiry(data);
  if (dateField.validity.badInput) errors.date = 'Проверьте дату: выберите её в календаре.';
  if ($('#guests').validity.badInput) errors.guests = 'Укажите число гостей цифрами, например 120.';
  if (Object.keys(errors).length) {
    if (Object.keys(errors).some(name => formDetails.contains($(`#${name}`)))) formDetails.open = true;
    Object.entries(errors).forEach(([name, text]) => { $(`#${name}`).setAttribute('aria-invalid', 'true'); $(`#${name}-error`).textContent = text; });
    $('#form-status').textContent = 'Проверьте отмеченные поля.';
    const first = $(`#${Object.keys(errors)[0]}`);
    first.focus({ preventScroll: true });
    first.scrollIntoView({ block: 'center', behavior: reducedMotion() ? 'instant' : 'smooth' });
    return;
  }
  $('#form-status').textContent = '';
  showMessage(composeMessage(data), form.querySelector('[type=submit]'));
});
$('#copy-message').addEventListener('click', async () => {
  const message = $('#message-preview').textContent;
  const version = messageVersion;
  const isCurrent = () => messageDialog.open && version === messageVersion;
  const button = $('#copy-message');
  const hadFocus = document.activeElement === button;
  button.disabled = true;
  button.textContent = 'Копируем…';
  try {
    await navigator.clipboard.writeText(message);
    if (!isCurrent()) return;
    button.textContent = 'Текст скопирован';
    $('#copy-status').textContent = 'Можно вставить его в переписку с администратором.';
  } catch {
    if (!isCurrent()) return;
    button.textContent = 'Скопировать текст';
    const preview = $('#message-preview');
    const range = document.createRange(); range.selectNodeContents(preview);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    preview.focus();
    $('#copy-status').textContent = 'Автоматическое копирование недоступно. Скопируйте выделенный текст вручную.';
  } finally {
    if (isCurrent()) {
      button.disabled = false;
      if (hadFocus && document.activeElement === document.body) button.focus({ preventScroll: true });
    }
  }
});

const gallery = [
  { src: '/assets/venue-celebration.jpg', alt: 'Сцена и оформление праздника в Royal Palace', caption: 'Сцена и оформление' },
  { src: '/assets/venue-hall.jpg', alt: 'Оформление столов в Royal Palace', caption: 'Оформление столов' },
  { src: '/assets/venue-room.jpg', alt: 'Круглый стол и бело-золотые кресла в интерьере Royal Palace', caption: 'Интерьер и рассадка' },
  { src: '/assets/venue-hero.jpg', alt: 'Основной, самый большой зал Royal Palace', caption: 'Основной зал' },
];
let galleryIndex = 0;
let galleryZoomed = false;
const galleryImage = $('#lightbox-image');
const stage = $('#lightbox-stage');
function setGalleryZoom(zoomed) {
  // Measure the fitted photo: a portrait occupies much less width than its stage.
  if (zoomed) galleryImage.style.width = `${galleryImage.getBoundingClientRect().width * 2}px`;
  else galleryImage.style.removeProperty('width');
  galleryZoomed = zoomed;
  stage.classList.toggle('is-zoomed', zoomed);
  $('#gallery-zoom').setAttribute('aria-pressed', String(zoomed));
  $('#gallery-zoom').textContent = zoomed ? 'Показать целиком' : 'Увеличить ×2';
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
  $('#gallery-image-message').textContent = 'Загружаем фотографию…';
  $('#gallery-retry').hidden = true;
  $('#gallery-zoom').disabled = true;
  galleryImage.onload = () => {
    galleryImage.hidden = false;
    $('#gallery-image-status').hidden = true;
    $('#gallery-zoom').disabled = false;
    $$(`[data-gallery="${galleryIndex}"] img`).forEach(thumbnail => {
      if (thumbnail.parentElement.classList.contains('photo-unavailable')) thumbnail.src = galleryImage.src;
    });
  };
  galleryImage.onerror = () => {
    galleryImage.hidden = true;
    $('#gallery-image-message').textContent = 'Фото не загрузилось. Попробуйте ещё раз или откройте следующее.';
    $('#gallery-retry').hidden = false;
  };
  galleryImage.alt = item.alt;
  galleryImage.src = `${item.src}${retry ? `?retry=${Date.now()}` : ''}`;
  $('#gallery-original').href = item.src;
  $('#lightbox-caption').textContent = item.caption;
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
