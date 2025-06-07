// js/user.js (ФИНАЛЬНАЯ ВЕРСИЯ)
document.addEventListener("DOMContentLoaded", () => {
  // Проверяем, что мы на странице личного кабинета
  const userPage = document.querySelector(".user-page");
  if (!userPage) {
    return;
  }

  // --- Находим все необходимые элементы ---
  const userDashboard = document.querySelector(".user-dashboard");
  const userHeader = document.querySelector(".user-header");
  const userSidebar = document.getElementById("user-sidebar-nav");
  const userContent = document.getElementById("user-tabs-container");
  
  const initialLoginBtn = document.getElementById("login-btn");
  const initialRegisterBtn = document.getElementById("register-btn");
  const logoutBtn = document.getElementById("logout-btn");
  
  const userProfileName = document.getElementById("user-profile-name");
  // ... другие элементы для заполнения данными, если нужно

  // --- Главная функция для отрисовки состояния страницы ---
  function renderPage() {
    const currentUser = Auth.getCurrentUser();

    if (currentUser) {
      // --- СОСТОЯНИЕ: ПОЛЬЗОВАТЕЛЬ АВТОРИЗОВАН ---
      if (userDashboard) userDashboard.classList.add('is-logged-in');
      if (userHeader) userHeader.style.display = "none";
      if (userSidebar) userSidebar.style.display = ""; // Показываем боковую панель
      if (userContent) userContent.style.display = ""; // Показываем контент

      if (userProfileName) userProfileName.textContent = currentUser.fullname || "Пользователь";
      // Здесь можно добавить код для заполнения других полей профиля
      
    } else {
      // --- СОСТОЯНИЕ: ПОЛЬЗОВАТЕЛЬ НЕ АВТОРИЗОВАН (ГОСТЬ) ---
      if (userDashboard) userDashboard.classList.remove('is-logged-in');
      if (userHeader) userHeader.style.display = ""; // Показываем приветствие
      if (userSidebar) userSidebar.style.display = "none";
      if (userContent) userContent.style.display = "none";

      if (userProfileName) userProfileName.textContent = "Гость";
    }
  }

  // --- Установка обработчиков событий ---
  if (initialLoginBtn) {
    initialLoginBtn.addEventListener("click", () => {
      // Вызываем функцию из auth.js, передаем ей renderPage как колбэк
      Auth.showLoginForm(document.body, renderPage);
    });
  }

  if (initialRegisterBtn) {
    initialRegisterBtn.addEventListener("click", () => {
      Auth.showRegisterForm(document.body, renderPage);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      Auth.handleLogout(renderPage);
    });
  }

  // --- Первый запуск при загрузке страницы ---
  renderPage();
});