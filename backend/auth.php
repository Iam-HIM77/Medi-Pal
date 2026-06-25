<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';

if ($action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $password = $data['password'] ?? '';
    $confirm = $data['confirm'] ?? '';

    if (empty($name) || empty($email) || empty($password) || empty($confirm)) {
        respond(['success' => false, 'message' => 'All fields required'], 400);
    }
    if ($password !== $confirm) {
        respond(['success' => false, 'message' => 'Passwords do not match'], 400);
    }
    if (strlen($password) < 6) {
        respond(['success' => false, 'message' => 'Password too short'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(['success' => false, 'message' => 'Invalid email'], 400);
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() > 0) {
        respond(['success' => false, 'message' => 'Email already registered'], 409);
    }

    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, 'user')");
    if ($stmt->execute([$name, $email, $phone, $hashed])) {
        respond(['success' => true, 'message' => 'Registration successful']);
    } else {
        respond(['success' => false, 'message' => 'Registration failed'], 500);
    }
}
elseif ($action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        respond(['success' => false, 'message' => 'Email and password required'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_role'] = $user['role'];

        respond([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'role' => $user['role']
            ]
        ]);
    } else {
        respond(['success' => false, 'message' => 'Invalid email or password'], 401);
    }
}
elseif ($action === 'logout') {
    session_destroy();
    respond(['success' => true]);
}
elseif ($action === 'check') {
    $user = getCurrentUser();
    if ($user) {
        respond(['loggedIn' => true, 'user' => $user]);
    } else {
        respond(['loggedIn' => false]);
    }
}
elseif ($action === 'update_profile') {
    $user = getCurrentUser();
    if (!$user) respond(['error' => 'Unauthorized'], 401);

    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');
    $phone = trim($data['phone'] ?? '');

    if (empty($name)) {
        respond(['success' => false, 'message' => 'Name is required'], 400);
    }

    $stmt = $pdo->prepare("UPDATE users SET name = ?, phone = ? WHERE id = ?");
    if ($stmt->execute([$name, $phone, $user['id']])) {
        // Return updated user data
        $stmt = $pdo->prepare("SELECT id, name, email, phone, role FROM users WHERE id = ?");
        $stmt->execute([$user['id']]);
        $updated = $stmt->fetch(PDO::FETCH_ASSOC);
        respond(['success' => true, 'user' => $updated]);
    } else {
        respond(['success' => false, 'message' => 'Update failed'], 500);
    }
}
else {
    respond(['error' => 'Invalid action'], 400);
}
?>