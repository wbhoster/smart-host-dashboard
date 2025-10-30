<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

function hostToCamel(array $row) {
    return [
        'id' => $row['id'],
        'url' => $row['url'],
        'name' => $row['name'],
        'isActive' => (bool)$row['is_active'],
    ];
}

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query('SELECT id, url, name, is_active FROM host_urls ORDER BY created_at DESC');
            $rows = $stmt->fetchAll();
            echo json_encode(array_map('hostToCamel', $rows));
            break;
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $stmt = $pdo->prepare('INSERT INTO host_urls (id, url, name, is_active) VALUES (?, ?, ?, ?)');
            $stmt->execute([
                $data['id'] ?? uniqid('host-'),
                $data['url'] ?? '',
                $data['name'] ?? '',
                isset($data['isActive']) ? (int)(bool)$data['isActive'] : 1,
            ]);
            echo json_encode(['success' => true]);
            break;
        case 'PUT':
            $id = $_GET['id'] ?? null;
            if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); break; }
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $stmt = $pdo->prepare('UPDATE host_urls SET url = ?, name = ?, is_active = ? WHERE id = ?');
            $stmt->execute([
                $data['url'] ?? '',
                $data['name'] ?? '',
                isset($data['isActive']) ? (int)(bool)$data['isActive'] : 1,
                $id,
            ]);
            echo json_encode(['success' => true]);
            break;
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); break; }
            $stmt = $pdo->prepare('DELETE FROM host_urls WHERE id = ?');
            $stmt->execute([$id]);
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
