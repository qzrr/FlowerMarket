// data/db.js (Серверный)
const fs = require("fs").promises;
const path = require("path");

const FLOWERS_DB_PATH = path.join(__dirname, "flowersData.json");
const USERS_DB_PATH = path.join(__dirname, "users.json");
const CATEGORIES_DB_PATH = path.join(__dirname, "categories.json");

let flowersCache = null;
let usersCache = null;
let categoriesCache = null;

let lastFlowersLoadTime = 0;
let lastUsersLoadTime = 0;
let lastCategoriesLoadTime = 0;

const CACHE_TTL = 60000; // Время жизни кэша в миллисекундах (1 минута)

async function loadFlowersDb(forceRefresh = false) {
  const now = Date.now();
  // Обновляем кэш, если он не существует, истек TTL или запрошено принудительное обновление
  if (!flowersCache || forceRefresh || now - lastFlowersLoadTime > CACHE_TTL) {
    try {
      const rawData = await fs.readFile(FLOWERS_DB_PATH, "utf-8");
      const parsedData = JSON.parse(rawData);

      // Проверяем структуру данных и создаем правильную структуру, если необходимо
      flowersCache = {
        products: Array.isArray(parsedData)
          ? parsedData
          : parsedData.products || [],
        categories: parsedData.categories || [],
        promos: parsedData.promos || [],
      };

      // Дополнительная обработка дат, если нужно
      if (flowersCache.promos) {
        flowersCache.promos.forEach((promo) => {
          if (promo.expiryDate)
            promo.expiryDateObj = new Date(promo.expiryDate);
        });
      }

      lastFlowersLoadTime = now;
      console.log("Данные товаров и категорий успешно загружены");
    } catch (error) {
      console.error("Ошибка загрузки flowersData.json:", error);
      // Если кэш уже существует, используем его даже при ошибке загрузки
      if (!flowersCache) {
        flowersCache = { products: [], categories: [], promos: [] }; // Базовая структура при ошибке
      }
    }
  }
  return flowersCache;
}
async function loadCategoriesDb(forceRefresh = false) {
  const now = Date.now();
  if (
    !categoriesCache ||
    forceRefresh ||
    now - lastCategoriesLoadTime > CACHE_TTL
  ) {
    try {
      const rawData = await fs.readFile(CATEGORIES_DB_PATH, "utf-8");
      categoriesCache = JSON.parse(rawData); // Предполагаем, что categoriesData.json - это массив
      if (!Array.isArray(categoriesCache)) {
        console.warn(
          "categoriesData.json не является массивом! Устанавливаю пустой массив."
        );
        categoriesCache = [];
      }
      lastCategoriesLoadTime = now;
      console.log("Данные категорий успешно загружены из categoriesData.json");
    } catch (error) {
      console.error("Ошибка загрузки categoriesData.json:", error);
      if (!categoriesCache) {
        categoriesCache = [];
      }
    }
  }
  return categoriesCache;
}
async function loadUsersDb(forceRefresh = false) {
  const now = Date.now();
  // Обновляем кэш, если он не существует, истек TTL или запрошено принудительное обновление
  if (!usersCache || forceRefresh || now - lastUsersLoadTime > CACHE_TTL) {
    try {
      const rawData = await fs.readFile(USERS_DB_PATH, "utf-8");
      usersCache = JSON.parse(rawData);
      lastUsersLoadTime = now;
      console.log("Данные пользователей успешно загружены");
    } catch (error) {
      console.error("Ошибка загрузки users.json:", error);
      // Если кэш уже существует, используем его даже при ошибке загрузки
      if (!usersCache) {
        usersCache = [];
      }
    }
  }
  return usersCache;
}

class Database {
  // Метод для принудительного обновления кэша
  static async refreshCache() {
    try {
      await loadFlowersDb(true);
      await loadCategoriesDb(true);
      await loadUsersDb(true);
      return true;
    } catch (error) {
      console.error("Ошибка при обновлении кэша:", error);
      return false;
    }
  }

  static async getProducts(forceRefresh = false) {
    const db = await loadFlowersDb(forceRefresh);
    return db.products || [];
  }

  static async getProductById(id, forceRefresh = false) {
    const db = await loadFlowersDb(forceRefresh);
    // Обработка разных типов id (строка или число)
    const productId = isNaN(parseInt(id, 10)) ? id : parseInt(id, 10);
    return (db.products || []).find((p) => p.id === productId);
  }

