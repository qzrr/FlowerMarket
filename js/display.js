// js/display.js
(function () {
  async function displayHomepageCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    try {
      let categories = await API.getCategories();
      if (categories && categories.length > 0) {
        const featured = categories.filter(cat => cat.featured === true || cat.featured === 1);
        const toDisplay = featured.length > 0 ? featured : categories.slice(0, 4); // Показать 4, если нет featured
        container.innerHTML = toDisplay.map(window.createCategoryCardHTML).join('');
      } else {
        container.innerHTML = '<p>Категории не найдены.</p>';
      }
    } catch (e) {
      container.innerHTML = '<p class="error-message">Ошибка загрузки категорий.</p>';
      console.error(e);
    }
  }

  async function displayFooterCategories() {
    const container = document.getElementById('footer-categories-list');
    if (!container) return;
    try {
      const categories = await API.getCategories();
      if (categories && categories.length > 0) {
        container.innerHTML = categories.map(cat =>
          `<li><a href="catalog.html?category=${cat.id || cat.slug}">${cat.name}</a></li>`
        ).join('');
      }
    } catch (e) {
      console.error("Ошибка загрузки категорий для футера:", e);
    }
  }

  async function displayPopularProducts() {
    const container = document.getElementById('popular-products-container');
    if (!container) return;
    container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    try {
      const popular = await API.getPopularProducts();
      if (popular && popular.length > 0) {
        container.innerHTML = popular.map(window.createProductCardHTML).join('');
        if (window.Search && Search.setupPopularSearch) Search.setupPopularSearch(popular);
        if (window.Search && Search.setupProductCardActionsForContainer) Search.setupProductCardActionsForContainer(container);
      } else {
        container.innerHTML = '<p>Популярные товары не найдены.</p>';
      }
    } catch (e) {
      container.innerHTML = '<p class="error-message">Ошибка загрузки популярных товаров.</p>';
      console.error(e);
    }
  }

  async function displayHomepageReviews() {
    const container = document.getElementById('reviews-slider-container'); // Или другой ID
    if (!container) return;
    // container.innerHTML = '<div class="loading-spinner">Загрузка...</div>';
    try {
      const reviews = await API.getReviews(); // Запрос всех отзывов
      if (reviews && reviews.length > 0) {
        const toDisplay = reviews.slice(0, 5); // Показать несколько
        container.innerHTML = toDisplay.map(review => `
              <div class="review-card swiper-slide">
                <div class="review-card__author">
                    <img src="${review.avatar || window.IMAGE_PLACEHOLDERS.AVATAR_DEFAULT}" alt="${review.author || review.name}" class="review-card__avatar">
                    <div>
                      <h4 class="review-card__author-name">${review.author || review.name}</h4>
                      <div class="review-card__rating">${generateRatingStarsHTML(review.rating)}</div>
                      <div class="review-card__date">${new Date(review.dateObj || review.date).toLocaleDateString('ru-RU')}</div>
                    </div>
                </div>
                <p class="review-card__text">${review.text}</p>
              </div>
          `).join('');
        // Если используете Swiper.js, инициализируйте его здесь
        // if (typeof Swiper !== 'undefined' && container.closest('.swiper')) {
        //   new Swiper(container.closest('.swiper'), { /* options */ });
        // }
      } else {
        container.innerHTML = '<p>Отзывов пока нет.</p>';
      }
    } catch (e) {
      container.innerHTML = '<p class="error-message">Ошибка загрузки отзывов.</p>';
      console.error(e);
    }
  }

  function generateRatingStarsHTML(rating) {
    let stars = '';
    const full = Math.floor(rating);
    const half = (rating - full) >= 0.4;
    const assetsPath = (window.location.pathname.includes('/pages/') || (window.location.pathname.endsWith('.html') && !window.location.pathname.endsWith('index.html'))) ? '../assets/' : 'assets/';

    for (let i = 0; i < 5; i++) {
      if (i < full) stars += `<img src="${assetsPath}star-full.svg" alt="★" class="star">`;
      else if (i === full && half) stars += `<img src="${assetsPath}star-half.svg" alt="½" class="star">`;
      else stars += `<img src="${assetsPath}star-empty.svg" alt="☆" class="star">`;
    }
    return `<span class="rating-stars-wrapper">${stars}</span>`;
  }

  window.Display = {
    homepageCategories, footerCategories, popularProducts, homepageReviews, generateRatingStarsHTML
  };
})();
// Инициализация в app.js
