import { astanaToday, validateEnquiry, composeMessage, composeQuickMessage, composeMenuMessage, whatsappUrl, getPlannerCopy } from './planner.mjs';
import { validateBudget, estimateBudget, composeCostMessage } from './cost.mjs';
import { normalizeLocale, numberFormatter, preferredLocale } from './i18n.mjs';
import { PAGE_COPY } from './page-locales.mjs';
import { UI_COPY } from './ui-locales.mjs';
import { MENUS } from './menu-data.mjs';
import { VIDEOS, MENU_VIDEOS } from './media-data.mjs';
import { getMenuSections, getMenuFooterNotes, getMenuAsset, getMenuCollection, getMenuTitle, menuHall } from './menu-locales.mjs';

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
const mobileMenu = $('#mobile-menu');
const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
const themePicker = $('#theme-picker');
const themeToggle = $('#theme-toggle');
const themeOptions = $('#theme-options');
const themeColors = { classic: '#fbf9f4', emerald: '#064734', 'emerald-halls': '#064734' };
let theme = document.documentElement.dataset.layout === 'halls' ? 'emerald-halls' : document.documentElement.dataset.theme === 'emerald' ? 'emerald' : 'classic';
const languageSelect = $('#language-select');
let focusedHeaderControl = null;
const topics = new Set();
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
dateField.min = astanaToday();

