/**
 * Product.js - Модуль для работы с данными о продуктах из JSON базы данных
 * Обеспечивает загрузку и отображение информации о продукте на странице product.html
 */

class ProductManager {
    constructor() {
        // Путь к JSON файлу с данными
        this.jsonDbPath = '../data/products.json';
        
        // Кэш загруженных данных
        this.productsCache = null;
        this.categoriesCache = null;
        this.reviewsCache = null;
        
        // Текущий продукт
        this.currentProduct = null;
        this.currentProductId = null;
        
        // DOM элементы
        this.productDetailsContainer = document.getElementById('product-details');
        this.relatedProductsContainer = document.getElementById('related-products-container');
        this.reviewsContainer = document.getElementById('reviews-container');
        
        // Инициализация
        this.init();
    }
    
    /**
     * Инициализация модуля
     */
    async init() {
        try {
            // Получаем ID продукта из URL
            this.currentProductId = this.getProductIdFromUrl();
            
            if (!this.currentProductId) {
                console.error('ID продукта не найден в URL');
                this.showErrorMessage('Продукт не найден');
                return;
            }
            
            // Загружаем данные
            await this.loadData();
            
            // Отображаем информацию о продукте
            this.renderProductDetails();
            
            // Отображаем отзывы
            this.renderReviews();
            
            // Отображаем связанные товары
            this.renderRelatedProducts();
            
            // Устанавливаем обработчики событий
            this.setupEventListeners();
            
        } catch (error) {
            console.error('Ошибка инициализации ProductManager:', error);
            this.showErrorMessage('Произошла ошибка при загрузке данных о продукте');
        }
    }
    
