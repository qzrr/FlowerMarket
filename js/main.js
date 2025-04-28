// Основной JavaScript файл для цветочного магазина

document.addEventListener('DOMContentLoaded', () => {
  // Инициализируем все компоненты UI
  initMobileMenu();
  initHeroSlider();
  setupAddToCartButtons();
  setupCartPageInteractions();
  setupContactForm();
  initFaq();
  setupCatalogFilters();

  // Загружаем начальные данные
  loadInitialData();
});

// === Функции для работы с API ===

// Общая функция для загрузки данных из API
async function fetchData(url, errorMessage = 'Ошибка при загрузке данных') {
  try {
    // Используем API-пути сервера вместо локальных JSON файлов
    let apiUrl = '';

    if (url === '/api/products/categories') {
      apiUrl = 'http://localhost:3000/api/categories';
    } else if (url === '/api/products/popular') {
      apiUrl = 'http://localhost:3000/api/products/popular';
    } else if (url === '/api/products') {
      apiUrl = 'http://localhost:3000/api/products';
    } else if (url.startsWith('/api/products/category/')) {
      const category = url.split('/').pop();
      apiUrl = `http://localhost:3000/api/products/category/${category}`;
    } else if (url.startsWith('../data/')) {
      // Для оставшихся запросов к JSON-файлам, преобразуем их в соответствующие API-вызовы
      if (url === '../data/reviews.json') {
        apiUrl = 'http://localhost:3000/api/reviews';
      } else {
        apiUrl = url.replace('../data/', 'http://localhost:3000/api/');
      }
    } else {
      apiUrl = url; // Если это уже полный URL
    }

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP ошибка! Статус: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`${errorMessage}: ${error.message}`);
    showNotification(`${errorMessage}. Попробуйте позже.`, true);
    return null;
  }
}

// Загрузка всех необходимых данных при инициализации страницы
async function loadInitialData() {
  // Определяем текущую страницу
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Загружаем категории для всех страниц (для футера и хедера)
  const categories = await fetchData('/api/products/categories', 'Не удалось загрузить категории');
  displayFooterCategories(categories);

  // Загружаем данные в зависимости от страницы
  if (currentPage === 'index.html' || currentPage === '') {
    // Главная страница
    displayCategories(categories);
    const popularProducts = await fetchData('/api/products/popular', 'Не удалось загрузить популярные товары');
    displayPopularProducts(popularProducts);

    // Загружаем и отображаем отзывы
    const reviews = await fetchData('../data/reviews.json', 'Не удалось загрузить отзывы');
    displayReviews(reviews);
  } else if (currentPage === 'catalog.html') {
    // Страница каталога
    populateCategoryFilter(categories);

    // Проверяем, есть ли параметр категории в URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');

    let products;
    if (categoryParam) {
      // Загружаем товары конкретной категории
      products = await fetchData(`/api/products/category/${categoryParam}`, 'Не удалось загрузить товары категории');
      // Обновляем заголовок страницы
      const categoryName = categories.find(cat => cat.id === categoryParam)?.name || 'Все товары';
      document.querySelector('.page-title').textContent = categoryName;
    } else {
      // Загружаем все товары
      products = await fetchData('/api/products', 'Не удалось загрузить товары');
    }

    // Отображаем товары
    displayCatalogProducts(products);
  } else if (currentPage === 'cart.html') {
    // Корзина - данные загружаются из localStorage в cart.js
  }
}

// === Функции отображения данных на страницах ===

// Отображение категорий на главной
function displayCategories(categories) {
  const container = document.getElementById('categories-container');
  if (!container) return;

  // Фильтруем только featured категории если нужно
  const featuredCategories = categories.filter(cat => cat.featured);
  container.innerHTML = featuredCategories.map(createCategoryCardHTML).join('');
}