function updateThemeControl() {
  const copy = PAGE_COPY[locale];
  const label = `${copy['theme.label']}: ${copy[`theme.${theme}`]}`;
  themeToggle.setAttribute('aria-label', label);
  themeToggle.title = label;
  $$('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
}
function closeThemePicker() {
  themeToggle.setAttribute('aria-expanded', 'false');
  themeOptions.hidden = true;
}
themeToggle.addEventListener('click', () => {
  const open = themeOptions.hidden;
  closeMenu();
  themeToggle.setAttribute('aria-expanded', String(open));
  themeOptions.hidden = !open;
});
$$('[data-theme-choice]').forEach(button => button.addEventListener('click', () => {
  const next = button.dataset.themeChoice;
  if (!Object.hasOwn(themeColors, next)) return;
  theme = next;
  if (theme !== 'classic') document.documentElement.dataset.theme = 'emerald';
  else delete document.documentElement.dataset.theme;
  if (theme === 'emerald-halls') document.documentElement.dataset.layout = 'halls';
  else delete document.documentElement.dataset.layout;
  $('meta[name="theme-color"]').content = themeColors[theme];
  applyHallLayout();
  updateThemeControl();
  try { localStorage.setItem('royal-palace-theme', theme); } catch { /* The current page still changes without storage. */ }
  closeThemePicker();
  if (theme !== 'emerald-halls' || location.hash !== '#gallery') themeToggle.focus({ preventScroll: true });
}));
themePicker.addEventListener('focusout', event => {
  if (event.relatedTarget && !themePicker.contains(event.relatedTarget)) closeThemePicker();
});
themeToggle.disabled = false;
languageSelect.disabled = false;

function closeMenu() {
  closeThemePicker();
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', t('menuOpen'));
  mobileMenu.open = false;
  header.classList.remove('menu-open');
}
mobileMenu.addEventListener('toggle', () => {
  const open = mobileMenu.open;
  if (open) closeThemePicker();
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', t(open ? 'menuClose' : 'menuOpen'));
  header.classList.toggle('menu-open', open);
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('focusin', event => { focusedHeaderControl = header.contains(event.target) ? event.target : null; });
header.addEventListener('focusout', event => {
  if (event.relatedTarget && !header.contains(event.relatedTarget)) closeMenu();
});
document.addEventListener('pointerdown', event => {
  if (!themePicker.contains(event.target)) closeThemePicker();
  if (!header.contains(event.target)) focusedHeaderControl = null;
  if (mobileMenu.open && !header.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!themeOptions.hidden) { closeThemePicker(); themeToggle.focus(); }
  else if (mobileMenu.open) { closeMenu(); menuToggle.focus(); }
});
window.matchMedia('(min-width: 1241px)').addEventListener('change', event => {
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
$$('[data-enquiry-topic]').forEach(link => link.addEventListener('click', () => {
  topics.add(link.dataset.enquiryTopic);
  if (link.dataset.enquiryTopic === 'guests') formDetails.open = true;
}));
$$('[data-form-details]').forEach(link => link.addEventListener('click', () => { formDetails.open = true; }));

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
const costFields = ['guests', 'budget'];
let costNumber = numberFormatter(locale);
function costData() {
  return Object.fromEntries(new FormData(costForm));
}
function clearCostError(name) {
  costForm.querySelectorAll(`[name="${name}"]`).forEach(input => input.removeAttribute('aria-invalid'));
  $(`#cost-${name}-error`).textContent = '';
}
function renderCostText() {
  const data = costData();
  const valid = !Object.keys(validateBudget(data, locale)).length && costFields.every(name => costForm.elements[name].validity.valid);
  $('#cost-total').textContent = '—';
  $('#cost-formula').textContent = '';
  if (valid) {
    $('#cost-total').textContent = `${costNumber.format(estimateBudget(data.guests, data.budget))} ₸`;
    $('#cost-formula').textContent = t('formula', { guests: costNumber.format(Number(data.guests)), budget: costNumber.format(Number(data.budget)) });
  }
}
$$('[data-cost-open]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); renderCostText(); openDialog(costDialog, link);
  $('#cost-guests').focus({ preventScroll: true });
}));
costForm.addEventListener('input', event => { clearCostError(event.target.name); renderCostText(); });
costForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = costData();
  const errors = validateBudget(data, locale);
  costFields.forEach(clearCostError);
  const firstError = Object.keys(errors)[0];
  if (firstError) {
    Object.entries(errors).forEach(([name, text]) => {
      $(`#cost-${name}-error`).textContent = text;
      costForm.querySelectorAll(`[name="${name}"]`).forEach(input => input.setAttribute('aria-invalid', 'true'));
    });
    const input = costForm.querySelector(`[name="${firstError}"]`);
    input.focus({ preventScroll: true }); input.scrollIntoView({ block: 'center', behavior: 'instant' });
    return;
  }
  showMessage(() => composeCostMessage(data, locale), $('#cost-next'), 'cost');
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
  const item = activeHall === 'main' && galleryIndex === 3 ? { src: '/assets/hall-main-centered.webp' } : gallery[galleryIndex];
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
  $('#gallery-count').textContent = `${(activeHall === 'main' ? (galleryIndex + 1) % gallery.length : galleryIndex) + 1} / ${gallery.length}`;
}
$$('[data-gallery]').forEach(button => button.addEventListener('click', event => {
  event.preventDefault();
  activeHall = null;
  updateHallDetail();
  renderGallery(Number(button.dataset.gallery), button.classList.contains('photo-unavailable'));
  openDialog($('#gallery-dialog'), button);
}));
$('#gallery-prev').addEventListener('click', () => renderGallery(galleryIndex - 1));
$('#gallery-next').addEventListener('click', () => renderGallery(galleryIndex + 1));
$('#gallery-retry').addEventListener('click', () => renderGallery(galleryIndex, true));
$('#gallery-zoom').addEventListener('click', () => setGalleryZoom(!galleryZoomed));
$('#gallery-dialog').addEventListener('keydown', event => {
  if ((activeHall && activeHall !== 'main') || (galleryZoomed && event.target === stage)) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); renderGallery(galleryIndex + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); renderGallery(galleryIndex - 1); }
});
$$('.gallery-item img, .hall-photo img, .menu-card img').forEach(img => {
  const showFailure = () => { img.parentElement.classList.add('photo-unavailable'); img.parentElement.querySelector('.photo-fallback').hidden = false; };
  img.addEventListener('load', () => {
    img.parentElement.classList.remove('photo-unavailable');
    img.parentElement.querySelector('.photo-fallback').hidden = true;
  });
  img.addEventListener('error', showFailure);
  if (img.complete && !img.naturalWidth) showFailure();
});
window.addEventListener('resize', () => { if (galleryZoomed) setGalleryZoom(false); });

