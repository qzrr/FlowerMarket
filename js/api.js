// js/api.js
class API {
  static BASE_URL = "/api"; // Относительный путь к вашему API
  static CACHE_TTL = 60000; // Время жизни кэша в миллисекундах (1 минута)
  static cache = new Map(); // Кэш для хранения результатов запросов
  static lastCacheTime = new Map(); // Время последнего обновления кэша для каждого эндпоинта

  static async request(endpoint, options = {}, useCache = true) {
    const cacheKey = `${endpoint}${options.method || 'GET'}${JSON.stringify(options.body || '')}`;
    const now = Date.now();

    // Проверяем кэш, если разрешено использование кэша и это GET-запрос
    if (useCache && (!options.method || options.method === 'GET')) {
      const cachedData = this.cache.get(cacheKey);
      const lastTime = this.lastCacheTime.get(cacheKey) || 0;

      // Используем кэшированные данные, если они есть и не устарели
      if (cachedData && (now - lastTime < this.CACHE_TTL)) {
        console.log(`Используем кэшированные данные для ${endpoint}`);
        return cachedData;
      }
    }

    // Максимальное количество попыток запроса
    const maxRetries = 2;
    let retries = 0;
    let lastError;

    while (retries <= maxRetries) {
      try {
        const response = await fetch(`${this.BASE_URL}${endpoint}`, options);

        if (!response.ok) {
          let errorData = {message: `HTTP ${response.status} - ${response.statusText}`};
          try {
            const jsonError = await response.json();
            if (jsonError && jsonError.error) errorData.message = jsonError.error;
          } catch (e) { /* Ошибка парсинга JSON, используем response.statusText */ }

          console.error(`API Error ${response.status} for ${endpoint}:`, errorData.message);

          // Если это ошибка сервера (5xx), пробуем повторить запрос
          if (response.status >= 500 && retries < maxRetries) {
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Увеличиваем задержку с каждой попыткой
            continue;
          }

          throw new Error(errorData.message);
        }

        if (response.status === 204) return {}; // No Content

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        // Сохраняем результат в кэш для GET-запросов
        if (useCache && (!options.method || options.method === 'GET')) {
          this.cache.set(cacheKey, data);
          this.lastCacheTime.set(cacheKey, now);
        }

        return data;
      } catch (error) {
        lastError = error;
        console.error(`Ошибка запроса к ${this.BASE_URL}${endpoint} (попытка ${retries + 1}/${maxRetries + 1}):`, error.message);

        // Если это ошибка сети, пробуем повторить запрос
        if (error.message.toLowerCase().includes('failed to fetch') && retries < maxRetries) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          continue;
        }

        // Глобальное уведомление об ошибке сети
        if (typeof window.showNotification === 'function' && error.message.toLowerCase().includes('failed to fetch')) {
          window.showNotification('Ошибка сети. Проверьте подключение к интернету или доступность сервера.', true);
        }

        throw error;
      }
    }

    throw lastError;
  }

  // Метод для очистки всего кэша или конкретного эндпоинта
  static clearCache(endpoint = null) {
    if (endpoint) {
      // Очищаем кэш только для указанного эндпоинта
      for (const key of this.cache.keys()) {
        if (key.startsWith(endpoint)) {
          this.cache.delete(key);
          this.lastCacheTime.delete(key);
        }
      }
    } else {
      // Очищаем весь кэш
      this.cache.clear();
      this.lastCacheTime.clear();
    }
    console.log(`Кэш ${endpoint ? `для ${endpoint}` : 'полностью'} очищен`);
  }

  static getProducts(useCache = true) {
    return this.request("/products", {}, useCache);
  }

  static getProductById(id, useCache = true) {
    return this.request(`/products/${id}`, {}, useCache);
  }

  static getProductsByCategory(category, useCache = true) {
    return this.request(`/products/category/${encodeURIComponent(category)}`, {}, useCache);
  }

  static getPopularProducts(useCache = true) {
    return this.request(`/products/popular`, {}, useCache);
  }

  static getCategories(useCache = true) {
    return this.request("/categories", {}, useCache);
  }

  static getPromos(useCache = true) {
    return this.request("/promos", {}, useCache);
  }

  static getReviews(useCache = true) {
    return this.request("/reviews", {}, useCache);
  } // Все отзывы (агрегированные сервером)

  static getReviewsByProductId(productId, useCache = true) {
    return this.request(`/reviews/product/${productId}`, {}, useCache);
  } // Отзывы для конкретного товара

  static searchProducts(query, useCache = false) { // Для поиска лучше не использовать кэш по умолчанию
    return this.request(`/products/search?q=${encodeURIComponent(query)}`, {}, useCache);
  }

  static getUsers(useCache = true) {
    return this.request("/users", {}, useCache);
  } // Для auth.js
}

window.API = API;