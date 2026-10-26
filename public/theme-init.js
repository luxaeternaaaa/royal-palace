try {
  const savedTheme = localStorage.getItem('royal-palace-theme');
  if (savedTheme === 'emerald' || savedTheme === 'emerald-halls') {
    document.documentElement.dataset.theme = 'emerald';
    if (savedTheme === 'emerald-halls') document.documentElement.dataset.layout = 'halls';
    document.querySelector('meta[name="theme-color"]').content = '#064734';
  }
} catch { /* The default theme works when browser storage is disabled. */ }

// Only preload the photograph belonging to the saved design.
for (const preload of document.querySelectorAll?.('[data-hero-preload]') || []) {
  const variant = document.documentElement.dataset.layout === 'halls' ? 'halls' : 'legacy';
  preload.media = preload.dataset.heroPreload === variant ? preload.dataset.heroMedia : 'not all';
}
