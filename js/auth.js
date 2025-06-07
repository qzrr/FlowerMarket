// js/auth.js (ФИНАЛЬНАЯ ВЕРСИЯ)
(function () {
  let allUsersCache = [];

  // Загружаем пользователей с сервера (если нужно)
  async function loadUsersFromServer() {
    if (allUsersCache.length > 0) return allUsersCache;
    try {
      // Предполагается, что у вас есть API.getUsers()
      allUsersCache = await API.getUsers();
      return allUsersCache;
    } catch (error) {
      console.error("Ошибка загрузки пользователей с сервера:", error);
      // showNotification("Не удалось загрузить данные пользователей.", true); // Если есть такая функция
      return [];
    }
  }

  // Получаем текущего пользователя из localStorage
  function getCurrentUser() {
    const userData = localStorage.getItem("currentUser");
    return userData ? JSON.parse(userData) : null;
  }

  // Обновляем иконку в шапке сайта
  function updateAuthUI(user) {
    const userIcon = document.querySelector(
      '.header__action-btn[aria-label="Аккаунт"]'
    );
    if (userIcon) {
      userIcon.classList.toggle("logged-in", !!user);
      userIcon.title = user
        ? `Профиль: ${user.fullname || user.email}`
        : "Войти или зарегистрироваться";
    }
  }

  // Функция для полной очистки всех форм авторизации
  function clearAllAuthForms() {
    const overlay = document.querySelector(".auth-overlay");
    if (overlay) {
      overlay.remove();
    }
    document.body.classList.remove("auth-open");
  }

  // Главная функция для создания модальных окон
  function createAuthForm(type, parentElement, onAuthSuccess) {
    clearAllAuthForms(); // Сначала очищаем все существующие формы

    document.body.classList.add("auth-open");
    const overlay = document.createElement("div");
    overlay.className = "auth-overlay";

    const isLogin = type === "login";

    overlay.innerHTML = `
      <div class="auth-form-container">
        <div class="auth-form-wrapper">
          <button class="auth-close-btn" aria-label="Закрыть форму">×</button>
          <div class="auth-form">
            <h2>${isLogin ? "Вход в аккаунт" : "Регистрация"}</h2>
            <form id="${type}-form-actual">
              ${
                !isLogin
                  ? `<div class="form-group"><label for="${type}-fullname">Полное имя</label><input type="text" id="${type}-fullname" name="fullname" required></div>`
                  : ""
              }
              <div class="form-group"><label for="${type}-email">Email</label><input type="email" id="${type}-email" name="email" required></div>
              <div class="form-group"><label for="${type}-password">Пароль</label><input type="password" id="${type}-password" name="password" required></div>
              ${
                !isLogin
                  ? `<div class="form-group"><label for="${type}-confirm-password">Повторите пароль</label><input type="password" id="${type}-confirm-password" name="confirmPassword" required></div>`
                  : ""
              }
              <div class="form-error" id="${type}-error-message"></div>
              <button type="submit" class="btn btn-primary btn-block">${
                isLogin ? "Войти" : "Зарегистрироваться"
              }</button>
            </form>
            <p class="auth-switch">${
              isLogin
                ? 'Нет аккаунта? <a href="#" data-auth-switch="register">Зарегистрироваться</a>'
                : 'Уже есть аккаунт? <a href="#" data-auth-switch="login">Войти</a>'
            }</p>
          </div>
        </div>
      </div>
    `;
    parentElement.appendChild(overlay);

    const closeBtn = overlay.querySelector(".auth-close-btn");
    const switchLink = overlay.querySelector("[data-auth-switch]");
    const form = overlay.querySelector("form");

    closeBtn.addEventListener("click", clearAllAuthForms);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) clearAllAuthForms();
    });
    switchLink.addEventListener("click", (e) => {
      e.preventDefault();
      createAuthForm(e.target.dataset.authSwitch, parentElement, onAuthSuccess);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const success = isLogin
        ? await handleLoginSubmit(e.target)
        : await handleRegisterFormSubmit(e.target);
      if (success) {
        clearAllAuthForms();
        if (typeof onAuthSuccess === "function") {
          onAuthSuccess(getCurrentUser());
        }
      }
    });
  }

  // Логика входа
  async function handleLoginSubmit(form) {
    const email = form.email.value;
    const password = form.password.value;
    const errorMsgEl = form.querySelector(".form-error");
    errorMsgEl.textContent = "";

    const users = await loadUsersFromServer();
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      const { password, ...userDataToStore } = user; // Убираем пароль перед сохранением
      localStorage.setItem("currentUser", JSON.stringify(userDataToStore));
      updateAuthUI(userDataToStore);
      // showNotification("Вы успешно вошли!");
      return true;
    } else {
      errorMsgEl.textContent = "Неверный email или пароль.";
      return false;
    }
  }

  // Логика регистрации (демо)
  async function handleRegisterFormSubmit(form) {
    const errorMsgEl = form.querySelector(".form-error");
    errorMsgEl.textContent = "";
    if (form.password.value !== form.confirmPassword.value) {
      errorMsgEl.textContent = "Пароли не совпадают.";
      return false;
    }
    // Здесь должна быть логика отправки на сервер, мы симулируем
    const newUser = { fullname: form.fullname.value, email: form.email.value };
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    updateAuthUI(newUser);
    // showNotification("Регистрация успешна!");
    return true;
  }

  // Логика выхода
  function handleLogout(onLogoutCallback) {
    localStorage.removeItem("currentUser");
    updateAuthUI(null);
    // showNotification("Вы вышли из аккаунта.");
    if (typeof onLogoutCallback === "function") {
      onLogoutCallback();
    }
  }

  // Запускается при загрузке любой страницы
  document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI(getCurrentUser());
    loadUsersFromServer();
  });

  // ЭКСПОРТ: Делаем функции доступными для других скриптов
  window.Auth = {
    getCurrentUser,
    handleLogout,
    showLoginForm: (parentElement, onAuthSuccess) =>
      createAuthForm("login", parentElement, onAuthSuccess),
    showRegisterForm: (parentElement, onAuthSuccess) =>
      createAuthForm("register", parentElement, onAuthSuccess),
    clearAllAuthForms,
  };
})();
