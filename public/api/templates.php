<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query('SELECT id, type, name, message FROM whatsapp_templates');
            $rows = $stmt->fetchAll();
            echo json_encode($rows);
            break;
        case 'PUT':
            $id = $_GET['id'] ?? null;
            if (!$id) { http_response_code(400); echo json_encode(['error' => 'Missing id']); break; }
            $data = json_decode(file_get_contents('php://input'), true) ?? [];
            if (!isset($data['message'])) { http_response_code(400); echo json_encode(['error' => 'Missing message']); break; }
            $stmt = $pdo->prepare('UPDATE whatsapp_templates SET message = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$data['message'], $id]);
            $stmt = $pdo->prepare('SELECT id, type, name, message FROM whatsapp_templates WHERE id = ?');
            $stmt->execute([$id]);
            echo json_encode($stmt->fetch());
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
