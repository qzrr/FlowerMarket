// js/product.js
(function () {
  let currentProduct = null;
  let currentProductId = null;

  async function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentProductId = parseInt(urlParams.get('id'));
    const loadingEl = document.getElementById('product-page-loading');
    const productDetailsEl = document.getElementById('product-details');
    const productTabsSectionEl = document.getElementById('product-tabs-section');
    const relatedProductsSectionEl = document.getElementById('related-products-section');
    const breadcrumbsEl = document.getElementById('product-breadcrumbs');

    // Сначала скроем все основные блоки, если они не скрыты CSS по умолчанию
    if (productDetailsEl) productDetailsEl.style.display = 'none';
    if (productTabsSectionEl) productTabsSectionEl.style.display = 'none';
    if (relatedProductsSectionEl) relatedProductsSectionEl.style.display = 'none';
    if (breadcrumbsEl) breadcrumbsEl.style.display = 'none';


    if (!currentProductId) {
      showErrorPage('Информация о товаре не найдена.');
      if (loadingEl) loadingEl.style.display = 'none';
      return;
    }
    if (loadingEl) loadingEl.style.display = 'block';

    try {
      currentProduct = await API.getProductById(currentProductId);
      if (!currentProduct) {
        showErrorPage('Товар не найден.');
        // Не нужно скрывать productDetailsEl здесь, так как showErrorPage уже это делает или заменяет контент
        return; // Важно выйти из функции, если товар не найден
      }

      renderProductDetails();
      await renderProductReviews();
      await renderRelatedProducts();
      setupProductPageEventListeners();
      updateMainWishlistButtonState();

      // Показываем основные блоки после успешной загрузки и рендеринга
      if (productDetailsEl) productDetailsEl.style.display = 'flex'; // Как в HTML
      if (productTabsSectionEl) productTabsSectionEl.style.display = 'block';
      if (relatedProductsSectionEl) relatedProductsSectionEl.style.display = 'block';
      if (breadcrumbsEl) breadcrumbsEl.style.display = 'block';


    } catch (error) {
      console.error('Ошибка загрузки страницы продукта:', error);
      showErrorPage('Не удалось загрузить информацию о товаре.');
      // Ошибки уже обработаны в showErrorPage, основные блоки останутся скрытыми или будут заменены
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  }

  function renderProductDetails() {
    document.title = `${currentProduct.name} | Floww`;
    document.getElementById('product-page-title').textContent = currentProduct.name;
    document.getElementById('product-page-price').textContent = formatPrice(currentProduct.price);

    const oldPriceEl = document.getElementById('product-page-old-price');
    const discountBadgeEl = document.getElementById('product-page-discount-badge'); // Используем правильный ID
    if (currentProduct.oldPrice && currentProduct.oldPrice > currentProduct.price) {
      if (oldPriceEl) {
        oldPriceEl.textContent = formatPrice(currentProduct.oldPrice);
        oldPriceEl.style.display = 'inline';
      }
      if (discountBadgeEl && currentProduct.discount) {
        discountBadgeEl.textContent = `-${currentProduct.discount}%`;
        discountBadgeEl.style.display = 'inline-block'; // или 'block' или 'flex' в зависимости от стилей
      } else if (discountBadgeEl) {
        discountBadgeEl.style.display = 'none';
      }
    } else {
      if (oldPriceEl) oldPriceEl.style.display = 'none';
      if (discountBadgeEl) discountBadgeEl.style.display = 'none';
    }

    document.getElementById('product-page-description-short').innerHTML = `<p>${currentProduct.description || 'Описание отсутствует.'}</p>`;

    const mainImgEl = document.getElementById('product-main-image');
    const thumbnailsContainerEl = document.getElementById('product-thumbnails-container');
    const productImages = currentProduct.images && currentProduct.images.length > 0
      ? currentProduct.images
      : (currentProduct.image ? [currentProduct.image] : [window.IMAGE_PLACEHOLDERS.PRODUCT]);


    if (mainImgEl) {
      mainImgEl.src = productImages[0];
      mainImgEl.alt = currentProduct.name;
    }

    if (thumbnailsContainerEl) {
      if (productImages.length > 1) { // Показываем миниатюры только если их больше одной
        thumbnailsContainerEl.innerHTML = productImages.map((imgSrc, index) => `
                <button class="product__thumbnail ${index === 0 ? 'active' : ''}" data-image-src="${imgSrc}">
                    <img src="${imgSrc}" alt="Миниатюра ${currentProduct.name} ${index + 1}">
                </button>
            `).join('');
        thumbnailsContainerEl.querySelectorAll('.product__thumbnail').forEach(thumb => {
          thumb.addEventListener('click', function () {
            if (mainImgEl) mainImgEl.src = this.dataset.imageSrc;
            thumbnailsContainerEl.querySelector('.active')?.classList.remove('active');
            this.classList.add('active');
          });
        });
      } else {
        thumbnailsContainerEl.innerHTML = ''; // Очищаем, если изображение одно
      }
    }


    const descTabContent = document.getElementById('tab-panel-description');
    const compTabContent = document.getElementById('tab-panel-composition');

    if (descTabContent) descTabContent.innerHTML = `<p>${currentProduct.details || currentProduct.description || 'Подробное описание отсутствует.'}</p>`;
    if (compTabContent) {
      if (currentProduct.composition && currentProduct.composition.length > 0) {
        compTabContent.innerHTML = '<ul>' + currentProduct.composition.map(item => `<li>${item}</li>`).join('') + '</ul>';
      } else {
        compTabContent.innerHTML = '<p>Информация о составе отсутствует.</p>';
      }
    }

    const ratingStarsDisplay = document.getElementById('product-header-rating-stars');

    const reviewsCountDisplay = document.getElementById('product-header-reviews-count');
    if (currentProduct.rating && ratingStarsDisplay && typeof window.Display !== 'undefined' && typeof window.Display.generateRatingStarsHTML === 'function') {
      ratingStarsDisplay.innerHTML = window.Display.generateRatingStarsHTML(currentProduct.rating);
    } else if (ratingStarsDisplay) {
      ratingStarsDisplay.innerHTML = ''; // Очистить, если рейтинга нет или функция недоступна
    }

    if (reviewsCountDisplay) {
      const reviewsLength = currentProduct.reviews ? currentProduct.reviews.length : (currentProduct.reviewsCount || 0);
      reviewsCountDisplay.textContent = `(${reviewsLength} ${getReviewPlural(reviewsLength)})`;
    }

    document.getElementById('product-sku-value').textContent = currentProduct.sku || 'N/A';
    const categoryLink = document.getElementById('product-category-meta-link');
    const categoryValue = document.getElementById('product-category-meta-value');
    if (categoryLink && categoryValue && currentProduct.categoryName) {
      categoryValue.textContent = currentProduct.categoryName;
      categoryLink.href = `catalog.html?category=${currentProduct.category || currentProduct.categoryId || currentProduct.categoryName.toLowerCase().replace(/\s+/g, '-')}`;
    } else if (categoryValue) {
      categoryValue.textContent = 'Не указана';
    }

    const availabilityEl = document.querySelector('.product__availability span');
    if (availabilityEl) {
      availabilityEl.textContent = currentProduct.inStock ? 'В наличии' : 'Нет в наличии';
      availabilityEl.parentElement.className = `product__meta-item product__availability ${currentProduct.inStock ? 'in-stock' : 'out-of-stock'}`;
    }

    const breadcrumbCategory = document.getElementById('breadcrumb-category');
    const breadcrumbProduct = document.getElementById('breadcrumb-product');
    if (breadcrumbCategory && currentProduct.categoryName) {
      breadcrumbCategory.textContent = currentProduct.categoryName;
      breadcrumbCategory.href = `catalog.html?category=${currentProduct.category || currentProduct.categoryId || currentProduct.categoryName.toLowerCase().replace(/\s+/g, '-')}`;
    }
    if (breadcrumbProduct && currentProduct.name) {
      breadcrumbProduct.textContent = currentProduct.name;
    }
  }

  async function renderProductReviews() {
    const reviewsContainer = document.getElementById('tab-panel-reviews'); // Полный ID `tab-panel-reviews`
    const reviewsListContainer = document.getElementById('reviews-list-container'); // Для списка отзывов
    const reviewsOverallRatingStars = document.getElementById('reviews-overall-rating-stars');
    const reviewsOverallRatingText = document.getElementById('reviews-overall-rating-text');

    if (!reviewsContainer || !reviewsListContainer || !reviewsOverallRatingStars || !reviewsOverallRatingText) {
      console.warn("Элементы для отображения отзывов не найдены.");
      if (reviewsContainer) reviewsContainer.innerHTML = '<p>Ошибка: компоненты для отзывов не найдены на странице.</p>';
      return;
    }

    reviewsListContainer.innerHTML = '<div class="loading-spinner">Загрузка отзывов...</div>';

    try {
      let reviews;
      if (currentProduct.reviews && Array.isArray(currentProduct.reviews) && currentProduct.reviews.length > 0) {
        reviews = currentProduct.reviews.map(r => ({ ...r, dateObj: new Date(r.date.split('.').reverse().join('-') || r.date) })).sort((a,b) => b.dateObj - a.dateObj);
      } else {
        reviews = await API.getReviewsByProductId(currentProductId, false); // false - не кешировать
      }

      const totalReviews = reviews ? reviews.length : 0;

      if (totalReviews > 0 && currentProduct.rating && typeof window.Display !== 'undefined' && typeof window.Display.generateRatingStarsHTML === 'function') {
        reviewsOverallRatingStars.innerHTML = window.Display.generateRatingStarsHTML(currentProduct.rating);
      } else {
        reviewsOverallRatingStars.innerHTML = 'Нет оценок';
      }
      reviewsOverallRatingText.textContent = `На основе ${totalReviews} ${getReviewPlural(totalReviews)}`;


      if (reviews && reviews.length > 0) {
        reviewsListContainer.innerHTML = reviews.map(review => {
          let displayDate;
          try {
            // Пробуем создать дату. Если в review.date формат DD.MM.YYYY, его нужно преобразовать
            const dateParts = String(review.date).split('.');
            if (dateParts.length === 3 && dateParts[0].length === 2) { // DD.MM.YYYY
              displayDate = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`).toLocaleDateString('ru-RU');
            } else { // Пытаемся как есть
              displayDate = new Date(review.dateObj || review.date).toLocaleDateString('ru-RU');
            }
          } catch (e) {
            displayDate = review.date || 'Дата не указана';
          }

          return `
                  <div class="review-card">
                    <div class="review-card__header">
                      <img src="${review.avatar || window.IMAGE_PLACEHOLDERS.AVATAR_DEFAULT}" alt="${review.author || review.name}" class="review-card__avatar">
                      <div class="review-card__author-info">
                        <strong class="review-card__author-name">${review.author || review.name || 'Аноним'}</strong>
                        <div class="review-card__date">${displayDate}</div>
                      </div>
                    </div>
                    <div class="review-card__rating">${(typeof window.Display !== 'undefined' && typeof window.Display.generateRatingStarsHTML === 'function') ? window.Display.generateRatingStarsHTML(review.rating) : `${review.rating}/5`}</div>
                    <p class="review-card__text">${review.text || ''}</p>
                  </div>
                `;
        }).join('');
      } else {
        reviewsListContainer.innerHTML = '<p>Отзывов о товаре пока нет. Будьте первым!</p>';
      }
    } catch (error) {
      console.error('Ошибка загрузки отзывов для товара:', error);
      reviewsListContainer.innerHTML = '<p class="error-message">Не удалось загрузить отзывы.</p>';
    }
  }

  async function renderRelatedProducts() {
    const relatedContainer = document.getElementById('related-products-section-container');
    if (!relatedContainer || !currentProduct) return;

    if (!currentProduct.category && !currentProduct.categoryId && !currentProduct.categoryName) {
      console.warn("Не удалось определить категорию товара для поиска похожих");
      relatedContainer.innerHTML = '<h3>Похожие товары</h3><p>Похожие товары не найдены.</p>';
      return;
    }

    relatedContainer.innerHTML = '<div class="loading-spinner">Загрузка похожих товаров...</div>';
    try {
      let related = [];
      const categoryIdentifier = currentProduct.category || currentProduct.categoryId || currentProduct.categoryName.toLowerCase().replace(/\s+/g, '-');

      if (categoryIdentifier) {
        related = await API.getProductsByCategory(categoryIdentifier, false); // false - не кешировать
        related = related.filter(p => p.id !== currentProductId).slice(0, 4);
      }

      if (related.length === 0) {
        const popular = await API.getPopularProducts(false); // false - не кешировать
        related = popular.filter(p => p.id !== currentProductId).slice(0, 4);
      }

      if (related.length > 0 && typeof window.createProductCardHTML === 'function') {
        relatedContainer.innerHTML = `<div class="product-grid">` +
          related.map(window.createProductCardHTML).join('') +
          `</div>`;
        if (window.Search && Search.setupProductCardActionsForContainer) {
          Search.setupProductCardActionsForContainer(relatedContainer.querySelector('.product-grid'));
        }
      } else {
        relatedContainer.innerHTML = '<p>Похожие товары не найдены.</p>';
      }
    } catch (error) {
      console.error('Ошибка загрузки похожих товаров:', error);
      relatedContainer.innerHTML = '<p class="error-message">Не удалось загрузить похожие товары.</p>';
    }
  }

  function setupProductPageEventListeners() {
    const addToCartBtn = document.getElementById('product-page-add-to-cart-btn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        if (currentProduct && typeof window.Cart !== 'undefined' && typeof window.Cart.addToCart === 'function') {
          const quantityInput = document.getElementById('product-quantity-input');
          const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
          if (quantity > 0) window.Cart.addToCart(currentProduct.id, quantity, currentProduct);
          else if (typeof showNotification === 'function') showNotification("Выберите количество товара", true);
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

    const tabButtons = document.querySelectorAll('.product__tab-btn'); // CSS селектор для кнопок вкладок
    const tabPanels = document.querySelectorAll('.product__tab-panel'); // CSS селектор для панелей вкладок

    tabButtons.forEach(button => {
      button.addEventListener('click', function () {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanels.forEach(panel => panel.classList.remove('active'));
        this.classList.add('active');
        const targetPanelId = this.getAttribute('data-tab-target');
        const targetPanel = document.getElementById(`tab-panel-${targetPanelId}`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        } else {
          console.warn(`Панель вкладок с ID 'tab-panel-${targetPanelId}' не найдена.`);
        }
      });
    });
    // Активируем первую вкладку по умолчанию
    if (tabButtons.length > 0) {
      tabButtons[0].click(); // Эмулируем клик для активации
    }


    const wishlistBtn = document.getElementById('product-page-wishlist-btn');
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
          if (heartIcon && window.ASSET_PATHS) heartIcon.src = window.ASSET_PATHS.HEART_SVG;
          if (typeof showNotification === 'function') showNotification('Удалено из избранного');
        } else {
          wishlist.push(productId);
          this.classList.add('active');
          if (heartIcon && window.ASSET_PATHS) heartIcon.src = window.ASSET_PATHS.HEART_FILLED_SVG;
          if (typeof showNotification === 'function') showNotification('Добавлено в избранное');
        }
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
      });
    }

    // Обработчик для кнопки "Написать отзыв"
    const writeReviewBtn = document.getElementById('write-review-btn');
    const reviewModal = document.getElementById('review-modal');
    const closeReviewModalBtn = reviewModal?.querySelector('.js-close-review-modal');
    const reviewForm = document.getElementById('review-form');

    if (writeReviewBtn && reviewModal) {
      writeReviewBtn.addEventListener('click', () => {
        reviewModal.style.display = 'flex'; // Показываем модальное окно
      });
    }
    if (closeReviewModalBtn && reviewModal) {
      closeReviewModalBtn.addEventListener('click', () => {
        reviewModal.style.display = 'none';
      });
    }
    // Закрытие модального окна по клику вне его
    if (reviewModal) {
      reviewModal.addEventListener('click', (event) => {
        if (event.target === reviewModal) {
          reviewModal.style.display = 'none';
        }
      });
    }


    if (reviewForm) {
      const ratingStarsContainer = reviewForm.querySelector('#review-form-rating-stars');
      const ratingInput = reviewForm.querySelector('#review-form-rating');

      if (ratingStarsContainer && ratingInput) {
        ratingStarsContainer.addEventListener('click', (e) => {
          if (e.target.classList.contains('rating-btn')) {
            const rating = e.target.dataset.rating;
            ratingInput.value = rating;
            // Обновляем активные звезды
            ratingStarsContainer.querySelectorAll('.rating-btn').forEach(btn => {
              btn.classList.toggle('active', btn.dataset.rating <= rating);
            });
          }
        });
      }

      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = reviewForm.querySelector('#review-form-name').value;
        const rating = reviewForm.querySelector('#review-form-rating').value;
        const text = reviewForm.querySelector('#review-form-text').value;

        if (!name || !rating || !text) {
          if(typeof showNotification === 'function') showNotification('Пожалуйста, заполните все обязательные поля.', true);
          return;
        }
        // Здесь должна быть логика отправки отзыва на сервер
        console.log('Отзыв для отправки:', { productId: currentProductId, name, rating, text });
        if(typeof showNotification === 'function') showNotification('Спасибо за ваш отзыв! (Демо)');

        // Имитация добавления отзыва в currentProduct.reviews для немедленного отображения (не рекомендуется для продакшена без реального API)
        // currentProduct.reviews.unshift({ name, rating: parseInt(rating), text, date: new Date().toISOString().split('T')[0], avatar: window.IMAGE_PLACEHOLDERS.AVATAR_DEFAULT });
        // await renderProductReviews(); // Перерисовываем отзывы

        reviewForm.reset();
        // Сбрасываем звезды к дефолтному состоянию (например, 5 звезд)
        if (ratingStarsContainer && ratingInput) {
          ratingInput.value = '5';
          ratingStarsContainer.querySelectorAll('.rating-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.rating <= 5);
          });
        }
        if(reviewModal) reviewModal.style.display = 'none';
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
      if (heartIcon && window.ASSET_PATHS) heartIcon.src = window.ASSET_PATHS.HEART_FILLED_SVG;
    } else {
      wishlistBtn.classList.remove('active');
      if (heartIcon && window.ASSET_PATHS) heartIcon.src = window.ASSET_PATHS.HEART_SVG;
    }
  }

  function getReviewPlural(count) {
    count = Number(count);
    if (isNaN(count)) return "отзывов";
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;
    if (lastDigit === 1 && lastTwoDigits !== 11) return "отзыв";
    if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) return "отзыва";
    return "отзывов";
  }

  function showErrorPage(message) {
    const mainContentContainer = document.querySelector('.product-page-container') || document.querySelector('main');
    const loadingEl = document.getElementById('product-page-loading');
    if (loadingEl) loadingEl.style.display = 'none';

    // Скрываем все потенциально видимые блоки перед отображением ошибки
    const productDetailsEl = document.getElementById('product-details');
    const productTabsSectionEl = document.getElementById('product-tabs-section');
    const relatedProductsSectionEl = document.getElementById('related-products-section');
    const breadcrumbsEl = document.getElementById('product-breadcrumbs');

    if (productDetailsEl) productDetailsEl.style.display = 'none';
    if (productTabsSectionEl) productTabsSectionEl.style.display = 'none';
    if (relatedProductsSectionEl) relatedProductsSectionEl.style.display = 'none';
    if (breadcrumbsEl) breadcrumbsEl.style.display = 'none';


    if (mainContentContainer) {
      mainContentContainer.innerHTML =
        `<div class="container error-page-message" style="text-align: center; padding: 40px 15px;">
           <h2>Ошибка</h2>
           <p>${message}</p>
           <a href="index.html" class="btn btn--primary" style="margin-top: 20px;">На главную</a>
         </div>`;
    }
  }

  if (document.querySelector('.product-page-container')) {
    document.addEventListener('DOMContentLoaded', initProductPage);
  }
})();
