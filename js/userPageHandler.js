// js/userPageHandler.js
(function () {
  // --- Начало логики из auth.js (адаптировано) ---
  let allUsersCache = [];

  async function loadUsersFromServer() {
    if (allUsersCache.length > 0) return allUsersCache;
    try {
      allUsersCache = await API.getUsers();
      return allUsersCache;
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      showNotification('Не удалось загрузить данные пользователей.', true);
      return [];
    }
  }

  function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
  }

  function updateGlobalAuthUI(user) { // Обновляет только общие элементы (хедер)
    const userIcon = document.querySelector('.header__action-btn[aria-label="Аккаунт"]');
    if (userIcon) {
      userIcon.classList.toggle('logged-in', !!user);
      userIcon.title = user ? `Профиль: ${user.fullname}` : 'Войти или зарегистрироваться';
    }
  }

  function controlPageVisibility(isUserLoggedIn) {
    const userSidebar = document.getElementById('user-sidebar-nav');
    const userTabsContent = document.getElementById('user-tabs-container');
    const loginFormWrapper = document.getElementById('login-form-wrapper');
    const registerFormWrapper = document.getElementById('register-form-wrapper');

    if (isUserLoggedIn) {
      if (userSidebar) userSidebar.style.display = '';
      if (userTabsContent) userTabsContent.style.display = '';
      if (loginFormWrapper) loginFormWrapper.style.display = 'none';
      if (registerFormWrapper) registerFormWrapper.style.display = 'none';
    } else {
      if (userSidebar) userSidebar.style.display = 'none';
      if (userTabsContent) userTabsContent.style.display = 'none';
      showLoginForm(); // Показываем форму входа по умолчанию
    }
  }

  function showLoginForm() {
    const userPageContent = document.querySelector('.user-page__content');
    if (!userPageContent) return;
    hideAuthForms();
    let loginFormWrapper = document.getElementById('login-form-wrapper');
    if (!loginFormWrapper) {
      loginFormWrapper = createAuthFormHTML('login');
      userPageContent.insertBefore(loginFormWrapper, userPageContent.firstChild); // Вставляем перед user-tabs-content
      attachFormListeners('login');
    }
    loginFormWrapper.style.display = 'block';
  }

  function showRegisterForm() {
    const userPageContent = document.querySelector('.user-page__content');
    if (!userPageContent) return;
    hideAuthForms();
    let registerFormWrapper = document.getElementById('register-form-wrapper');
    if (!registerFormWrapper) {
      registerFormWrapper = createAuthFormHTML('register');
      userPageContent.insertBefore(registerFormWrapper, userPageContent.firstChild);
      attachFormListeners('register');
    }
    registerFormWrapper.style.display = 'block';
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
    formWrapper.className = 'auth-form-container';
    const isLogin = type === 'login';
    const title = isLogin ? 'Вход в аккаунт' : 'Регистрация';
    const submitBtnText = isLogin ? 'Войти' : 'Зарегистрироваться';
    const switchLink = isLogin ? 'Нет аккаунта? <a href="#" data-auth-switch="register">Зарегистрироваться</a>'
      : 'Уже есть аккаунт? <a href="#" data-auth-switch="login">Войти</a>';
    let fields = `
            <div class="form-group">
                <label for="${type}-email">Email</label>
                <input type="email" id="${type}-email" name="email" class="form-input" required placeholder="your@email.com">
            </div>
            <div class="form-group">
                <label for="${type}-password">Пароль ${!isLogin ? '(мин. 6 символов)' : ''}</label>
                <input type="password" id="${type}-password" name="password" class="form-input" required ${!isLogin ? 'minlength="6"' : ''}>
            </div>`;
    if (!isLogin) {
      fields = `
                <div class="form-group">
                    <label for="${type}-fullname">Полное имя</label>
                    <input type="text" id="${type}-fullname" name="fullname" class="form-input" required placeholder="Иван Иванов">
                </div>` + fields + `
                <div class="form-group">
                    <label for="${type}-confirm-password">Повторите пароль</label>
                    <input type="password" id="${type}-confirm-password" name="confirmPassword" class="form-input" required>
                </div>`;
    }
    formWrapper.innerHTML = `
            <div class="auth-form">
                <h2>${title}</h2>
                <form id="${type}-form-actual">
                    ${fields}
                    <div class="form-error" id="${type}-error-message"></div>
                    <button type="submit" class="btn btn-primary btn-block">${submitBtnText}</button>
                </form>
                <p class="auth-switch">${switchLink}</p>
            </div>`;
    return formWrapper;
  }

  function attachFormListeners(type) {
    const form = document.getElementById(`${type}-form-actual`);
    if (form) form.addEventListener('submit', type === 'login' ? handleLoginSubmit : handleRegisterFormSubmit);
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
    const errorEl = document.getElementById('login-error-message');
    if (errorEl) errorEl.textContent = '';
    if (!email || !password) {
      if (errorEl) errorEl.textContent = 'Заполните все поля.';
      return;
    }

    const users = await loadUsersFromServer();
    const user = users.find(u => u.email === email && u.password === password); // ПРОСТАЯ ПРОВЕРКА!
    if (user) {
      const userData = {...user};
      delete userData.password;
      localStorage.setItem('currentUser', JSON.stringify(userData));
      updateGlobalAuthUI(userData); // Обновить хедер
      initializeUserPageContent(userData); // Инициализировать контент ЛК
      showNotification('Вы успешно вошли!');
    } else {
      if (errorEl) errorEl.textContent = 'Неверный email или пароль.';
    }
  }

  async function handleRegisterFormSubmit(e) {
    e.preventDefault();
    const fullname = document.getElementById('register-fullname').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorEl = document.getElementById('register-error-message');
    if (errorEl) errorEl.textContent = '';

    if (!fullname || !email || !password || !confirmPassword) {
      if (errorEl) errorEl.textContent = 'Заполните все поля.';
      return;
    }
    if (password !== confirmPassword) {
      if (errorEl) errorEl.textContent = 'Пароли не совпадают.';
      return;
    }
    if (password.length < 6) {
      if (errorEl) errorEl.textContent = 'Пароль слишком короткий.';
      return;
    }

    const users = await loadUsersFromServer();
    if (users.some(u => u.email === email)) {
      if (errorEl) errorEl.textContent = 'Email уже занят.';
      return;
    }

    const newUser = {
      id: String(Date.now()), fullname, email,
      avatar: '../assets/account_circle.svg', // Путь от корня /pages/
      favorites: [], orders: [], addresses: [],
      settings: {emailNotifications: true, smsNotifications: false}
    };
    // ДЕМО: В реальном приложении здесь был бы API запрос на сервер для сохранения пользователя.
    // Сервер бы добавил его в users.json и вернул бы объект пользователя (или токен).
    console.warn("ДЕМО-РЕГИСТРАЦИЯ: Пользователь НЕ сохранен на сервере (в users.json).", newUser);
    // Для демо, чтобы можно было сразу залогиниться (пароль не хэширован):
    // allUsersCache.push({ ...newUser, password: password });

    localStorage.setItem('currentUser', JSON.stringify(newUser)); // Сразу логиним
    updateGlobalAuthUI(newUser);
    initializeUserPageContent(newUser);
    showNotification('Регистрация успешна! Вы вошли.');
  }

  function handleLogout() {
    localStorage.removeItem('currentUser');
    updateGlobalAuthUI(null);
    controlPageVisibility(false); // Показать формы входа/регистрации
    showNotification('Вы вышли из аккаунта.');
    // Обновить поля профиля на "Гость" и т.д.
    const userNameDisplay = document.getElementById('user-profile-name');
    const userAvatarDisplay = document.getElementById('user-profile-avatar');
    if (userNameDisplay) userNameDisplay.textContent = 'Гость';
    if (userAvatarDisplay) userAvatarDisplay.src = '../assets/account_circle.svg';
  }

  // --- Конец логики из auth.js ---


  // --- Начало логики из user.js (адаптировано) ---
  function initUserTabs() {
    const tabLinks = document.querySelectorAll('.user-navigation a, .user-sidebar__link');
    const tabs = document.querySelectorAll('.user-tab');
    if (tabLinks.length === 0 || tabs.length === 0) return;

    const activateTab = (linkElement) => {
      tabLinks.forEach(item => item.classList.remove('active'));
      linkElement.classList.add('active');
      const tabId = linkElement.getAttribute('data-tab') || linkElement.hash.substring(1);
      tabs.forEach(tab => tab.classList.remove('active'));
      const targetTab = document.getElementById(tabId);
      if (targetTab) targetTab.classList.add('active');
    };

    let activatedFromHash = false;
    if (window.location.hash) {
      const hashTabId = window.location.hash.substring(1);
      const linkForHash = Array.from(tabLinks).find(l => (l.getAttribute('data-tab') === hashTabId) || (l.hash?.substring(1) === hashTabId));
      if (linkForHash) {
        activateTab(linkForHash);
        activatedFromHash = true;
      }
    }
    if (!activatedFromHash && tabLinks.length > 0) activateTab(tabLinks[0]);

    tabLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        activateTab(link);
        const tabId = link.getAttribute('data-tab') || link.hash.substring(1);
        if (history.pushState) history.pushState(null, null, `#${tabId}`);
        else window.location.hash = tabId;
      });
    });
  }

  function setupUserProfileForm(currentUser) {
    const profileForm = document.getElementById('profile-form');
    if (!profileForm || !currentUser) return;

    document.getElementById('user-fullname').value = currentUser.fullname || '';
    document.getElementById('user-email').value = currentUser.email || '';
    document.getElementById('user-phone').value = currentUser.phone || '';
    document.getElementById('user-birthday').value = currentUser.birthday || '';

    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedData = {
        fullname: document.getElementById('user-fullname').value,
        phone: document.getElementById('user-phone').value,
        birthday: document.getElementById('user-birthday').value
      };
      const userToSave = {...currentUser, ...updatedData};
      localStorage.setItem('currentUser', JSON.stringify(userToSave));
      document.querySelectorAll('#user-profile-name').forEach(el => {
        if (el) el.textContent = userToSave.fullname;
      });
      showNotification('Профиль обновлен.');
    });
  }

  function setupSettingsForm(currentUser) {
    const settingsForm = document.getElementById('settings-form');
    if (!settingsForm || !currentUser) return;

    const emailNotify = document.getElementById('notification-email');
    const smsNotify = document.getElementById('notification-sms');
    if (currentUser.settings) {
      if (emailNotify) emailNotify.checked = !!currentUser.settings.emailNotifications;
      if (smsNotify) smsNotify.checked = !!currentUser.settings.smsNotifications;
    }

    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPassword = document.getElementById('change-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (newPassword && newPassword !== confirmPassword) {
        showNotification('Пароли не совпадают!', true);
        return;
      }
      if (newPassword && newPassword.length < 6) {
        showNotification('Новый пароль слишком короткий.', true);
        return;
      }

      if (newPassword) {
        // ДЕМО: В реальном приложении - API запрос на смену пароля
        console.log("ДЕМО: Запрос на смену пароля:", newPassword);
        // currentUser.password = newPassword; // НЕ ХРАНИТЬ ТАК!
        document.getElementById('change-password').value = '';
        document.getElementById('confirm-password').value = '';
        showNotification('Пароль (демо) изменен. Для реального изменения нужна серверная часть.');
      }

      const updatedSettings = {
        emailNotifications: emailNotify ? emailNotify.checked : true,
        smsNotifications: smsNotify ? smsNotify.checked : false
      };
      const userToSave = {...currentUser, settings: updatedSettings};
      localStorage.setItem('currentUser', JSON.stringify(userToSave));
      showNotification('Настройки сохранены.');
    });
  }

  async function loadUserFavorites(currentUser) {
    const favoritesContainer = document.getElementById('favorites-list-container');
    if (!favoritesContainer) return;

    const favoriteProductIds = currentUser.favorites || JSON.parse(localStorage.getItem('wishlist')) || [];

    const emptyStateDiv = favoritesContainer.querySelector('.empty-state');

    if (favoriteProductIds.length === 0) {
      if (emptyStateDiv) {
        emptyStateDiv.style.display = 'block';
        emptyStateDiv.innerHTML = `
                    <p>В избранном пока нет товаров.</p>
                    <a href="catalog.html" class="btn btn-primary">В каталог</a>`;
      }
      favoritesContainer.querySelectorAll('.product-card').forEach(card => card.remove()); // Удалить старые карточки, если есть
      return;
    }
    if (emptyStateDiv) emptyStateDiv.style.display = 'none';
    favoritesContainer.innerHTML = '<div class="loading-spinner">Загрузка избранного...</div>';

    try {
      const productPromises = favoriteProductIds.map(id => API.getProductById(id).catch(() => null));
      const favoriteProductsData = (await Promise.all(productPromises)).filter(p => p !== null);

      if (favoriteProductsData.length === 0 && favoriteProductIds.length > 0) {
        if (emptyStateDiv) {
          emptyStateDiv.style.display = 'block';
          emptyStateDiv.innerHTML = `
                        <p>Некоторые товары из избранного не найдены. Список обновлен.</p>
                        <a href="catalog.html" class="btn btn-primary">В каталог</a>`;
        }
        favoritesContainer.querySelectorAll('.product-card, .loading-spinner').forEach(el => el.remove());
        // Очистка невалидных ID
        const validIds = favoriteProductsData.map(p => p.id);
        currentUser.favorites = validIds;
        localStorage.setItem('wishlist', JSON.stringify(validIds));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        return;
      }
      favoritesContainer.innerHTML = favoriteProductsData.map(window.createProductCardHTML).join('');
      if (window.Search && Search.setupProductCardActionsForContainer) {
        Search.setupProductCardActionsForContainer(favoritesContainer);
      }
    } catch (error) {
      console.error("Ошибка загрузки избранных:", error);
      favoritesContainer.innerHTML = `<p class="error-message">Не удалось загрузить избранные товары.</p>`;
    }
  }

  function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      // Удаляем старый обработчик, если он был, чтобы избежать дублирования
      const newLogoutBtn = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
      newLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout(); // Используем общую функцию выхода
      });
    }
  }

  // Главная функция инициализации контента ЛК (вызывается после успешного логина/проверки)
  function initializeUserPageContent(user) {
    if (!user) {
      controlPageVisibility(false); // Показать формы входа/регистрации
      return;
    }
    controlPageVisibility(true); // Показать контент ЛК

    // Обновление информации в сайдбаре/профиле
    const userNameDisplay = document.getElementById('user-profile-name');
    const userAvatarDisplay = document.getElementById('user-profile-avatar');
    if (userNameDisplay) userNameDisplay.textContent = user.fullname;
    if (userAvatarDisplay && user.avatar) userAvatarDisplay.src = user.avatar;
    else if (userAvatarDisplay) userAvatarDisplay.src = '../assets/account_circle.svg';


    initUserTabs();
    setupUserProfileForm(user);
    setupSettingsForm(user);
    loadUserFavorites(user); // Загрузка избранного для текущего пользователя
    // loadUserOrders(user); // Если будет реализовано
    // loadUserAddresses(user); // Если будет реализовано
    setupLogoutButton();
  }

  // --- Конец логики из user.js ---


  // --- Общая инициализация для страницы ---
  async function initPage() {
    await loadUsersFromServer(); // Загружаем всех пользователей (для демо-логина/регистрации)
    const currentUser = getCurrentUser();
    updateGlobalAuthUI(currentUser); // Обновляем хедер
    initializeUserPageContent(currentUser); // Инициализируем страницу в зависимости от статуса

    // Глобальный обработчик клика по иконке Аккаунт в хедере
    const userIconBtn = document.querySelector('.header__action-btn[aria-label="Аккаунт"]');
    if (userIconBtn) {
      userIconBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Если мы уже на странице user.html, то просто убедимся, что UI правильный
        if (window.location.pathname.includes('user.html') || window.location.pathname.includes('profile.html')) {
          const user = getCurrentUser();
          if (!user) showLoginForm(); // Если не залогинен, показать форму входа
          // Если залогинен, ничего не делаем, пользователь уже видит свой ЛК
        } else { // Если на другой странице, переходим на user.html
          window.location.href = 'user.html'; // или profile.html
        }
      });
    }
  }

  if (document.querySelector('.user-page')) { // Выполнять только на странице ЛК
    document.addEventListener('DOMContentLoaded', initPage);
  }

  // Экспортируем, если нужно вызывать что-то извне (например, UserPage.loadFavorites() из search.js)
  window.UserPage = {
    loadFavorites: () => {
      const user = getCurrentUser();
      if (user) loadUserFavorites(user);
    }
  };

})();
