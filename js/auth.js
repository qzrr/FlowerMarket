// js/auth.js
(function () {
  let allUsersCache = []; // Кэш пользователей с "сервера" (users.json)
  let lastCacheTime = 0;
  const CACHE_TTL = 60000; // Время жизни кэша в миллисекундах (1 минута)

  async function loadUsersFromServer(forceRefresh = false) {
    const now = Date.now();
    // Обновляем кэш, если он пуст, истек TTL или запрошено принудительное обновление
    if (allUsersCache.length === 0 || forceRefresh || (now - lastCacheTime > CACHE_TTL)) {
      try {
        // Используем параметр useCache=false для API.getUsers(), чтобы получить свежие данные
        allUsersCache = await API.getUsers(!forceRefresh);
        lastCacheTime = now;
        console.log("Данные пользователей успешно загружены");
        return allUsersCache;
      } catch (error) {
        console.error('Ошибка загрузки пользователей с сервера:', error);
        showNotification('Не удалось загрузить данные пользователей. Функционал входа/регистрации может быть ограничен.', true);
        // Если кэш уже существует, используем его даже при ошибке загрузки
        if (allUsersCache.length > 0) {
          return allUsersCache;
        }
        return [];
      }
    }
    return allUsersCache;
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
      const userNameEl = document.getElementById('user-profile-name'); // На странице профиля
      const userAvatarEl = document.getElementById('user-profile-avatar');
      if (userNameEl) userNameEl.textContent = user ? user.fullname : 'Гость';
      if (userAvatarEl && user && user.avatar) userAvatarEl.src = user.avatar;
      else if (userAvatarEl) userAvatarEl.src = window.IMAGE_PLACEHOLDERS.AVATAR_DEFAULT;

      toggleAuthFormsVisibility(!user);
      if (user && typeof window.UserPage !== 'undefined' && typeof window.UserPage.initialize === 'function') {
        window.UserPage.initialize(user);
      }
    }
  }

  function toggleAuthFormsVisibility(showAuthForms) {
    const userPageContent = document.querySelector('.user-page__content'); // Главный контейнер на user.html
    const loginFormWrapper = document.getElementById('login-form-wrapper'); // Обертка для формы логина
    const registerFormWrapper = document.getElementById('register-form-wrapper'); // Обертка для формы регистрации

    const userInterfaceElements = document.querySelectorAll('.user-sidebar, .user-tabs-content'); // Элементы, которые скрываем/показываем

    if (showAuthForms) {
      userInterfaceElements.forEach(el => el.style.display = 'none');
      if (registerFormWrapper) registerFormWrapper.style.display = 'none'; // Сначала только логин
      if (loginFormWrapper) loginFormWrapper.style.display = 'block';
      else if (userPageContent) createLoginForm(userPageContent);
    } else { // Пользователь авторизован
      if (loginFormWrapper) loginFormWrapper.style.display = 'none';
      if (registerFormWrapper) registerFormWrapper.style.display = 'none';
      userInterfaceElements.forEach(el => el.style.display = ''); // Восстанавливаем display
    }
  }

  function createAuthForm(type, parentElement) {
    const formId = `${type}-form-wrapper`;
    let formWrapper = document.getElementById(formId);
    if (formWrapper) {
      formWrapper.style.display = 'block';
      return;
    }

    formWrapper = document.createElement('div');
    formWrapper.id = formId;
    formWrapper.className = 'auth-form-container'; // Общий класс для стилизации

    const isLogin = type === 'login';
    formWrapper.innerHTML = `
      <div class="auth-form">
        <h2>${isLogin ? 'Вход в аккаунт' : 'Регистрация'}</h2>
        <form id="${type}-form-actual">
          ${!isLogin ? `
            <div class="form-group">
              <label for="${type}-fullname">Полное имя</label>
              <input type="text" id="${type}-fullname" name="fullname" required placeholder="Иван Иванов">
            </div>` : ''}
          <div class="form-group">
            <label for="${type}-email">Email</label>
            <input type="email" id="${type}-email" name="email" required placeholder="your@email.com">
          </div>
          <div class="form-group">
            <label for="${type}-password">Пароль ${!isLogin ? '(мин. 6 симв.)' : ''}</label>
            <input type="password" id="${type}-password" name="password" required ${!isLogin ? 'minlength="6"' : ''}>
          </div>
          ${!isLogin ? `
            <div class="form-group">
              <label for="${type}-confirm-password">Повторите пароль</label>
              <input type="password" id="${type}-confirm-password" name="confirmPassword" required>
            </div>` : ''}
          <div class="form-error" id="${type}-error-message"></div>
          <button type="submit" class="btn btn-primary btn-block">${isLogin ? 'Войти' : 'Зарегистрироваться'}</button>
        </form>
        <p class="auth-switch">
          ${isLogin ? 'Нет аккаунта? <a href="#" data-auth-switch="register">Зарегистрироваться</a>'
      : 'Уже есть аккаунт? <a href="#" data-auth-switch="login">Войти</a>'}
        </p>
      </div>
    `;
    parentElement.appendChild(formWrapper);
    document.getElementById(`${type}-form-actual`).addEventListener('submit', isLogin ? handleLoginSubmit : handleRegisterFormSubmit);
    formWrapper.querySelector('[data-auth-switch]').addEventListener('click', (e) => {
      e.preventDefault();
      formWrapper.style.display = 'none';
      createAuthForm(e.target.dataset.authSwitch, parentElement);
    });
  }

  const createLoginForm = (parentElement) => createAuthForm('login', parentElement);
  const createRegisterForm = (parentElement) => createAuthForm('register', parentElement);


  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorMsgEl = document.getElementById('login-error-message');
    if (errorMsgEl) errorMsgEl.textContent = '';

    const users = await loadUsersFromServer();
    const user = users.find(u => u.email === email && u.password === password); // Простая проверка пароля!

    if (user) {
      const userDataToStore = {...user};
      delete userDataToStore.password;
      localStorage.setItem('currentUser', JSON.stringify(userDataToStore));
      updateAuthUI(userDataToStore);
      showNotification('Вы успешно вошли!');
    } else {
      if (errorMsgEl) errorMsgEl.textContent = 'Неверный email или пароль.';
    }
  }

  async function handleRegisterFormSubmit(e) {
    e.preventDefault();
    const fullname = document.getElementById('register-fullname').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorMsgEl = document.getElementById('register-error-message');
    if (errorMsgEl) errorMsgEl.textContent = '';

    if (password !== confirmPassword) {
      if (errorMsgEl) errorMsgEl.textContent = 'Пароли не совпадают.';
      return;
    }
    if (password.length < 6) {
      if (errorMsgEl) errorMsgEl.textContent = 'Пароль слишком короткий.';
      return;
    }

    // Принудительно обновляем кэш пользователей перед проверкой
    const users = await loadUsersFromServer(true);
    if (users.some(u => u.email === email)) {
      if (errorMsgEl) errorMsgEl.textContent = 'Email уже занят.';
      return;
    }

    const newUser = {
      id: String(Date.now()), fullname, email, avatar: window.IMAGE_PLACEHOLDERS.AVATAR_DEFAULT,
      favorites: [], orders: [], addresses: [], settings: {emailNotifications: true, smsNotifications: false}
    };
    // В реальном мире: await API.registerUser({ fullname, email, password });
    // Для демо:
    console.warn("Демо-регистрация: новый пользователь не сохраняется на сервере.", newUser);
    // Добавляем в кэш с паролем для возможности логина в этой сессии
    allUsersCache.push({...newUser, password});
    lastCacheTime = Date.now(); // Обновляем время кэша

    localStorage.setItem('currentUser', JSON.stringify(newUser)); // Логиним сразу
    updateAuthUI(newUser);
    showNotification('Регистрация успешна!');
  }

  function handleLogout() {
    localStorage.removeItem('currentUser');
    allUsersCache = []; // Сброс кэша пользователей
    updateAuthUI(null);
    showNotification('Вы вышли из аккаунта.');
    if (window.location.pathname.includes('user.html') || window.location.pathname.includes('profile.html')) {
      toggleAuthFormsVisibility(true); // Показать формы входа
    }
  }

  function initAuthListeners() {
    const userIconBtn = document.querySelector('.header__action-btn[aria-label="Аккаунт"]');
    if (userIconBtn) {
      userIconBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetPage = 'user.html'; // или profile.html
        if (!window.location.pathname.includes(targetPage)) {
          window.location.href = targetPage;
        } else {
          // Если уже на странице профиля, то auth.js сам решит, показывать ли формы
          if (!getCurrentUser()) toggleAuthFormsVisibility(true);
        }
      });
    }
    // Кнопка выхода обрабатывается в user.js, если она там
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI(getCurrentUser()); // Изначальная настройка UI
    initAuthListeners();
    loadUsersFromServer(); // Предзагрузка пользователей
  });

  window.Auth = {getCurrentUser, isLoggedIn: () => !!getCurrentUser(), handleLogout, updateUI: updateAuthUI};
})();