const menuGroups = $$('[data-menu-group]');
function updateMenuAssets() {
  $$('[data-menu-id]').forEach(card => {
    const menu = MENUS.find(menu => menu.id === card.dataset.menuId);
    card.href = getMenuAsset(menu, locale);
    card.querySelector('img').src = getMenuAsset(menu, locale, 'preview');
  });
  $$('[data-menu-footnotes]').forEach(text => {
    text.textContent = getMenuFooterNotes(MENUS.find(menu => menu.id === text.dataset.menuFootnotes), locale).join(' ');
  });
}
function selectServiceHall(hall) {
  $$('[data-service-group]').forEach(group => { group.hidden = group.dataset.serviceGroup !== hall; });
  $$('[data-service-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.serviceFilter === hall)));
  const link = $('#services-discuss');
  link.dataset.quickHall = hall;
  link.href = whatsappUrl(composeQuickMessage('services', hall, locale));
}
$$('[data-service-filter]').forEach(button => button.addEventListener('click', () => selectServiceHall(button.dataset.serviceFilter)));
$$('.service-set-title').forEach(title => title.classList.add('sr-only'));
selectServiceHall('main');
$('.service-filters').hidden = false;
let selectedMenuHall = 'main';
const menuKind = $('#menu-kind');
function selectMenuGroup() {
  const usesHall = menuKind.value === 'banquet' || menuKind.value === 'newyear';
  menuGroups.forEach(group => {
    group.hidden = group.dataset.menuKind !== menuKind.value || (usesHall && group.dataset.menuHall !== selectedMenuHall);
  });
  $$('[data-menu-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.menuFilter === selectedMenuHall)));
  $('.menu-filters').hidden = !usesHall;
  if (usesHall) selectServiceHall(selectedMenuHall);
}
$$('[data-menu-filter]').forEach(button => button.addEventListener('click', () => {
  selectedMenuHall = button.dataset.menuFilter;
  selectMenuGroup();
}));
menuKind.addEventListener('change', selectMenuGroup);
$$('.menu-set-title').forEach(title => title.classList.add('sr-only'));
selectMenuGroup();
$('#menu-kind-control').hidden = false;

const hallDirectory = $('#hall-directory');
const hallDetail = $('#hall-detail');
const hallGallery = $('#gallery');
const hallDialog = $('#gallery-dialog');
const contactCopy = $('.contact-copy');
const contactLinks = $('.contact-links');
const contactRoute = $('.contact-copy > .text-link');
const contactMap = $('#contact-map');
const venueMap = $('#venue-map');
let activeHall = null;
$$('.hall-card-photo img').forEach(image => {
  const fallback = image.nextElementSibling;
  const showFallback = () => { image.hidden = true; fallback.hidden = false; };
  image.addEventListener('error', showFallback);
  image.addEventListener('load', () => { image.hidden = false; fallback.hidden = true; });
  if (image.complete && !image.naturalWidth) showFallback();
});

function updateHallDetail() {
  const selected = !!activeHall;
  $$('[data-hall-view]').forEach(button => button.setAttribute('aria-expanded', String(button.dataset.hallView === activeHall)));
  hallDetail.hidden = !selected;
  hallDialog.classList.toggle('hall-view', selected);
  $('.lightbox-brand').hidden = selected;
  $('.lightbox-tools').hidden = selected;
  $('.lightbox-bottom').hidden = selected && activeHall !== 'main';
  $('#gallery-prev').disabled = selected && activeHall !== 'main';
  $('#gallery-next').disabled = selected && activeHall !== 'main';
  $('#lightbox-caption').hidden = selected;
  $('#hall-actions').hidden = !selected;
  $('#hall-gallery-videos').hidden = activeHall !== 'main';
  $('#hall-detail-visit').hidden = !selected || activeHall === 'main';
  if (!selected) return;
  const copy = PAGE_COPY[locale];
  $('#hall-detail-title').textContent = copy[`halls.${activeHall}`];
  $('#hall-detail-capacity').textContent = `${copy[`halls.${activeHall}Capacity`]} ${copy['halls.seats']}`;
  $('#hall-enquire').dataset.hall = activeHall;
  if (activeHall !== 'main') $('#gallery-image-message').textContent = copy['halls.noPhoto'];
}

function openHallGallery(hall, opener) {
  activeHall = hall;
  updateHallDetail();
  if (hall === 'main') renderGallery(3);
  else {
    setGalleryZoom(false);
    galleryImage.onload = null;
    galleryImage.onerror = null;
    galleryImage.removeAttribute('src');
    galleryImage.hidden = true;
    galleryState = 'empty';
    $('#gallery-image-status').hidden = false;
    $('#gallery-image-message').textContent = PAGE_COPY[locale]['halls.noPhoto'];
    $('#gallery-retry').hidden = true;
    $('#gallery-zoom').disabled = true;
  }
  if (!hallDialog.open) openDialog(hallDialog, opener);
}

function applyHallLayout() {
  const enabled = theme === 'emerald-halls';
  $('#legacy-halls').hidden = enabled;
  hallDirectory.hidden = !enabled;
  $('#halls').setAttribute('aria-labelledby', enabled ? 'hall-directory-title' : 'halls-title');
  $$('.desktop-nav a[href="#gallery"], .mobile-nav a[href="#gallery"]').forEach(link => { link.hidden = enabled; });
  $('#contact-navigation').hidden = !enabled;
  contactMap.hidden = !enabled;
  $('.contact-photo').hidden = enabled;
  $('#contacts-title').classList.toggle('sr-only', enabled);
  $('#contact-address-label').hidden = !enabled;
  $('#contact-phone-label').hidden = !enabled;
  if (enabled) {
    $('#contact-socials').append(contactLinks);
    $('#contact-map-route').append(contactRoute);
    if (!venueMap.hasAttribute('src')) venueMap.src = venueMap.dataset.src;
  } else {
    contactCopy.append(contactRoute, contactLinks);
    venueMap.removeAttribute('src');
  }
  hallGallery.hidden = enabled;
  if (!enabled) {
    if (activeHall && hallDialog.open) hallDialog.close();
    activeHall = null;
  }
  updateHallDetail();
  restoreGalleryAnchor();
}

function restoreGalleryAnchor() {
  if (theme !== 'emerald-halls' || location.hash !== '#gallery') return;
  openHallGallery('main', $('[data-hall-view="main"]'));
}
window.addEventListener('hashchange', restoreGalleryAnchor);

$$('[data-hall-view]').forEach(button => button.addEventListener('click', () => {
  openHallGallery(button.dataset.hallView, button);
}));
hallDialog.addEventListener('close', () => {
  if (!activeHall) return;
  activeHall = null;
  if (location.hash === '#gallery') {
    const url = new URL(location.href);
    url.hash = 'halls';
    history.replaceState(null, '', url);
  }
  updateHallDetail();
});
$('#hall-menu').addEventListener('click', () => {
  if (!activeHall) return;
  selectedMenuHall = activeHall;
  if (!['banquet', 'newyear'].includes(menuKind.value)) menuKind.value = 'banquet';
  selectMenuGroup();
  dialogOpeners.set(hallDialog, $(`[data-menu-filter="${selectedMenuHall}"]`));
  hallDialog.close();
});
$('#hall-enquire').addEventListener('click', () => {
  dialogOpeners.set(hallDialog, $('#event'));
  hallDialog.close();
});
applyHallLayout();

const menuViewer = $('#menu-viewer');
const menuViewerStage = $('#menu-viewer-stage');
let currentMenu = null;
function updateMenuViewerCopy() {
  if (!currentMenu) return;
  const videoLink = $('#menu-reader-video');
  const videoId = MENU_VIDEOS[currentMenu.id];
  videoLink.hidden = !videoId;
  if (videoId) {
    videoLink.href = VIDEOS[videoId].src;
    videoLink.dataset.video = videoId; videoLink.dataset.videoMenu = currentMenu.id;
  } else {
    videoLink.removeAttribute('href');
    delete videoLink.dataset.video; delete videoLink.dataset.videoMenu;
  }
  const title = $('#menu-viewer-title');
  title.textContent = getMenuTitle(currentMenu, locale);
  if (currentMenu.occasion === 'newyear') {
    const hall = document.createElement('span'); hall.className = 'menu-reader-hall';
    hall.textContent = menuHall(currentMenu.hall, locale);
    title.replaceChildren(document.createTextNode(PAGE_COPY[locale]['menu.newyear'] + ' '), hall);
  }
  $('#menu-viewer-prices').querySelectorAll('button').forEach(button => {
    const offer = MENUS.find(menu => menu.id === button.dataset.menuOffer);
    button.textContent = `${numberFormatter(locale).format(offer.price)} ₸`;
    button.setAttribute('aria-pressed', String(offer === currentMenu));
  });
  const sections = getMenuSections(currentMenu, locale).map(category => {
    const section = document.createElement('section');
    const title = document.createElement('h3'); title.textContent = category.title;
    const list = document.createElement('ul');
    category.items.forEach(item => {
      const li = document.createElement('li');
      const name = document.createElement('span'); name.textContent = item.name;
      li.append(name);
      list.append(li);
    });
    section.append(title, list);
    return section;
  });
  const columns = [sections.slice(0, 3), sections.slice(3)].map(sections => {
    const column = document.createElement('div'); column.className = 'menu-reader-column';
    column.append(...sections);
    return column;
  });
  $('#menu-reader-sections').replaceChildren(...columns);
  $('#menu-reader-notes').textContent = getMenuFooterNotes(currentMenu, locale).join(' ');
  $('#menu-reader-services').hidden = !['main', 'middle', 'small'].includes(currentMenu.hall) || currentMenu.servicesIncluded;
}
$$('[data-menu-viewer]').forEach(card => card.addEventListener('click', event => {
  // Keep native open-in-new-tab and no-JavaScript image links available.
  if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  currentMenu = MENUS.find(menu => menu.id === card.dataset.menuId);
  const prices = MENUS.filter(menu => getMenuCollection(menu) === getMenuCollection(currentMenu)).map(menu => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'menu-filter'; button.dataset.menuOffer = menu.id;
    button.addEventListener('click', () => {
      currentMenu = menu;
      updateMenuViewerCopy();
      menuViewerStage.scrollTop = 0;
    });
    return button;
  });
  $('#menu-viewer-prices').replaceChildren(...prices);
  updateMenuViewerCopy();
  openDialog(menuViewer, card);
  menuViewerStage.scrollTop = 0;
  menuViewerStage.focus({ preventScroll: true });
}));
$('#menu-reader-discuss').addEventListener('click', event => {
  const id = currentMenu.id;
  showMessage(() => composeMenuMessage(id, locale), event.currentTarget, 'quick');
});
$('#menu-reader-services').addEventListener('click', event => {
  event.preventDefault();
  selectServiceHall(currentMenu.hall);
  // The destination is outside the closing dialog, so restore focus there.
  const destination = $(`[data-service-filter="${currentMenu.hall}"]`);
  dialogOpeners.set(menuViewer, destination);
  menuViewer.close();
  $('#services').scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'instant' : 'smooth' });
});

