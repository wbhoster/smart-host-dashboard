<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/config.php';

// Create campaigns table
$pdo->exec('CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  media_url VARCHAR(512) NULL,
  media_type ENUM("image","video","pdf","link") NULL,
  target_audience ENUM("all","active","inactive","expired","expiring-soon","csv") NOT NULL,
  status ENUM("draft","scheduled","running","paused","completed","failed") NOT NULL DEFAULT "draft",
  scheduled_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  total_recipients INT NOT NULL DEFAULT 0,
  sent_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;');

// Create campaign_recipients table
$pdo->exec('CREATE TABLE IF NOT EXISTS campaign_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id VARCHAR(64) NOT NULL,
  client_id VARCHAR(64) NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  message_id VARCHAR(128) NULL,
  status ENUM("pending","sent","failed") NOT NULL DEFAULT "pending",
  error_message TEXT NULL,
  sent_at DATETIME NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_campaign_status (campaign_id, status),
  INDEX idx_message_id (message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;');

$method = $_SERVER['REQUEST_METHOD'];

try {
  switch ($method) {
    case 'GET':
      if (isset($_GET['id'])) {
        // Get single campaign
        $stmt = $pdo->prepare('SELECT * FROM campaigns WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        $campaign = $stmt->fetch();
        if (!$campaign) {
          http_response_code(404);
          echo json_encode(['error' => 'Campaign not found']);
          exit;
        }
        // Ensure dates are properly formatted
        if (!$campaign['created_at']) {
          $campaign['created_at'] = date('Y-m-d H:i:s');
        }
        // Ensure counts are integers
        $campaign['total_recipients'] = (int)$campaign['total_recipients'];
        $campaign['sent_count'] = (int)$campaign['sent_count'];
        $campaign['failed_count'] = (int)$campaign['failed_count'];
        
        echo json_encode($campaign);
      } else {
        // Get all campaigns
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = $_GET['search'] ?? '';

        $where = '';
        $params = [];
        if ($search) {
          $where = 'WHERE title LIKE ?';
          $params[] = "%$search%";
        }

        $totalStmt = $pdo->prepare("SELECT COUNT(*) FROM campaigns $where");
        $totalStmt->execute($params);
        $total = (int)$totalStmt->fetchColumn();

        $stmt = $pdo->prepare("SELECT * FROM campaigns $where ORDER BY created_at DESC LIMIT ? OFFSET ?");
        $stmt->execute([...$params, $limit, $offset]);
        $campaigns = $stmt->fetchAll();

        // Ensure all campaigns have proper data types and valid dates
        foreach ($campaigns as &$campaign) {
          if (!$campaign['created_at']) {
            $campaign['created_at'] = date('Y-m-d H:i:s');
          }
          $campaign['total_recipients'] = (int)$campaign['total_recipients'];
          $campaign['sent_count'] = (int)$campaign['sent_count'];
          $campaign['failed_count'] = (int)$campaign['failed_count'];
        }

        echo json_encode([
          'data' => $campaigns,
          'total' => $total,
          'page' => $page,
          'limit' => $limit
        ]);
      }
      break;

    case 'POST':
      $data = json_decode(file_get_contents('php://input'), true) ?? [];
      
      $id = $data['id'] ?? uniqid('camp_', true);
      $scheduledAt = null;
      if (!empty($data['scheduledAt'])) {
        $scheduledAt = date('Y-m-d H:i:s', strtotime($data['scheduledAt']));
      }
      
      $stmt = $pdo->prepare('INSERT INTO campaigns (
        id, title, message, media_url, media_type, target_audience, 
        status, scheduled_at, created_at, total_recipients
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)');
      
      $stmt->execute([
        $id,
        $data['title'] ?? '',
        $data['message'] ?? '',
        $data['mediaUrl'] ?? null,
        $data['mediaType'] ?? null,
        $data['targetAudience'] ?? 'all',
        $data['status'] ?? 'draft',
        $scheduledAt,
        $data['totalRecipients'] ?? 0
      ]);
      
      echo json_encode(['success' => true, 'id' => $id]);
      break;

    case 'PUT':
      if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit;
      }

      $data = json_decode(file_get_contents('php://input'), true) ?? [];
      
      $fields = [];
      $values = [];
      
      if (isset($data['title'])) { $fields[] = 'title = ?'; $values[] = $data['title']; }
      if (isset($data['message'])) { $fields[] = 'message = ?'; $values[] = $data['message']; }
      if (isset($data['mediaUrl'])) { $fields[] = 'media_url = ?'; $values[] = $data['mediaUrl']; }
      if (isset($data['mediaType'])) { $fields[] = 'media_type = ?'; $values[] = $data['mediaType']; }
      if (isset($data['status'])) { 
        $fields[] = 'status = ?'; 
        $values[] = $data['status'];
        if ($data['status'] === 'completed') {
          $fields[] = 'completed_at = NOW()';
        }
      }
      if (isset($data['scheduledAt'])) {
        $scheduledAt = null;
        if (!empty($data['scheduledAt'])) {
          $scheduledAt = date('Y-m-d H:i:s', strtotime($data['scheduledAt']));
        }
        $fields[] = 'scheduled_at = ?'; 
        $values[] = $scheduledAt;
      }
      if (isset($data['totalRecipients'])) { $fields[] = 'total_recipients = ?'; $values[] = $data['totalRecipients']; }
      if (isset($data['sentCount'])) { $fields[] = 'sent_count = ?'; $values[] = $data['sentCount']; }
      if (isset($data['failedCount'])) { $fields[] = 'failed_count = ?'; $values[] = $data['failedCount']; }

      $values[] = $_GET['id'];
      
      $stmt = $pdo->prepare('UPDATE campaigns SET ' . implode(', ', $fields) . ' WHERE id = ?');
      $stmt->execute($values);
      
      echo json_encode(['success' => true]);
      break;

    case 'DELETE':
      if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'ID required']);
        exit;
      }

      $stmt = $pdo->prepare('DELETE FROM campaigns WHERE id = ?');
      $stmt->execute([$_GET['id']]);
      
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
