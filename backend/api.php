<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ============================
// PUBLIC ENDPOINTS (no login needed)
// ============================

// ----- PRODUCTS -----
if ($action === 'products' && $method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY id");
        $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond($products);
    } catch (Exception $e) {
        respond(['error' => 'Failed to load products: ' . $e->getMessage()], 500);
    }
}

// ----- CONTACT (send message) -----
elseif ($action === 'contact' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $subject = trim($data['subject'] ?? '');
    $message = trim($data['message'] ?? '');

    if (empty($name) || empty($email) || empty($message)) {
        respond(['success' => false, 'message' => 'Name, email and message are required'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(['success' => false, 'message' => 'Invalid email address'], 400);
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$name, $email, $subject, $message])) {
            respond(['success' => true, 'message' => 'Message sent successfully']);
        } else {
            respond(['success' => false, 'message' => 'Failed to send message'], 500);
        }
    } catch (Exception $e) {
        respond(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// ============================
// PROTECTED ENDPOINTS (require login)
// ============================

$user = getCurrentUser();
if (!$user) {
    respond(['error' => 'Unauthorized – please login'], 401);
}

// ----- CART -----
if ($action === 'cart') {
    $userId = $user['id'];

    if ($method === 'GET') {
        $stmt = $pdo->prepare("
            SELECT c.*, p.name, p.price, p.image 
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        ");
        $stmt->execute([$userId]);
        $cart = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond($cart);
    }
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $product_id = intval($data['product_id'] ?? 0);
        $quantity = intval($data['quantity'] ?? 1);
        if ($product_id <= 0 || $quantity <= 0) {
            respond(['error' => 'Invalid product or quantity'], 400);
        }
        $stmt = $pdo->prepare("SELECT stock FROM products WHERE id = ?");
        $stmt->execute([$product_id]);
        $product = $stmt->fetch();
        if (!$product) {
            respond(['error' => 'Product not found'], 404);
        }
        if ($product['stock'] < $quantity) {
            respond(['error' => 'Not enough stock'], 400);
        }
        $stmt = $pdo->prepare("
            INSERT INTO cart (user_id, product_id, quantity) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE quantity = quantity + ?
        ");
        $stmt->execute([$userId, $product_id, $quantity, $quantity]);
        respond(['success' => true, 'message' => 'Added to cart']);
    }
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $product_id = intval($data['product_id'] ?? 0);
        $quantity = intval($data['quantity'] ?? 0);
        if ($product_id <= 0) respond(['error' => 'Invalid product'], 400);
        if ($quantity <= 0) {
            $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?");
            $stmt->execute([$userId, $product_id]);
        } else {
            $stmt = $pdo->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?");
            $stmt->execute([$quantity, $userId, $product_id]);
        }
        respond(['success' => true]);
    }
    elseif ($method === 'DELETE') {
        $product_id = intval($_GET['product_id'] ?? 0);
        if ($product_id <= 0) respond(['error' => 'Invalid product'], 400);
        $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$userId, $product_id]);
        respond(['success' => true]);
    }
}

// ----- ORDERS -----
elseif ($action === 'orders') {
    $userId = $user['id'];
    if ($method === 'GET') {
        $status = $_GET['status'] ?? 'all';
        $sql = "SELECT o.*, 
                       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count 
                FROM orders o 
                WHERE o.user_id = ?";
        if ($status !== 'all') $sql .= " AND o.status = ?";
        $sql .= " ORDER BY o.created_at DESC";
        $stmt = $pdo->prepare($sql);
        if ($status !== 'all') $stmt->execute([$userId, $status]);
        else $stmt->execute([$userId]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($orders as &$order) {
            $stmt2 = $pdo->prepare("SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
            $stmt2->execute([$order['id']]);
            $order['items'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);
        }
        respond($orders);
    }
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $required = ['fullName', 'email', 'phone', 'address', 'city', 'payment'];
        foreach ($required as $field) {
            if (empty($data[$field])) respond(['error' => "Missing field: $field"], 400);
        }
        $stmt = $pdo->prepare("SELECT c.*, p.price, p.name, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?");
        $stmt->execute([$userId]);
        $cartItems = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (empty($cartItems)) respond(['error' => 'Cart is empty'], 400);
        $subtotal = 0;
        foreach ($cartItems as $item) {
            if ($item['stock'] < $item['quantity']) respond(['error' => "Not enough stock for {$item['name']}"], 400);
            $subtotal += $item['price'] * $item['quantity'];
        }
        $delivery = 5.00;
// Use total from frontend if provided, else calculate
        $total = isset($data['total']) ? (float)$data['total'] : ($subtotal + $delivery);
        $orderNumber = generateOrderNumber();
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO orders (user_id, order_number, subtotal, delivery_fee, total, payment_method, delivery_address, city, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
            $stmt->execute([$userId, $orderNumber, $subtotal, $delivery, $total, $data['payment'], $data['address'], $data['city'], $data['phone']]);
            $orderId = $pdo->lastInsertId();
            foreach ($cartItems as $item) {
                $stmt = $pdo->prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
                $stmt->execute([$orderId, $item['product_id'], $item['quantity'], $item['price']]);
                $stmt = $pdo->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
                $stmt->execute([$item['quantity'], $item['product_id']]);
            }
            $stmt = $pdo->prepare("DELETE FROM cart WHERE user_id = ?");
            $stmt->execute([$userId]);
            $pdo->commit();
            $orderData = [
                'id' => $orderId,
                'orderNumber' => $orderNumber,
                'subtotal' => $subtotal,
                'delivery' => $delivery,
                'total' => $total,
                'status' => 'pending',
                'createdAt' => date('Y-m-d H:i:s')
            ];
            respond(['success' => true, 'order' => $orderData]);
        } catch (Exception $e) {
            $pdo->rollBack();
            respond(['error' => 'Order placement failed: ' . $e->getMessage()], 500);
        }
    }
}

// ----- TRACK ORDER -----
elseif ($action === 'track') {
    $identifier = $_GET['id'] ?? '';
    if (empty($identifier)) respond(['error' => 'Order ID or number required'], 400);
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? AND (id = ? OR order_number = ?)");
    $stmt->execute([$user['id'], $identifier, $identifier]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) respond(['error' => 'Order not found'], 404);
    $stmt = $pdo->prepare("SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
    $stmt->execute([$order['id']]);
    $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respond($order);
}

// ----- DEFAULT -----
else {
    respond(['error' => 'Invalid endpoint'], 400);
}
?>