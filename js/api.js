// js/api.js
class API {
  static BASE_URL = "/api"; // Относительный путь к вашему API

  static async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, options);
      if (!response.ok) {
        let errorData = {message: `HTTP ${response.status} - ${response.statusText}`};
        try {
          const jsonError = await response.json();
          if (jsonError && jsonError.error) errorData.message = jsonError.error;
        } catch (e) { /* Ошибка парсинга JSON, используем response.statusText */
        }
        console.error(`API Error ${response.status} for ${endpoint}:`, errorData.message);
        throw new Error(errorData.message);
      }
      if (response.status === 204) return {}; // No Content
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) return await response.json();
      return await response.text();
    } catch (error) {
      console.error(`Ошибка запроса к ${this.BASE_URL}${endpoint}:`, error.message);
      // Глобальное уведомление об ошибке сети
      if (typeof window.showNotification === 'function' && error.message.toLowerCase().includes('failed to fetch')) {
        window.showNotification('Ошибка сети. Проверьте подключение к интернету или доступность сервера.', true);
      }
      throw error;
    }
  }

  static getProducts() {
    return this.request("/products");
  }

  static getProductById(id) {
    return this.request(`/products/${id}`);
  }

  static getProductsByCategory(category) {
    return this.request(`/products/category/${encodeURIComponent(category)}`);
  }

  static getPopularProducts() {
    return this.request(`/products/popular`);
  }

  static getCategories() {
    return this.request("/categories");
  }

  static getPromos() {
    return this.request("/promos");
  }

  static getReviews() {
    return this.request("/reviews");
  } // Все отзывы (агрегированные сервером)
  static getReviewsByProductId(productId) {
    return this.request(`/reviews/product/${productId}`);
  } // Отзывы для конкретного товара
  static searchProducts(query) {
    return this.request(`/products/search?q=${encodeURIComponent(query)}`);
  }

  static getUsers() {
    return this.request("/users");
  } // Для auth.js
}

window.API = API;