// Отображение категорий в футере
function displayFooterCategories(categories) {
  const container = document.getElementById('footer-categories');
  if (!container) return;

  container.innerHTML = categories.map(category =>
    `<li><a href="catalog.html?category=${category.id}">${category.name}</a></li>`
  ).join('');
}

// Отображение популярных товаров
function displayPopularProducts(products) {
  const container = document.getElementById('popular-products-container');
  if (!container || !products) return;

  container.innerHTML = products.map(createProductCardHTML).join('');
  setupAddToCartButtons();
}

// Отображение товаров в каталоге
function displayCatalogProducts(products) {
  const container = document.getElementById('catalog-products-container');
  const countElement = document.getElementById('products-count');
  if (!container || !products) return;

  container.innerHTML = products.length > 0
    ? products.map(createProductCardHTML).join('')
    : '<p class="catalog-empty">Товары не найдены</p>';

  if (countElement) {
    countElement.textContent = products.length;
  }

  setupAddToCartButtons();
}

// Заполнение фильтра категорий
function populateCategoryFilter(categories) {
  const select = document.getElementById('category-filter');
  if (!select || !categories) return;

  const options = categories.map(category =>
    `<option value="${category.id}">${category.name}</option>`
  ).join('');

  select.innerHTML = '<option value="all">Все категории</option>' + options;

  // Устанавливаем выбранную категорию из URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  if (categoryParam) {
    select.value = categoryParam;
  }
}

// Отображение отзывов на главной странице
function displayReviews(reviews) {
  const container = document.getElementById('reviews-container');
  if (!container || !reviews) return;

  // Отображаем только несколько отзывов
  const displayedReviews = reviews.slice(0, 3);

  const reviewsHTML = displayedReviews.map(review => `
    <div class="review-card">
      <div class="review-card__author">
        <img src="${review.avatar}" alt="${review.name}" class="review-card__avatar">
        <div>
          <h4>${review.name}</h4>
          <div class="review-card__rating">
            ${getStarsHTML(review.rating)}
          </div>
          <div class="review-card__date">${review.date}</div>
        </div>
      </div>
      <p>${review.text}</p>
    </div>
  `).join('');

  container.innerHTML = reviewsHTML;
}

// Генерация HTML для звездочек рейтинга
function getStarsHTML(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  let starsHTML = '';

  // Определяем правильный путь к изображениям, в зависимости от текущей страницы
  const isInPagesDir = window.location.pathname.includes('/pages/');
  const assetsPath = isInPagesDir ? '../assets/' : 'assets/';

  // Добавляем полные звезды
  for (let i = 0; i < fullStars; i++) {
    starsHTML += `<img src="${assetsPath}star-full.svg" alt="★" class="star">`;
  }

  // Добавляем половину звезды, если нужно
  if (halfStar) {
    starsHTML += `<img src="${assetsPath}star-half.svg" alt="½" class="star">`;
  }

  // Добавляем пустые звезды
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += `<img src="${assetsPath}star-empty.svg" alt="☆" class="star">`;
  }

  return starsHTML;
}

// === Функции для создания HTML элементов ===

// Создание карточки категории
function createCategoryCardHTML(category) {
  return `
    <a href="catalog.html?category=${category.id}" class="category-card">
      <div class="category-card__image-wrapper">
        <img src="${category.image}" alt="${category.name}" class="category-card__image">
      </div>
      <h3 class="category-card__name">${category.name}</h3>
      <p class="category-card__description">${category.description}</p>
    </a>
  `;
}

