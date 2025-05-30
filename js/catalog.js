/**
 * Catalog.js - Модуль для работы с каталогом товаров
 * Обеспечивает загрузку и отображение всех товаров из JSON базы данных
 */

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация каталога
    initCatalog();
});

/**
 * Инициализация каталога
 */
async function initCatalog() {
    try {
        // Загружаем категории для фильтра
        const categories = await loadCategories();
        populateCategoryFilter(categories);
        
        // Загружаем все товары из JSON
        const products = await loadAllProducts();
        
        // Проверяем, есть ли параметр категории в URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category');
        
        // Фильтруем товары по категории, если указана
        let filteredProducts = products;
        if (categoryParam && categoryParam !== 'all') {
            filteredProducts = products.filter(product => product.category === categoryParam);
            
            // Обновляем заголовок страницы
            const categoryName = categories.find(cat => cat.id === categoryParam)?.name || 'Все товары';
            document.querySelector('.page-title').textContent = categoryName;
        }
        
        // Отображаем товары
        displayCatalogProducts(filteredProducts);
        
        // Настраиваем фильтры и сортировку
        setupFilters(products);
        
    } catch (error) {
        console.error('Ошибка инициализации каталога:', error);
        showErrorMessage('Не удалось загрузить каталог товаров. Пожалуйста, попробуйте позже.');
    }
}

/**
 * Загрузка всех товаров из JSON
 * @returns {Promise<Array>} Массив товаров
 */
async function loadAllProducts() {
    try {
        const response = await fetch('../data/products.json');
        if (!response.ok) {
            throw new Error(`HTTP ошибка! Статус: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        // Возвращаем пустой массив в случае ошибки
        return [];
    }
}

/**
 * Загрузка категорий из JSON
 * @returns {Promise<Array>} Массив категорий
 */
async function loadCategories() {
    try {
        const response = await fetch('../data/categories.json');
        if (!response.ok) {
            throw new Error(`HTTP ошибка! Статус: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        // Возвращаем пустой массив в случае ошибки
        return [];
    }
}

/**
 * Отображение товаров в каталоге
 * @param {Array} products Массив товаров для отображения
 */
function displayCatalogProducts(products) {
    const container = document.getElementById('catalog-products-container');
    const countElement = document.getElementById('products-count');
    
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p class="catalog-empty">Товары не найдены</p>';
        if (countElement) countElement.textContent = '0';
        return;
    }
    
    // Создаем HTML для каждого товара
    const productsHTML = products.map(product => createProductCardHTML(product)).join('');
    container.innerHTML = productsHTML;
    
    // Обновляем счетчик товаров
    if (countElement) {
        countElement.textContent = products.length;
    }
    
    // Инициализируем кнопки добавления в корзину
    setupAddToCartButtons();
}

/**
 * Создание HTML для карточки товара
 * @param {Object} product Данные товара
 * @returns {string} HTML-код карточки товара
 */
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
            </div>
            <div class="product-card__content">
                <span class="product-card__category">${product.categoryName || 'Букет'}</span>
                <h3 class="product-card__name">
                    <a href="product.html?id=${product.id}">${product.name}</a>
                </h3>
                <div class="product-card__price">
                    ${formatPrice(product.price)} ${oldPriceHTML}
                </div>
                <div class="product-card__bottom-actions">
                    <button class="product-card__icon-btn add-to-wishlist" aria-label="Добавить в избранное">
                        <img src="../assets/heart.svg" alt="В избранное">
                    </button>
                    <button class="product-card__icon-btn add-to-cart-btn" data-product-id="${product.id}" aria-label="Добавить в корзину">
                        <img src="../assets/cart.svg" alt="В корзину">
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Форматирование цены
 * @param {number} price Цена
 * @returns {string} Отформатированная цена
 */
function formatPrice(price) {
    return `${price.toLocaleString('ru-RU')} ₽`;
}

/**
 * Заполнение фильтра категорий
 * @param {Array} categories Массив категорий
 */
function populateCategoryFilter(categories) {
    const select = document.getElementById('category-filter');
    if (!select || !categories || categories.length === 0) return;
    
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

/**
 * Настройка фильтров и сортировки
 * @param {Array} allProducts Полный массив товаров
 */
function setupFilters(allProducts) {
    const categoryFilter = document.getElementById('category-filter');
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    const sortFilter = document.getElementById('sort-filter');
    const discountFilter = document.getElementById('discount-filter');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    const searchInput = document.getElementById('catalog-search');
    
    // Сохраняем оригинальные данные для фильтрации
    window.catalogProductsData = [...allProducts];
    
    // Обработчик применения фильтров
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            applyFilters();
        });
    }
    
    // Обработчик сброса фильтров
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            resetFilters();
        });
    }
    
    // Обработчик поиска
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFilters();
        });
    }
    
    // Функция применения фильтров
    function applyFilters() {
        let filtered = [...window.catalogProductsData];
        
        // Фильтр по категории
        if (categoryFilter && categoryFilter.value !== 'all') {
            filtered = filtered.filter(product => product.category === categoryFilter.value);
        }
        
        // Фильтр по цене
        if (priceMinInput && priceMinInput.value) {
            const minPrice = parseInt(priceMinInput.value);
            filtered = filtered.filter(product => product.price >= minPrice);
        }
        
        if (priceMaxInput && priceMaxInput.value) {
            const maxPrice = parseInt(priceMaxInput.value);
            filtered = filtered.filter(product => product.price <= maxPrice);
        }
        
        // Фильтр по скидке
        if (discountFilter && discountFilter.checked) {
            filtered = filtered.filter(product => product.discount && product.discount > 0);
        }
        
        // Поиск по названию
        if (searchInput && searchInput.value.trim()) {
            const searchQuery = searchInput.value.trim().toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchQuery) || 
                (product.description && product.description.toLowerCase().includes(searchQuery))
            );
        }
        
        // Сортировка
        if (sortFilter) {
            switch (sortFilter.value) {
                case 'price_asc':
                    filtered.sort((a, b) => a.price - b.price);
                    break;
                case 'price_desc':
                    filtered.sort((a, b) => b.price - a.price);
                    break;
                case 'name_asc':
                    filtered.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'name_desc':
                    filtered.sort((a, b) => b.name.localeCompare(a.name));
                    break;
                // По умолчанию сортировка не применяется
            }
        }
        
        // Отображаем отфильтрованные товары
        displayCatalogProducts(filtered);
    }
    
    // Функция сброса фильтров
    function resetFilters() {
        if (categoryFilter) categoryFilter.value = 'all';
        if (priceMinInput) priceMinInput.value = '';
        if (priceMaxInput) priceMaxInput.value = '';
        if (sortFilter) sortFilter.value = 'default';
        if (discountFilter) discountFilter.checked = false;
        if (searchInput) searchInput.value = '';
        
        // Отображаем все товары
        displayCatalogProducts(window.catalogProductsData);
    }
    
    // Инициализация мобильного переключателя фильтров
    const toggleFiltersBtn = document.getElementById('toggle-filters');
    const filtersPanel = document.getElementById('filters-panel');
    
    if (toggleFiltersBtn && filtersPanel) {
        toggleFiltersBtn.addEventListener('click', () => {
            filtersPanel.classList.toggle('active');
            toggleFiltersBtn.classList.toggle('active');
        });
    }
}

