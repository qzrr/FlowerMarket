// js/search.js
(function () {
  let popularProductsDataCache = []; // Кэш для популярных товаров (если поиск по ним на главной)

  function initSearchModal() {
    const searchToggleButtons = document.querySelectorAll('.js-search-toggle, .header__action-btn[aria-label="Поиск"]');
    const searchModal = document.getElementById('searchModal'); // ID вашей модалки
    const closeSearchModalBtn = document.getElementById('closeSearchModalBtn'); // ID кнопки закрытия модалки
    const searchForm = document.getElementById('modalSearchForm'); // ID формы в модалке
    const searchInput = document.getElementById('modalSearchInput'); // ID поля ввода в модалке
    const searchResultsContainer = document.getElementById('modalSearchResultsContainer'); // ID контейнера для результатов

    if (searchToggleButtons.length === 0 || !searchModal || !closeSearchModalBtn || !searchForm || !searchInput || !searchResultsContainer) {
      // console.warn('Один или несколько элементов модального окна поиска не найдены.');
      return;
    }

    searchToggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        searchModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку фона
        setTimeout(() => searchInput.focus(), 150); // Фокус на поле ввода
      });
    });

    function closeModal() {
      searchModal.classList.remove('active');
      document.body.style.overflow = '';
      searchInput.value = ''; // Очищаем поле ввода
      searchResultsContainer.innerHTML = '<p class="search-hint">Начните вводить для поиска товаров...</p>'; // Сброс результатов
    }

    closeSearchModalBtn.addEventListener('click', closeModal);
    searchModal.addEventListener('click', (e) => { // Закрытие по клику на оверлей
      if (e.target === searchModal) closeModal();
    });
    document.addEventListener('keydown', (e) => { // Закрытие по Escape
      if (e.key === 'Escape' && searchModal.classList.contains('active')) closeModal();
    });

    searchForm.addEventListener('submit', (e) => e.preventDefault()); // Предотвращаем стандартную отправку

    searchInput.addEventListener('input', debounce(async () => {
      const query = searchInput.value.trim();
      if (query.length === 0) {
        searchResultsContainer.innerHTML = '<p class="search-hint">Начните вводить для поиска товаров...</p>';
        return;
      }
      if (query.length < 3) {
        searchResultsContainer.innerHTML = '<p class="search-hint">Введите не менее 3 символов для поиска.</p>';
        return;
      }
      searchResultsContainer.innerHTML = '<div class="loading-spinner">Поиск товаров...</div>';
      try {
        const results = await API.searchProducts(query);
        displayModalSearchResults(results, searchResultsContainer, query);
      } catch (error) {
        searchResultsContainer.innerHTML = '<p class="search-hint error-message">Ошибка при поиске. Попробуйте позже.</p>';
        showNotification('Ошибка поиска товаров.', true);
      }
    }, 400)); // Задержка перед отправкой запроса
  }

  function displayModalSearchResults(results, container, query) {
    if (!results || results.length === 0) {
      container.innerHTML = `<p class="search-hint">По вашему запросу "${query}" ничего не найдено.</p>`;
      return;
    }
    const limitedResults = results.slice(0, 6); // Ограничиваем количество результатов в модалке
    container.innerHTML = `
      <div class="product-grid search-results-grid">
        ${limitedResults.map(window.createProductCardHTML).join('')}
      </div>
      ${results.length > limitedResults.length ?
      `<div class="search-results-more">
           <a href="catalog.html?search=${encodeURIComponent(query)}" class="btn btn-secondary">Показать все (${results.length})</a>
         </div>` : ''}
    `;
    setupProductCardActionsForContainer(container); // Навешиваем обработчики на новые карточки
  }

  function setupPopularSearch(initialPopularProducts) {
    popularProductsDataCache = initialPopularProducts || [];
    const searchInput = document.getElementById('popular-search-input'); // ID поля поиска на главной
    const popularContainer = document.getElementById('popular-products-container');

    if (!searchInput || !popularContainer) return;

    searchInput.addEventListener('input', debounce(() => {
      const query = searchInput.value.trim().toLowerCase();
      filterAndDisplayPopular(query, popularContainer);
    }, 300));
  }

  function filterAndDisplayPopular(query, container) {
    if (!query) { // Если запрос пуст, показываем все популярные
      container.innerHTML = popularProductsDataCache.map(window.createProductCardHTML).join('');
      setupProductCardActionsForContainer(container);
      return;
    }

    const filtered = popularProductsDataCache.filter(p =>
      p.name.toLowerCase().includes(query) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
      container.innerHTML = `<div class="empty-search-result"><p>По запросу "${query}" ничего не найдено.</p></div>`;
    } else {
      container.innerHTML = filtered.map(window.createProductCardHTML).join('');
      setupProductCardActionsForContainer(container);
    }
  }

  function setupProductCardActionsForContainer(containerElement) {
    containerElement.querySelectorAll('.add-to-cart-btn').forEach(button => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      newButton.addEventListener('click', async function () {
        const productId = parseInt(this.dataset.productId);
        this.disabled = true;
        const originalHTML = this.innerHTML;
        this.innerHTML = '<span class="loading-dot"></span>'.repeat(3); // Простой индикатор
        try {
          let productData = popularProductsDataCache.find(p => p.id === productId); // Сначала ищем в кэше популярных
          if (!productData && window.CatalogPage && window.CatalogPage.getCurrentProducts) { // Затем в кэше каталога
            productData = window.CatalogPage.getCurrentProducts().find(p => p.id === productId);
          }
          if (!productData) { // Если нигде нет, запрашиваем
            productData = await API.getProductById(productId);
          }

          if (productData) window.Cart.addToCart(productId, 1, productData);
          else showNotification('Товар не найден.', true);
        } catch (err) {
          showNotification('Ошибка добавления товара', true);
          console.error("Ошибка при добавлении в корзину:", err);
        } finally {
          this.disabled = false;
          this.innerHTML = originalHTML;
        }
      });
    });

    containerElement.querySelectorAll('.add-to-wishlist').forEach(button => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      const productId = parseInt(newButton.dataset.productId);
      const heartIcon = newButton.querySelector('img');

      const updateButtonState = () => {
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        if (wishlist.includes(productId)) {
          newButton.classList.add('active');
          if (heartIcon) heartIcon.src = window.ASSET_PATHS.HEART_FILLED_SVG; // Используем константу
        } else {
          newButton.classList.remove('active');
          if (heartIcon) heartIcon.src = window.ASSET_PATHS.HEART_SVG; // Используем константу
        }
      };
      updateButtonState(); // Инициализация состояния

      newButton.addEventListener('click', function () {
        let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
        const index = wishlist.indexOf(productId);
        if (index > -1) {
          wishlist.splice(index, 1);
          showNotification('Удалено из избранного');
        } else {
          wishlist.push(productId);
          showNotification('Добавлено в избранное');
        }
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        updateButtonState();

        // Если это страница профиля, и вкладка "Избранное" активна, обновить ее
        if ((window.location.pathname.includes('user.html') || window.location.pathname.includes('profile.html')) &&
          document.getElementById('favorites')?.classList.contains('active') &&
          typeof window.UserPage !== 'undefined' && typeof window.UserPage.loadFavorites === 'function') {
          window.UserPage.loadFavorites();
        }
      });
    });
  }

  window.Search = {
    initSearchModal,
    setupPopularSearch,
    setupProductCardActionsForContainer 
  };
})();
