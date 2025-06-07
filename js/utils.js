// js/user.js (ОБНОВЛЕННАЯ ВЕРСИЯ С РАБОЧИМИ ТАБАМИ)

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
  const userContentContainer = document.getElementById("user-tabs-container"); // Переименовал для ясности

  const initialLoginBtn = document.getElementById("login-btn");
  const initialRegisterBtn = document.getElementById("register-btn");
  const logoutBtn = document.getElementById("logout-btn");

  const userProfileName = document.getElementById("user-profile-name");

  function initTabSystem() {
    // Проверяем, есть ли нужные элементы
    if (!userSidebar || !userContentContainer) return;

    const tabLinks = userSidebar.querySelectorAll(".user-sidebar__link");
    const tabContents = userContentContainer.querySelectorAll(".user-tab");

    userSidebar.addEventListener("click", (e) => {
      // Ищем клик именно по ссылке
      const link = e.target.closest(".user-sidebar__link");
      if (!link) return;

      e.preventDefault(); // Отменяем стандартный переход по ссылке #
      const tabId = link.dataset.tab;
      if (!tabId) return;

      const targetTab = document.getElementById(tabId);
      if (!targetTab) return;

      // 1. Убираем класс 'active' со всех ссылок и вкладок
      tabLinks.forEach((l) => l.classList.remove("active"));
      tabContents.forEach((t) => t.classList.remove("active"));

      // 2. Добавляем класс 'active' нужной ссылке и вкладке
      link.classList.add("active");
      targetTab.classList.add("active");
    });

    // Активируем первую вкладку по умолчанию при загрузке
    const firstLink = userSidebar.querySelector(".user-sidebar__link");
    if (firstLink) {
      firstLink.click();
    }
  }

  // --- Главная функция для отрисовки состояния страницы ---
  function renderPage() {
    const currentUser = Auth.getCurrentUser();

    if (currentUser) {
      // --- СОСТОЯНИЕ: ПОЛЬЗОВАТЕЛЬ АВТОРИЗОВАН ---
      if (userDashboard) userDashboard.classList.add("is-logged-in");
      if (userHeader) userHeader.style.display = "none";
      if (userSidebar) userSidebar.style.display = "";
      if (userContentContainer) userContentContainer.style.display = "";

      if (userProfileName)
        userProfileName.textContent = currentUser.fullname || "Пользователь";

      initTabSystem();
    } else {
      // --- СОСТОЯНИЕ: ПОЛЬЗОВАТЕЛЬ НЕ АВТОРИЗОВАН (ГОСТЬ) ---
      if (userDashboard) userDashboard.classList.remove("is-logged-in");
      if (userHeader) userHeader.style.display = "";
      if (userSidebar) userSidebar.style.display = "none";
      if (userContentContainer) userContentContainer.style.display = "none";

      if (userProfileName) userProfileName.textContent = "Гость";
    }
  }

  // --- Установка обработчиков событий ---
  if (initialLoginBtn) {
    initialLoginBtn.addEventListener("click", () => {
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
