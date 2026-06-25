-- ============================================
-- 1. DROP DATABASE IF EXISTS
-- ============================================
DROP DATABASE IF EXISTS medipal;

-- ============================================
-- 2. CREATE DATABASE
-- ============================================
CREATE DATABASE medipal
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE medipal;

-- ============================================
-- 3. USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    stock INT DEFAULT 0,
    image VARCHAR(255) DEFAULT 'assets/medicines/default.jpg',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. CART TABLE (with ON DELETE CASCADE)
-- ============================================
CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (user_id, product_id)
);

-- ============================================
-- 6. ORDERS TABLE (with ON DELETE CASCADE for user)
-- ============================================
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 5.00,
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pending','processing','shipped','delivered','cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50),
    delivery_address TEXT,
    city VARCHAR(50),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 7. ORDER ITEMS (with ON DELETE CASCADE)
-- ============================================
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- 9. MESSAGES TABLE (for contact form)
-- ============================================
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    read_status TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. SEED DATA
-- ============================================

-- Admin user (password = "password" hashed)
INSERT INTO users (name, email, phone, password, role) VALUES
('Admin User', 'admin@medipal.com', '0240000000', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Sample products (for homepage featured set)
INSERT INTO products (name, description, price, category, stock, image) VALUES
('Paracetamol', 'Used for fever and pain relief', 10.00, 'Pain Relief', 50, 'assets/medicines/para.webp'),
('Vitamin C', 'Boosts immune system', 15.00, 'Vitamins', 30, 'assets/medicines/vitamin-c.jpg'),
('Amoxicillin', 'For treating bacterial infections', 25.00, 'Antibiotics', 20, 'assets/medicines/amoxicillin.jpg'),
('Gebedol', 'Used for pain relief', 15.00, 'Pain Relief', 40, 'assets/medicines/gebedol.jpg'),
('Amuzu', 'Improves blood circulation', 50.00, 'Herbal', 10, 'assets/medicines/amuzu.jpg'),
('Agbeve', 'Boosts immune system', 70.00, 'Herbal', 5, 'assets/medicines/agbeve.jpg'),
('Time', 'Malaria treatment', 32.00, 'Antimalarial', 25, 'assets/medicines/time.jpg'),
('Kwik Action', 'Immediate symptoms relief', 60.00, 'Pain Relief', 0, 'assets/medicines/kwik.jpg');

