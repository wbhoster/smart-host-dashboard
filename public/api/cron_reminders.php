<?php
// Cron endpoint to send reminder messages (pre-expiry: 7 days before, expiry: today)
header('Content-Type: application/json');
require_once __DIR__ . '/config.php';

try {
  // Load API key from settings
  $stmt = $pdo->prepare('SELECT setting_value FROM settings WHERE setting_key = ?');
  $stmt->execute(['whatsapp_api_key']);
  $row = $stmt->fetch();
  $apiKey = $row ? $row['setting_value'] : '';
  if (!$apiKey) { echo json_encode(['error' => 'Missing whatsapp_api_key in settings']); exit; }

  // Fetch templates
  $templates = [];
  foreach (['pre-expiry','expiry'] as $type) {
    $stmt = $pdo->prepare('SELECT message FROM whatsapp_templates WHERE type = ? LIMIT 1');
    $stmt->execute([$type]);
    $templates[$type] = ($stmt->fetch()['message'] ?? '');
  }

  $dateToday = date('Y-m-d');
  $date7 = date('Y-m-d', strtotime('+7 days'));

  $send = function($phone, $text) use ($apiKey) {
    $ch = curl_init('https://api.360messenger.com/v2/sendMessage');
    $payload = ['phonenumber' => $phone, 'text' => $text];
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_POST => true,
      CURLOPT_HTTPHEADER => ["Authorization: Bearer {$apiKey}"],
      CURLOPT_POSTFIELDS => $payload,
      CURLOPT_TIMEOUT => 30,
    ]);
    $resp = curl_exec($ch);
    $err = curl_error($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$status >= 200 && $status < 300, $err ?: $resp];
  };

  // Helper to fill template
  $fill = function($tpl, $client) {
    $replacements = [
      '{fullName}' => $client['full_name'],
      '{username}' => $client['username'],
      '{password}' => $client['password'],
      '{hostUrl}' => $client['host_url'],
      '{expiryDate}' => date('M j, Y', strtotime($client['expiry_date'])),
    ];
    return strtr($tpl, $replacements);
  };

  $processed = 0;

  // Pre-expiry (7 days)
  if (!empty($templates['pre-expiry'])) {
    $stmt = $pdo->prepare("SELECT * FROM clients WHERE DATE(expiry_date) = ? AND status <> 'expired'");
    $stmt->execute([$date7]);
    foreach ($stmt->fetchAll() as $client) {
      $text = $fill($templates['pre-expiry'], $client);
      [$ok, $raw] = $send($client['whatsapp_number'], $text);
      $pdo->prepare('INSERT INTO whatsapp_logs (client_id, client_name, username, phone, message, status, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())')
          ->execute([$client['id'], $client['full_name'], $client['username'], $client['whatsapp_number'], $text, $ok ? 'sent' : 'failed', $ok ? null : $raw]);
      $processed++;
    }
  }

  // Expiry today
  if (!empty($templates['expiry'])) {
    $stmt = $pdo->prepare('SELECT * FROM clients WHERE DATE(expiry_date) = ?');
    $stmt->execute([$dateToday]);
    foreach ($stmt->fetchAll() as $client) {
      $text = $fill($templates['expiry'], $client);
      [$ok, $raw] = $send($client['whatsapp_number'], $text);
      $pdo->prepare('INSERT INTO whatsapp_logs (client_id, client_name, username, phone, message, status, error_message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())')
          ->execute([$client['id'], $client['full_name'], $client['username'], $client['whatsapp_number'], $text, $ok ? 'sent' : 'failed', $ok ? null : $raw]);
      $processed++;
    }
  }

  echo json_encode(['success' => true, 'processed' => $processed]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
