// js/cart.js
(function () {
  let cart = [];
  let serverPromos = [];

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

  function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  function updateCartCounter() {
    const counters = document.querySelectorAll('[data-cart-count]');
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    counters.forEach(counter => {
      counter.textContent = itemCount;
      const cartBtn = counter.closest('.header__cart-btn');
      if (cartBtn) cartBtn.classList.toggle('active', itemCount > 0);
      counter.style.display = itemCount > 0 ? 'inline-block' : 'none';
    });
  }

  function addToCart(productId, quantity = 1, productData) {
    if (!productData || !productData.id) {
      showNotification('Не удалось добавить товар: неверные данные.', true);
      return;
    }
    const numProductId = parseInt(productId);
    const existingItem = cart.find(item => item.id === numProductId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        id: numProductId, name: productData.name, price: productData.price,
        oldPrice: productData.oldPrice,
        image: productData.image || (productData.images && productData.images.length > 0 ? productData.images[0] : window.IMAGE_PLACEHOLDERS.PRODUCT),
        quantity
      });
    }
    saveCartToStorage();
    updateCartCounter();
    if (document.getElementById('cart-items-container')) renderCartPage();
    showNotification(`"${productData.name}" добавлен в корзину`);
  }

  function updateCartItemQuantity(productId, newQuantity) {
    const numProductId = parseInt(productId);
    const index = cart.findIndex(item => item.id === numProductId);
    if (index === -1) return;
    if (newQuantity <= 0) cart.splice(index, 1);
    else cart[index].quantity = newQuantity;
    saveCartToStorage();
    updateCartCounter();
    if (document.getElementById('cart-items-container')) renderCartPage();
  }

  function removeFromCart(productId) {
    const numProductId = parseInt(productId);
    const index = cart.findIndex(item => item.id === numProductId);
    if (index !== -1) {
      const removedItemName = cart[index].name;
      cart.splice(index, 1);
      saveCartToStorage();
      updateCartCounter();
      if (document.getElementById('cart-items-container')) renderCartPage();
      showNotification(`"${removedItemName}" удален из корзины`);
    }
  }

  function renderCartPage() {
    const container = document.getElementById('cart-items-container');
    const emptyMsgEl = document.getElementById('cart-empty-message');
    const summarySection = document.getElementById('cart-summary-section');
    if (!container) return;
    if (cart.length === 0) {
      container.innerHTML = '';
      if (emptyMsgEl) emptyMsgEl.style.display = 'block';
      if (summarySection) summarySection.style.display = 'none';
    } else {
      if (emptyMsgEl) emptyMsgEl.style.display = 'none';
      if (summarySection) summarySection.style.display = 'block';
      container.innerHTML = cart.map(window.createCartItemHTML).join('');
    }
    updateCartSummary();
  }

  function updateCartSummary() {
    const els = {
      subtotal: document.getElementById('summary-subtotal'),
      delivery: document.getElementById('summary-delivery'),
      total: document.getElementById('summary-total'),
      itemCount: document.getElementById('summary-item-count'),
      promoInput: document.getElementById('promo-code-input'),
      discountRow: document.getElementById('summary-discount-row'),
      discountAmount: document.getElementById('summary-discount-amount')
    };
    if (!els.subtotal || !els.delivery || !els.total || !els.itemCount) return;

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryPrice = subtotal >= 5000 ? 0 : 300; // Примерная логика доставки
    const discount = getDiscountAmount(subtotal);
    const total = Math.max(0, subtotal + deliveryPrice - discount);

    els.itemCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    els.subtotal.textContent = formatPrice(subtotal);
    els.delivery.textContent = deliveryPrice > 0 ? formatPrice(deliveryPrice) : 'Бесплатно';
    els.total.textContent = formatPrice(total);
    if (els.promoInput) els.promoInput.disabled = cart.length === 0;
    if (els.discountRow && els.discountAmount) {
      if (discount > 0) {
        els.discountRow.style.display = 'flex';
        els.discountAmount.textContent = `-${formatPrice(discount)}`;
      } else {
        els.discountRow.style.display = 'none';
      }
    }
  }

  async function loadPromosFromServer() {
    try {
      serverPromos = await API.getPromos();
      console.log('Промокоды загружены:', serverPromos.length);
      if (localStorage.getItem('activePromo')) updateCartSummary();
    } catch (error) {
      console.error('Ошибка загрузки промокодов:', error);
    }
  }

  function handlePromoApply() {
    const promoInput = document.getElementById('promo-code-input');
    const promoStatus = document.getElementById('promo-status-message');
    if (!promoInput || !promoStatus) return;

    const promoCode = promoInput.value.trim().toUpperCase();
    promoStatus.classList.remove('success', 'error'); // Сброс классов

    if (promoCode === '') {
      promoStatus.textContent = 'Введите промокод.';
      promoStatus.className = 'promo-status error active';
      localStorage.removeItem('activePromo');
      updateCartSummary();
      setTimeout(() => promoStatus.classList.remove('active'), 3000);
      return;
    }

    const promo = serverPromos.find(p => p.code === promoCode);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (promo) {
      if (subtotal < (promo.minCartAmount || 0)) {
        promoStatus.textContent = `Мин. сумма для промокода: ${formatPrice(promo.minCartAmount || 0)}`;
        promoStatus.className = 'promo-status error active';
        localStorage.removeItem('activePromo');
      } else {
        localStorage.setItem('activePromo', promoCode);
        promoStatus.textContent = 'Промокод применен!';
        promoStatus.className = 'promo-status success active';
      }
    } else {
      promoStatus.textContent = 'Недействительный промокод.';
      promoStatus.className = 'promo-status error active';
      localStorage.removeItem('activePromo');
    }
    updateCartSummary();
    setTimeout(() => promoStatus.classList.remove('active'), 3000);
  }

  function getDiscountAmount(subtotal) {
    const activePromoCode = localStorage.getItem('activePromo');
    if (!activePromoCode || subtotal === 0 || serverPromos.length === 0) return 0;
    const promo = serverPromos.find(p => p.code === activePromoCode);
    if (!promo || subtotal < (promo.minCartAmount || 0)) return 0;
    let discountValue = 0;
    if (promo.type === 'percent') discountValue = Math.floor(subtotal * promo.value / 100);
    else if (promo.type === 'fixed') discountValue = promo.value;
    return Math.min(discountValue, subtotal);
  }

  function setupCartPageEvents() {
    const cartContainer = document.getElementById('cart-items-container');
    if (!cartContainer) return;
    cartContainer.addEventListener('click', (event) => {
      const target = event.target;
      const cartItemEl = target.closest('.cart-item');
      if (!cartItemEl) return;
      const productId = parseInt(cartItemEl.dataset.productId);
      if (target.closest('.quantity-change')) {
        const action = target.closest('.quantity-change').dataset.action;
        const currentItem = cart.find(item => item.id === productId);
        if (!currentItem) return;
        if (action === 'increase') updateCartItemQuantity(productId, currentItem.quantity + 1);
        else if (action === 'decrease') {
          if (currentItem.quantity > 1) updateCartItemQuantity(productId, currentItem.quantity - 1);
          else removeFromCart(productId);
        }
      } else if (target.closest('.cart-item__remove')) removeFromCart(productId);
    });
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    if (applyPromoBtn) applyPromoBtn.addEventListener('click', handlePromoApply);
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (cart.length === 0) {
          showNotification('Ваша корзина пуста!', true);
          return;
        }
        // Здесь ваша логика валидации формы заказа и отправки на сервер
        console.log('Оформление заказа (демо):', cart);
        showNotification('Ваш заказ оформлен! (демо)');
        cart = [];
        saveCartToStorage();
        updateCartCounter();
        renderCartPage();
        localStorage.removeItem('activePromo');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadCartFromStorage();
    updateCartCounter();
    if (document.getElementById('cart-items-container')) {
      renderCartPage();
      setupCartPageEvents();
      loadPromosFromServer();
    }
  });

  window.Cart = {addToCart, updateCartCounter, removeFromCart, updateItemQuantity: updateCartItemQuantity};
})();