/**
 * Инициализация кнопок добавления в корзину
 */
function setupAddToCartButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const productId = parseInt(this.dataset.productId);
            if (!productId) return;
            
            try {
                // Добавляем индикатор загрузки
                this.classList.add('loading');
                this.disabled = true;
                
                // Получаем данные о продукте
                const product = window.catalogProductsData.find(p => p.id === productId);
                
                if (product) {
                    // Если функция addToCart доступна (из cart.js)
                    if (typeof addToCart === 'function') {
                        addToCart(productId, 1, product);
                        showNotification(`"${product.name}" добавлен в корзину`);
                    } else {
                        // Если функция недоступна, сохраняем в localStorage
                        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
                        
                        // Проверяем, есть ли уже этот товар в корзине
                        const existingItemIndex = cart.findIndex(item => item.id === productId);
                        
                        if (existingItemIndex >= 0) {
                            // Если товар уже в корзине, увеличиваем количество
                            cart[existingItemIndex].quantity += 1;
                        } else {
                            // Если товара нет в корзине, добавляем его
                            cart.push({
                                id: productId,
                                name: product.name,
                                price: product.price,
                                image: product.image,
                                quantity: 1
                            });
                        }
                        
                        // Сохраняем обновленную корзину
                        localStorage.setItem('cart', JSON.stringify(cart));
                        
                        // Обновляем счетчик товаров в корзине
                        updateCartCount();
                        
                        showNotification(`"${product.name}" добавлен в корзину`);
                    }
                }
            } catch (error) {
                console.error('Ошибка при добавлении товара в корзину:', error);
                showNotification('Не удалось добавить товар в корзину', true);
            } finally {
                // Убираем индикатор загрузки
                this.classList.remove('loading');
                this.disabled = false;
            }
        });
    });
}

/**
 * Обновление счетчика товаров в корзине
 */
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Обновляем все элементы с классом data-cart-count
    document.querySelectorAll('[data-cart-count]').forEach(element => {
        element.textContent = totalItems.toString();
    });
}

/**
 * Отображение уведомления
 * @param {string} message Текст уведомления
 * @param {boolean} isError Флаг ошибки
 */
function showNotification(message, isError = false) {
    // Проверяем, существует ли уже контейнер для уведомлений
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        // Создаем контейнер, если его нет
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'notification--error' : 'notification--success'}`;
    notification.textContent = message;
    
    // Добавляем уведомление в контейнер
    notificationContainer.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.add('notification--hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Отображение сообщения об ошибке
 * @param {string} message Текст сообщения
 */
function showErrorMessage(message) {
    const container = document.getElementById('catalog-products-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="error-message">
            <h2>Ошибка</h2>
            <p>${message}</p>
            <button class="btn btn--primary" onclick="location.reload()">Попробовать снова</button>
        </div>
    `;
    
    // Обновляем счетчик товаров
    const countElement = document.getElementById('products-count');
    if (countElement) {
        countElement.textContent = '0';
    }
}
