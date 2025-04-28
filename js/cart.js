// Корзина: добавление товаров, изменение количества, отображение итоговой суммы

// Объявляем глобальные переменные
let cart = []; // Корзина с товарами
let promos = []; // Список доступных промокодов

// Загружаем корзину из localStorage при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  updateCartCounter();

  // Если мы на странице корзины, отображаем товары
  if (document.getElementById('cart-items-container')) {
    renderCartItems();
    setupCartEvents();
    loadPromos();
  }
});

// Загрузка корзины из localStorage
function loadCartFromStorage() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      console.error('Ошибка загрузки корзины из localStorage:', e);
      cart = [];
    }
  }
}

// Сохранение корзины в localStorage
function saveCartToStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Обновление счетчика товаров в корзине (в шапке)
function updateCartCounter() {
  const counters = document.querySelectorAll('[data-cart-count]');
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  counters.forEach(counter => {
    counter.textContent = itemCount;

    // Показываем счетчик только если в корзине есть товары
    const cartBtn = counter.closest('.header__cart-btn');
    if (cartBtn) {
      if (itemCount > 0) {
        cartBtn.classList.add('active');
      } else {
        cartBtn.classList.remove('active');
      }
    }
  });
}

// Добавление товара в корзину
function addToCart(productId, quantity = 1, productData) {
  // Проверяем, есть ли уже такой товар в корзине
  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    // Если товар уже есть, увеличиваем количество
    existingItem.quantity += quantity;
  } else {
    // Если товара нет, добавляем новый
    cart.push({
      id: productId,
      name: productData.name,
      price: productData.price,
      oldPrice: productData.oldPrice,
      image: productData.image,
      quantity: quantity
    });
  }

  // Сохраняем корзину и обновляем счетчик
  saveCartToStorage();
  updateCartCounter();

  // Если мы на странице корзины, обновляем отображение
  if (document.getElementById('cart-items-container')) {
    renderCartItems();
  }
}

// Изменение количества товара в корзине
function updateCartItemQuantity(productId, newQuantity) {
  // Находим товар в корзине
  const itemIndex = cart.findIndex(item => item.id === productId);

  if (itemIndex === -1) return; // Товар не найден

  if (newQuantity <= 0) {
    // Если количество <= 0, удаляем товар
    cart.splice(itemIndex, 1);
  } else {
    // Иначе обновляем количество
    cart[itemIndex].quantity = newQuantity;
  }

  // Сохраняем корзину и обновляем счетчик
  saveCartToStorage();
  updateCartCounter();

  // Перерисовываем корзину
  renderCartItems();
}

// Удаление товара из корзины
function removeFromCart(productId) {
  const itemIndex = cart.findIndex(item => item.id === productId);
  if (itemIndex !== -1) {
    cart.splice(itemIndex, 1);
    saveCartToStorage();
    updateCartCounter();
    renderCartItems();
  }
}

// Форматирование цены
function formatPrice(price) {
  return price.toLocaleString('ru-RU') + ' ₽';
}

