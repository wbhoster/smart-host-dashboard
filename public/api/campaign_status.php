<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
  if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
  }

  $data = json_decode(file_get_contents('php://input'), true) ?? [];
  $messageIds = $data['messageIds'] ?? [];

  if (empty($messageIds)) {
    echo json_encode(['success' => true, 'statuses' => []]);
    exit;
  }

  // Get API key
  $apiKeyStmt = $pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = "whatsapp_api_key"');
  $apiKeyStmt->execute();
  $apiKey = $apiKeyStmt->fetchColumn();

  if (!$apiKey) {
    http_response_code(400);
    echo json_encode(['error' => 'WhatsApp API key not configured']);
    exit;
  }

  $statuses = [];

  // Check status for each message using 360Messenger API
  foreach ($messageIds as $messageId) {
    $ch = curl_init('https://api.360messenger.com/v2/message/status?id=' . urlencode($messageId));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
      'Authorization: Bearer ' . $apiKey
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
      $result = json_decode($response, true);
      // 360Messenger only provides sent status
      if (isset($result['success']) && $result['success']) {
        $statuses[$messageId] = 'sent';
      }
    }

    // Small delay to avoid rate limits
    usleep(50000); // 50ms
  }

  echo json_encode([
    'success' => true,
    'statuses' => $statuses
  ]);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
