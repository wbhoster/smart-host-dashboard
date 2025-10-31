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
  $apiKeyStmt = $pdo->prepare('SELECT value FROM settings WHERE setting_key = "whatsapp_api_key"');
  $apiKeyStmt->execute();
  $apiKey = $apiKeyStmt->fetchColumn();

  if (!$apiKey) {
    http_response_code(400);
    echo json_encode(['error' => 'WhatsApp API key not configured']);
    exit;
  }

  $statuses = [];

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
      $status = $result['status'] ?? 'sent';
      
      // Update recipient status
      $updateStmt = $pdo->prepare('UPDATE campaign_recipients SET status = ? WHERE message_id = ?');
      
      if ($status === 'delivered') {
        $updateStmt = $pdo->prepare('UPDATE campaign_recipients SET status = ?, delivered_at = NOW() WHERE message_id = ?');
      } elseif ($status === 'read') {
        $updateStmt = $pdo->prepare('UPDATE campaign_recipients SET status = ?, read_at = NOW() WHERE message_id = ?');
      } elseif ($status === 'failed') {
        $updateStmt = $pdo->prepare('UPDATE campaign_recipients SET status = ?, error_message = ? WHERE message_id = ?');
        $updateStmt->execute([$status, $result['error'] ?? 'Unknown error', $messageId]);
        continue;
      }
      
      $updateStmt->execute([$status, $messageId]);
      
      $statuses[$messageId] = $status;
    }

    // Small delay to avoid rate limits
    usleep(50000); // 50ms
  }

  // Update campaign counts from recipients
  $campaignStmt = $pdo->prepare('SELECT DISTINCT campaign_id FROM campaign_recipients WHERE message_id IN (' . implode(',', array_fill(0, count($messageIds), '?')) . ')');
  $campaignStmt->execute($messageIds);
  $campaignIds = $campaignStmt->fetchAll(PDO::FETCH_COLUMN);

  foreach ($campaignIds as $campaignId) {
    $countStmt = $pdo->prepare('SELECT 
      COUNT(CASE WHEN status = "sent" THEN 1 END) as sent,
      COUNT(CASE WHEN status = "delivered" THEN 1 END) as delivered,
      COUNT(CASE WHEN status = "read" THEN 1 END) as read,
      COUNT(CASE WHEN status = "failed" THEN 1 END) as failed
      FROM campaign_recipients WHERE campaign_id = ?');
    $countStmt->execute([$campaignId]);
    $counts = $countStmt->fetch();

    $updateCampaignStmt = $pdo->prepare('UPDATE campaigns SET 
      sent_count = ?,
      delivered_count = ?,
      read_count = ?,
      failed_count = ?
      WHERE id = ?');
    $updateCampaignStmt->execute([
      $counts['sent'],
      $counts['delivered'],
      $counts['read'],
      $counts['failed'],
      $campaignId
    ]);
  }

  echo json_encode([
    'success' => true,
    'statuses' => $statuses
  ]);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
