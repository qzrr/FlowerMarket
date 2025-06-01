// js/catalog.js
(function () {
  let productsOnPageCache = [];
  let categoriesCache = [];

  async function initCatalog() {
    const loadingEl = document.getElementById('catalog-loading-indicator');
    const pageTitleEl = document.querySelector('.page-title');
    const productsContainerEl = document.getElementById('catalog-products-container');

    if (loadingEl) loadingEl.style.display = 'block';
    if (productsContainerEl) productsContainerEl.innerHTML = '';

    try {
      categoriesCache = await API.getCategories();
      populateCategoryFilter(categoriesCache);

      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      const searchParam = urlParams.get('search');

      if (searchParam) {
        if (pageTitleEl) pageTitleEl.textContent = `Поиск: "${searchParam}"`;
        productsOnPageCache = await API.searchProducts(searchParam);
      } else if (categoryParam && categoryParam !== 'all') {
        const category = categoriesCache.find(c => (c.id && String(c.id) === categoryParam) || (c.slug && c.slug === categoryParam));
        if (pageTitleEl) pageTitleEl.textContent = category ? category.name : 'Каталог';
        productsOnPageCache = await API.getProductsByCategory(categoryParam);
      } else {
        if (pageTitleEl) pageTitleEl.textContent = 'Все товары';
        productsOnPageCache = await API.getProducts();
      }

      displayCatalogProducts(productsOnPageCache);
      setupFilterAndSortControls();
      if (window.Search && Search.setupProductCardActionsForContainer && productsContainerEl) {
        Search.setupProductCardActionsForContainer(productsContainerEl);
      }

    } catch (error) {
      console.error('Ошибка инициализации каталога:', error);
      if (productsContainerEl) productsContainerEl.innerHTML = '<p class="catalog-empty error-message">Ошибка загрузки товаров.</p>';
      showNotification('Ошибка загрузки каталога.', true);
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
    }
  }

  function displayCatalogProducts(products) {
    const container = document.getElementById('catalog-products-container');
    const countEl = document.getElementById('products-count');
    if (!container) return;

    if (!products || products.length === 0) {
      container.innerHTML = '<p class="catalog-empty">Товары не найдены. Попробуйте изменить фильтры.</p>';
      if (countEl) countEl.textContent = '0 товаров';
      return;
    }
    container.innerHTML = products.map(window.createProductCardHTML).join('');
    if (countEl) {
      let plural = products.length === 1 ? "товар" : (products.length >= 2 && products.length <= 4 ? "товара" : "товаров");
      if (products.length % 100 >= 11 && products.length % 100 <= 14) plural = "товаров"; // для 11-14
      else {
        const lastDigit = products.length % 10;
        if (lastDigit === 1) plural = "товар";
        else if (lastDigit >= 2 && lastDigit <= 4) plural = "товара";
      }
      countEl.textContent = `${products.length} ${plural}`;
    }
  }

  function populateCategoryFilter(categories) {
    const select = document.getElementById('category-filter');
    if (!select || !categories || categories.length === 0) return;
    const options = categories.map(cat => `<option value="${cat.id || cat.slug}">${cat.name}</option>`).join('');
    select.innerHTML = '<option value="all">Все категории</option>' + options;
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) select.value = categoryParam;
  }

  function setupFilterAndSortControls() {
    const controls = {
      category: document.getElementById('category-filter'),
      priceMin: document.getElementById('price-min'),
      priceMax: document.getElementById('price-max'),
      sort: document.getElementById('sort-filter'),
      discount: document.getElementById('discount-filter'),
      search: document.getElementById('catalog-search-input'), // Поиск в фильтрах
      applyBtn: document.getElementById('apply-filters-btn'),
      resetBtn: document.getElementById('reset-filters-btn'),
      toggleFiltersBtn: document.getElementById('toggle-filters-mobile-btn'), // Кнопка для мобильных фильтров
      filtersPanel: document.getElementById('filters-panel-mobile') // Сама панель фильтров
    };

    const applyFilters = () => {
      let filtered = [...productsOnPageCache]; // Фильтруем уже загруженные на страницу товары

      if (controls.priceMin?.value) filtered = filtered.filter(p => p.price >= parseFloat(controls.priceMin.value));
      if (controls.priceMax?.value) filtered = filtered.filter(p => p.price <= parseFloat(controls.priceMax.value));
      if (controls.discount?.checked) filtered = filtered.filter(p => (p.oldPrice && p.oldPrice > p.price) || p.discount);
      if (controls.search?.value.trim()) {
        const query = controls.search.value.trim().toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(query))
        );
      }
      if (controls.sort?.value) {
        const sortVal = controls.sort.value;
        if (sortVal === 'price_asc') filtered.sort((a, b) => a.price - b.price);
        else if (sortVal === 'price_desc') filtered.sort((a, b) => b.price - a.price);
        else if (sortVal === 'name_asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortVal === 'name_desc') filtered.sort((a, b) => b.name.localeCompare(a.name));
        else if (sortVal === 'popular') filtered.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0) || a.id - b.id);
      }
      displayCatalogProducts(filtered);
      const productsContainerEl = document.getElementById('catalog-products-container');
      if (window.Search && Search.setupProductCardActionsForContainer && productsContainerEl) {
        Search.setupProductCardActionsForContainer(productsContainerEl);
      }
    };

    if (controls.applyBtn) controls.applyBtn.addEventListener('click', applyFilters);
    if (controls.search) controls.search.addEventListener('input', debounce(applyFilters, 400));

    ['sort', 'discount'].forEach(key => { // Категорию обрабатываем отдельно (перезагрузка страницы)
      if (controls[key]) controls[key].addEventListener('change', applyFilters);
    });
    if (controls.category) {
      controls.category.addEventListener('change', () => {
        const newCategory = controls.category.value;
        // Перенаправляем на новую страницу каталога с выбранной категорией
        const searchParams = new URLSearchParams(window.location.search);
        if (newCategory === 'all') searchParams.delete('category');
        else searchParams.set('category', newCategory);
        window.location.search = searchParams.toString();
      });
    }

    if (controls.resetBtn) {
      controls.resetBtn.addEventListener('click', () => {
        if (controls.category) controls.category.value = 'all'; // Сброс категории
        if (controls.priceMin) controls.priceMin.value = '';
        if (controls.priceMax) controls.priceMax.value = '';
        if (controls.sort) controls.sort.value = 'default'; // или 'popular'
        if (controls.discount) controls.discount.checked = false;
        if (controls.search) controls.search.value = '';
        // При сбросе, если была выбрана категория, нужно остаться на ней, но без доп. фильтров
        // или если "все" - то показать все. Проще всего переинициализировать.
        const currentCategory = new URLSearchParams(window.location.search).get('category');
        if (currentCategory && currentCategory !== 'all' && controls.category.value === 'all') {
          // Если сбросили на "все категории", а в URL была категория, убираем ее из URL
          const searchParams = new URLSearchParams(window.location.search);
          searchParams.delete('category');
          window.location.search = searchParams.toString();
        } else {
          initCatalog(); // Перезагрузка данных для текущей основной категории (или всех)
        }
      });
    }

    if (controls.toggleFiltersBtn && controls.filtersPanel) {
      controls.toggleFiltersBtn.addEventListener('click', () => {
        controls.filtersPanel.classList.toggle('active');
        controls.toggleFiltersBtn.classList.toggle('active');
        document.body.classList.toggle('filters-panel-open', controls.filtersPanel.classList.contains('active'));
      });
    }
  }

  // Экспортируем, если нужно вызывать извне (например, при поиске с главной)
  window.CatalogPage = {
    init: initCatalog,
    getCurrentProducts: () => productsOnPageCache // Для доступа к текущим отфильтрованным продуктам
  };

  // Авто-инициализация, если это страница каталога
  if (document.getElementById('catalog-products-container')) {
    document.addEventListener('DOMContentLoaded', initCatalog);
  }
})();
