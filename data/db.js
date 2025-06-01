// data/db.js (Серверный)
const fs = require('fs').promises;
const path = require('path');

const FLOWERS_DB_PATH = path.join(__dirname, 'flowersData.json');
const USERS_DB_PATH = path.join(__dirname, 'users.json');
let flowersCache = null;
let usersCache = null;

async function loadFlowersDb() {
  if (flowersCache) return flowersCache;
  try {
    const rawData = await fs.readFile(FLOWERS_DB_PATH, 'utf-8');
    flowersCache = JSON.parse(rawData);
    // Дополнительная обработка дат, если нужно
    if (flowersCache.promos) {
      flowersCache.promos.forEach(promo => {
        if (promo.expiryDate) promo.expiryDateObj = new Date(promo.expiryDate);
      });
    }
    // Если отзывы вложены, они будут обработаны в getReviews/getReviewsByProductId
    return flowersCache;
  } catch (error) {
    console.error("Ошибка загрузки flowersData.json:", error);
    return { products: [], categories: [], promos: [] }; // Базовая структура при ошибке
  }
}

async function loadUsersDb() {
  if (usersCache) return usersCache;
  try {
    const rawData = await fs.readFile(USERS_DB_PATH, 'utf-8');
    usersCache = JSON.parse(rawData);
    return usersCache;
  } catch (error) {
    console.error("Ошибка загрузки users.json:", error);
    return [];
  }
}

class Database {
  static async getProducts() {
    const db = await loadFlowersDb();
    return db.products || [];
  }

  static async getProductById(id) {
    const db = await loadFlowersDb();
    const productId = parseInt(id, 10);
    return (db.products || []).find(p => p.id === productId);
  }

  static async getProductsByCategory(categoryIdentifier) {
    const db = await loadFlowersDb();
    const lowerIdentifier = categoryIdentifier.toLowerCase();
    return (db.products || []).filter(p =>
      (p.category && p.category.toLowerCase() === lowerIdentifier) ||
      (p.categoryName && p.categoryName.toLowerCase() === lowerIdentifier)
    );
  }

  static async getPopularProducts() {
    const db = await loadFlowersDb();
    return (db.products || []).filter(p => p.popular === true);
  }

  static async getCategories() {
    const db = await loadFlowersDb();
    return db.categories || [];
  }

  static async getPromos() {
    const db = await loadFlowersDb();
    const now = new Date();
    return (db.promos || []).filter(promo => promo.expiryDateObj && promo.expiryDateObj > now);
  }

  static async getReviews() { // Агрегирует все отзывы из продуктов
    const db = await loadFlowersDb();
    let allReviews = [];
    (db.products || []).forEach(product => {
      if (product.reviews && Array.isArray(product.reviews)) {
        product.reviews.forEach(review => {
          const reviewCopy = { ...review, productId: product.id }; // Гарантируем productId
          if (reviewCopy.date) { // Преобразуем дату для сортировки
            const parts = String(reviewCopy.date).split('.');
            if (parts.length === 3 && parts[0].length === 2) { // DD.MM.YYYY
              reviewCopy.dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            } else { // YYYY-MM-DD или другой формат
              reviewCopy.dateObj = new Date(reviewCopy.date);
            }
          }
          allReviews.push(reviewCopy);
        });
      }
    });
    return allReviews.sort((a, b) => (b.dateObj || 0) - (a.dateObj || 0));
  }

  static async getReviewsByProductId(productId) {
    const numProductId = parseInt(productId, 10);
    const product = await this.getProductById(numProductId); // Используем уже существующий метод
    if (product && product.reviews && Array.isArray(product.reviews)) {
      return product.reviews.map(review => {
        const reviewCopy = { ...review };
        if (reviewCopy.date) {
          const parts = String(reviewCopy.date).split('.');
          if (parts.length === 3 && parts[0].length === 2) {
            reviewCopy.dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            reviewCopy.dateObj = new Date(reviewCopy.date);
          }
        }
        return reviewCopy;
      }).sort((a, b) => (b.dateObj || 0) - (a.dateObj || 0));
    }
    return [];
  }

  static async searchProducts(query) {
    const db = await loadFlowersDb();
    const searchQuery = query.toLowerCase();
    if (!db.products) return [];
    return db.products.filter(product =>
      Object.values(product).some(value =>
        String(value).toLowerCase().includes(searchQuery)
      ) || (product.composition && product.composition.some(item => item.toLowerCase().includes(searchQuery)))
    );
  }

  static async getUsers() {
    return await loadUsersDb();
  }
}

module.exports = Database;
