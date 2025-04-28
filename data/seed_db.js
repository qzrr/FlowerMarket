const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('flowers.db');

// Образцы данных для заполнения базы данных
const products = [
    {
        id: 1,
        name: "Нежность",
        category: "bouquets",
        categoryName: "Букеты",
        price: 2500,
        oldPrice: null,
        discount: null,
        image: "../img/products/bouquet1.jpg",
        popular: true,
        description: "Нежный букет для самых любимых. Этот великолепный букет станет прекрасным подарком для любого события.",
        details: "Нежный букет для самых любимых. Этот великолепный букет станет прекрасным подарком для любого события. Созданный с любовью и заботой, он украсит ваш дом и поднимет настроение. Наши флористы тщательно отбирают только самые свежие цветы, чтобы создать неповторимые композиции. Каждый букет уникален и собран вручную.",
        sku: "FL-0001",
        inStock: true,
        rating: 5.0,
        reviews: 3,
        images: [
            "../img/products/bouquet1.jpg",
            "../img/products/bouquet1-2.jpg",
            "../img/products/bouquet1-3.jpg"
        ],
        composition: [
            "розы белые - 7 шт",
            "гипсофила - 3 ветки",
            "зелень - по сезону"
        ],
        sizes: [
            { name: "Маленький", price: 2500 },
            { name: "Средний", price: 3500 },
            { name: "Большой", price: 4500 }
        ]
    },
    {
        id: 2,
        name: "Розовая мечта",
        category: "roses",
        categoryName: "Розы",
        price: 3200,
        oldPrice: 3500,
        discount: 10,
        image: "../img/products/roses1.jpg",
        popular: true,
        description: "Классические розовые розы. Букет из свежих роз символизирует любовь и нежность.",
        details: "Букет из розовых роз - классика, которая никогда не выходит из моды. Эти прекрасные цветы выражают нежность, восхищение и благодарность. Букет идеально подходит для романтических свиданий, юбилеев и просто чтобы порадовать близкого человека.",
        sku: "FL-0002",
        inStock: true,
        rating: 4.8,
        reviews: 12,
        images: [
            "../img/products/roses1.jpg",
            "../img/products/roses1-2.jpg",
            "../img/products/roses1-3.jpg"
        ],
        composition: [
            "розы розовые - 15 шт",
            "зелень - по сезону",
            "атласная лента"
        ],
        sizes: [
            { name: "15 роз", price: 3200 },
            { name: "25 роз", price: 4500 },
            { name: "51 роза", price: 8000 }
        ]
    },
    {
        id: 3,
        name: "Весенний аромат",
        category: "bouquets",
        categoryName: "Букеты",
        price: 2800,
        oldPrice: null,
        discount: null,
        image: "../img/products/bouquet2.jpg",
        popular: true,
        description: "Свежий букет с ароматом весны. Яркая композиция из сезонных цветов.",
        details: "Свежий букет с ароматом весны наполнит ваш дом яркими красками и цветочным благоуханием. В этой композиции собраны самые красивые весенние цветы - тюльпаны, нарциссы и фрезии.",
        sku: "FL-0003",
        inStock: true,
        rating: 4.9,
        reviews: 8,
        images: [
            "../img/products/bouquet2.jpg",
            "../img/products/bouquet2-2.jpg",
            "../img/products/bouquet2-3.jpg"
        ],
        composition: [
            "тюльпаны - 7 шт",
            "нарциссы - 5 шт",
            "фрезии - 3 шт",
            "зелень - по сезону"
        ],
        sizes: [
            { name: "Стандартный", price: 2800 },
            { name: "Большой", price: 4200 }
        ]
    }
];

const categories = [
    {
        id: "bouquets",
        name: "Букеты",
        image: "../img/categories/bouquets.jpg",
        description: "Свежие и яркие букеты для любого повода",
        count: 12,
        featured: true
    },
    {
        id: "roses",
        name: "Розы",
        image: "../img/categories/roses.jpg",
        description: "Классические розы всех сортов и оттенков",
        count: 8,
        featured: true
    },
    {
        id: "plants",
        name: "Комнатные растения",
        image: "../img/categories/plants.jpg",
        description: "Растения для дома и офиса в стильных горшках",
        count: 10,
        featured: true
    },
    {
        id: "gifts",
        name: "Подарки",
        image: "../img/categories/gifts.jpg",
        description: "Цветочные композиции и подарочные наборы",
        count: 6,
        featured: true
    },
    {
        id: "wedding",
        name: "Свадебные букеты",
        image: "../img/categories/wedding.jpg",
        description: "Изысканные букеты для невест и праздничное оформление",
        count: 4,
        featured: false
    }
];

