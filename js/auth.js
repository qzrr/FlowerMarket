/**
 * Auth.js - Модуль для авторизации пользователей
 * Обеспечивает функционал входа, выхода и проверки авторизации
 */

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация авторизации
    initAuth();
});

/**
 * Инициализация авторизации
 */
function initAuth() {
    // Проверяем, авторизован ли пользователь
    checkAuth();
    
    // Добавляем обработчики для кнопок авторизации в хедере
    setupAuthButtons();
    
    // Добавляем обработчик для кнопки выхода
    setupLogoutButton();
}

/**
 * Проверка авторизации пользователя
 */
function checkAuth() {
    const currentUser = getCurrentUser();
    
    // Обновляем UI в зависимости от статуса авторизации
    updateAuthUI(currentUser);
    
    return currentUser !== null;
}

/**
 * Получение текущего авторизованного пользователя
 * @returns {Object|null} Данные пользователя или null, если не авторизован
 */
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

/**
 * Обновление UI в зависимости от статуса авторизации
 * @param {Object|null} user Данные пользователя или null
 */
function updateAuthUI(user) {
    // Обновляем иконку пользователя в хедере
    const userIcon = document.querySelector('.header__action-btn[aria-label="Аккаунт"]');
    if (userIcon) {
        if (user) {
            userIcon.classList.add('logged-in');
            // Можно добавить тултип с именем пользователя
            userIcon.setAttribute('title', `Привет, ${user.fullname}`);
        } else {
            userIcon.classList.remove('logged-in');
            userIcon.setAttribute('title', 'Войти в аккаунт');
        }
    }
    
    // Если мы на странице пользователя, обновляем информацию профиля
    if (window.location.pathname.includes('user.html')) {
        const userNameElement = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userNameElement) {
            userNameElement.textContent = user ? user.fullname : 'Гость';
        }
        
        if (userAvatar && user && user.avatar) {
            userAvatar.src = user.avatar;
        }
        
        // Показываем или скрываем форму входа
        toggleLoginForm(!user);
        
        // Если пользователь авторизован, заполняем форму профиля
        if (user) {
            fillProfileForm(user);
            loadUserOrders(user);
            loadUserFavorites(user);
            loadUserAddresses(user);
            loadUserSettings(user);
        }
    }
}

/**
 * Переключение отображения формы входа
 * @param {boolean} show Показать форму входа
 */
function toggleLoginForm(show) {
    // Получаем контейнер с содержимым пользователя
    const userContent = document.querySelector('.user-content');
    if (!userContent) return;
    
    // Если нужно показать форму входа
    if (show) {
        // Скрываем все вкладки
        document.querySelectorAll('.user-tab').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Скрываем боковую панель
        const sidebar = document.querySelector('.user-sidebar');
        if (sidebar) {
            sidebar.style.display = 'none';
        }
        
        // Создаем форму входа, если её еще нет
        let loginForm = document.getElementById('login-form-container');
        if (!loginForm) {
            loginForm = document.createElement('div');
            loginForm.id = 'login-form-container';
            loginForm.className = 'login-form-container';
            loginForm.innerHTML = `
                <h2>Вход в аккаунт</h2>
                <form id="login-form" class="login-form">
                    <div class="form-group">
                        <label for="login-email">Email</label>
                        <input type="email" id="login-email" name="email" placeholder="Введите ваш email" required>
                    </div>
                    <div class="form-group">
                        <label for="login-password">Пароль</label>
                        <input type="password" id="login-password" name="password" placeholder="Введите ваш пароль" required>
                    </div>
                    <div class="form-error" id="login-error"></div>
                    <button type="submit" class="btn btn-primary">Войти</button>
                </form>
                <div class="login-links">
                    <a href="#" id="forgot-password-link">Забыли пароль?</a>
                    <a href="#" id="register-link">Зарегистрироваться</a>
                </div>
            `;
            userContent.appendChild(loginForm);
            
            // Добавляем обработчик для формы входа
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            
            // Добавляем обработчики для ссылок
            document.getElementById('forgot-password-link').addEventListener('click', handleForgotPassword);
            document.getElementById('register-link').addEventListener('click', handleRegister);
        } else {
            loginForm.style.display = 'block';
        }
    } else {
        // Если нужно скрыть форму входа
        const loginForm = document.getElementById('login-form-container');
        if (loginForm) {
            loginForm.style.display = 'none';
        }
        
        // Показываем боковую панель
        const sidebar = document.querySelector('.user-sidebar');
        if (sidebar) {
            sidebar.style.display = 'block';
        }
        
        // Показываем вкладку профиля
        const profileTab = document.getElementById('profile');
        if (profileTab) {
            profileTab.style.display = 'block';
        }
    }
}