// Отображение товаров в корзине
function renderCartItems() {
  const container = document.getElementById('cart-items-container');
  const emptyMessage = document.getElementById('cart-empty-message');
  const summarySection = document.getElementById('cart-summary-section');

  if (!container) return;

  if (cart.length === 0) {
    // Если корзина пуста, показываем сообщение
    if (emptyMessage) emptyMessage.style.display = 'block';
    if (summarySection) summarySection.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  // Если в корзине есть товары, скрываем сообщение и показываем сводку
  if (emptyMessage) emptyMessage.style.display = 'none';
  if (summarySection) summarySection.style.display = 'block';

  // Формируем HTML для всех товаров
  const cartItemsHTML = cart.map(item => {
    const totalItemPrice = item.price * item.quantity;

    return `
      <div class="cart-item" data-product-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" class="cart-item__image">
        <div class="cart-item__details">
          <h3 class="cart-item__name">${item.name}</h3>
          <div class="cart-item__quantity">
            <button class="quantity-change" data-action="decrease">-</button>
            <input type="number" value="${item.quantity}" min="1" class="quantity-input" readonly>
            <button class="quantity-change" data-action="increase">+</button>
          </div>
        </div>
        <div class="cart-item__price">
          <span class="item-total-price">${formatPrice(totalItemPrice)}</span>
          <span class="item-unit-price">${formatPrice(item.price)} / шт.</span>
        </div>
        <button class="cart-item__remove" aria-label="Удалить товар">
          <img src="../assets/trash.svg" alt="Удалить">
        </button>
      </div>
    `;
  }).join('');

  container.innerHTML = cartItemsHTML;
  updateCartSummary();
}

// Обновление сводки по корзине (сумма, доставка, итого)
function updateCartSummary() {
  const subtotalEl = document.getElementById('summary-subtotal');
  const deliveryEl = document.getElementById('summary-delivery');
  const totalEl = document.getElementById('summary-total');
  const itemCountEl = document.getElementById('summary-item-count');

  if (!subtotalEl || !deliveryEl || !totalEl || !itemCountEl) return;

  // Подсчитываем общую сумму товаров
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Определяем стоимость доставки
  const deliveryPrice = subtotal >= 5000 ? 0 : 300; // Если сумма >= 5000, то доставка бесплатная

  // Вычисляем скидку по промокоду (если есть)
  const discount = getDiscountAmount(subtotal);

  // Обновляем отображение скидки
  const discountRow = document.getElementById('discount-row');
  const discountEl = document.getElementById('summary-discount');

  if (discountRow && discountEl) {
    if (discount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-${formatPrice(discount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  // Вычисляем общую сумму
  const total = subtotal + deliveryPrice - discount;

  // Обновляем элементы
  subtotalEl.textContent = formatPrice(subtotal);
  deliveryEl.textContent = deliveryPrice > 0 ? formatPrice(deliveryPrice) : 'Бесплатно';
  totalEl.textContent = formatPrice(total);

  // Обновляем количество товаров
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  itemCountEl.textContent = itemCount;
}

// Настройка обработчиков событий на странице корзины
function setupCartEvents() {
  // Получаем контейнер для товаров в корзине
  const cartContainer = document.getElementById('cart-items-container');
  if (!cartContainer) return;

  // Обработка клика по кнопкам +/- и удалить
  cartContainer.addEventListener('click', (event) => {
    const target = event.target;
    const cartItem = target.closest('.cart-item');
    if (!cartItem) return;

    const productId = parseInt(cartItem.dataset.productId);

    if (target.classList.contains('quantity-change')) {
      // Обрабатываем изменение количества
      const action = target.dataset.action;
      const input = cartItem.querySelector('.quantity-input');
      const currentQuantity = parseInt(input.value);

      if (action === 'increase') {
        updateCartItemQuantity(productId, currentQuantity + 1);
      } else if (action === 'decrease') {
        if (currentQuantity > 1) {
          updateCartItemQuantity(productId, currentQuantity - 1);
        } else {
          removeFromCart(productId);
        }
      }
    } else if (target.closest('.cart-item__remove')) {
      // Обрабатываем удаление товара
      removeFromCart(productId);
    }
  });

  // Обработчик для промокода
  const applyPromoBtn = document.getElementById('apply-promo');
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener('click', () => {
      const promoInput = document.getElementById('promo');
      const promoStatus = document.getElementById('promo-status');

      if (!promoInput || !promoStatus) return;

      const promoCode = promoInput.value.trim().toUpperCase();

      if (promoCode === '') {
        promoStatus.textContent = 'Введите промокод';
        promoStatus.className = 'promo-status error';
        return;
      }

      // Проверяем, существует ли такой промокод
      const promo = promos.find(p => p.code === promoCode);

      if (promo) {
        // Сохраняем промокод в localStorage
        localStorage.setItem('activePromo', promoCode);
        promoStatus.textContent = 'Промокод применен';
        promoStatus.className = 'promo-status success';

        // Обновляем итоговую сумму
        updateCartSummary();
      } else {
        promoStatus.textContent = 'Недействительный промокод';
        promoStatus.className = 'promo-status error';
        localStorage.removeItem('activePromo');
      }
    });
  }

  // Обработчик для кнопки оформления заказа
  const checkoutBtn = document.getElementById('place-order');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // Проверяем, что все обязательные поля заполнены
      const nameInput = document.getElementById('customer-name');
      const phoneInput = document.getElementById('customer-phone');
      const emailInput = document.getElementById('customer-email');
      const addressInput = document.getElementById('delivery-address');

      if (!nameInput.value || !phoneInput.value || !emailInput.value || !addressInput.value) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
      }

      // Здесь бы отправили данные на сервер
      // ...

      // Очищаем корзину
      cart = [];
      saveCartToStorage();
      updateCartCounter();

      // Показываем сообщение об успешном оформлении
      alert('Ваш заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.');

      // Перенаправляем на главную страницу
      window.location.href = 'index.html';
    });
  }
}

// Загрузка доступных промокодов
async function loadPromos() {
  try {
    const response = await fetch('http://localhost:3000/api/promos');
    if (response.ok) {
      promos = await response.json();
      console.log('Промокоды загружены:', promos.length);
    } else {
      console.error('Ошибка загрузки промокодов:', response.status);
    }
  } catch (error) {
    console.error('Ошибка при загрузке промокодов:', error);
  }

  // Настройка обработчика применения промокода
  const applyPromoButton = document.getElementById('apply-promo');
  if (applyPromoButton) {
    applyPromoButton.addEventListener('click', () => {
      const promoInput = document.getElementById('promo');
      const promoStatus = document.getElementById('promo-status');

      if (!promoInput || !promoStatus) return;

      const promoCode = promoInput.value.trim().toUpperCase();

      // Проверяем, существует ли такой промокод
      const promo = promos.find(p => p.code === promoCode);

      if (promo) {
        // Сохраняем промокод в localStorage
        localStorage.setItem('activePromo', promoCode);
        promoStatus.textContent = 'Промокод применен';
        promoStatus.className = 'promo-status success';

        // Обновляем итоговую сумму
        updateCartSummary();
      } else {
        promoStatus.textContent = 'Недействительный промокод';
        promoStatus.className = 'promo-status error';
        localStorage.removeItem('activePromo');
      }
    });
  }
}

// Расчет скидки по промокоду
function getDiscountAmount(subtotal) {
  const activePromoCode = localStorage.getItem('activePromo');
  if (!activePromoCode || subtotal === 0) return 0;

  const promo = promos.find(p => p.code === activePromoCode);
  if (!promo) return 0;

  // Проверяем минимальную сумму заказа
  if (subtotal < (promo.minCartAmount || 0)) return 0;

  // Вычисляем скидку в зависимости от типа
  if (promo.type === 'percent') {
    return Math.floor(subtotal * promo.value / 100);
  } else if (promo.type === 'fixed') {
    return promo.value;
  }

  return 0;
}
