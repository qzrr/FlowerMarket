require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database("./flowers.db", (err) => {
  if (err) console.error("Ошибка подключения к БД:", err.message);
  else console.log("Подключено к SQLite");
});

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

// Статика
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/img", express.static(path.join(__dirname, "img")));
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(express.static(path.join(__dirname, "pages"))); // fallback

const Database = require("./data/db");

//API маршруты
app.get("/api/products", async (req, res, next) => {
  try {
    const products = await Database.getProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.get("/api/products/popular", async (req, res, next) => {
  try {
    const products = await Database.getPopularProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.get("/api/products/category/:category", async (req, res, next) => {
  try {
    const products = await Database.getProductsByCategory(req.params.category);
    res.json(products);
  } catch (error) {
    next(error);
  }
});

app.get("/api/products/search", (req, res, next) => {
  const searchQuery = req.query.q?.toLowerCase() || "";

  if (searchQuery.length < 3) {
    return res
      .status(400)
      .json({ error: "Поисковый запрос должен содержать минимум 3 символа" });
  }

  db.all(
    `
    SELECT p.*,
           GROUP_CONCAT(DISTINCT i.image_url) AS images,
           GROUP_CONCAT(DISTINCT c.item) AS composition,
           GROUP_CONCAT(DISTINCT s.name || '|' || s.price) AS sizes
    FROM products p
      LEFT JOIN images i ON p.id = i.product_id
      LEFT JOIN compositions c ON p.id = c.product_id
      LEFT JOIN sizes s ON p.id = s.product_id
    WHERE LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.categoryName) LIKE ?
    GROUP BY p.id
    ORDER BY p.name
    `,
    [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`],
    (err, rows) => {
      if (err) return next(err);
      const products = rows.map((row) => ({
        ...row,
        images: row.images ? row.images.split(",") : [],
        composition: row.composition ? row.composition.split(",") : [],
        sizes: row.sizes
          ? row.sizes.split(",").map((size) => {
              const [name, price] = size.split("|");
              return { name, price: parseInt(price) };
            })
          : [],
      }));
      res.json(products);
    }
  );
});

app.get("/api/products/:id", async (req, res, next) => {
  try {
    const product = await Database.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: "Продукт не найден" });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

app.get("/api/categories", async (req, res, next) => {
  try {
    const categories = await Database.getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

app.get("/api/promos", async (req, res, next) => {
  try {
    const promos = await Database.getPromos();
    res.json(promos);
  } catch (error) {
    next(error);
  }
});

app.get("/api/reviews", async (req, res, next) => {
  try {
    const reviews = await Database.getReviews();
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

app.get("/api/reviews/product/:productId", async (req, res, next) => {
  try {
    const reviews = await Database.getReviewsByProductId(req.params.productId);
    res.json(reviews);
  } catch (error) {
    next(error);
  }
});

// Стартовая страница
app.get("/", (req, res) => {
  res.send("Добро пожаловать в API цветочного магазина!");
});

// Универсальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error("Ошибка:", err);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

// Старт сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
