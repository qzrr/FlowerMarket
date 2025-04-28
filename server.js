const express = require('express');
const cors = require('cors');
const Database = require('./data/db');

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