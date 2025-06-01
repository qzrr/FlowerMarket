// js/app.js
document.addEventListener('DOMContentLoaded', () => {
  // Общие компоненты UI (инициализируются всегда)
  initMobileMenu();
  initHeroSlider();
  if (window.Search && Search.initSearchModal) Search.initSearchModal();
  if (typeof setupContactForm === 'function') setupContactForm(); // На странице контактов

  // Инициализация корзины (счетчик в шапке)
  if (window.Cart && Cart.updateCartCounter) Cart.updateCartCounter();

  // Auth.js и Cart.js имеют свои собственные 'DOMContentLoaded' для базовой инициализации.
  // Здесь мы вызываем функции, которые зависят от загрузки данных или специфичны для страницы.

  loadPageSpecificData();
});

async function loadPageSpecificData() {
  const path = window.location.pathname;
  // Определяем имя файла или корневой путь
  const pageName = path.substring(path.lastIndexOf('/') + 1) || (path === '/' ? 'index.html' : '');

  // Загрузка категорий для футера (на всех страницах)
  if (window.Display && Display.footerCategories) await Display.footerCategories();

  if (pageName === 'index.html' || pageName === '') {
    if (window.Display && Display.homepageCategories) await Display.homepageCategories();
    if (window.Display && Display.popularProducts) await Display.popularProducts();
    if (window.Display && Display.homepageReviews) await Display.homepageReviews();
  }
  // Для страниц catalog.html, product.html, user.html, cart.html - их специфичные JS файлы
  // (catalog.js, product.js, user.js, cart.js) уже должны были инициализироваться
  // через свой собственный 'DOMContentLoaded' и загрузить необходимые данные.
  // app.js в этом случае больше отвечает за общие компоненты.
}