const videoDialog = $('#video-dialog');
const videoPlayer = $('#venue-video');
const videoControls = $('#video-controls');
const videoSeek = $('#video-seek');
const videoVolume = $('#video-volume');
let lastVideoVolume = videoPlayer.volume || 1;
let canSetVideoVolume = false;
try {
  const probe = document.createElement('video');
  probe.volume = .5;
  canSetVideoVolume = probe.volume === .5;
} catch { /* Some devices reserve media volume for their system controls. */ }
videoVolume.hidden = !canSetVideoVolume;
$('#video-device-volume').hidden = canSetVideoVolume;
let videoVersion = 0;
let videoScrubbing = false;
let videoSeekTarget = null;
let appliedVideoSeek = null;
let activeVideo = null;
function videoTime(seconds) {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
function updateVideoControls() {
  const copy = PAGE_COPY[locale];
  const playing = !videoPlayer.paused && !videoPlayer.ended && !videoPlayer.error;
  const muted = videoPlayer.muted || videoPlayer.volume === 0;
  const duration = Number.isFinite(videoPlayer.duration) ? videoPlayer.duration : 0;
  $('#video-toggle').setAttribute('aria-label', copy[playing ? 'media.pause' : 'media.play']);
  $('#video-toggle use').setAttribute('href', playing ? '#i-pause' : '#i-play');
  $('#video-mute').setAttribute('aria-label', copy[muted ? 'media.unmute' : 'media.mute']);
  $('#video-mute use').setAttribute('href', muted ? '#i-muted' : '#i-sound');
  if (videoPlayer.volume > 0) lastVideoVolume = videoPlayer.volume;
  const volume = videoPlayer.muted ? 0 : videoPlayer.volume;
  videoVolume.value = String(volume);
  videoVolume.setAttribute('aria-valuetext', `${Math.round(volume * 100)}%`);
  videoVolume.style.setProperty('--video-progress', `${volume * 100}%`);
  videoSeek.disabled = duration <= 0 || !!videoPlayer.error;
  videoSeek.max = String(duration || 1);
  if (!videoScrubbing) videoSeek.value = String(videoSeekTarget ?? (videoPlayer.currentTime || 0));
  const current = videoTime(Number(videoSeek.value));
  const total = videoTime(duration);
  videoSeek.setAttribute('aria-valuetext', copy['media.time'].replace('{current}', current).replace('{duration}', total));
  videoSeek.style.setProperty('--video-progress', `${duration ? Number(videoSeek.value) / duration * 100 : 0}%`);
  $('#video-time').textContent = `${current} / ${total}`;
}
function videoWaiting(waiting) {
  $('#video-loading').hidden = !waiting;
  $('.video-stage').setAttribute('aria-busy', String(waiting));
}
async function toggleVideo() {
  if (!videoPlayer.paused && !videoPlayer.ended && !videoPlayer.error) { videoPlayer.pause(); return; }
  const version = videoVersion;
  $('#video-error').hidden = true;
  if (videoPlayer.error) videoPlayer.load();
  if (videoPlayer.ended) videoPlayer.currentTime = 0;
  try { await videoPlayer.play(); }
  catch (error) {
    if (error.name !== 'AbortError' && videoDialog.open && version === videoVersion) {
      videoWaiting(false);
      $('#video-error').hidden = error.name === 'NotAllowedError';
      updateVideoControls();
    }
  }
}
$('#video-toggle').addEventListener('click', toggleVideo);
videoPlayer.addEventListener('click', toggleVideo);
$('#video-mute').addEventListener('click', () => {
  const muted = videoPlayer.muted || videoPlayer.volume === 0;
  if (canSetVideoVolume && videoPlayer.volume === 0) videoPlayer.volume = lastVideoVolume;
  videoPlayer.muted = !muted;
  updateVideoControls();
});
videoVolume.addEventListener('input', () => {
  if (!canSetVideoVolume) return;
  videoPlayer.volume = Number(videoVolume.value);
  videoPlayer.muted = videoPlayer.volume === 0;
  updateVideoControls();
});
videoSeek.addEventListener('pointerdown', () => { videoScrubbing = true; });
function applyVideoSeek() {
  if (videoSeekTarget === null || videoPlayer.seeking) return;
  appliedVideoSeek = videoSeekTarget;
  videoPlayer.currentTime = videoSeekTarget;
}
videoSeek.addEventListener('input', () => {
  if (!videoSeek.disabled) { videoSeekTarget = Number(videoSeek.value); applyVideoSeek(); }
  updateVideoControls();
});
videoPlayer.addEventListener('seeked', () => {
  // WebKit can drop a new currentTime assignment while its previous seek is pending.
  if (videoSeekTarget !== null && videoSeekTarget !== appliedVideoSeek) applyVideoSeek();
  else videoSeekTarget = appliedVideoSeek = null;
  updateVideoControls();
});
function finishVideoSeek() { videoScrubbing = false; updateVideoControls(); }
['change', 'pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach(name => videoSeek.addEventListener(name, finishVideoSeek));
['timeupdate', 'durationchange', 'loadedmetadata', 'play', 'pause', 'ended', 'volumechange', 'emptied'].forEach(name => videoPlayer.addEventListener(name, updateVideoControls));
videoPlayer.addEventListener('loadstart', () => videoWaiting(videoDialog.open && videoPlayer.hasAttribute('src')));
videoPlayer.addEventListener('waiting', () => videoWaiting(videoDialog.open && !videoPlayer.paused));
videoPlayer.addEventListener('loadedmetadata', () => {
  const ratio = videoPlayer.videoWidth / videoPlayer.videoHeight;
  if (!Number.isFinite(ratio) || ratio <= 0) return;
  videoDialog.classList.toggle('is-landscape', ratio > 1);
  videoDialog.style.setProperty('--source-ratio', String(ratio));
});
['canplay', 'playing', 'pause', 'emptied'].forEach(name => videoPlayer.addEventListener(name, () => videoWaiting(false)));
videoPlayer.controls = false;
videoControls.hidden = false;
function updateVideoCopy() {
  if (!activeVideo) return;
  const menu = MENUS.find(menu => menu.id === activeVideo.menuId);
  $('#video-title').textContent = menu ? menuHall(menu.hall, locale) : PAGE_COPY[locale][VIDEOS[activeVideo.id].title];
  $('#video-context').textContent = menu ? `${numberFormatter(locale).format(menu.price)} ₸ ${PAGE_COPY[locale]['menu.perGuest']}` : '';
  $('#video-context').hidden = !menu;
  $('#video-discuss').hidden = !menu;
  $('.video-actions').hidden = !menu;
  videoDialog.classList.toggle('has-menu', !!menu);
  updateVideoControls();
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-video]');
  if (!link || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  if (!Object.hasOwn(VIDEOS, link.dataset.video)) return;
  event.preventDefault();
  videoVersion++;
  videoSeekTarget = appliedVideoSeek = null;
  activeVideo = { id: link.dataset.video, menuId: link.dataset.videoMenu };
  const video = VIDEOS[activeVideo.id];
  $('#video-error').hidden = true;
  $('#video-original').href = video.src;
  videoPlayer.poster = video.poster;
  $('.video-stage').style.setProperty('--video-poster', `url("${video.poster}")`);
  videoPlayer.src = window.matchMedia('(max-width: 1000px)').matches ? video.mobileSrc : video.src;
  updateVideoCopy();
  openDialog(videoDialog, link);
  videoPlayer.load();
  toggleVideo();
});
videoPlayer.addEventListener('error', () => {
  if (videoDialog.open && videoPlayer.hasAttribute('src')) {
    videoPlayer.pause();
    videoSeekTarget = appliedVideoSeek = null;
    videoWaiting(false); $('#video-error').hidden = false; updateVideoControls();
  }
});
videoDialog.addEventListener('close', () => {
  videoVersion++; videoScrubbing = false; videoSeekTarget = appliedVideoSeek = null;
  videoPlayer.pause(); videoPlayer.removeAttribute('src'); videoPlayer.removeAttribute('poster'); videoPlayer.load();
  $('.video-stage').style.removeProperty('--video-poster');
  videoDialog.classList.remove('is-landscape');
  videoDialog.style.removeProperty('--source-ratio');
  $('#video-error').hidden = true; videoWaiting(false); updateVideoControls();
  activeVideo = null;
});
$('#video-discuss').addEventListener('click', event => {
  const id = activeVideo.menuId;
  videoPlayer.pause();
  showMessage(() => composeMenuMessage(id, locale), event.currentTarget, 'quick');
});

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
menuToggle.setAttribute('aria-expanded', String(mobileMenu.open));
header.classList.toggle('menu-open', mobileMenu.open);

function applyLanguage(nextLocale) {
  locale = normalizeLocale(nextLocale);
  document.documentElement.lang = locale;
  languageSelect.value = locale;
  languageSelect.setAttribute('aria-label', t('language'));
  languageSelect.title = t('language');
  const copy = PAGE_COPY[locale];
  $$('[data-i18n]').forEach(element => { element.textContent = copy[element.dataset.i18n]; });
  $$('[data-menu-amount]').forEach(element => { element.textContent = `${numberFormatter(locale).format(Number(element.dataset.menuAmount))} ₸`; });
  updateMenuAssets();
  ['placeholder', 'aria-label', 'alt', 'title', 'content'].forEach(attribute => {
    $$(`[data-i18n-${attribute}]`).forEach(element => {
      element.setAttribute(attribute, copy[element.getAttribute(`data-i18n-${attribute}`)]);
    });
  });
  const plannerCopy = getPlannerCopy(locale);
  $$('#event option').forEach(option => { if (Object.hasOwn(plannerCopy.events, option.value)) option.textContent = plannerCopy.events[option.value]; });
  menuToggle.setAttribute('aria-label', t(mobileMenu.open ? 'menuClose' : 'menuOpen'));
  updateWishesCount();
  costNumber = numberFormatter(locale);
  renderCostText();

  // Refresh existing errors without validating untouched fields or changing drafts.
  const enquiryErrors = validateEnquiry({ event: $('#event').value, hall: $('#hall').value, date: dateField.value, guests: $('#guests').value, wishes: $('#wishes').value }, undefined, locale);
  if (dateField.validity.badInput) enquiryErrors.date = t('badDate');
  if ($('#guests').validity.badInput) enquiryErrors.guests = t('badGuests');
  form.querySelectorAll('[aria-invalid="true"]').forEach(input => {
    if (enquiryErrors[input.id]) $(`#${input.id}-error`).textContent = enquiryErrors[input.id];
    else clearFieldError(input.id);
  });
  if ($('#form-status').textContent) $('#form-status').textContent = t('checkFields');
  const costErrors = validateBudget(costData(), locale);
  costFields.forEach(name => {
    if (!costForm.querySelector(`[name="${name}"][aria-invalid="true"]`)) return;
    if (costErrors[name]) $(`#cost-${name}-error`).textContent = costErrors[name];
    else clearCostError(name);
  });
  $$('[data-quick-topic]').forEach(link => { link.href = whatsappUrl(composeQuickMessage(link.dataset.quickTopic, link.dataset.quickHall, locale)); });
  if (messageDialog.open && messageFactory) renderMessage();
  galleryImage.alt = t(`gallery.alt.${galleryIndex}`);
  $('#lightbox-caption').textContent = t(`gallery.caption.${galleryIndex}`);
  $('#gallery-count').textContent = `${(activeHall === 'main' ? (galleryIndex + 1) % gallery.length : galleryIndex) + 1} / ${gallery.length}`;
  $('#gallery-zoom').textContent = t(galleryZoomed ? 'zoomOut' : 'zoomIn');
  $('#gallery-image-message').textContent = t(galleryState === 'error' ? 'photoError' : 'photoLoading');
  updateMenuViewerCopy();
  updateVideoCopy();
  updateThemeControl();
  updateHallDetail();
}
languageSelect.addEventListener('change', () => {
  applyLanguage(languageSelect.value);
  try { localStorage.setItem('royal-palace-language', locale); } catch { /* The current page still works without storage. */ }
  const url = new URL(location.href);
  url.searchParams.set('lang', locale);
  history.replaceState(null, '', url);
});
applyLanguage(locale);
