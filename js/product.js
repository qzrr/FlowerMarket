// js/product.js
(function () {
  let currentProduct = null;
  let currentProductId = null;

  async function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentProductId = parseInt(urlParams.get('id'));
    const loadingEl = document.getElementById('product-page-loading'); // ID индикатора загрузки

    if (!currentProductId) {
      showErrorPage('Информация о товаре не найдена.');
      return;
    }
    if (loadingEl) loadingEl.style.display = 'block';

    try {
      currentProduct = await API.getProductById(currentProductId);
      if (!currentProduct) {
        showErrorPage('Товар не найден.');
        return;
      }

      renderProductDetails();
      await renderProductReviews();
      await renderRelatedProducts();
      setupProductPageEventListeners();
      updateMainWishlistButtonState();

    } catch (error) {
      console.error('Ошибка загрузки страницы продукта:', error);
      showErrorPage('Не удалось загрузить информацию о товаре.');
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  }

  function renderProductDetails() {
    document.title = `${currentProduct.name} | Flowwow`;
    document.getElementById('product-page-title').textContent = currentProduct.name; // ID для заголовка
    document.getElementById('product-page-price').textContent = formatPrice(currentProduct.price);

    const oldPriceEl = document.getElementById('product-page-old-price');
    const discountBadgeEl = document.getElementById('product-page-discount-badge');
    if (currentProduct.oldPrice && currentProduct.oldPrice > currentProduct.price) {
      if (oldPriceEl) {
        oldPriceEl.textContent = formatPrice(currentProduct.oldPrice);
        oldPriceEl.style.display = 'inline';
      }
      if (discountBadgeEl && currentProduct.discount) {
        discountBadgeEl.textContent = `-${currentProduct.discount}%`;
        discountBadgeEl.style.display = 'inline-block';
      } else if (discountBadgeEl) {
        discountBadgeEl.style.display = 'none';
      }
    } else {
      if (oldPriceEl) oldPriceEl.style.display = 'none';
      if (discountBadgeEl) discountBadgeEl.style.display = 'none';
    }

    document.getElementById('product-page-description-short').innerHTML = `<p>${currentProduct.description}</p>`;

    // Галерея
    const mainImgEl = document.getElementById('product-main-image');
    const thumbnailsContainerEl = document.getElementById('product-thumbnails-container');
    const productImages = currentProduct.images || (currentProduct.image ? [currentProduct.image] : []);

    if (mainImgEl && productImages.length > 0) {
      mainImgEl.src = productImages[0];
      mainImgEl.alt = currentProduct.name;
      if (thumbnailsContainerEl) {
        thumbnailsContainerEl.innerHTML = productImages.map((imgSrc, index) => `
                <button class="product__thumbnail ${index === 0 ? 'active' : ''}" data-image-src="${imgSrc}">
                    <img src="${imgSrc}" alt="Миниатюра ${currentProduct.name} ${index + 1}">
                </button>
            `).join('');
        thumbnailsContainerEl.querySelectorAll('.product__thumbnail').forEach(thumb => {
          thumb.addEventListener('click', function () {
            mainImgEl.src = this.dataset.imageSrc;
            thumbnailsContainerEl.querySelector('.active')?.classList.remove('active');
            this.classList.add('active');
          });
        });
      }
    } else if (mainImgEl) { // Если нет изображений, ставим плейсхолдер
      mainImgEl.src = window.IMAGE_PLACEHOLDERS.PRODUCT;
      mainImgEl.alt = "Изображение отсутствует";
      if (thumbnailsContainerEl) thumbnailsContainerEl.innerHTML = '';
    }

    // Вкладки
    const descTabContent = document.getElementById('tab-panel-description'); // ID для контента вкладок
    const compTabContent = document.getElementById('tab-panel-composition');

    if (descTabContent) descTabContent.innerHTML = `<p>${currentProduct.details || currentProduct.description}</p>`;
    if (compTabContent) {
      if (currentProduct.composition && currentProduct.composition.length > 0) {
        compTabContent.innerHTML = '<ul>' + currentProduct.composition.map(item => `<li>${item}</li>`).join('') + '</ul>';
      } else {
        compTabContent.innerHTML = '<p>Информация о составе отсутствует.</p>';
      }
    }

    // Рейтинг и кол-во отзывов под названием товара
    const ratingStarsDisplay = document.getElementById('product-header-rating-stars');
    const reviewsCountDisplay = document.getElementById('product-header-reviews-count');
    if (currentProduct.rating && ratingStarsDisplay) {
      ratingStarsDisplay.innerHTML = window.Display.generateRatingStarsHTML(currentProduct.rating);
    }
    if (reviewsCountDisplay) {
      const reviewsLength = currentProduct.reviews ? currentProduct.reviews.length : (currentProduct.reviewsCount || 0);
      reviewsCountDisplay.textContent = `(${reviewsLength} ${getReviewPlural(reviewsLength)})`;
    }
  }

  async function renderProductReviews() {
    const reviewsContainer = document.getElementById('tab-panel-reviews'); // ID для контента вкладки отзывов
    const reviewsSectionTitle = document.getElementById('reviews-section-title'); // Заголовок секции "Отзывы (N)"
    if (!reviewsContainer) return;

    try {
      let reviews;

      // Используем отзывы, вложенные в товар, если они есть и актуальны
      if (currentProduct.reviews && Array.isArray(currentProduct.reviews) && currentProduct.reviews.length > 0) {
        reviews = currentProduct.reviews;
        console.log("Используем отзывы из кэша продукта");
      } else {
        // Иначе запрашиваем по API с отключенным кэшированием для получения свежих данных
        console.log("Запрашиваем отзывы через API");
        reviews = await API.getReviewsByProductId(currentProductId, false);
      }

      if (reviewsSectionTitle) {
        reviewsSectionTitle.textContent = `Отзывы (${reviews ? reviews.length : 0})`;
      }

      if (reviews && reviews.length > 0) {
        reviewsContainer.innerHTML = reviews.map(review => {
          // Обработка даты с проверкой формата
          let displayDate;
          try {
            displayDate = new Date(review.dateObj || review.date).toLocaleDateString('ru-RU');
          } catch (e) {
            displayDate = review.date || 'Дата не указана';
          }

          return `
          <div class="review-card">
            <div class="review-card__header">
              <img src="${review.avatar || window.IMAGE_PLACEHOLDERS.AVATAR_DEFAULT}" alt="${review.author || review.name}" class="review-card__avatar">
              <div class="review-card__author-info">
                <strong class="review-card__author-name">${review.author || review.name}</strong>
                <div class="review-card__date">${displayDate}</div>
              </div>
            </div>
            <div class="review-card__rating">${window.Display.generateRatingStarsHTML(review.rating)}</div>
            <p class="review-card__text">${review.text}</p>
          </div>
        `;
        }).join('');
      } else {
        reviewsContainer.innerHTML = '<p>Отзывов о товаре пока нет. Будьте первым!</p>';
      }
    } catch (error) {
      console.error('Ошибка загрузки отзывов для товара:', error);
      reviewsContainer.innerHTML = '<p class="error-message">Не удалось загрузить отзывы.</p>';
    }
  }

  async function renderRelatedProducts() {
    const relatedContainer = document.getElementById('related-products-section-container'); // ID контейнера для похожих товаров
    if (!relatedContainer || !currentProduct) return;

    // Проверяем наличие категории для поиска похожих
    if (!currentProduct.category && !currentProduct.categoryId && !currentProduct.categoryName) {
      console.warn("Не удалось определить категорию товара для поиска похожих");
      relatedContainer.innerHTML = '<h3>Похожие товары</h3><p>Похожие товары не найдены.</p>';
      return;
    }

    relatedContainer.innerHTML = '<div class="loading-spinner">Загрузка похожих товаров...</div>';
    try {
      // Пробуем найти товары той же категории
      let related = [];

      if (currentProduct.category) {
        // Используем API с отключенным кэшированием для получения свежих данных
        related = await API.getProductsByCategory(currentProduct.category, false);
        related = related.filter(p => p.id !== currentProductId).slice(0, 4);
      }

      // Если не нашли по категории или список пуст, пробуем найти популярные товары
      if (related.length === 0) {
        console.log("Не найдены товары в той же категории, ищем популярные");
        const popular = await API.getPopularProducts(false);
        related = popular.filter(p => p.id !== currentProductId).slice(0, 4);
      }

      if (related.length > 0) {
        relatedContainer.innerHTML = `<h3>Похожие товары</h3><div class="product-grid">` +
          related.map(window.createProductCardHTML).join('') +
          `</div>`;
        if (window.Search && Search.setupProductCardActionsForContainer) {
          Search.setupProductCardActionsForContainer(relatedContainer.querySelector('.product-grid'));
        }
      } else {
        relatedContainer.innerHTML = '<h3>Похожие товары</h3><p>Похожие товары не найдены.</p>';
      }
    } catch (error) {
      console.error('Ошибка загрузки похожих товаров:', error);
      relatedContainer.innerHTML = '<h3>Похожие товары</h3><p class="error-message">Не удалось загрузить.</p>';
    }
  }


  function setupProductPageEventListeners() {
    const addToCartBtn = document.getElementById('product-page-add-to-cart-btn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        if (currentProduct) {
          const quantityInput = document.getElementById('product-quantity-input');
          const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
          if (quantity > 0) window.Cart.addToCart(currentProduct.id, quantity, currentProduct);
          else showNotification("Выберите количество товара", true);
        }
      });
    }

    const quantityInput = document.getElementById('product-quantity-input');
    const plusBtn = document.getElementById('product-quantity-plus');
    const minusBtn = document.getElementById('product-quantity-minus');

    if (plusBtn && quantityInput) {
      plusBtn.addEventListener('click', () => {
        quantityInput.value = parseInt(quantityInput.value) + 1;
      });
    }
    if (minusBtn && quantityInput) {
      minusBtn.addEventListener('click', () => {
        let val = parseInt(quantityInput.value);
        if (val > 1) quantityInput.value = val - 1;
      });
    }

    // Вкладки
    const tabButtons = document.querySelectorAll('.product-tabs__nav-btn'); // Кнопки навигации вкладок
    const tabPanels = document.querySelectorAll('.product-tabs__panel'); // Панели контента вкладок
    tabButtons.forEach(button => {
      button.addEventListener('click', function () {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        this.classList.add('active');
        const targetPanelId = this.getAttribute('data-tab-target'); // e.g., "description", "composition", "reviews"
        document.getElementById(`tab-panel-${targetPanelId}`)?.classList.add('active');
      });
    });
    // Активируем первую вкладку по умолчанию
    if (tabButtons.length > 0 && tabPanels.length > 0) {
      tabButtons[0].classList.add('active');
      const firstPanelId = tabButtons[0].getAttribute('data-tab-target');
      document.getElementById(`tab-panel-${firstPanelId}`)?.classList.add('active');
    }


    const wishlistBtn = document.getElementById('product-page-wishlist-btn'); // Главная кнопка избранного
    if (wishlistBtn) {
      wishlistBtn.addEventListener('click', function () {
        if (!currentProduct) return;
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const productId = currentProduct.id;
        const index = wishlist.indexOf(productId);
        const heartIcon = this.querySelector('img');

        if (index > -1) {
          wishlist.splice(index, 1);
          this.classList.remove('active');
          if (heartIcon) heartIcon.src = window.ASSET_PATHS.HEART_SVG;
          showNotification('Удалено из избранного');
        } else {
          wishlist.push(productId);
          this.classList.add('active');
          if (heartIcon) heartIcon.src = window.ASSET_PATHS.HEART_FILLED_SVG;
          showNotification('Добавлено в избранное');
        }
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
      });
    }
  }

  function updateMainWishlistButtonState() {
    const wishlistBtn = document.getElementById('product-page-wishlist-btn');
    if (!wishlistBtn || !currentProduct) return;
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    const heartIcon = wishlistBtn.querySelector('img');
    if (wishlist.includes(currentProduct.id)) {
      wishlistBtn.classList.add('active');
      if (heartIcon) heartIcon.src = window.ASSET_PATHS.HEART_FILLED_SVG;
    } else {
      wishlistBtn.classList.remove('active');
      if (heartIcon) heartIcon.src = window.ASSET_PATHS.HEART_SVG;
    }
  }

  function getReviewPlural(count) {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastDigit === 1 && lastTwoDigits !== 11) return "отзыв";
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) return "отзыва";
    return "отзывов";
  }

  function showErrorPage(message) {
    const mainContentContainer = document.querySelector('.product-page-container, main'); // Основной контейнер страницы
    const loadingEl = document.getElementById('product-page-loading');
    if (loadingEl) loadingEl.style.display = 'none';
    if (mainContentContainer) {
      mainContentContainer.innerHTML =
        `<div class="container error-page-message">
           <h2>Ошибка</h2>
           <p>${message}</p>
           <a href="index.html" class="btn btn-primary">На главную</a>
         </div>`;
    }
  }

  // Инициализация, если мы на странице товара
  if (document.querySelector('.product-page-container')) { // Проверка по уникальному классу контейнера страницы
    document.addEventListener('DOMContentLoaded', initProductPage);
  }
})();
