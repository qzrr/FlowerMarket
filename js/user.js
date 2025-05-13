// JavaScript для страницы личного кабинета

document.addEventListener('DOMContentLoaded', () => {
    initUserTabs();
    setupUserProfile();
    loadFavorites();
});

// Инициализация вкладок в личном кабинете
function initUserTabs() {
    const tabLinks = document.querySelectorAll('.user-navigation a');
    const tabs = document.querySelectorAll('.user-tab');

    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Удаляем активный класс со всех ссылок
            tabLinks.forEach(item => item.classList.remove('active'));

            // Добавляем активный класс к текущей ссылке
            link.classList.add('active');

            // Получаем id вкладки, которую нужно показать
            const tabId = link.getAttribute('data-tab');

            // Скрываем все вкладки
            tabs.forEach(tab => tab.classList.remove('active'));

            // Показываем выбранную вкладку
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Настройка профиля пользователя
function setupUserProfile() {
    const profileForm = document.getElementById('profile-form');

    if (!profileForm) return;

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Получаем данные из формы
        const userData = {
            fullname: document.getElementById('user-fullname').value,
            email: document.getElementById('user-email').value,
            phone: document.getElementById('user-phone').value,
            birthday: document.getElementById('user-birthday').value
        };

        // Сохраняем данные в localStorage
        localStorage.setItem('userData', JSON.stringify(userData));

        // Обновляем отображаемое имя пользователя
        if (userData.fullname) {
            document.getElementById('user-name').textContent = userData.fullname;
        }

        // Показываем уведомление об успешном сохранении
        showUserNotification('Профиль успешно сохранен');
    });

    // Загружаем сохраненные данные пользователя, если они есть
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        const userData = JSON.parse(savedUserData);

        // Заполняем форму сохраненными данными
        if (userData.fullname) {
            document.getElementById('user-fullname').value = userData.fullname;
            document.getElementById('user-name').textContent = userData.fullname;
        }
        if (userData.email) document.getElementById('user-email').value = userData.email;
        if (userData.phone) document.getElementById('user-phone').value = userData.phone;
        if (userData.birthday) document.getElementById('user-birthday').value = userData.birthday;
    }

    // Настройка обработчика формы настроек
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const newPassword = document.getElementById('change-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword && newPassword !== confirmPassword) {
                showUserNotification('Пароли не совпадают', true);
                return;
            }

            // Сохраняем настройки
            const settings = {
                emailNotifications: document.getElementById('notification-email').checked,
                smsNotifications: document.getElementById('notification-sms').checked
            };

            localStorage.setItem('userSettings', JSON.stringify(settings));

            if (newPassword) {
                // В реальном приложении здесь была бы отправка запроса на изменение пароля
                localStorage.setItem('userPassword', newPassword); // Для демонстрации

                // Очищаем поля пароля
                document.getElementById('change-password').value = '';
                document.getElementById('confirm-password').value = '';
            }

            showUserNotification('Настройки успешно сохранены');
        });
    }

    // Настройка кнопки выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // В реальном приложении здесь был бы выход из аккаунта
            document.getElementById('user-name').textContent = 'Гость';
            showUserNotification('Вы вышли из аккаунта');

            // Очищаем форму профиля
            if (profileForm) profileForm.reset();
        });
    }
}

// Загрузка избранных товаров
function loadFavorites() {
    const favoritesContainer = document.querySelector('#favorites .favorites-container');
    if (!favoritesContainer) return;

    // Получаем список избранных товаров из localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (favorites.length === 0) {
        // Если избранных товаров нет, показываем сообщение
        favoritesContainer.innerHTML = `
            <div class="empty-state">
                <h3>В избранном пока нет товаров</h3>
                <p>Добавляйте понравившиеся товары в избранное, чтобы вернуться к ним позже</p>
                <a href="catalog.html" class="btn btn-primary">Перейти в каталог</a>
            </div>
        `;
        return;
    }

    // В реальном приложении здесь был бы запрос к API для получения данных о товарах
    // Для демонстрации просто показываем список ID избранных товаров
    const favoritesList = favorites.map(id => `
        <div class="product-card">
            <a href="product.html?id=${id}" class="product-card__image-link">
                <img src="../img/products/bouquet1.jpg" alt="Товар ${id}" class="product-card__image">
            </a>
            <div class="product-card__actions">
                <button class="product-card__action-btn remove-favorite" data-id="${id}" aria-label="Удалить из избранного">
                    <img src="../assets/favorite.svg" alt="Удалить из избранного">
                </button>
                <button class="product-card__action-btn add-to-cart" data-id="${id}" aria-label="Добавить в корзину">
                    <img src="../assets/cart.svg" alt="Добавить в корзину">
                </button>
            </div>
            <div class="product-card__content">
                <div class="product-card__category">Букеты</div>
                <h3 class="product-card__name">
                    <a href="product.html?id=${id}">Товар ${id}</a>
                </h3>
                <div class="product-card__price">5000 ₽</div>
            </div>
        </div>
    `).join('');

    favoritesContainer.innerHTML = favoritesList;

    // Добавляем обработчики для кнопок удаления из избранного
    const removeButtons = favoritesContainer.querySelectorAll('.remove-favorite');
    removeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.getAttribute('data-id');
            removeFromFavorites(productId);
            button.closest('.product-card').remove();

            // Если все товары удалены, показываем сообщение
            if (favoritesContainer.children.length === 0) {
                loadFavorites(); // Перезагружаем список избранного (покажет пустое состояние)
            }
        });
    });
}

// Удаление товара из избранного
function removeFromFavorites(productId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const updatedFavorites = favorites.filter(id => id != productId);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));

    showUserNotification('Товар удален из избранного');
}

// Показ уведомления в личном кабинете
function showUserNotification(message, isError = false) {
    // Проверяем, существует ли уже уведомление
    let notification = document.querySelector('.user-notification');

    // Если нет, создаем новое
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'user-notification';
        document.body.appendChild(notification);
    }

    // Устанавливаем класс ошибки при необходимости
    notification.className = isError
        ? 'user-notification user-notification--error'
        : 'user-notification';

    // Устанавливаем текст уведомления
    notification.textContent = message;

    // Показываем уведомление
    notification.classList.add('active');

    // Скрываем через 3 секунды
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}
