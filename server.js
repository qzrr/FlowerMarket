const express = require('express');
const cors = require('cors');
const Database = require('./data/db');
const sqlite3 = require('sqlite3');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Получение всех продуктов
app.get('/api/products', async (req, res) => {
    try {
        const products = await Database.getProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение популярных продуктов
app.get('/api/products/popular', async (req, res) => {
    try {
        const products = await Database.getPopularProducts();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение продуктов по категории
app.get('/api/products/category/:category', async (req, res) => {
    try {
        const products = await Database.getProductsByCategory(req.params.category);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Поиск продуктов
app.get('/api/products/search', (req, res) => {
    const searchQuery = req.query.q ? req.query.q.toLowerCase() : '';

    if (!searchQuery || searchQuery.length < 3) {
        return res.status(400).json({ error: 'Поисковый запрос должен содержать минимум 3 символа' });
    }

    const db = new sqlite3.Database('./flowers.db');

    db.all(`
    SELECT p.*,
           GROUP_CONCAT(DISTINCT i.image_url) as images,
           GROUP_CONCAT(DISTINCT c.item) as composition,
           GROUP_CONCAT(DISTINCT s.name || '|' || s.price) as sizes
    FROM products p
           LEFT JOIN images i ON p.id = i.product_id
           LEFT JOIN compositions c ON p.id = c.product_id
           LEFT JOIN sizes s ON p.id = s.product_id
    WHERE LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.categoryName) LIKE ?
    GROUP BY p.id
    ORDER BY p.name
  `, [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`], (err, rows) => {
        if (err) {
            console.error('Error searching products:', err);
            res.status(500).json({ error: 'Ошибка при поиске товаров' });
            db.close();
            return;
        }

        // Преобразуем результаты в нужный формат
        const products = rows.map(row => ({
            ...row,
            images: row.images ? row.images.split(',') : [],
            composition: row.composition ? row.composition.split(',') : [],
            sizes: row.sizes ? row.sizes.split(',').map(size => {
                const [name, price] = size.split('|');
                return { name, price: parseInt(price) };
            }) : []
        }));

        res.json(products);
        db.close();
    });
});

// Получение продукта по ID (должен идти после других специфичных маршрутов /api/products/...)
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Database.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Продукт не найден' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение всех категорий
app.get('/api/categories', async (req, res) => {
    try {
        const categories = await Database.getCategories();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение всех промо-акций
app.get('/api/promos', async (req, res) => {
    try {
        const promos = await Database.getPromos();
        res.json(promos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение всех отзывов
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Database.getReviews();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение отзывов по ID продукта
app.get('/api/reviews/product/:productId', async (req, res) => {
    try {
        const reviews = await Database.getReviewsByProductId(req.params.productId);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
}); 