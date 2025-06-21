// js/favorite.js
(function () {
    const favoriteProductsContainer =
        document.getElementById("favorite-products");
    const emptyFavoriteMessage = document.getElementById("empty-favorite");
    const favoriteItemsWrapper = document.getElementById("favorite-items"); // Обертка для списка и кнопки очистки
    const clearFavoriteButton = document.getElementById("clear-favorite");

    async function loadFavoriteItems() {
        if (
            !favoriteProductsContainer ||
            !emptyFavoriteMessage ||
            !favoriteItemsWrapper
        ) {
            console.warn(
                "Элементы для отображения избранного не найдены на странице."
            );
            return;
        }

        // Получаем ID избранных товаров из localStorage (универсальный способ)
        // В будущем, если избранное будет храниться на сервере для пользователя, логика изменится
        const favoriteProductIds =
            JSON.parse(localStorage.getItem("wishlist")) || []; // Используем 'wishlist' как ключ

        if (favoriteProductIds.length === 0) {
            emptyFavoriteMessage.style.display = "block";
            favoriteItemsWrapper.style.display = "none";
            favoriteProductsContainer.innerHTML = ""; // Очищаем на всякий случай
            return;
        }

        emptyFavoriteMessage.style.display = "none";
        favoriteItemsWrapper.style.display = "block";
        favoriteProductsContainer.innerHTML =

            '<div class="loading-spinner">Загрузка избранных товаров...</div>';

        try {
            const productPromises = favoriteProductIds.map((id) =>
                API.getProductById(id).catch((err) => {
                    console.warn(`Не удалось загрузить товар ${id} из избранного:`, err);
                    // Удаляем невалидный ID из localStorage, чтобы не пытаться загрузить его снова
                    const currentWishlist =
                        JSON.parse(localStorage.getItem("wishlist")) || [];
                    const updatedWishlist = currentWishlist.filter(
                        (itemId) => itemId !== id
                    );
                    localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
                    return null;
                })
            );
            const favoriteProductsData = (await Promise.all(productPromises)).filter(
                (p) => p !== null
            );

            if (favoriteProductsData.length === 0) {
                // Это может случиться, если все ID в localStorage оказались невалидными
                emptyFavoriteMessage.style.display = "block";
                favoriteItemsWrapper.style.display = "none";
                favoriteProductsContainer.innerHTML = "";
                if (favoriteProductIds.length > 0) {
                    // Если изначально ID были, но не загрузились
                    emptyFavoriteMessage.innerHTML = `
                        <h2>Некоторые товары из избранного не найдены</h2>
                        <p>Возможно, они были удалены. Список избранного был обновлен.</p>
                        <a href="catalog.html" class="btn btn-primary">Перейти в каталог</a>`;
                }
                return;
            }

            favoriteProductsContainer.innerHTML = favoriteProductsData
                .map(window.createProductCardHTML)
                .join("");
            // Навешиваем обработчики на кнопки "в корзину" и "удалить из избранного"
            if (
                window.Search &&
                typeof window.Search.setupProductCardActionsForContainer === "function"
            ) {
                window.Search.setupProductCardActionsForContainer(
                    favoriteProductsContainer
                );
            } else {
                console.warn(
                    "Функция Search.setupProductCardActionsForContainer не найдена. Кнопки на карточках могут не работать."
                );
            }
        } catch (error) {
            console.error("Ошибка при загрузке избранных товаров:", error);
            favoriteProductsContainer.innerHTML = `<p class="error-message">Не удалось загрузить избранные товары. Попробуйте позже.</p>`;
        }
    }

    function setupClearFavoritesButton() {
        if (!clearFavoriteButton) return;
        clearFavoriteButton.addEventListener("click", () => {
            if (confirm("Вы уверены, что хотите очистить список избранного?")) {
                localStorage.removeItem("wishlist"); // Очищаем localStorage
                // Если избранное связано с пользователем, то нужно будет также обновлять данные пользователя
                const currentUser = Auth.getCurrentUser();
                if (currentUser && currentUser.favorites) {
                    currentUser.favorites = [];
                    localStorage.setItem("currentUser", JSON.stringify(currentUser));
                }
                loadFavoriteItems(); // Перерисовываем (должно показать пустое состояние)
                showNotification("Список избранного очищен.");
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (document.querySelector(".favorite-page")) {
            // Убедимся, что мы на нужной странице
            loadFavoriteItems();
            setupClearFavoritesButton();
        }
    });

    // Экспонируем функцию для возможности принудительного обновления извне (например, после удаления товара из избранного на другой странице)
    window.FavoritePage = {
        reloadFavorites: loadFavoriteItems,
    };
})();
