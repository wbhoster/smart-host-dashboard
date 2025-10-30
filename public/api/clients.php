<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

function toCamel(array $row) {
    return [
        'id' => $row['id'],
        'fullName' => $row['full_name'],
        'username' => $row['username'],
        'password' => $row['password'],
        'hostUrl' => $row['host_url'],
        'packageDuration' => (int)$row['package_duration'],
        'createdAt' => $row['created_at'],
        'expiryDate' => $row['expiry_date'],
        'status' => $row['status'],
        'whatsappNumber' => $row['whatsapp_number'],
    ];
}

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query('SELECT id, full_name, username, password, host_url, package_duration, created_at, expiry_date, status, whatsapp_number FROM clients ORDER BY created_at DESC');
            $rows = $stmt->fetchAll();
            echo json_encode(array_map('toCamel', $rows));
            break;
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $stmt = $pdo->prepare('INSERT INTO clients (id, full_name, username, password, host_url, package_duration, created_at, expiry_date, status, whatsapp_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([
                $data['id'] ?? uniqid('client-'),
                $data['fullName'] ?? '',
                $data['username'] ?? '',
                $data['password'] ?? '',
                $data['hostUrl'] ?? '',
                (int)($data['packageDuration'] ?? 1),
                $data['createdAt'] ?? date('Y-m-d H:i:s'),
                $data['expiryDate'] ?? date('Y-m-d H:i:s'),
                $data['status'] ?? 'active',
                $data['whatsappNumber'] ?? '',
            ]);
            echo json_encode(['success' => true]);
            break;
        case 'PUT':
            $id = $_GET['id'] ?? null;
            if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); break; }
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            $stmt = $pdo->prepare('UPDATE clients SET full_name = ?, username = ?, password = ?, host_url = ?, package_duration = ?, created_at = ?, expiry_date = ?, status = ?, whatsapp_number = ? WHERE id = ?');
            $stmt->execute([
                $data['fullName'] ?? '',
                $data['username'] ?? '',
                $data['password'] ?? '',
                $data['hostUrl'] ?? '',
                (int)($data['packageDuration'] ?? 1),
                $data['createdAt'] ?? date('Y-m-d H:i:s'),
                $data['expiryDate'] ?? date('Y-m-d H:i:s'),
                $data['status'] ?? 'active',
                $data['whatsappNumber'] ?? '',
                $id,
            ]);
            echo json_encode(['success' => true]);
            break;
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); break; }
            $stmt = $pdo->prepare('DELETE FROM clients WHERE id = ?');
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
