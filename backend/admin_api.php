<?php
require_once 'config.php';

$admin = requireAdmin();
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

// ----- STATS -----
if ($action === 'stats' && $method === 'GET') {
    try {
        $totalOrders = $pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();
        $totalRevenue = $pdo->query("SELECT SUM(total) FROM orders")->fetchColumn() ?: 0;
        $totalCustomers = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'user'")->fetchColumn();
        $totalProducts = $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
        $recentOrders = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        $lowStock = $pdo->query("SELECT * FROM products WHERE stock < 10 ORDER BY stock ASC")->fetchAll(PDO::FETCH_ASSOC);

        respond([
            'totalOrders' => (int)$totalOrders,
            'totalRevenue' => (float)$totalRevenue,
            'totalCustomers' => (int)$totalCustomers,
            'totalProducts' => (int)$totalProducts,
            'recentOrders' => $recentOrders,
            'lowStock' => $lowStock
        ]);
    } catch (Exception $e) {
        respond(['error' => 'Stats error: ' . $e->getMessage()], 500);
    }
}

// ----- ADMIN ORDERS -----
elseif ($action === 'admin_orders') {
    if ($method === 'GET') {
        try {
            $status = $_GET['status'] ?? 'all';
            $sql = "SELECT * FROM orders";
            if ($status !== 'all') $sql .= " WHERE status = ?";
            $sql .= " ORDER BY created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($status !== 'all' ? [$status] : []);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($orders as &$order) {
                $stmt2 = $pdo->prepare("SELECT oi.*, p.name, p.image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?");
                $stmt2->execute([$order['id']]);
                $order['items'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);
            }
            respond($orders);
        } catch (Exception $e) {
            respond(['error' => 'Orders error: ' . $e->getMessage()], 500);
        }
    }
    elseif ($method === 'PUT') {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $orderId = (int)($data['order_id'] ?? 0);
            $newStatus = $data['status'] ?? '';
            $allowed = ['pending','processing','shipped','delivered','cancelled'];
            if (!$orderId || !in_array($newStatus, $allowed)) {
                respond(['error' => 'Invalid order or status'], 400);
            }
            $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->execute([$newStatus, $orderId]);
            respond(['success' => true]);
        } catch (Exception $e) {
            respond(['error' => 'Update error: ' . $e->getMessage()], 500);
        }
    }
}

// ----- ADMIN PRODUCTS (FIXED: search by ID) -----
elseif ($action === 'admin_products') {
    if ($method === 'GET') {
        try {
            $search = $_GET['search'] ?? '';
            $sql = "SELECT * FROM products";
            $params = [];
            if (!empty($search)) {
                // If search is numeric, also match exact ID
                if (is_numeric($search)) {
                    $sql .= " WHERE id = ? OR name LIKE ? OR description LIKE ?";
                    $params = [(int)$search, "%$search%", "%$search%"];
                } else {
                    $sql .= " WHERE name LIKE ? OR description LIKE ?";
                    $params = ["%$search%", "%$search%"];
                }
            }
            $sql .= " ORDER BY id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            respond($products);
        } catch (Exception $e) {
            respond(['error' => 'Products error: ' . $e->getMessage()], 500);
        }
    }
    elseif ($method === 'POST') {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $name = trim($data['name'] ?? '');
            $description = trim($data['description'] ?? '');
            $price = (float)($data['price'] ?? 0);
            $category = trim($data['category'] ?? '');
            $stock = (int)($data['stock'] ?? 0);
            $image = trim($data['image'] ?? 'assets/medicines/default.jpg');

            if (empty($name) || $price <= 0) {
                respond(['error' => 'Name and price required'], 400);
            }
            $stmt = $pdo->prepare("INSERT INTO products (name, description, price, category, stock, image) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$name, $description, $price, $category, $stock, $image]);
            respond(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (Exception $e) {
            respond(['error' => 'Add product error: ' . $e->getMessage()], 500);
        }
    }
    elseif ($method === 'PUT') {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = (int)($data['id'] ?? 0);
            $name = trim($data['name'] ?? '');
            $description = trim($data['description'] ?? '');
            $price = (float)($data['price'] ?? 0);
            $category = trim($data['category'] ?? '');
            $stock = (int)($data['stock'] ?? 0);
            $image = trim($data['image'] ?? '');
            if ($id <= 0 || empty($name) || $price <= 0) {
                respond(['error' => 'Invalid data'], 400);
            }
            $stmt = $pdo->prepare("UPDATE products SET name=?, description=?, price=?, category=?, stock=?, image=? WHERE id=?");
            $stmt->execute([$name, $description, $price, $category, $stock, $image, $id]);
            respond(['success' => true]);
        } catch (Exception $e) {
            respond(['error' => 'Update error: ' . $e->getMessage()], 500);
        }
    }
    elseif ($method === 'DELETE') {
        try {
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) respond(['error' => 'Invalid product ID'], 400);
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);
            respond(['success' => true]);
        } catch (Exception $e) {
            respond(['error' => 'Delete error: ' . $e->getMessage()], 500);
        }
    }
}

// ----- ADMIN CUSTOMERS -----
elseif ($action === 'admin_customers' && $method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT id, name, email, phone, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC");
        respond($stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        respond(['error' => 'Customers error: ' . $e->getMessage()], 500);
    }
}

// ----- MESSAGES -----
elseif ($action === 'messages') {
    if ($method === 'GET') {
        try {
            $stmt = $pdo->query("SELECT * FROM messages ORDER BY created_at DESC");
            respond($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (Exception $e) {
            respond(['error' => 'Messages error: ' . $e->getMessage()], 500);
        }
    }
    elseif ($method === 'PUT') {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            $id = (int)($data['id'] ?? 0);
            if ($id <= 0) respond(['error' => 'Invalid message ID'], 400);
            $stmt = $pdo->prepare("UPDATE messages SET read_status = 1 WHERE id = ?");
            $stmt->execute([$id]);
            respond(['success' => true]);
        } catch (Exception $e) {
            respond(['error' => 'Update message error: ' . $e->getMessage()], 500);
        }
    }
    elseif ($method === 'DELETE') {
        try {
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) respond(['error' => 'Invalid message ID'], 400);
            $stmt = $pdo->prepare("DELETE FROM messages WHERE id = ?");
            $stmt->execute([$id]);
            respond(['success' => true]);
        } catch (Exception $e) {
            respond(['error' => 'Delete message error: ' . $e->getMessage()], 500);
        }
    }
}

// ----- DELETE USER -----
elseif ($action === 'delete_user' && $method === 'DELETE') {
    try {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) respond(['error' => 'Invalid user ID'], 400);
        if ($id == $admin['id']) respond(['error' => 'Cannot delete your own account'], 400);
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        respond(['success' => true]);
    } catch (Exception $e) {
        respond(['error' => 'Delete user error: ' . $e->getMessage()], 500);
    }
}

// ----- DELETE ORDER -----
elseif ($action === 'delete_order' && $method === 'DELETE') {
    try {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) respond(['error' => 'Invalid order ID'], 400);
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
        $stmt->execute([$id]);
        respond(['success' => true]);
    } catch (Exception $e) {
        respond(['error' => 'Delete order error: ' . $e->getMessage()], 500);
    }
}

// ----- DEFAULT -----
else {
    respond(['error' => 'Invalid endpoint'], 400);
}
?>