const promos = [
    {
        code: "WELCOME10",
        type: "percent",
        value: 10,
        description: "Скидка 10% на первый заказ",
        minCartAmount: 2000,
        expiryDate: "2025-12-31"
    },
    {
        code: "FLOWERS500",
        type: "fixed",
        value: 500,
        description: "Скидка 500 ₽ при заказе от 5000 ₽",
        minCartAmount: 5000,
        expiryDate: "2025-12-31"
    },
    {
        code: "DELIVERY",
        type: "fixed",
        value: 300,
        description: "Бесплатная доставка",
        minCartAmount: 0,
        expiryDate: "2025-12-31"
    }
];

const reviews = [
    {
        productId: 1,
        name: "Анна Петрова",
        avatar: "../img/avatars/avatar1.jpg",
        date: "12.04.2025",
        rating: 5,
        text: "Заказывала букет на день рождения мамы. Доставили вовремя, цветы свежие и красивые. Мама была в восторге! Простоял более недели. Обязательно буду заказывать еще."
    },
    {
        productId: 2,
        name: "Иван Сидоров",
        avatar: "../img/avatars/avatar2.jpg",
        date: "03.03.2025",
        rating: 5,
        text: "Отличный сервис! Заказал букет для жены на годовщину. Флористы помогли с выбором и создали именно то, что я хотел. Рекомендую!"
    },
    {
        productId: 3,
        name: "Елена Смирнова",
        avatar: "../img/avatars/avatar3.jpg",
        date: "15.02.2025",
        rating: 5,
        text: "Заказываю цветы здесь уже третий раз. Всегда свежие, красивые и стоят долго. Отдельное спасибо за оперативную доставку и внимательное отношение!"
    }
];

db.serialize(() => {
    // Сначала очистим таблицы, если в них есть данные
    db.run('DELETE FROM sizes');
    db.run('DELETE FROM compositions');
    db.run('DELETE FROM images');
    db.run('DELETE FROM reviews');
    db.run('DELETE FROM promos');
    db.run('DELETE FROM categories');
    db.run('DELETE FROM products');

    // Сбросим автоинкрементные ID
    db.run('DELETE FROM sqlite_sequence WHERE name IN ("products", "sizes", "compositions", "images", "reviews", "promos")');

    // Добавление продуктов
    const productStmt = db.prepare(`
        INSERT INTO products (
            id, name, category, categoryName, price, oldPrice, discount,
            image, popular, description, details, sku, inStock, rating, reviews
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    products.forEach(product => {
        productStmt.run(
            product.id,
            product.name,
            product.category,
            product.categoryName,
            product.price,
            product.oldPrice,
            product.discount,
            product.image,
            product.popular,
            product.description,
            product.details,
            product.sku,
            product.inStock,
            product.rating,
            product.reviews
        );

        // Добавляем изображения
        const imageStmt = db.prepare('INSERT INTO images (product_id, image_url) VALUES (?, ?)');
        product.images.forEach(image => {
            imageStmt.run(product.id, image);
        });
        imageStmt.finalize();

        // Добавляем состав
        const compositionStmt = db.prepare('INSERT INTO compositions (product_id, item) VALUES (?, ?)');
        product.composition.forEach(item => {
            compositionStmt.run(product.id, item);
        });
        compositionStmt.finalize();

        // Добавляем размеры
        const sizeStmt = db.prepare('INSERT INTO sizes (product_id, name, price) VALUES (?, ?, ?)');
        product.sizes.forEach(size => {
            sizeStmt.run(product.id, size.name, size.price);
        });
        sizeStmt.finalize();
    });

    productStmt.finalize();

    // Добавление категорий
    const categoryStmt = db.prepare(`
        INSERT INTO categories (id, name, image, description, count, featured)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    categories.forEach(category => {
        categoryStmt.run(
            category.id,
            category.name,
            category.image,
            category.description,
            category.count,
            category.featured
        );
    });

    categoryStmt.finalize();

    // Добавление промо-акций
    const promoStmt = db.prepare(`
        INSERT INTO promos (code, type, value, description, min_cart_amount, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    promos.forEach(promo => {
        promoStmt.run(
            promo.code,
            promo.type,
            promo.value,
            promo.description,
            promo.minCartAmount || 0,
            promo.expiryDate
        );
    });

    promoStmt.finalize();

    // Добавление отзывов
    const reviewStmt = db.prepare(`
        INSERT INTO reviews (product_id, name, avatar, date, rating, text)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    reviews.forEach(review => {
        reviewStmt.run(
            review.productId,
            review.name,
            review.avatar,
            review.date,
            review.rating,
            review.text
        );
    });

    reviewStmt.finalize();

    console.log("База данных успешно заполнена");
});

db.close(); 