    /**
     * Получение ID продукта из URL
     * @returns {number|null} ID продукта или null, если не найден
     */
    getProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        return id ? parseInt(id) : null;
    }
    
    /**
     * Загрузка данных из JSON файлов
     */
    async loadData() {
        try {
            // Загружаем все продукты, если еще не загружены
            if (!this.productsCache) {
                const productsResponse = await fetch(this.jsonDbPath);
                if (!productsResponse.ok) {
                    throw new Error(`Ошибка загрузки данных о продуктах: ${productsResponse.status}`);
                }
                this.productsCache = await productsResponse.json();
            }
            
            // Находим текущий продукт по ID
            this.currentProduct = this.productsCache.find(product => product.id === this.currentProductId);
            
            if (!this.currentProduct) {
                throw new Error(`Продукт с ID ${this.currentProductId} не найден`);
            }
            
            // Загружаем отзывы для текущего продукта
            this.reviewsCache = this.currentProduct.reviews || [];
            
            // Загружаем категории, если нужно
            if (!this.categoriesCache) {
                const categoriesResponse = await fetch('../data/categories.json');
                if (categoriesResponse.ok) {
                    this.categoriesCache = await categoriesResponse.json();
                }
            }
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            throw error;
        }
    }
    
    /**
     * Отображение информации о продукте
     */
    renderProductDetails() {
        if (!this.currentProduct) return;
        
        // Заголовок страницы
        document.title = `${this.currentProduct.name} - Floww`;
        
        // Основная информация о продукте
        document.getElementById('product-title').textContent = this.currentProduct.name;
        document.getElementById('product-price').textContent = `${this.currentProduct.price} ₽`;
        document.getElementById('product-description').innerHTML = `<p>${this.currentProduct.description}</p>`;
        document.getElementById('product-sku').textContent = this.currentProduct.sku;
        document.getElementById('product-category-meta').textContent = this.currentProduct.categoryName;
        
        // Старая цена и скидка
        const oldPriceElement = document.getElementById('product-old-price');
        const discountElement = document.getElementById('product-discount');
        
        if (this.currentProduct.oldPrice && this.currentProduct.oldPrice > this.currentProduct.price) {
            oldPriceElement.textContent = `${this.currentProduct.oldPrice} ₽`;
            oldPriceElement.style.display = 'block';
            
            if (this.currentProduct.discount) {
                discountElement.textContent = `-${this.currentProduct.discount}%`;
                discountElement.style.display = 'block';
            } else {
                discountElement.style.display = 'none';
            }
        } else {
            oldPriceElement.style.display = 'none';
            discountElement.style.display = 'none';
        }
        
        // Рейтинг
        const ratingElement = document.getElementById('product-rating');
        if (ratingElement) {
            ratingElement.innerHTML = this.generateRatingStars(this.currentProduct.rating);
        }
        
        // Галерея изображений
        this.renderProductGallery();
        
        // Состав продукта (вкладка "Состав")
        const specsTabContent = document.getElementById('tab-specs');
        if (specsTabContent && this.currentProduct.composition && this.currentProduct.composition.length > 0) {
            const compositionList = document.createElement('ul');
            compositionList.className = 'product__specs-list';
            
            this.currentProduct.composition.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                compositionList.appendChild(li);
            });
            
            specsTabContent.innerHTML = '';
            specsTabContent.appendChild(compositionList);
        }
        
        // Описание продукта (вкладка "Описание")
        const descTabContent = document.getElementById('tab-description');
        if (descTabContent && this.currentProduct.details) {
            descTabContent.innerHTML = `<p>${this.currentProduct.details}</p>`;
        }
        
        // Наличие товара
        const availabilityElement = document.querySelector('.product__availability');
        if (availabilityElement) {
            if (this.currentProduct.inStock) {
                availabilityElement.innerHTML = '<span class="product__in-stock">В наличии</span>';
            } else {
                availabilityElement.innerHTML = '<span class="product__out-stock">Нет в наличии</span>';
            }
        }
    }
    
    /**
     * Отображение галереи изображений продукта
     */
    renderProductGallery() {
        const mainImageContainer = document.getElementById('product-main-image-container');
        const mainImage = document.getElementById('product-main-image');
        const thumbnailsContainer = document.getElementById('product-thumbnails');
        
        if (!mainImage || !thumbnailsContainer || !this.currentProduct.images || this.currentProduct.images.length === 0) {
            return;
        }
        
        // Устанавливаем основное изображение
        mainImage.src = this.currentProduct.images[0];
        mainImage.alt = this.currentProduct.name;
        
        // Очищаем и заполняем миниатюры
        thumbnailsContainer.innerHTML = '';
        
        this.currentProduct.images.forEach((image, index) => {
            const button = document.createElement('button');
            button.className = `product__thumbnail ${index === 0 ? 'active' : ''}`;
            button.setAttribute('data-image', image);
            
            const img = document.createElement('img');
            img.src = image.replace('.jpg', '-thumb.jpg').replace('.png', '-thumb.png');
            img.alt = `${this.currentProduct.name} - фото ${index + 1}`;
            
            button.appendChild(img);
            thumbnailsContainer.appendChild(button);
            
            // Добавляем обработчик события для переключения изображений
            button.addEventListener('click', () => {
                mainImage.src = image;
                
                // Обновляем активную миниатюру
                document.querySelectorAll('.product__thumbnail').forEach(thumb => {
                    thumb.classList.remove('active');
                });
                button.classList.add('active');
            });
        });
    }
    
    /**
     * Отображение отзывов о продукте
     */
    renderReviews() {
        if (!this.reviewsContainer) return;
        
        // Очищаем контейнер отзывов
        this.reviewsContainer.innerHTML = '';
        
        // Если отзывов нет
        if (!this.reviewsCache || this.reviewsCache.length === 0) {
            this.reviewsContainer.innerHTML = '<p class="no-reviews">Отзывов пока нет. Будьте первым, кто оставит отзыв!</p>';
            
            // Обновляем счетчик отзывов
            const reviewsCountElement = document.getElementById('reviews-count');
            if (reviewsCountElement) {
                reviewsCountElement.textContent = '0';
            }
            
            return;
        }
        
        // Обновляем счетчик отзывов
        const reviewsCountElement = document.getElementById('reviews-count');
        if (reviewsCountElement) {
            reviewsCountElement.textContent = this.reviewsCache.length.toString();
        }
        
        // Отображаем каждый отзыв
        this.reviewsCache.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            
            const authorDiv = document.createElement('div');
            authorDiv.className = 'review-card__author';
            
            const avatar = document.createElement('img');
            avatar.className = 'review-card__avatar';
            avatar.src = review.avatar || '../img/avatar-default.jpg';
            avatar.alt = review.name;
            
            const authorInfo = document.createElement('div');
            authorInfo.innerHTML = `
                <strong>${review.name}</strong>
                <div class="review-card__rating">${this.generateRatingStars(review.rating)}</div>
                <div class="review-card__date">${review.date}</div>
            `;
            
            authorDiv.appendChild(avatar);
            authorDiv.appendChild(authorInfo);
            
            const reviewText = document.createElement('p');
            reviewText.textContent = review.text;
            
            reviewCard.appendChild(authorDiv);
            reviewCard.appendChild(reviewText);
            
            this.reviewsContainer.appendChild(reviewCard);
        });
        
        // Обновляем сводную информацию о рейтинге
        this.updateReviewsSummary();
    }
    
    /**
     * Обновление сводной информации о рейтинге
     */
    updateReviewsSummary() {
        if (!this.reviewsCache || this.reviewsCache.length === 0) return;
        
        // Вычисляем средний рейтинг
        const totalRating = this.reviewsCache.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / this.reviewsCache.length;
        
        // Обновляем отображение среднего рейтинга
        const reviewsStarsElement = document.querySelector('.product__reviews-stars');
        const reviewsCountElement = document.querySelector('.product__reviews-count');
        const reviewsTotalElement = document.querySelector('.product__reviews-total');
        
        if (reviewsStarsElement) {
            reviewsStarsElement.innerHTML = this.generateRatingStars(averageRating);
        }
        
        if (reviewsCountElement) {
            reviewsCountElement.textContent = `${averageRating.toFixed(1)} из 5`;
        }
        
        if (reviewsTotalElement) {
            reviewsTotalElement.textContent = `На основе ${this.reviewsCache.length} отзывов`;
        }
    }
    
    /**
     * Отображение связанных товаров
     */
    renderRelatedProducts() {
        if (!this.relatedProductsContainer || !this.productsCache) return;
        
        // Очищаем контейнер
        this.relatedProductsContainer.innerHTML = '';
        
        // Находим товары из той же категории, исключая текущий
        const relatedProducts = this.productsCache
            .filter(product => 
                product.category === this.currentProduct.category && 
                product.id !== this.currentProduct.id
            )
            .slice(0, 4); // Ограничиваем до 4 товаров
        
        // Если связанных товаров нет
        if (relatedProducts.length === 0) {
            // Берем любые популярные товары
            const popularProducts = this.productsCache
                .filter(product => product.popular && product.id !== this.currentProduct.id)
                .slice(0, 4);
                
            if (popularProducts.length > 0) {
                this.renderProductCards(popularProducts);
            } else {
                this.relatedProductsContainer.innerHTML = '<p>Нет рекомендуемых товаров</p>';
            }
        } else {
            this.renderProductCards(relatedProducts);
        }
    }
    
    /**
     * Отображение карточек товаров
     * @param {Array} products - Массив товаров для отображения
     */
    renderProductCards(products) {
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // Формируем URL для страницы товара
            const productUrl = `product.html?id=${product.id}`;
            
            // Определяем, есть ли скидка
            const hasDiscount = product.oldPrice && product.oldPrice > product.price;
            
            card.innerHTML = `
                <a href="${productUrl}" class="product-card__image-container">
                    <img src="${product.image}" alt="${product.name}" class="product-card__image">
                    ${hasDiscount ? `<span class="product-card__discount">-${product.discount}%</span>` : ''}
                </a>
                <div class="product-card__content">
                    <h3 class="product-card__title">
                        <a href="${productUrl}">${product.name}</a>
                    </h3>
                    <div class="product-card__rating">${this.generateRatingStars(product.rating)}</div>
                    <div class="product-card__price-block">
                        <div class="product-card__price">${product.price} ₽</div>
                        ${hasDiscount ? `<div class="product-card__old-price">${product.oldPrice} ₽</div>` : ''}
                    </div>
                    <div class="product-card__actions">
                        <button class="btn btn--primary btn--sm add-to-cart-btn" data-product-id="${product.id}">
                            В корзину
                        </button>
                        <button class="btn btn--outline btn--sm add-to-wishlist-btn" data-product-id="${product.id}">
                            <img src="../assets/heart.svg" alt="В избранное">
                        </button>
                    </div>
                </div>
            `;
            
            this.relatedProductsContainer.appendChild(card);
        });
    }
    
    /**
     * Генерация HTML для отображения рейтинга звездами
     * @param {number} rating - Рейтинг от 0 до 5
     * @returns {string} HTML-код со звездами
     */
    generateRatingStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let starsHtml = '';
        
        // Полные звезды
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '★';
        }
        
        // Половина звезды
        if (halfStar) {
            starsHtml += '⯨';
        }
        
        // Пустые звезды
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '☆';
        }
        
        return starsHtml;
    }
    
    /**
     * Установка обработчиков событий
     */
    setupEventListeners() {
        // Обработчик для кнопки "Добавить в корзину"
        const addToCartBtn = document.getElementById('add-to-cart');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }
        
        // Обработчик для кнопки "Добавить в избранное"
        const addToWishlistBtn = document.getElementById('add-to-wishlist');
        if (addToWishlistBtn) {
            addToWishlistBtn.addEventListener('click', () => this.addToWishlist());
        }
        
        // Обработчики для кнопок изменения количества
        const quantityMinusBtn = document.getElementById('quantity-minus');
        const quantityPlusBtn = document.getElementById('quantity-plus');
        const quantityInput = document.getElementById('product-quantity');
        
        if (quantityMinusBtn && quantityInput) {
            quantityMinusBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                }
            });
        }
        
        if (quantityPlusBtn && quantityInput) {
            quantityPlusBtn.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value);
                if (currentValue < 99) {
                    quantityInput.value = currentValue + 1;
                }
            });
        }
        
        // Обработчики для вкладок
        const tabButtons = document.querySelectorAll('.product__tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Удаляем активный класс у всех кнопок и панелей
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.product__tab-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                
                // Добавляем активный класс текущей кнопке
                button.classList.add('active');
                
                // Активируем соответствующую панель
                const tabId = button.getAttribute('data-tab');
                document.getElementById(`tab-${tabId}`).classList.add('active');
            });
        });
        
        // Обработчик для кнопки "Написать отзыв"
        const writeReviewBtn = document.getElementById('write-review-btn');
        const reviewModal = document.getElementById('review-modal');
        const closeModalBtn = reviewModal?.querySelector('.modal__close');
        const overlay = document.querySelector('.overlay');
        
        if (writeReviewBtn && reviewModal) {
            writeReviewBtn.addEventListener('click', () => {
                reviewModal.classList.add('active');
                if (overlay) overlay.classList.add('active');
            });
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                reviewModal.classList.remove('active');
                if (overlay) overlay.classList.remove('active');
            });
        }
        
        // Обработчик для формы отзыва
        const reviewForm = document.getElementById('review-form');
        if (reviewForm) {
            reviewForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitReview();
            });
        }
        
        // Обработчики для выбора рейтинга
        const ratingButtons = document.querySelectorAll('.rating-btn');
        const ratingInput = document.getElementById('review-rating');
        
        if (ratingButtons.length && ratingInput) {
            ratingButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const rating = parseInt(button.getAttribute('data-rating'));
                    ratingInput.value = rating;
                    
                    // Обновляем визуальное отображение
                    ratingButtons.forEach((btn, index) => {
                        if (index < rating) {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    });
                });
            });
        }
        
        // Обработчики для связанных товаров
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = parseInt(button.getAttribute('data-product-id'));
                this.addToCart(productId);
            });
        });
        
        document.querySelectorAll('.add-to-wishlist-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = parseInt(button.getAttribute('data-product-id'));
                this.addToWishlist(productId);
            });
        });
    }
    
    /**
     * Добавление товара в корзину
     * @param {number} productId - ID товара (если не указан, используется текущий товар)
     */
    addToCart(productId = null) {
        const id = productId || this.currentProductId;
        const quantity = productId ? 1 : parseInt(document.getElementById('product-quantity').value || 1);
        
        // Находим товар
        const product = this.productsCache.find(p => p.id === id);
        if (!product) return;
        
        // Получаем текущую корзину из localStorage
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        // Проверяем, есть ли уже этот товар в корзине
        const existingItemIndex = cart.findIndex(item => item.id === id);
        
        if (existingItemIndex >= 0) {
            // Если товар уже в корзине, увеличиваем количество
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Если товара нет в корзине, добавляем его
            cart.push({
                id: id,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }
        
        // Сохраняем обновленную корзину
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Обновляем счетчик товаров в корзине
        this.updateCartCount();
        
        // Показываем уведомление
        this.showNotification('Товар добавлен в корзину');
    }
    
    /**
     * Добавление товара в избранное
     * @param {number} productId - ID товара (если не указан, используется текущий товар)
     */
    addToWishlist(productId = null) {
        const id = productId || this.currentProductId;
        
        // Находим товар
        const product = this.productsCache.find(p => p.id === id);
        if (!product) return;
        
        // Получаем текущий список избранного из localStorage
        let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        
        // Проверяем, есть ли уже этот товар в избранном
        const existingItemIndex = wishlist.findIndex(item => item.id === id);
        
        if (existingItemIndex >= 0) {
            // Если товар уже в избранном, удаляем его
            wishlist.splice(existingItemIndex, 1);
            this.showNotification('Товар удален из избранного');
        } else {
            // Если товара нет в избранном, добавляем его
            wishlist.push({
                id: id,
                name: product.name,
                price: product.price,
                image: product.image
            });
            this.showNotification('Товар добавлен в избранное');
        }
        
        // Сохраняем обновленный список избранного
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        
        // Обновляем визуальное отображение кнопки избранного
        this.updateWishlistButton();
    }
    
    /**
     * Обновление счетчика товаров в корзине
     */
    updateCartCount() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Обновляем все элементы с классом data-cart-count
        document.querySelectorAll('[data-cart-count]').forEach(element => {
            element.textContent = totalItems.toString();
        });
    }
    
    /**
     * Обновление визуального отображения кнопки избранного
     */
    updateWishlistButton() {
        const wishlistBtn = document.getElementById('add-to-wishlist');
        if (!wishlistBtn) return;
        
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const isInWishlist = wishlist.some(item => item.id === this.currentProductId);
        
        if (isInWishlist) {
            wishlistBtn.classList.add('active');
        } else {
            wishlistBtn.classList.remove('active');
        }
    }
    
    /**
     * Отправка нового отзыва
     */
    submitReview() {
        const nameInput = document.getElementById('review-name');
        const ratingInput = document.getElementById('review-rating');
        const textInput = document.getElementById('review-text');
        
        if (!nameInput || !ratingInput || !textInput) return;
        
        const name = nameInput.value.trim();
        const rating = parseInt(ratingInput.value);
        const text = textInput.value.trim();
        
        if (!name || !text || isNaN(rating)) {
            this.showNotification('Пожалуйста, заполните все поля формы', 'error');
            return;
        }
        
        // Создаем новый отзыв
        const newReview = {
            productId: this.currentProductId,
            name: name,
            avatar: '../img/avatar-default.jpg',
            date: new Date().toLocaleDateString('ru-RU'),
            rating: rating,
            text: text
        };
        
        // Добавляем отзыв в кэш
        if (!this.reviewsCache) {
            this.reviewsCache = [];
        }
        this.reviewsCache.unshift(newReview);
        
        // Сохраняем отзыв в localStorage для демонстрации
        // В реальном приложении здесь был бы запрос к API для сохранения в базе данных
        const allReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        allReviews.push(newReview);
        localStorage.setItem('reviews', JSON.stringify(allReviews));
        
        // Обновляем отображение отзывов
        this.renderReviews();
        
        // Закрываем модальное окно
        const reviewModal = document.getElementById('review-modal');
        const overlay = document.querySelector('.overlay');
        
        if (reviewModal) {
            reviewModal.classList.remove('active');
        }
        
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Сбрасываем форму
        document.getElementById('review-form').reset();
        
        // Показываем уведомление
        this.showNotification('Спасибо за ваш отзыв!');
    }
    
    /**
     * Отображение уведомления
     * @param {string} message - Текст уведомления
     * @param {string} type - Тип уведомления ('success', 'error', 'info')
     */
    showNotification(message, type = 'success') {
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
        notification.className = `notification notification--${type}`;
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
     * @param {string} message - Текст сообщения об ошибке
     */
    showErrorMessage(message) {
        if (!this.productDetailsContainer) return;
        
        this.productDetailsContainer.innerHTML = `
            <div class="error-message">
                <h2>Ошибка</h2>
                <p>${message}</p>
                <a href="catalog.html" class="btn btn--primary">Перейти в каталог</a>
            </div>
        `;
    }
}

// Создаем экземпляр класса при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const productManager = new ProductManager();
});
