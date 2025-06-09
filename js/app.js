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
  if (window.Display && Display.displayFooterCategories) await Display.displayFooterCategories();
  if (pageName === 'index.html' || pageName === '') {
    if (window.Display && Display.displayHomepageCategories) await Display.displayHomepageCategories();
    if (window.Display && Display.displayPopularProducts) await Display.displayPopularProducts();
    if (window.Display && Display.displayHomepageReviews) await Display.displayHomepageReviews();
  }
}


document.addEventListener('DOMContentLoaded', async function () {
  // Проверяем, находимся ли мы на главной странице
  const isHomePage = window.location.pathname === '/' ||
    window.location.pathname === '/index.html' ||
    window.location.pathname === '/pages/index.html';

  if (!isHomePage) return;

  // Загрузка популярных товаров для главной страницы
  const popularProductsContainer = document.getElementById('popular-products-container');
  if (popularProductsContainer) {
    try {
      // Используем API без кэширования для получения свежих данных
      const popularProducts = await API.getPopularProducts(false);

      if (popularProducts && popularProducts.length > 0) {
        popularProductsContainer.innerHTML = `
          <div class="product-grid">
            ${popularProducts.map(product => window.createProductCardHTML(product)).join('')}
          </div>
        `;

        // Настраиваем обработчики событий для карточек товаров
        if (window.Search && Search.setupProductCardActionsForContainer) {
          Search.setupProductCardActionsForContainer(popularProductsContainer);
        }
      } else {
        popularProductsContainer.innerHTML = '<p>Популярные товары не найдены.</p>';
      }
    } catch (error) {
      console.error('Ошибка загрузки популярных товаров:', error);
      popularProductsContainer.innerHTML = '<p class="error-message">Не удалось загрузить популярные товары.</p>';
    }
  }
});


