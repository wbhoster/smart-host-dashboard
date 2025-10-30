<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/config.php';

// Ensure table exists (safe to run many times)
$pdo->exec('CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id VARCHAR(64) NULL,
  client_name VARCHAR(255) NULL,
  username VARCHAR(255) NULL,
  phone VARCHAR(32) NOT NULL,
  message TEXT NOT NULL,
  status ENUM("sent","failed") NOT NULL,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;');

$method = $_SERVER['REQUEST_METHOD'];

try {
  switch ($method) {
    case 'GET':
      $page = max(1, (int)($_GET['page'] ?? 1));
      $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
      $offset = ($page - 1) * $limit;

      $total = (int)$pdo->query('SELECT COUNT(*) FROM whatsapp_logs')->fetchColumn();

      $stmt = $pdo->prepare('SELECT id, client_id, client_name, username, phone, message, status, error_message, created_at FROM whatsapp_logs ORDER BY created_at DESC LIMIT ? OFFSET ?');
      $stmt->bindValue(1, $limit, PDO::PARAM_INT);
      $stmt->bindValue(2, $offset, PDO::PARAM_INT);
      $stmt->execute();
      $rows = $stmt->fetchAll();

      echo json_encode(['data' => $rows, 'total' => $total, 'page' => $page, 'limit' => $limit]);
      break;

    case 'POST':
      $data = json_decode(file_get_contents('php://input'), true) ?? [];
      $stmt = $pdo->prepare('INSERT INTO whatsapp_logs (client_id, client_name, username, phone, message, status, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())');
      $stmt->execute([
        $data['clientId'] ?? null,
        $data['clientName'] ?? null,
        $data['username'] ?? null,
        $data['phone'] ?? '',
        $data['message'] ?? '',
        in_array($data['status'] ?? 'sent', ['sent','failed']) ? $data['status'] : 'sent',
        $data['errorMessage'] ?? null,
      ]);
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
