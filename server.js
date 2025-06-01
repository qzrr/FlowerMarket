// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const Database = require("./data/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet({ contentSecurityPolicy: false })); // Настройте CSP для продакшена
app.use(express.json());
app.use(morgan("dev"));

// Статика: пути от корня проекта
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/img", express.static(path.join(__dirname, "img"))); // Для /img/products/..., /img/categories/...
app.use("/assets", express.static(path.join(__dirname, "assets"))); // Для /assets/heart.svg и т.д.

app.use(express.static(path.join(__dirname)));
// Обслуживание HTML файлов из папки pages/ ИЛИ из корня
app.use(express.static(path.join(__dirname, "pages"))); // Если страницы в /pages/
// app.use(express.static(path.join(__dirname))); // Если index.html и др. в корне

// API маршруты
app.get("/api/products", async (req, res, next) => {
  try {
    const products = await Database.getProducts();
    res.json(products);
  } catch (error) { next(error); }
});

app.get("/api/products/popular", async (req, res, next) => {
  try {
    const products = await Database.getPopularProducts();
    res.json(products);
  } catch (error) { next(error); }
});

app.get("/api/products/category/:category", async (req, res, next) => {
  try {
    const products = await Database.getProductsByCategory(req.params.category);
    res.json(products);
  } catch (error) { next(error); }
});

app.get("/api/products/search", async (req, res, next) => {
  try {
    const searchQuery = req.query.q || "";
    if (searchQuery.length > 0 && searchQuery.length < 3) { // Пустой запрос может быть валидным
      return res.status(400).json({ error: "Поисковый запрос должен содержать минимум 3 символа" });
    }
    const products = await Database.searchProducts(searchQuery);
    res.json(products);
  } catch (error) { next(error); }
});

app.get("/api/products/:id", async (req, res, next) => {
  try {
    const product = await Database.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "Продукт не найден" });
    res.json(product);
  } catch (error) { next(error); }
});

app.get("/api/categories", async (req, res, next) => {
  try {
    const categories = await Database.getCategories();
    res.json(categories);
  } catch (error) { next(error); }
});

app.get("/api/promos", async (req, res, next) => {
  try {
    const promos = await Database.getPromos();
    res.json(promos);
  } catch (error) { next(error); }
});

app.get("/api/reviews", async (req, res, next) => { // Общие отзывы
  try {
    const reviews = await Database.getReviews();
    res.json(reviews);
  } catch (error) { next(error); }
});

app.get("/api/reviews/product/:productId", async (req, res, next) => {
  try {
    const reviews = await Database.getReviewsByProductId(req.params.productId);
    res.json(reviews);
  } catch (error) { next(error); }
});

app.get("/api/users", async (req, res, next) => {
  try {
    const users = await Database.getUsers();
    res.json(users);
  } catch (error) { next(error); }
});

// Отдача index.html для корневого маршрута
app.get("/", (req, res) => {
  const indexPathPages = path.join(__dirname, "pages", "index.html");
  const indexPathRoot = path.join(__dirname, "index.html");

  res.sendFile(indexPathPages, (err) => {
    if (err) { // Если не нашли в pages/
      res.sendFile(indexPathRoot, (errRoot) => {
        if (errRoot) { // Если не нашли и в корне
          res.status(404).send("Главная страница (index.html) не найдена.");
        }
      });
    }
  });
});
// Обработка прямых запросов к страницам в папке pages
app.get("/pages/:page", (req, res) => {
  const pagePath = path.join(__dirname, "pages", req.params.page);
  res.sendFile(pagePath, (err) => {
    if (err) {
      console.error(`Ошибка при отправке файла ${pagePath}:`, err);
      res.status(404).send(`Страница ${req.params.page} не найдена.`);
    }
  });
});

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error("Ошибка сервера:", err.stack || err.message || err);
  res.status(err.status || 500).json({
    error: err.message || "Внутренняя ошибка сервера",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
