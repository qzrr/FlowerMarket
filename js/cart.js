// Корзина: добавление товаров, изменение количества, отображение итоговой суммы

let cart = [];
let promos = [];

// Загрузка при старте
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  updateCartCounter();

  if (document.getElementById('cart-items-container')) {
    renderCartItems();
    setupCartEvents();
    loadPromos();
  }
});

// Загрузка из localStorage
function loadCartFromStorage() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch (e) {
      console.error('Ошибка загрузки корзины:', e);
      cart = [];
    }
  }
}

// Сохранение
function saveCartToStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Счётчик в шапке
function updateCartCounter() {
  const counters = document.querySelectorAll('[data-cart-count]');
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  counters.forEach(counter => {
    counter.textContent = itemCount;
    const cartBtn = counter.closest('.header__cart-btn');
    if (cartBtn) cartBtn.classList.toggle('active', itemCount > 0);
  });
}

// Добавление товара
function addToCart(productId, quantity = 1, productData) {
  const existingItem = cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: productId,
      name: productData.name,
      price: productData.price,
      oldPrice: productData.oldPrice,
      image: productData.image,
      quantity
    });
  }

  saveCartToStorage();
  updateCartCounter();
  if (document.getElementById('cart-items-container')) renderCartItems();
}

// Изменение количества
function updateCartItemQuantity(productId, newQuantity, rerender = true) {
  const index = cart.findIndex(item => item.id === productId);
  if (index === -1) return;

  if (newQuantity <= 0) {
    cart.splice(index, 1);
  } else {
    cart[index].quantity = newQuantity;
  }

  saveCartToStorage();
  updateCartCounter();
  if (rerender) renderCartItems();
}

// Удаление
function removeFromCart(productId) {
  const index = cart.findIndex(item => item.id === productId);
  if (index !== -1) {
    cart.splice(index, 1);
    saveCartToStorage();
    updateCartCounter();
    renderCartItems();
  }
}

// Формат цены
function formatPrice(price) {
  return price.toLocaleString('ru-RU') + ' ₽';
}

// Отображение товаров
function renderCartItems() {
  const container = document.getElementById('cart-items-container');
  const emptyMessage = document.getElementById('cart-empty-message');
  const summarySection = document.getElementById('cart-summary-section');

  if (!container) return;

  if (cart.length === 0) {
    if (emptyMessage) emptyMessage.style.display = 'block';
    if (summarySection) summarySection.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  if (emptyMessage) emptyMessage.style.display = 'none';
  if (summarySection) summarySection.style.display = 'block';

  container.innerHTML = cart.map(item => {
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

  updateCartSummary();
}

// Сводка
function updateCartSummary() {
  const subtotalEl = document.getElementById('summary-subtotal');
  const deliveryEl = document.getElementById('summary-delivery');
  const totalEl = document.getElementById('summary-total');
  const itemCountEl = document.getElementById('summary-item-count');
  const promoInput = document.getElementById('promo');

  if (!subtotalEl || !deliveryEl || !totalEl || !itemCountEl) return;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryPrice = subtotal >= 5000 ? 0 : 300;
  const discount = getDiscountAmount(subtotal);
  const total = subtotal + deliveryPrice - discount;

  subtotalEl.textContent = formatPrice(subtotal);
  deliveryEl.textContent = deliveryPrice > 0 ? formatPrice(deliveryPrice) : 'Бесплатно';
  totalEl.textContent = formatPrice(total);
  itemCountEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (promoInput) promoInput.disabled = cart.length === 0;

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
}

// Обработчик промокода
function handlePromoApply() {
  const promoInput = document.getElementById('promo');
  const promoStatus = document.getElementById('promo-status');

  if (!promoInput || !promoStatus) return;

  const promoCode = promoInput.value.trim().toUpperCase();
  if (promoCode === '') {
    promoStatus.textContent = 'Введите промокод';
    promoStatus.className = 'promo-status error';
    return;
  }

  const promo = promos.find(p => p.code === promoCode);
  if (promo) {
    localStorage.setItem('activePromo', promoCode);
    promoStatus.textContent = 'Промокод применен';
    promoStatus.className = 'promo-status success';
    updateCartSummary();
  } else {
    promoStatus.textContent = 'Недействительный промокод';
    promoStatus.className = 'promo-status error';
    localStorage.removeItem('activePromo');
    promoInput.value = '';
  }
}

// Применение промокода
function getDiscountAmount(subtotal) {
  const code = localStorage.getItem('activePromo');
  if (!code || subtotal === 0) return 0;

  const promo = promos.find(p => p.code === code);
  if (!promo) return 0;
  if (subtotal < (promo.minCartAmount || 0)) return 0;

  if (promo.type === 'percent') return Math.floor(subtotal * promo.value / 100);
  if (promo.type === 'fixed') return promo.value;

  return 0;
}

// Загрузка промокодов
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
}

// Настройка событий
function setupCartEvents() {
  const cartContainer = document.getElementById('cart-items-container');
  if (!cartContainer) return;

  cartContainer.addEventListener('click', (event) => {
    const target = event.target;
    const cartItem = target.closest('.cart-item');
    if (!cartItem) return;

    const productId = parseInt(cartItem.dataset.productId);

    if (target.classList.contains('quantity-change')) {
      const action = target.dataset.action;
      const input = cartItem.querySelector('.quantity-input');
      const current = parseInt(input.value);

      if (action === 'increase') {
        updateCartItemQuantity(productId, current + 1);
      } else if (action === 'decrease') {
        if (current > 1) {
          updateCartItemQuantity(productId, current - 1);
        } else {
          removeFromCart(productId);
        }
      }
    } else if (target.closest('.cart-item__remove')) {
      removeFromCart(productId);
    }
  });

  const applyPromoBtn = document.getElementById('apply-promo');
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener('click', handlePromoApply);
  }

  const checkoutBtn = document.getElementById('place-order');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      e.preventDefault();

      const name = document.getElementById('customer-name')?.value.trim();
      const phone = document.getElementById('customer-phone')?.value.trim();
      const email = document.getElementById('customer-email')?.value.trim();
      const address = document.getElementById('delivery-address')?.value.trim();

      if (!name || !phone || !email || !address) {
        alert('Пожалуйста, заполните все поля.');
        return;
      }

      // Тут можно отправить данные на сервер

      cart = [];
      saveCartToStorage();
      updateCartCounter();
      alert('Ваш заказ оформлен!');
      window.location.href = 'index.html';
    });
  }
}
