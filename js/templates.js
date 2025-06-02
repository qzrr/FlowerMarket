// js/templates.js

// Используем пути от корня сайта для единообразия
const IMAGE_PLACEHOLDER_CATEGORY = '/img/placeholder-category.jpg';
const IMAGE_PLACEHOLDER_PRODUCT = '/img/placeholder-product.jpg';
const ASSET_HEART_SVG = '/assets/heart.svg';
const ASSET_HEART_FILLED_SVG = '/assets/heart.svg';
const ASSET_CART_SVG = '/assets/cart.svg';
const ASSET_TRASH_SVG = '/assets/delete.svg';
const ASSET_AVATAR_DEFAULT = '/img/avatar-default.jpg';


function createCategoryCardHTML(category) {
  const imageUrl = category.image || IMAGE_PLACEHOLDER_CATEGORY;
  return `
    <a href="catalog.html?category=${category.id || category.slug}" class="category-card">
      <div class="category-card__image-wrapper">
        <img src="${imageUrl}" alt="${category.name}" class="category-card__image">
      </div>
      <h3 class="category-card__name">${category.name}</h3>
    </a>
  `;
}

function createProductCardHTML(product) {
  const oldPriceHTML = product.oldPrice && product.oldPrice > product.price
    ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>`
    : "";
  const discountHTML = product.discount
    ? `<div class="product-card__discount">-${product.discount}%</div>`
    : "";
  const imageUrl = (product.images && product.images.length > 0 ? product.images[0] : product.image) || IMAGE_PLACEHOLDER_PRODUCT;

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card__image-wrapper">
        <a href="product.html?id=${product.id}">
          ${discountHTML}
          <img src="${imageUrl}" alt="${product.name}" class="product-card__image">
        </a>
      </div>
      <div class="product-card__content">
        <span class="product-card__category">${product.categoryName || 'Категория'}</span>
        <h3 class="product-card__name">
          <a href="product.html?id=${product.id}">${product.name}</a>
        </h3>
        <div class="product-card__price">
          ${formatPrice(product.price)} ${oldPriceHTML}
        </div>
        <div class="product-card__bottom-actions">
          <button class="product-card__icon-btn add-to-wishlist" data-product-id="${product.id}" aria-label="Добавить в избранное">
            <img src="${ASSET_HEART_SVG}" alt="В избранное">
          </button>
          <button class="product-card__icon-btn add-to-cart-btn" data-product-id="${product.id}" aria-label="Добавить в корзину">
            <img src="${ASSET_CART_SVG}" alt="В корзину">
          </button>
        </div>
      </div>
    </div>
  `;
}

function createCartItemHTML(item) {
  const totalItemPrice = item.price * item.quantity;
  const imageUrl = item.image || IMAGE_PLACEHOLDER_PRODUCT;
  return `
    <div class="cart-item" data-product-id="${item.id}">
      <img src="${imageUrl}" alt="${item.name}" class="cart-item__image">
      <div class="cart-item__details">
        <h3 class="cart-item__name">${item.name}</h3>
        <div class="cart-item__quantity">
          <button class="quantity-change" data-action="decrease" aria-label="Уменьшить">-</button>
          <input type="number" value="${item.quantity}" min="1" class="quantity-input" readonly>
          <button class="quantity-change" data-action="increase" aria-label="Увеличить">+</button>
        </div>
      </div>
      <div class="cart-item__price">
        <span class="item-total-price">${formatPrice(totalItemPrice)}</span>
        ${item.quantity > 1 ? `<span class="item-unit-price">${formatPrice(item.price)} / шт.</span>` : ''}
      </div>
      <button class="cart-item__remove" aria-label="Удалить товар">
        <img src="${ASSET_TRASH_SVG}" alt="Удалить">
      </button>
    </div>
  `;
}

window.createCategoryCardHTML = createCategoryCardHTML;
window.createProductCardHTML = createProductCardHTML;
window.createCartItemHTML = createCartItemHTML;
// Экспортируем пути для использования в других модулях, если нужно
window.IMAGE_PLACEHOLDERS = {
  CATEGORY: IMAGE_PLACEHOLDER_CATEGORY,
  PRODUCT: IMAGE_PLACEHOLDER_PRODUCT,
  AVATAR_DEFAULT: ASSET_AVATAR_DEFAULT
};
window.ASSET_PATHS = {
  HEART_SVG: ASSET_HEART_SVG,
  HEART_FILLED_SVG: ASSET_HEART_FILLED_SVG,
  // ... другие ассеты
};