// Создание карточки товара
function createProductCardHTML(product) {
  const oldPriceHTML = product.oldPrice
    ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>`
    : '';
  const discountHTML = product.discount
    ? `<div class="product-card__discount">-${product.discount}%</div>`
    : '';

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card__image-wrapper">
        <a href="product.html?id=${product.id}">
          ${discountHTML}
          <img src="${product.image}" alt="${product.name}" class="product-card__image">
        </a>
        <div class="product-card__actions">
          <button class="product-card__action-btn add-to-wishlist" aria-label="Добавить в избранное">
            <img src="../assets/heart.svg" alt="Сердечко">
          </button>
          <button class="product-card__action-btn quick-view" aria-label="Быстрый просмотр">
            <img src="../assets/eye.svg" alt="Глаз">
          </button>
        </div>
      </div>
      <div class="product-card__content">
        <span class="product-card__category">${product.categoryName}</span>
        <h3 class="product-card__name">
          <a href="product.html?id=${product.id}">${product.name}</a>
        </h3>
        <div class="product-card__price">
          ${formatPrice(product.price)} ${oldPriceHTML}
        </div>
        <button class="btn product-card__add-to-cart add-to-cart-btn" data-product-id="${product.id}">
          В корзину
        </button>
      </div>
    </div>
  `;
}

// Форматирование цены
function formatPrice(price) {
  return `${price.toLocaleString('ru-RU')} ₽`;
}

// === Функции для инициализации компонентов UI ===

// Инициализация мобильного меню
function initMobileMenu() {
  const burgerButton = document.querySelector('.burger-menu');
  const closeButton = document.querySelector('.mobile-menu__close');
  const mobileMenu = document.querySelector('.mobile-menu');
  const overlay = document.querySelector('.overlay');

  if (!burgerButton || !closeButton || !mobileMenu || !overlay) return;

  burgerButton.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  function closeMenu() {
    mobileMenu.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  closeButton.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
}

// Инициализация слайдера на главной странице
function initHeroSlider() {
  const slider = document.querySelector('.hero__slider');
  const slides = document.querySelectorAll('.hero__slide');
  const dotsContainer = document.querySelector('.hero__dots');
  const prevButton = document.querySelector('.hero__control--prev');
  const nextButton = document.querySelector('.hero__control--next');

  if (!slider || slides.length === 0) return;

  let currentSlide = 0;
  let interval;

  // Создаем точки слайдера
  if (dotsContainer) {
    dotsContainer.innerHTML = Array.from(slides).map((_, index) =>
      `<button class="hero__dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></button>`
    ).join('');

    // Навигация по точкам
    dotsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('hero__dot')) {
        const slideIndex = parseInt(e.target.dataset.slide);
        goToSlide(slideIndex);
        resetInterval();
      }
    });
  }

  // Переход к указанному слайду
  function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    dotsContainer.querySelectorAll('.hero__dot')[currentSlide].classList.remove('active');

    currentSlide = (n + slides.length) % slides.length;

    slides[currentSlide].classList.add('active');
    dotsContainer.querySelectorAll('.hero__dot')[currentSlide].classList.add('active');
  }

  // Следующий слайд
  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  // Предыдущий слайд
  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  // Запуск автоматического перелистывания
  function startInterval() {
    interval = setInterval(nextSlide, 5000);
  }

  // Сброс интервала при ручном переключении
  function resetInterval() {
    clearInterval(interval);
    startInterval();
  }

  // Навигация кнопками
  if (prevButton) prevButton.addEventListener('click', () => {
    prevSlide();
    resetInterval();
  });

  if (nextButton) nextButton.addEventListener('click', () => {
    nextSlide();
    resetInterval();
  });

  // Запускаем автоматическое перелистывание
  startInterval();
}

