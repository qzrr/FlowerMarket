// ./data/db.js
const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, 'products.json');
let databaseCache = null;

async function loadDb() {
  if (databaseCache) {
    return databaseCache;
  }
  try {
    const rawData = await fs.readFile(DB_PATH, 'utf-8');
    databaseCache = JSON.parse(rawData);
    // Преобразуем строки дат в объекты Date для удобства сравнения там, где это нужно
    if (databaseCache.promos) {
      databaseCache.promos.forEach(promo => {
        if (promo.expiryDate) {
          promo.expiryDateObj = new Date(promo.expiryDate);
        }
      });
    }
    if (databaseCache.reviews) {
      databaseCache.reviews.forEach(review => {
        if (review.date) {
          // "DD.MM.YYYY" -> "YYYY-MM-DD" для корректного парсинга Date
          const parts = review.date.split('.');
          if (parts.length === 3) {
            review.dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          } else {
            review.dateObj = new Date(review.date); // Попытка парсинга как есть
          }
        }
      });
    }
    return databaseCache;
  } catch (error) {
    console.error("Не удалось загрузить или распарсить JSON БД:", error);
    return { products: [], categories: [], promos: [], reviews: [] };
  }
}

// Вспомогательная функция для парсинга даты "DD.MM.YYYY"
function parseCustomDate(dateStr) { // "DD.MM.YYYY"
  const parts = dateStr.split('.');
  if (parts.length === 3) {
    // Месяцы в JS Date от 0 до 11
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return new Date(dateStr); // Fallback
}


class Database {
  static async getProducts() {
    const db = await loadDb();
    return db.products || [];
  }

  static async getProductById(id) {
    const db = await loadDb();
    const productId = parseInt(id, 10);
    return (db.products || []).find(p => p.id === productId);
  }

  static async getProductsByCategory(categorySlug) {
    const db = await loadDb();
    const lowerCategorySlug = categorySlug.toLowerCase();
    return (db.products || []).filter(p => p.category?.toLowerCase() === lowerCategorySlug);
  }

  static async getPopularProducts() {
    const db = await loadDb();
    return (db.products || []).filter(p => p.popular === true);
  }

  static async getCategories() {
    const db = await loadDb();
    return db.categories || [];
  }

  static async getPromos() {
    const db = await loadDb();
    const now = new Date();
    return (db.promos || []).filter(promo => promo.expiryDateObj && promo.expiryDateObj > now);
  }

  static async getReviews() {
    const db = await loadDb();
    // Сортировка по дате (от новых к старым)
    return (db.reviews || []).sort((a, b) => (b.dateObj || 0) - (a.dateObj || 0));
  }

  static async getReviewsByProductId(productId) {
    const db = await loadDb();
    const prodId = parseInt(productId, 10);
    const productReviews = (db.reviews || []).filter(r => r.productId === prodId);
    // Сортировка по дате (от новых к старым)
    return productReviews.sort((a, b) => (b.dateObj || 0) - (a.dateObj || 0));
  }

  // Метод для поиска, который будет использоваться в server.js
  static async searchProducts(query) {
    const db = await loadDb();
    const searchQuery = query.toLowerCase();
    if (!db.products) return [];

    return db.products.filter(product => {
      const nameMatch = product.name?.toLowerCase().includes(searchQuery);
      const descriptionMatch = product.description?.toLowerCase().includes(searchQuery);
      const categoryMatch = product.categoryName?.toLowerCase().includes(searchQuery);
      // Можно добавить поиск по другим полям, например, по составу:
      // const compositionMatch = product.composition?.some(item => item.toLowerCase().includes(searchQuery));
      return nameMatch || descriptionMatch || categoryMatch;
    });
  }
}

module.exports = Database;
