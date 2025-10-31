<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
  switch ($method) {
    case 'GET':
      if (!isset($_GET['campaign_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Campaign ID required']);
        exit;
      }

      $page = max(1, (int)($_GET['page'] ?? 1));
      $limit = min(100, max(1, (int)($_GET['limit'] ?? 50)));
      $offset = ($page - 1) * $limit;
      $status = $_GET['status'] ?? null;

      $where = 'WHERE campaign_id = ?';
      $params = [$_GET['campaign_id']];

      if ($status) {
        $where .= ' AND status = ?';
        $params[] = $status;
      }

      $totalStmt = $pdo->prepare("SELECT COUNT(*) FROM campaign_recipients $where");
      $totalStmt->execute($params);
      $total = (int)$totalStmt->fetchColumn();

      $stmt = $pdo->prepare("SELECT * FROM campaign_recipients $where ORDER BY id ASC LIMIT ? OFFSET ?");
      $stmt->execute([...$params, $limit, $offset]);
      $recipients = $stmt->fetchAll();

      echo json_encode([
        'data' => $recipients,
        'total' => $total,
        'page' => $page,
        'limit' => $limit
      ]);
      break;

    case 'POST':
      $data = json_decode(file_get_contents('php://input'), true) ?? [];
      
      // Batch insert recipients
      if (isset($data['recipients']) && is_array($data['recipients'])) {
        $stmt = $pdo->prepare('INSERT INTO campaign_recipients (
          campaign_id, client_id, name, phone, status
        ) VALUES (?, ?, ?, ?, "pending")');

        foreach ($data['recipients'] as $recipient) {
          $stmt->execute([
            $data['campaignId'],
            $recipient['clientId'] ?? null,
            $recipient['name'] ?? '',
            $recipient['phone'] ?? ''
          ]);
        }
      }
      
      echo json_encode(['success' => true]);
      break;

    case 'PUT':
      // Update recipient status
      if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit;
      }

      $data = json_decode(file_get_contents('php://input'), true) ?? [];
      
      $fields = [];
      $values = [];
      
      if (isset($data['messageId'])) { $fields[] = 'message_id = ?'; $values[] = $data['messageId']; }
      if (isset($data['status'])) { $fields[] = 'status = ?'; $values[] = $data['status']; }
      if (isset($data['errorMessage'])) { $fields[] = 'error_message = ?'; $values[] = $data['errorMessage']; }
      
      if ($data['status'] === 'sent') {
        $fields[] = 'sent_at = NOW()';
      } elseif ($data['status'] === 'delivered') {
        $fields[] = 'delivered_at = NOW()';
      } elseif ($data['status'] === 'read') {
        $fields[] = 'read_at = NOW()';
      }

      $values[] = $_GET['id'];
      
      $stmt = $pdo->prepare('UPDATE campaign_recipients SET ' . implode(', ', $fields) . ' WHERE id = ?');
      $stmt->execute($values);
      
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