// Инициализация кнопок "В корзину"
function setupAddToCartButtons() {
  document.addEventListener('click', async function (e) {
    if (e.target.classList.contains('add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
      const button = e.target.classList.contains('add-to-cart-btn') ? e.target : e.target.closest('.add-to-cart-btn');
      const productId = parseInt(button.dataset.productId);

      if (!productId) return;

      try {
        // Получаем данные о продукте из API
        const productData = await fetchData(`/api/products/${productId}`, 'Не удалось получить информацию о товаре');

        if (productData) {
          // Используем функцию из cart.js для добавления в корзину
          if (typeof addToCart === 'function') {
            addToCart(productId, 1, productData);
            showNotification('Товар добавлен в корзину');
          } else {
            console.error('Функция addToCart не определена');
          }
        }
      } catch (error) {
        console.error('Ошибка при добавлении товара в корзину:', error);
        showNotification('Не удалось добавить товар в корзину', true);
      }
    }
  });
}

// Инициализация интерактивности страницы корзины
function setupCartPageInteractions() {
  // Функциональность страницы корзины реализована в cart.js
  // Здесь можем добавить дополнительную функциональность, например, оформление заказа
}

// Инициализация формы обратной связи
function setupContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Очищаем предыдущие ошибки
    clearErrors();

    // Проверяем поля формы
    let isValid = true;
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const message = document.getElementById('message');
    const consent = document.getElementById('consent');

    if (!name.value.trim()) {
      showError(name, 'Пожалуйста, введите ваше имя');
      isValid = false;
    }

    if (!email.value.trim()) {
      showError(email, 'Пожалуйста, введите ваш email');
      isValid = false;
    } else if (!isValidEmail(email.value)) {
      showError(email, 'Пожалуйста, введите корректный email');
      isValid = false;
    }

    if (phone.value.trim() && !isValidPhone(phone.value)) {
      showError(phone, 'Пожалуйста, введите корректный номер телефона');
      isValid = false;
    }

    if (!message.value.trim()) {
      showError(message, 'Пожалуйста, введите ваше сообщение');
      isValid = false;
    }

    if (!consent.checked) {
      showError(consent, 'Вы должны согласиться с обработкой персональных данных');
      isValid = false;
    }

    if (!isValid) return;

    // Если форма валидна, отправляем данные
    const formStatus = document.getElementById('form-status');

    // Имитация отправки данных
    formStatus.textContent = 'Отправка сообщения...';
    formStatus.className = 'form-status';

    // Имитируем отправку на сервер
    setTimeout(() => {
      formStatus.textContent = 'Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.';
      formStatus.className = 'form-status success';

      // Сбрасываем форму
      contactForm.reset();

      // Опционально: показываем модальное окно благодарности
      const thankModal = document.getElementById('thank-modal');
      if (thankModal) {
        thankModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Закрытие модального окна
        const closeButtons = thankModal.querySelectorAll('.modal__close, #thank-close');
        closeButtons.forEach(btn => {
          btn.addEventListener('click', () => {
            thankModal.style.display = 'none';
            document.body.style.overflow = '';
          });
        });
      }
    }, 1500);
  });

  // Функция для отображения ошибки
  function showError(inputElement, message) {
    const errorElement = document.getElementById(`${inputElement.id}-error`) ||
      inputElement.parentElement.querySelector('.form-error');
    if (errorElement) {
      errorElement.textContent = message;
      inputElement.classList.add('invalid');
    }
  }

  // Функция для очистки ошибок
  function clearErrors() {
    const errorElements = document.querySelectorAll('.form-error');
    const invalidInputs = document.querySelectorAll('.invalid');

    errorElements.forEach(element => element.textContent = '');
    invalidInputs.forEach(input => input.classList.remove('invalid'));
  }

  // Проверка корректности email
  function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  // Проверка корректности телефона
  function isValidPhone(phone) {
    // Простая проверка на длину и наличие только цифр, +, -, (, )
    const re = /^[0-9+\-() ]{10,20}$/;
    return re.test(phone);
  }
}

// Инициализация аккордеона FAQ
function initFaq() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length === 0) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!question || !answer) return;

    // Устанавливаем начальную высоту для ответов (скрыто)
    answer.style.height = '0px';

    question.addEventListener('click', () => {
      // Проверяем, активен ли текущий вопрос
      const isActive = item.classList.contains('active');

      // Закрываем все вопросы
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          otherItem.querySelector('.faq-answer').style.height = '0px';
        }
      });

      // Переключаем текущий вопрос
      if (isActive) {
        item.classList.remove('active');
        answer.style.height = '0px';
      } else {
        item.classList.add('active');
        answer.style.height = answer.scrollHeight + 'px';
      }
    });
  });
}

