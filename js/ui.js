// Функции для создания и обновления HTML элементов

// Рендер карточки категории
function createCategoryCardHTML(category) {
  return `
        <a href="catalog.html?category=${category.id}" class="category-card">
            <img src="${category.image}" alt="${category.name}" class="category-card__image">
            <span class="category-card__name">${category.name}</span>
        </a>
    `;
}

// Рендер карточки товара
function createProductCardHTML(product) {
  const oldPriceHTML = product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : '';
  const discountHTML = product.discount ? `<div class="product-card__discount">-${product.discount}%</div>` : '';

  return `
        <article class="product-card" data-product-id="${product.id}">
            <a href="#product-${product.id}" class="product-card__image-link">
                 ${discountHTML}
                <img src="${product.image}" alt="${product.name}" class="product-card__image">
                <div class="product-card__actions">
                     <button class="product-card__action-btn add-to-wishlist" aria-label="Добавить в избранное">
                         <img src="assets/heart.svg" alt="Избранное">
                     </button>
                      <!-- Можно добавить кнопку быстрого просмотра -->
                 </div>
            </a>
            <div class="product-card__content">
                <span class="product-card__category">${product.category}</span>
                <h3 class="product-card__name">
                    <a href="#product-${product.id}">${product.name}</a>
                 </h3>
                <div class="product-card__price">
                    ${formatPrice(product.price)} ${oldPriceHTML}
                </div>
                <button class="btn product-card__add-to-cart add-to-cart-btn">В корзину</button>
            </div>
        </article>
    `;
}

// Рендер элемента корзины
function createCartItemHTML(item) {
  const totalItemPrice = item.price * item.quantity;
  return `
        <div class="cart-item" data-product-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" class="cart-item__image">
            <div class="cart-item__details">
                <h3 class="cart-item__name">${item.name}</h3>
                <div class="cart-item__quantity">
                    <button class="quantity-change" data-action="decrease" aria-label="Уменьшить количество">-</button>
                    <input type="number" value="${item.quantity}" min="1" class="quantity-input" readonly>
                    <button class="quantity-change" data-action="increase" aria-label="Увеличить количество">+</button>
                </div>
            </div>
            <div class="cart-item__price">
                <span class="item-total-price">${formatPrice(totalItemPrice)}</span>
                <span class="item-unit-price">${formatPrice(item.price)} / шт.</span>
            </div>
            <button class="cart-item__remove remove-from-cart-btn" aria-label="Удалить товар">
                <img src="assets/trash.svg" alt="Удалить">
            </button>
        </div>
    `;
}

// Функция форматирования цены (простая)
function formatPrice(price) {
  return `${price.toLocaleString('ru-RU')} ₽`;
}


// --- Функции обновления UI ---

// Обновление счетчика корзины в шапке
function updateCartCounter() {
  const count = getCartItemCount();
  const counters = document.querySelectorAll('[data-cart-count]');
  counters.forEach(counter => {
    counter.textContent = count;
    counter.style.display = count > 0 ? 'flex' : 'none';
  });
}


// Рендер страницы корзины
function renderCartPage() {
  const cart = getCart();
  const cartContainer = document.getElementById('cart-items-container');
  const summarySection = document.getElementById('cart-summary-section');
  const emptyMessage = cartContainer?.querySelector('.cart-empty-message'); // Используем ?. для безопасности

  if (!cartContainer || !summarySection) return; // Выходим, если нет нужных элементов (не на странице корзины)

  if (cart.length === 0) {
    cartContainer.innerHTML = '<p class="cart-empty-message">Ваша корзина пуста. <a href="catalog.html">Перейти в каталог</a></p>';
    summarySection.style.display = 'none';
  } else {
    if (emptyMessage) emptyMessage.style.display = 'none'; // Скрыть сообщение о пустой корзине

    cartContainer.innerHTML = cart.map(createCartItemHTML).join('');
    summarySection.style.display = 'block'; // Показать блок с суммой

    // Обновление итоговой информации
    const subtotal = getCartTotal();
    const deliveryCost = 300; // Примерная стоимость доставки
    const total = subtotal + deliveryCost;

    document.getElementById('summary-item-count').textContent = getCartItemCount();
    document.getElementById('summary-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('summary-delivery').textContent = formatPrice(deliveryCost);
    document.getElementById('summary-total').textContent = formatPrice(total);
  }
  updateCartCounter(); // Обновляем и счетчик в шапке
}