  static async getProductsByCategory(categoryIdentifier, forceRefresh = false) {
    const productsBb = await loadFlowersDb(forceRefresh);
    const categories = await loadCategoriesDb(forceRefresh);

    if (!categoryIdentifier) {
      console.error("Ошибка: categoryIdentifier не указан");
      return [];
    }

    const lowerIdentifier = String(categoryIdentifier).toLowerCase();

    // Сначала проверяем по id категории
    if (!isNaN(parseInt(categoryIdentifier, 10))) {
      const categoryId = parseInt(categoryIdentifier, 10);
      targetCategory = categories.find((c) => c.id === categoryId);
    } else {
      targetCategory = categories.find(
        (c) =>
          (c.slug && c.slug.toLowerCase() === lowerIdentifier) ||
          (c.name && c.name.toLowerCase() === lowerIdentifier)
      );
    }

    if (!targetCategory) {
      console.warn(
        `Категория с идентификатором "${categoryIdentifier}" не найдена.`
      );
      return [];
    }

    return (productsDb.products || []).filter((p) => {
      return (
        (p.categoryId && p.categoryId === targetCategory.id) ||
        (p.categorySlug &&
          targetCategory.slug &&
          p.categorySlug.toLowerCase() === targetCategory.slug.toLowerCase())
      );
    });
  }

  static async getPopularProducts(forceRefresh = false) {
    const db = await loadFlowersDb(forceRefresh);
    return (db.products || []).filter((p) => p.popular === true);
  }

  static async getCategories(forceRefresh = false) {
    const categories = await loadCategoriesDb(forceRefresh);
    console.log("[Database.getCategories] Загруженные категории:", categories);
    return categories || [];
  }

  static async getPromos(forceRefresh = false) {
    const db = await loadFlowersDb(forceRefresh);
    const now = new Date();
    return (db.promos || []).filter(
      (promo) => promo.expiryDateObj && promo.expiryDateObj > now
    );
  }

  static async getReviews(forceRefresh = false) {
    // Агрегирует все отзывы из продуктов
    const db = await loadFlowersDb(forceRefresh);
    let allReviews = [];
    (db.products || []).forEach((product) => {
      if (product.reviews && Array.isArray(product.reviews)) {
        product.reviews.forEach((review) => {
          const reviewCopy = { ...review, productId: product.id }; // Гарантируем productId
          if (reviewCopy.date) {
            // Преобразуем дату для сортировки
            const parts = String(reviewCopy.date).split(".");
            if (parts.length === 3 && parts[0].length === 2) {
              // DD.MM.YYYY
              reviewCopy.dateObj = new Date(
                `${parts[2]}-${parts[1]}-${parts[0]}`
              );
            } else {
              // YYYY-MM-DD или другой формат
              reviewCopy.dateObj = new Date(reviewCopy.date);
            }
          }
          allReviews.push(reviewCopy);
        });
      }
    });
    return allReviews.sort((a, b) => (b.dateObj || 0) - (a.dateObj || 0));
  }

  static async getReviewsByProductId(productId, forceRefresh = false) {
    const numProductId = parseInt(productId, 10);
    const product = await this.getProductById(numProductId, forceRefresh); // Используем уже существующий метод
    if (product && product.reviews && Array.isArray(product.reviews)) {
      return product.reviews
        .map((review) => {
          const reviewCopy = { ...review };
          if (reviewCopy.date) {
            const parts = String(reviewCopy.date).split(".");
            if (parts.length === 3 && parts[0].length === 2) {
              reviewCopy.dateObj = new Date(
                `${parts[2]}-${parts[1]}-${parts[0]}`
              );
            } else {
              reviewCopy.dateObj = new Date(reviewCopy.date);
            }
          }
          return reviewCopy;
        })
        .sort((a, b) => (b.dateObj || 0) - (a.dateObj || 0));
    }
    return [];
  }

  static async searchProducts(query, forceRefresh = false) {
    const db = await loadFlowersDb(forceRefresh);
    if (!query || typeof query !== "string") {
      return db.products || [];
    }

    const searchQuery = query.toLowerCase();
    if (!db.products) return [];

    return db.products.filter(
      (product) =>
        Object.entries(product).some(([key, value]) => {
          // Исключаем массивы и объекты из прямого поиска
          if (typeof value === "string" || typeof value === "number") {
            return String(value).toLowerCase().includes(searchQuery);
          }
          return false;
        }) ||
        // Отдельно проверяем массивы composition
        (product.composition &&
          Array.isArray(product.composition) &&
          product.composition.some((item) =>
            String(item).toLowerCase().includes(searchQuery)
          ))
    );
  }

  static async getUsers(forceRefresh = false) {
    return await loadUsersDb(forceRefresh);
  }
}

module.exports = Database;
