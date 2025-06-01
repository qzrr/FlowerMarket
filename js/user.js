// js/auth.js
(function () {
  let allUsersCache = []; // Кэш пользователей с "сервера" (users.json)

  async function loadUsersFromServer() {
    if (allUsersCache.length > 0) return allUsersCache;
    try {
      allUsersCache = await API.getUsers(); // Используем API.js
      return allUsersCache;
    } catch (error) {
      console.error('Ошибка загрузки пользователей с сервера:', error);
      showNotification('Не удалось загрузить данные пользователей. Функционал входа/регистрации может быть ограничен.', true);
      return [];
    }
  }

  function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  }

  function updateAuthUI(user) {
    const userIcon = document.querySelector('.header__action-btn[aria-label="Аккаунт"]');
    if (userIcon) {
      userIcon.classList.toggle('logged-in', !!user);
      userIcon.title = user ? `Профиль: ${user.fullname}` : 'Войти или зарегистрироваться';
    }

    const isUserPage = window.location.pathname.includes('user.html') || window.location.pathname.includes('profile.html');
    if (isUserPage) {
      const userNameDisplay = document.getElementById('user-profile-name');
      const userAvatarDisplay = document.getElementById('user-profile-avatar');
      const userTabsContent = document.querySelector('.user-tabs-content');
      const userSidebar = document.querySelector('.user-sidebar');


      if (user) { // Пользователь авторизован
        if (userNameDisplay) userNameDisplay.textContent = user.fullname;
        if (userAvatarDisplay && user.avatar) userAvatarDisplay.src = user.avatar;
        else if (userAvatarDisplay) userAvatarDisplay.src = window.IMAGE_PLACEHOLDERS.AVATAR_DEFAULT;

        hideAuthForms();
        if (userTabsContent) userTabsContent.style.display = ''; // Показываем контент вкладок
        if (userSidebar) userSidebar.style.display = ''; // Показываем сайдбар

        // Инициализация страницы пользователя (вкладки, данные форм и т.д.)
        if (typeof window.UserPage !== 'undefined' && typeof window.UserPage.initialize === 'function') {
          window.UserPage.initialize(user);
        }
      } else { // Пользователь НЕ авторизован
        if (userNameDisplay) userNameDisplay.textContent = 'Гость';
        if (userAvatarDisplay) userAvatarDisplay.src = window.IMAGE_PLACEHOLDERS.AVATAR_DEFAULT;

        if (userTabsContent) userTabsContent.style.display = 'none'; // Скрываем контент вкладок
        if (userSidebar) userSidebar.style.display = 'none'; // Скрываем сайдбар
        showLoginForm();
      }
    }
  }

  function showLoginForm() {
    const userPageContent = document.querySelector('.user-page__content');
    if (!userPageContent && (window.location.pathname.includes('user.html') || window.location.pathname.includes('profile.html'))) return;

    hideAuthForms(); // Сначала скрыть все формы
    let loginFormWrapper = document.getElementById('login-form-wrapper');
    if (!loginFormWrapper && userPageContent) {
      loginFormWrapper = createAuthFormHTML('login');
      userPageContent.appendChild(loginFormWrapper);
      attachFormListeners('login');
    } else if (loginFormWrapper) {
      loginFormWrapper.style.display = 'block';
    }
  }

  function showRegisterForm() {
    const userPageContent = document.querySelector('.user-page__content');
    if (!userPageContent && (window.location.pathname.includes('user.html') || window.location.pathname.includes('profile.html'))) return;

    hideAuthForms(); // Сначала скрыть все формы
    let registerFormWrapper = document.getElementById('register-form-wrapper');
    if (!registerFormWrapper && userPageContent) {
      registerFormWrapper = createAuthFormHTML('register');
      userPageContent.appendChild(registerFormWrapper);
      attachFormListeners('register');
    } else if (registerFormWrapper) {
      registerFormWrapper.style.display = 'block';
    }
  }

  function hideAuthForms() {
    const loginFormWrapper = document.getElementById('login-form-wrapper');
    const registerFormWrapper = document.getElementById('register-form-wrapper');
    if (loginFormWrapper) loginFormWrapper.style.display = 'none';
    if (registerFormWrapper) registerFormWrapper.style.display = 'none';
  }

  function createAuthFormHTML(type) {
    const formWrapper = document.createElement('div');
    formWrapper.id = `${type}-form-wrapper`;
    formWrapper.className = 'auth-form-container'; // Общий класс для стилизации

    const isLogin = type === 'login';
    const title = isLogin ? 'Вход в аккаунт' : 'Регистрация';
    const submitButtonText = isLogin ? 'Войти' : 'Зарегистрироваться';
    const switchLinkText = isLogin ? 'Нет аккаунта? <a href="#" data-auth-switch="register">Зарегистрироваться</a>'
      : 'Уже есть аккаунт? <a href="#" data-auth-switch="login">Войти</a>';

    let formFields = `
      <div class="form-group">
        <label for="${type}-email">Email</label>
        <input type="email" id="${type}-email" name="email" class="form-input" required placeholder="your@email.com">
      </div>
      <div class="form-group">
        <label for="${type}-password">Пароль ${!isLogin ? '(мин. 6 символов)' : ''}</label>
        <input type="password" id="${type}-password" name="password" class="form-input" required ${!isLogin ? 'minlength="6"' : ''}>
      </div>
    `;

    if (!isLogin) { // Дополнительные поля для регистрации
      formFields = `
        <div class="form-group">
          <label for="${type}-fullname">Полное имя</label>
          <input type="text" id="${type}-fullname" name="fullname" class="form-input" required placeholder="Иван Иванов">
        </div>
      ` + formFields + `
        <div class="form-group">
          <label for="${type}-confirm-password">Повторите пароль</label>
          <input type="password" id="${type}-confirm-password" name="confirmPassword" class="form-input" required>
        </div>
      `;
    }

    formWrapper.innerHTML = `
      <div class="auth-form">
        <h2>${title}</h2>
        <form id="${type}-form-actual">
          ${formFields}
          <div class="form-error" id="${type}-error-message"></div>
          <button type="submit" class="btn btn-primary btn-block">${submitButtonText}</button>
        </form>
        <p class="auth-switch">${switchLinkText}</p>
      </div>
    `;
    return formWrapper;
  }

  function attachFormListeners(type) {
    const form = document.getElementById(`${type}-form-actual`);
    if (form) {
      form.addEventListener('submit', type === 'login' ? handleLoginSubmit : handleRegisterFormSubmit);
    }
    const switchLink = document.querySelector(`#${type}-form-wrapper [data-auth-switch]`);
    if (switchLink) {
      switchLink.addEventListener('click', (e) => {
        e.preventDefault();
        const switchTo = e.target.dataset.authSwitch;
        if (switchTo === 'register') showRegisterForm();
        else showLoginForm();
      });
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const errorMsgEl = document.getElementById('login-error-message');
    if (errorMsgEl) errorMsgEl.textContent = '';

    if (!email || !password) {
      if (errorMsgEl) errorMsgEl.textContent = 'Пожалуйста, заполните все поля.';
      return;
    }

    const users = await loadUsersFromServer();
    const user = users.find(u => u.email === email && u.password === password); // ВНИМАНИЕ: Простая проверка пароля!

    if (user) {
      const userDataToStore = {...user};
      delete userDataToStore.password; // Никогда не храните пароль в localStorage
      localStorage.setItem('currentUser', JSON.stringify(userDataToStore));
      updateAuthUI(userDataToStore); // Обновит UI, скроет формы, покажет контент ЛК
      showNotification('Вы успешно вошли!');
    } else {
      if (errorMsgEl) errorMsgEl.textContent = 'Неверный email или пароль.';
    }
  }

  async function handleRegisterFormSubmit(e) {
    e.preventDefault();
    const fullname = document.getElementById('register-fullname').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorMsgEl = document.getElementById('register-error-message');
    if (errorMsgEl) errorMsgEl.textContent = '';

    if (!fullname || !email || !password || !confirmPassword) {
      if (errorMsgEl) errorMsgEl.textContent = 'Пожалуйста, заполните все обязательные поля.';
      return;
    }
    if (password !== confirmPassword) {
      if (errorMsgEl) errorMsgEl.textContent = 'Пароли не совпадают.';
      return;
    }
    if (password.length < 6) {
      if (errorMsgEl) errorMsgEl.textContent = 'Пароль должен быть не менее 6 символов.';
      return;
    }

    const users = await loadUsersFromServer();
    if (users.some(u => u.email === email)) {
      if (errorMsgEl) errorMsgEl.textContent = 'Пользователь с таким email уже существует.';
      return;
    }

    // Демо-регистрация:
    // В реальном приложении здесь был бы POST запрос к API для регистрации нового пользователя.
    // Сервер бы добавил пользователя в users.json (или реальную БД) и вернул бы данные пользователя (или токен).
    const newUser = {
      id: String(Date.now()), // Простое ID для демо
      fullname,
      email,
      // password: password, // НЕ храним пароль так, если бы это была реальная регистрация. Хэшировать на сервере!
      avatar: window.IMAGE_PLACEHOLDERS.AVATAR_DEFAULT,
      favorites: [], orders: [], addresses: [],
      settings: {emailNotifications: true, smsNotifications: false}
    };

    console.warn("ДЕМО-РЕГИСТРАЦИЯ: Новый пользователь НЕ сохраняется на сервере (в users.json).", newUser);
    // Для демо, чтобы можно было сразу залогиниться (пароль не хэширован):
    // allUsersCache.push({ ...newUser, password: password });
    // Это добавит пользователя в локальный кэш, но не в файл users.json

    // Сразу "логиним" нового пользователя для демо
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    updateAuthUI(newUser); // Обновит UI, скроет формы, покажет контент ЛК
    showNotification('Регистрация успешна! Вы вошли в аккаунт.');
  }

  function handleLogout() {
    localStorage.removeItem('currentUser');
    // allUsersCache = []; // Можно сбросить кэш, чтобы при следующем входе он загрузился заново
    updateAuthUI(null); // Обновит UI, покажет формы входа
    showNotification('Вы вышли из аккаунта.');
    // Если мы на странице профиля, то формы входа/регистрации уже должны быть показаны через updateAuthUI
  }

  function initAuthListeners() {
    const userIconBtn = document.querySelector('.header__action-btn[aria-label="Аккаунт"]');
    if (userIconBtn) {
      userIconBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetUserPage = 'user.html'; // или profile.html
        if (!window.location.pathname.endsWith(targetUserPage)) {
          window.location.href = targetUserPage;
        } else {
          // Если уже на странице профиля, и не авторизован, auth.js должен был показать формы.
          // Если авторизован, ничего не делаем.
          if (!getCurrentUser()) {
            showLoginForm(); // Убедимся, что форма логина показана
          }
        }
      });
    }
    // Кнопка выхода из аккаунта обрабатывается в user.js, так как она находится на странице профиля.
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await loadUsersFromServer(); // Предзагружаем пользователей
    updateAuthUI(getCurrentUser()); // Первичная настройка UI в зависимости от статуса авторизации
    initAuthListeners();
  });

  window.Auth = {
    getCurrentUser,
    isLoggedIn: () => !!getCurrentUser(),
    handleLogout, // Экспортируем для использования в user.js
    updateUI: updateAuthUI // Для возможного принудительного обновления UI извне
  };
})();