// Инициализация фильтров каталога
function setupCatalogFilters() {
  const filterPanel = document.getElementById('filters-panel');
  const toggleFilterBtn = document.getElementById('toggle-filters');
  const applyFiltersBtn = document.getElementById('apply-filters');
  const resetFiltersBtn = document.getElementById('reset-filters');

  if (!filterPanel) return;

  // Для мобильной версии - переключение видимости фильтров
  if (toggleFilterBtn) {
    toggleFilterBtn.addEventListener('click', () => {
      filterPanel.classList.toggle('open');
    });
  }

  // Применение фильтров
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyFilters);
  }

  // Сброс фильтров
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      // Сбрасываем значения всех фильтров
      document.getElementById('category-filter').value = 'all';
      document.getElementById('price-min').value = '';
      document.getElementById('price-max').value = '';
      document.getElementById('sort-filter').value = 'default';

      const discountCheckbox = document.getElementById('discount-filter');
      if (discountCheckbox) discountCheckbox.checked = false;

      // И применяем фильтры (т.е. загружаем всё заново)
      applyFilters();
    });
  }

  // Поиск по каталогу
  const searchInput = document.getElementById('catalog-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      applyFilters();
    }, 500));
  }

  async function applyFilters() {
    // Получаем значения фильтров
    const categoryValue = document.getElementById('category-filter').value;
    const minPrice = document.getElementById('price-min').value;
    const maxPrice = document.getElementById('price-max').value;
    const sortValue = document.getElementById('sort-filter').value;
    const discountOnly = document.getElementById('discount-filter')?.checked;
    const searchQuery = document.getElementById('catalog-search')?.value || '';

    // Получаем все товары или товары определенной категории
    let products;
    if (categoryValue && categoryValue !== 'all') {
      products = await fetchData(`/api/products/category/${categoryValue}`, 'Не удалось загрузить товары категории');
    } else {
      products = await fetchData('/api/products', 'Не удалось загрузить товары');
    }

    if (!products) return;

    // Фильтрация по цене
    if (minPrice) {
      products = products.filter(product => product.price >= minPrice);
    }
    if (maxPrice) {
      products = products.filter(product => product.price <= maxPrice);
    }

    // Фильтрация по скидке
    if (discountOnly) {
      products = products.filter(product => product.discount);
    }

    // Фильтрация по поиску (в названии и описании)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      products = products.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower)
      );
    }

    // Сортировка
    switch (sortValue) {
      case 'price_asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'name_asc':
        products.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        products.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // По умолчанию сортировка по популярности или id
        break;
    }

    // Отображаем отфильтрованные товары
    displayCatalogProducts(products);
  }
}

// === Вспомогательные функции ===

// Функция для отображения уведомлений
function showNotification(message, isError = false) {
  // Создаем элемент уведомления, если его еще нет
  let notification = document.getElementById('notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    document.body.appendChild(notification);

    // Стили для уведомления, если они не определены в CSS
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1000';
    notification.style.transition = 'all 0.3s ease';
    notification.style.transform = 'translateY(-10px)';
    notification.style.opacity = '0';
  }

  // Устанавливаем сообщение и стиль уведомления
  notification.textContent = message;
  notification.className = `notification ${isError ? 'notification--error' : 'notification--success'}`;

  // Основной цвет фона в зависимости от типа уведомления
  notification.style.backgroundColor = isError ? '#f44336' : '#4CAF50';
  notification.style.color = 'white';

  // Показываем уведомление
  setTimeout(() => {
    notification.style.transform = 'translateY(0)';
    notification.style.opacity = '1';
  }, 10);

  // Автоматически скрываем через 3 секунды
  setTimeout(() => {
    notification.style.transform = 'translateY(-10px)';
    notification.style.opacity = '0';
  }, 3000);
}

// Функция debounce для предотвращения частых вызовов функции (например, при поиске)
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
