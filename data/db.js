const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('flowers.db');

class Database {
    static async getProducts() {
        return new Promise((resolve, reject) => {
            db.all(`
        SELECT p.*,
               GROUP_CONCAT(DISTINCT i.image_url)              as images,
               GROUP_CONCAT(DISTINCT c.item)                   as composition,
               GROUP_CONCAT(DISTINCT s.name || '|' || s.price) as sizes
        FROM products p
               LEFT JOIN images i ON p.id = i.product_id
               LEFT JOIN compositions c ON p.id = c.product_id
               LEFT JOIN sizes s ON p.id = s.product_id
        GROUP BY p.id
      `, (err, rows) => {
                if (err) reject(err);
                else {
                    const products = rows.map(row => ({
                        ...row,
                        images: row.images ? row.images.split(',') : [],
                        composition: row.composition ? row.composition.split(',') : [],
                        sizes: row.sizes ? row.sizes.split(',').map(size => {
                            const [name, price] = size.split('|');
                            return { name, price: parseInt(price) };
                        }) : []
                    }));
                    resolve(products);
                }
            });
        });
    }

    static async getProductById(id) {
        return new Promise((resolve, reject) => {
            db.get(`
        SELECT p.*,
               GROUP_CONCAT(DISTINCT i.image_url)              as images,
               GROUP_CONCAT(DISTINCT c.item)                   as composition,
               GROUP_CONCAT(DISTINCT s.name || '|' || s.price) as sizes
        FROM products p
               LEFT JOIN images i ON p.id = i.product_id
               LEFT JOIN compositions c ON p.id = c.product_id
               LEFT JOIN sizes s ON p.id = s.product_id
        WHERE p.id = ?
        GROUP BY p.id
      `, [id], (err, row) => {
                if (err) reject(err);
                else if (!row) resolve(null);
                else {
                    const product = {
                        ...row,
                        images: row.images ? row.images.split(',') : [],
                        composition: row.composition ? row.composition.split(',') : [],
                        sizes: row.sizes ? row.sizes.split(',').map(size => {
                            const [name, price] = size.split('|');
                            return { name, price: parseInt(price) };
                        }) : []
                    };
                    resolve(product);
                }
            });
        });
    }

    static async getProductsByCategory(category) {
        return new Promise((resolve, reject) => {
            db.all(`
        SELECT p.*,
               GROUP_CONCAT(DISTINCT i.image_url)              as images,
               GROUP_CONCAT(DISTINCT c.item)                   as composition,
               GROUP_CONCAT(DISTINCT s.name || '|' || s.price) as sizes
        FROM products p
               LEFT JOIN images i ON p.id = i.product_id
               LEFT JOIN compositions c ON p.id = c.product_id
               LEFT JOIN sizes s ON p.id = s.product_id
        WHERE p.category = ?
        GROUP BY p.id
      `, [category], (err, rows) => {
                if (err) reject(err);
                else {
                    const products = rows.map(row => ({
                        ...row,
                        images: row.images ? row.images.split(',') : [],
                        composition: row.composition ? row.composition.split(',') : [],
                        sizes: row.sizes ? row.sizes.split(',').map(size => {
                            const [name, price] = size.split('|');
                            return { name, price: parseInt(price) };
                        }) : []
                    }));
                    resolve(products);
                }
            });
        });
    }

    static async getPopularProducts() {
        return new Promise((resolve, reject) => {
            db.all(`
        SELECT p.*,
               GROUP_CONCAT(DISTINCT i.image_url)              as images,
               GROUP_CONCAT(DISTINCT c.item)                   as composition,
               GROUP_CONCAT(DISTINCT s.name || '|' || s.price) as sizes
        FROM products p
               LEFT JOIN images i ON p.id = i.product_id
               LEFT JOIN compositions c ON p.id = c.product_id
               LEFT JOIN sizes s ON p.id = s.product_id
        WHERE p.popular = 1
        GROUP BY p.id
      `, (err, rows) => {
                if (err) reject(err);
                else {
                    const products = rows.map(row => ({
                        ...row,
                        images: row.images ? row.images.split(',') : [],
                        composition: row.composition ? row.composition.split(',') : [],
                        sizes: row.sizes ? row.sizes.split(',').map(size => {
                            const [name, price] = size.split('|');
                            return { name, price: parseInt(price) };
                        }) : []
                    }));
                    resolve(products);
                }
            });
        });
    }

    static async getCategories() {
        return new Promise((resolve, reject) => {
            db.all(`
        SELECT * FROM categories ORDER BY name
      `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static async getPromos() {
        return new Promise((resolve, reject) => {
            db.all(`
        SELECT * FROM promos WHERE expires_at > datetime('now')
      `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static async getReviews() {
        return new Promise((resolve, reject) => {
            db.all(`
        SELECT * FROM reviews ORDER BY date DESC
      `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    static async getReviewsByProductId(productId) {
        return new Promise((resolve, reject) => {
            db.all(`
        SELECT * FROM reviews 
        WHERE product_id = ? 
        ORDER BY date DESC
      `, [productId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = Database;
