<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$key = isset($_GET['key']) ? trim($_GET['key']) : null;

try {
    switch ($method) {
        case 'GET':
            if (!$key) { http_response_code(400); echo json_encode(['error' => 'Missing key']); break; }
            $stmt = $pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
            $stmt->execute([$key]);
            $row = $stmt->fetch();
            echo json_encode(['value' => $row ? $row['setting_value'] : null]);
            break;
        case 'POST':
            if (!$key) { http_response_code(400); echo json_encode(['error' => 'Missing key']); break; }
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $value = $data['value'] ?? '';
            $stmt = $pdo->prepare('INSERT INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()');
            $stmt->execute([$key, $value]);
            echo json_encode(['success' => true]);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