/**
 * Обработчик отправки формы входа
 * @param {Event} e Событие отправки формы
 */
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');
    
    try {
        // Очищаем предыдущие ошибки
        errorElement.textContent = '';
        
        // Загружаем список пользователей из JSON
        const users = await loadUsers();
        
        // Ищем пользователя по email
        const user = users.find(u => u.email === email);
        
        // Проверяем пароль
        if (!user || user.password !== password) {
            errorElement.textContent = 'Неверный email или пароль';
            return;
        }
        
        // Сохраняем данные пользователя в localStorage (без пароля)
        const userData = { ...user };
        delete userData.password;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Обновляем UI
        updateAuthUI(userData);
        
        // Показываем уведомление об успешном входе
        showNotification('Вы успешно вошли в аккаунт');
        
        // Перезагружаем страницу для обновления данных
        window.location.reload();
    } catch (error) {
        console.error('Ошибка при входе:', error);
        errorElement.textContent = 'Произошла ошибка при входе. Попробуйте позже.';
    }
}

/**
 * Загрузка списка пользователей из JSON
 * @returns {Promise<Array>} Массив пользователей
 */
async function loadUsers() {
    try {
        const response = await fetch('../data/users.json');
        if (!response.ok) {
            throw new Error(`HTTP ошибка! Статус: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
        // Возвращаем пустой массив в случае ошибки
        return [];
    }
}

/**
 * Обработчик для ссылки "Забыли пароль"
 * @param {Event} e Событие клика
 */
function handleForgotPassword(e) {
    e.preventDefault();
    alert('Функция восстановления пароля будет доступна в ближайшее время');
}

/**
 * Обработчик для ссылки "Зарегистрироваться"
 * @param {Event} e Событие клика
 */
function handleRegister(e) {
    e.preventDefault();
    
    // Получаем контейнер с содержимым пользователя
    const userContent = document.querySelector('.user-content');
    if (!userContent) return;
    
    // Скрываем форму входа
    const loginForm = document.getElementById('login-form-container');
    if (loginForm) {
        loginForm.style.display = 'none';
    }
    
    // Создаем форму регистрации, если её еще нет
    let registerForm = document.getElementById('register-form-container');
    if (!registerForm) {
        registerForm = document.createElement('div');
        registerForm.id = 'register-form-container';
        registerForm.className = 'register-form-container';
        registerForm.innerHTML = `
            <h2>Регистрация</h2>
            <form id="register-form" class="register-form">
                <div class="form-group">
                    <label for="register-fullname">ФИО</label>
                    <input type="text" id="register-fullname" name="fullname" placeholder="Введите ваше полное имя" required>
                </div>
                <div class="form-group">
                    <label for="register-email">Email</label>
                    <input type="email" id="register-email" name="email" placeholder="Введите ваш email" required>
                </div>
                <div class="form-group">
                    <label for="register-phone">Телефон</label>
                    <input type="tel" id="register-phone" name="phone" placeholder="+7 (___) ___-__-__">
                </div>
                <div class="form-group">
                    <label for="register-password">Пароль</label>
                    <input type="password" id="register-password" name="password" placeholder="Придумайте пароль" required>
                </div>
                <div class="form-group">
                    <label for="register-confirm-password">Подтверждение пароля</label>
                    <input type="password" id="register-confirm-password" name="confirm-password" placeholder="Повторите пароль" required>
                </div>
                <div class="form-error" id="register-error"></div>
                <button type="submit" class="btn btn-primary">Зарегистрироваться</button>
            </form>
            <div class="register-links">
                <a href="#" id="back-to-login-link">Уже есть аккаунт? Войти</a>
            </div>
        `;
        userContent.appendChild(registerForm);
        
        // Добавляем обработчик для формы регистрации
        document.getElementById('register-form').addEventListener('submit', handleRegister);
        
        // Добавляем обработчик для ссылки "Войти"
        document.getElementById('back-to-login-link').addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    } else {
        registerForm.style.display = 'block';
    }
}

/**
 * Обработчик отправки формы регистрации
 * @param {Event} e Событие отправки формы
 */
async function handleRegister(e) {
    e.preventDefault();
    
    const fullname = document.getElementById('register-fullname').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorElement = document.getElementById('register-error');
    
    try {
        // Очищаем предыдущие ошибки
        errorElement.textContent = '';
        
        // Проверяем совпадение паролей
        if (password !== confirmPassword) {
            errorElement.textContent = 'Пароли не совпадают';
            return;
        }
        
        // Загружаем список пользователей из JSON
        const users = await loadUsers();
        
        // Проверяем, не занят ли email
        if (users.some(u => u.email === email)) {
            errorElement.textContent = 'Пользователь с таким email уже существует';
            return;
        }
        
        // В реальном приложении здесь был бы запрос к API для регистрации
        // Для демонстрации просто создаем нового пользователя и сохраняем в localStorage
        const newUser = {
            id: users.length + 1,
            email,
            password,
            fullname,
            phone,
            birthday: '',
            avatar: '../assets/account_circle.svg',
            addresses: [],
            orders: [],
            favorites: [],
            settings: {
                emailNotifications: true,
                smsNotifications: true
            }
        };
        
        // Сохраняем данные пользователя в localStorage (без пароля)
        const userData = { ...newUser };
        delete userData.password;
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Обновляем UI
        updateAuthUI(userData);
        
        // Показываем уведомление об успешной регистрации
        showNotification('Вы успешно зарегистрировались');
        
        // Перезагружаем страницу для обновления данных
        window.location.reload();
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        errorElement.textContent = 'Произошла ошибка при регистрации. Попробуйте позже.';
    }
}

/**
 * Настройка кнопок авторизации в хедере
 */
function setupAuthButtons() {
    const userButton = document.querySelector('.header__action-btn[aria-label="Аккаунт"]');
    
    if (userButton) {
        userButton.addEventListener('click', (e) => {
            // Если мы не на странице пользователя, перенаправляем на неё
            if (!window.location.pathname.includes('user.html')) {
                window.location.href = 'user.html';
            }
        });
    }
}

/**
 * Настройка кнопки выхода
 */
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Удаляем данные пользователя из localStorage
            localStorage.removeItem('currentUser');
            
            // Обновляем UI
            updateAuthUI(null);
            
            // Показываем уведомление о выходе
            showNotification('Вы вышли из аккаунта');
            
            // Перезагружаем страницу для обновления данных
            window.location.reload();
        });
    }
}

/**
 * Заполнение формы профиля данными пользователя
 * @param {Object} user Данные пользователя
 */
function fillProfileForm(user) {
    const fullnameInput = document.getElementById('user-fullname');
    const emailInput = document.getElementById('user-email');
    const phoneInput = document.getElementById('user-phone');
    const birthdayInput = document.getElementById('user-birthday');
    
    if (fullnameInput) fullnameInput.value = user.fullname || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (birthdayInput) birthdayInput.value = user.birthday || '';
}

/**
 * Загрузка заказов пользователя
 * @param {Object} user Данные пользователя
 */
function loadUserOrders(user) {
    const ordersTab = document.getElementById('orders');
    if (!ordersTab) return;
    
    // Если у пользователя нет заказов
    if (!user.orders || user.orders.length === 0) {
        ordersTab.innerHTML = `
            <h2>История заказов</h2>
            <div class="orders-empty-state">
                <p>У вас пока нет заказов.</p>
                <a href="catalog.html" class="btn btn-primary">Перейти в каталог</a>
            </div>
        `;
        return;
    }
    
    // Если есть заказы, отображаем их
    let ordersHTML = '<h2>История заказов</h2><div class="orders-list">';
    
    user.orders.forEach(order => {
        // Формируем список товаров в заказе
        let itemsHTML = '';
        order.items.forEach(item => {
            itemsHTML += `
                <div class="order-item">
                    <img src="${item.image}" alt="${item.name}" class="order-item__image">
                    <div class="order-item__details">
                        <h4>${item.name}</h4>
                        <p>${item.price} ₽ × ${item.quantity} = ${item.price * item.quantity} ₽</p>
                    </div>
                </div>
            `;
        });
        
        // Формируем HTML для заказа
        ordersHTML += `
            <div class="order-card">
                <div class="order-card__header">
                    <div class="order-card__id">Заказ №${order.id}</div>
                    <div class="order-card__date">от ${order.date}</div>
                    <div class="order-card__status ${order.status}">${getOrderStatusText(order.status)}</div>
                </div>
                <div class="order-card__content">
                    <div class="order-card__items">
                        ${itemsHTML}
                    </div>
                    <div class="order-card__summary">
                        <div class="order-card__delivery">
                            <h4>Доставка:</h4>
                            <p>${getDeliveryMethodText(order.delivery.method)}</p>
                            <p>${order.delivery.address}</p>
                            <p>Стоимость доставки: ${order.delivery.cost} ₽</p>
                        </div>
                        <div class="order-card__payment">
                            <h4>Оплата:</h4>
                            <p>${getPaymentMethodText(order.payment.method)}</p>
                            <p>Статус: ${getPaymentStatusText(order.payment.status)}</p>
                        </div>
                        <div class="order-card__total">
                            <h4>Итого:</h4>
                            <p class="order-card__total-price">${order.total} ₽</p>
                        </div>
                    </div>
                </div>
                <div class="order-card__actions">
                    <button class="btn btn-secondary">Повторить заказ</button>
                    <button class="btn btn-outline">Отменить заказ</button>
                </div>
            </div>
        `;
    });
    
    ordersHTML += '</div>';
    ordersTab.innerHTML = ordersHTML;
}

/**
 * Получение текстового представления статуса заказа
 * @param {string} status Статус заказа
 * @returns {string} Текстовое представление статуса
 */
function getOrderStatusText(status) {
    switch (status) {
        case 'pending': return 'Ожидает обработки';
        case 'processing': return 'В обработке';
        case 'shipped': return 'Отправлен';
        case 'delivered': return 'Доставлен';
        case 'cancelled': return 'Отменен';
        default: return 'Неизвестный статус';
    }
}

/**
 * Получение текстового представления способа доставки
 * @param {string} method Способ доставки
 * @returns {string} Текстовое представление способа доставки
 */
function getDeliveryMethodText(method) {
    switch (method) {
        case 'courier': return 'Курьерская доставка';
        case 'pickup': return 'Самовывоз';
        case 'express': return 'Экспресс-доставка';
        default: return 'Неизвестный способ доставки';
    }
}

/**
 * Получение текстового представления способа оплаты
 * @param {string} method Способ оплаты
 * @returns {string} Текстовое представление способа оплаты
 */
function getPaymentMethodText(method) {
    switch (method) {
        case 'card': return 'Банковская карта';
        case 'cash': return 'Наличные при получении';
        case 'online': return 'Онлайн-оплата';
        default: return 'Неизвестный способ оплаты';
    }
}

/**
 * Получение текстового представления статуса оплаты
 * @param {string} status Статус оплаты
 * @returns {string} Текстовое представление статуса оплаты
 */
function getPaymentStatusText(status) {
    switch (status) {
        case 'paid': return 'Оплачено';
        case 'pending': return 'Ожидает оплаты';
        case 'failed': return 'Ошибка оплаты';
        default: return 'Неизвестный статус оплаты';
    }
}

/**
 * Загрузка избранных товаров пользователя
 * @param {Object} user Данные пользователя
 */
function loadUserFavorites(user) {
    const favoritesContainer = document.querySelector('#favorites .favorites-container');
    if (!favoritesContainer) return;
    
    // Если у пользователя нет избранных товаров
    if (!user.favorites || user.favorites.length === 0) {
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
    const favoritesList = user.favorites.map(id => `
        <div class="product-card">
            <div class="product-card__image-wrapper">
                <a href="product.html?id=${id}">
                    <img src="../img/placeholder-large.jpg" alt="Товар ${id}" class="product-card__image">
                </a>
            </div>
            <div class="product-card__content">
                <span class="product-card__category">Букеты</span>
                <h3 class="product-card__name">
                    <a href="product.html?id=${id}">Товар ${id}</a>
                </h3>
                <div class="product-card__price">
                    5000 ₽
                </div>
                <div class="product-card__bottom-actions">
                    <button class="product-card__icon-btn remove-from-wishlist" data-product-id="${id}" aria-label="Удалить из избранного">
                        <img src="../assets/heart.svg" alt="Удалить из избранного">
                    </button>
                    <button class="product-card__icon-btn add-to-cart-btn" data-product-id="${id}" aria-label="Добавить в корзину">
                        <img src="../assets/cart.svg" alt="В корзину">
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    favoritesContainer.innerHTML = favoritesList;
}

/**
 * Загрузка адресов пользователя
 * @param {Object} user Данные пользователя
 */
function loadUserAddresses(user) {
    const addressesTab = document.getElementById('addresses');
    if (!addressesTab) return;
    
    // Если у пользователя нет адресов
    if (!user.addresses || user.addresses.length === 0) {
        addressesTab.innerHTML = `
            <h2>Мои адреса доставки</h2>
            <div class="address-empty-state">
                <p>У вас пока нет сохраненных адресов.</p>
            </div>
            <button class="btn btn-primary add-address-btn">Добавить новый адрес</button>
        `;
        return;
    }
    
    // Если есть адреса, отображаем их
    let addressesHTML = '<h2>Мои адреса доставки</h2><div class="addresses-list">';
    
    user.addresses.forEach(address => {
        addressesHTML += `
            <div class="address-card ${address.isDefault ? 'default' : ''}">
                <div class="address-card__header">
                    <h3>${address.title}</h3>
                    ${address.isDefault ? '<span class="address-card__default-badge">По умолчанию</span>' : ''}
                </div>
                <div class="address-card__content">
                    <p>${address.address}</p>
                    <p>${address.city}, ${address.zipcode}</p>
                </div>
                <div class="address-card__actions">
                    <button class="btn btn-secondary edit-address-btn" data-address-id="${address.id}">Редактировать</button>
                    <button class="btn btn-outline delete-address-btn" data-address-id="${address.id}">Удалить</button>
                    ${!address.isDefault ? `<button class="btn btn-outline set-default-address-btn" data-address-id="${address.id}">Сделать основным</button>` : ''}
                </div>
            </div>
        `;
    });
    
    addressesHTML += '</div><button class="btn btn-primary add-address-btn">Добавить новый адрес</button>';
    addressesTab.innerHTML = addressesHTML;
}

/**
 * Загрузка настроек пользователя
 * @param {Object} user Данные пользователя
 */
function loadUserSettings(user) {
    const emailNotifications = document.getElementById('notification-email');
    const smsNotifications = document.getElementById('notification-sms');
    
    if (emailNotifications && user.settings) {
        emailNotifications.checked = user.settings.emailNotifications;
    }
    
    if (smsNotifications && user.settings) {
        smsNotifications.checked = user.settings.smsNotifications;
    }
}

/**
 * Показ уведомления
 * @param {string} message Текст уведомления
 * @param {boolean} isError Флаг ошибки
 */
function showNotification(message, isError = false) {
    // Проверяем, существует ли уже контейнер для уведомлений
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        // Создаем контейнер, если его нет
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'notification--error' : 'notification--success'}`;
    notification.textContent = message;
    
    // Добавляем уведомление в контейнер
    notificationContainer.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.add('notification--hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Экспортируем функции для использования в других файлах
window.Auth = {
    checkAuth,
    getCurrentUser,
    updateAuthUI,
    handleLogin,
    handleLogout: function() {
        localStorage.removeItem('currentUser');
        updateAuthUI(null);
        showNotification('Вы вышли из аккаунта');
        if (window.location.pathname.includes('user.html')) {
            window.location.reload();
        }
    }
};
