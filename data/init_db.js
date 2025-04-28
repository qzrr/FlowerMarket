const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('flowers.db');

db.serialize(() => {
    // Создаем таблицу продуктов
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        categoryName TEXT NOT NULL,
        price INTEGER NOT NULL,
        oldPrice INTEGER,
        discount INTEGER,
        image TEXT NOT NULL,
        popular BOOLEAN,
        description TEXT NOT NULL,
        details TEXT NOT NULL,
        sku TEXT NOT NULL,
        inStock BOOLEAN,
        rating REAL,
        reviews INTEGER
    )`);

    // Создаем таблицу изображений
    db.run(`CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        image_url TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Создаем таблицу составов
    db.run(`CREATE TABLE IF NOT EXISTS compositions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        item TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Создаем таблицу размеров
    db.run(`CREATE TABLE IF NOT EXISTS sizes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        name TEXT NOT NULL,
        price INTEGER NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Создаем таблицу категорий
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT NOT NULL,
        description TEXT,
        count INTEGER DEFAULT 0,
        featured BOOLEAN DEFAULT 0
    )`);

    // Создаем таблицу промо-акций
    db.run(`CREATE TABLE IF NOT EXISTS promos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        value INTEGER NOT NULL,
        description TEXT,
        min_cart_amount INTEGER DEFAULT 0,
        expires_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        applicable_categories TEXT
    )`);

    // Создаем таблицу отзывов
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        date TEXT NOT NULL,
        rating INTEGER NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
    )`);
});

db.close(); 