/**
 * API модуль для работы с базой данных цветочного магазина
 */

class API {
  static BASE_URL = "/api";

  static async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Ошибка запроса ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Получение всех продуктов
   * @returns {Promise<Array>} Массив продуктов
   */

  static getProducts() {
    return this.request("/products");
  }

  /**
   * Получение продукта по ID
   * @param {number} id ID продукта
   * @returns {Promise<Object>} Данные продукта
   */
  static async getProductById(id) {
    try {
      const response = await fetch(`${this.BASE_URL}/products/${id}`);
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Ошибка при получении продукта #${id}:`, error);
      throw error;
    }
  }

  /**
   * Получение продуктов по категории
   * @param {string} category Идентификатор категории
   * @returns {Promise<Array>} Массив продуктов данной категории
   */
  static async getProductsByCategory(category) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/products/category/${category}`
      );
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(
        `Ошибка при получении продуктов категории ${category}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Получение популярных продуктов
   * @returns {Promise<Array>} Массив популярных продуктов
   */
  static async getPopularProducts() {
    try {
      const response = await fetch(`${this.BASE_URL}/products/popular`);
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Ошибка при получении популярных продуктов:", error);
      throw error;
    }
  }

  /**
   * Получение категорий продуктов
   * @returns {Promise<Array>} Массив категорий
   */
  static async getCategories() {
    try {
      const response = await fetch(`${this.BASE_URL}/categories`);
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Ошибка при получении категорий:", error);

      //Для разработки: если API не работает, возвращаем моковые данные
      const mockCategories = [
        {
          id: "bouquets",
          name: "Букеты",
          image: "/categories/bouquets.jpg",
          count: 12,
          featured: true,
        },
        {
          id: "roses",
          name: "Розы",
          image: "/categories/roses.jpg",
          count: 8,
          featured: true,
        },
        {
          id: "plants",
          name: "Комнатные растения",
          image: "img/categories/plants.jpg",
          count: 10,
          featured: true,
        },
        {
          id: "gifts",
          name: "Подарки",
          image: "/categories/gifts.jpg",
          count: 6,
          featured: true,
        },
      ];

      return mockCategories;
    }
  }

  /**
   * Получение отзывов для продукта
   * @param {number} productId ID продукта
   * @returns {Promise<Array>} Массив отзывов
   */
  static async getReviewsForProduct(productId) {
    try {
      const response = await fetch(
        `${this.BASE_URL}/reviews/productId=${productId}`
      );
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(
        `Ошибка при получении отзывов для продукта #${productId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Отправка формы обратной связи
   * @param {Object} formData Данные формы
   * @returns {Promise<Object>} Результат отправки
   */
  static async submitContactForm(formData) {
    try {
      const response = await fetch(`${this.BASE_URL}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Ошибка при отправке формы:", error);
      throw error;
    }
  }

  /**
   * Проверка валидности промокода
   * @param {string} code Код промокода
   * @returns {Promise<Object>} Данные промокода
   */
  static async validatePromoCode(code) {
    try {
      const response = await fetch(`${this.BASE_URL}/promos/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Ошибка при проверке промокода ${code}:`, error);
      throw error;
    }
  }

  /**
   * Оформление заказа
   * @param {Object} orderData Данные заказа
   * @returns {Promise<Object>} Результат оформления
   */

  static submitOrder(orderData) {
    return this.request("/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
  }
}

// Экспортируем API для использования в других файлах
window.API = API;
