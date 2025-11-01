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
  $campaignId = $data['campaignId'] ?? null;
  
  // Optimized batch sizes for each API tier
  // Tier 1: 40/10sec = 4/sec, Tier 2: 70/10sec = 7/sec, Tier 3: 150/10sec = 15/sec
  // We'll use a safe default of 15 per batch with 1-second delay
  $batchSize = min(15, max(1, (int)($data['batchSize'] ?? 15)));

  if (!$campaignId) {
    http_response_code(400);
    echo json_encode(['error' => 'Campaign ID required']);
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

  // Get campaign details
  $campaignStmt = $pdo->prepare('SELECT * FROM campaigns WHERE id = ?');
  $campaignStmt->execute([$campaignId]);
  $campaign = $campaignStmt->fetch();

  if (!$campaign) {
    http_response_code(404);
    echo json_encode(['error' => 'Campaign not found']);
    exit;
  }

  // Get pending recipients (batch)
  $stmt = $pdo->prepare('SELECT * FROM campaign_recipients WHERE campaign_id = ? AND status = "pending" LIMIT ?');
  $stmt->execute([$campaignId, $batchSize]);
  $recipients = $stmt->fetchAll();

  if (empty($recipients)) {
    echo json_encode([
      'success' => true,
      'sent' => 0,
      'completed' => true,
      'message' => 'All messages sent'
    ]);
    exit;
  }

  // Prepare bulk send
  $ch = curl_init('https://api.360messenger.com/v2/sendMessage');
  
  $postData = [
    'text' => $campaign['message']
  ];

  if ($campaign['media_url']) {
    $postData['url'] = $campaign['media_url'];
  }

  // Add phone numbers
  $sentCount = 0;
  $failedCount = 0;
  $messageIds = [];

  foreach ($recipients as $recipient) {
    // Replace placeholders
    $personalizedMessage = str_replace(
      ['{{name}}', '{{phone}}'],
      [$recipient['name'], $recipient['phone']],
      $campaign['message']
    );

    // Send individual message (360Messenger doesn't support true bulk in one request reliably)
    // Format phone number for 360Messenger (remove + prefix)
    $formattedPhone = str_replace('+', '', $recipient['phone']);
    
    $ch = curl_init('https://api.360messenger.com/v2/sendMessage');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
      'Authorization: Bearer ' . $apiKey
    ]);
    
    $postFields = [
      'phonenumber' => $formattedPhone,
      'text' => $personalizedMessage
    ];
    
    // Only add URL if it exists and is not empty
    if (!empty($campaign['media_url'])) {
      $postFields['url'] = $campaign['media_url'];
    }
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postFields));

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($httpCode === 201 || $httpCode === 200) {
      $result = json_decode($response, true);
      
      // Check if API response indicates success
      if (isset($result['success']) && $result['success'] === true) {
        $messageId = $result['data'][0]['id'] ?? null;

        // Update recipient status
        $updateStmt = $pdo->prepare('UPDATE campaign_recipients SET status = "sent", message_id = ?, sent_at = NOW() WHERE id = ?');
        $updateStmt->execute([$messageId, $recipient['id']]);
        
        $sentCount++;
        if ($messageId) {
          $messageIds[] = $messageId;
        }
      } else {
        // API returned 200/201 but with error
        $errorMsg = $result['message'] ?? json_encode($result);
        $updateStmt = $pdo->prepare('UPDATE campaign_recipients SET status = "failed", error_message = ? WHERE id = ?');
        $updateStmt->execute(['API Error: ' . $errorMsg, $recipient['id']]);
        $failedCount++;
      }
    } else {
      // HTTP error
      $errorMsg = $curlError ? $curlError : 'HTTP ' . $httpCode . ': ' . substr($response, 0, 200);
      $updateStmt = $pdo->prepare('UPDATE campaign_recipients SET status = "failed", error_message = ? WHERE id = ?');
      $updateStmt->execute([$errorMsg, $recipient['id']]);
      
      $failedCount++;
    }

    // Small delay to respect rate limits
    // 70ms between requests = ~14 requests/sec, safely within Tier 3 limits
    usleep(70000);
  }

  // Update campaign counts
  $updateCampaignStmt = $pdo->prepare('UPDATE campaigns SET 
    sent_count = sent_count + ?,
    failed_count = failed_count + ?
    WHERE id = ?');
  $updateCampaignStmt->execute([$sentCount, $failedCount, $campaignId]);

  // Check if campaign is complete
  $remainingStmt = $pdo->prepare('SELECT COUNT(*) FROM campaign_recipients WHERE campaign_id = ? AND status = "pending"');
  $remainingStmt->execute([$campaignId]);
  $remaining = (int)$remainingStmt->fetchColumn();

  $isComplete = $remaining === 0;

  if ($isComplete) {
    $completeStmt = $pdo->prepare('UPDATE campaigns SET status = "completed", completed_at = NOW() WHERE id = ?');
    $completeStmt->execute([$campaignId]);
  }

  echo json_encode([
    'success' => true,
    'sent' => $sentCount,
    'failed' => $failedCount,
    'remaining' => $remaining,
    'completed' => $isComplete,
    'messageIds' => $messageIds
  ]);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
