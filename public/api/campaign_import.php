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
  $csvData = $data['csvData'] ?? null;

  if (!$csvData) {
    http_response_code(400);
    echo json_encode(['error' => 'CSV data required']);
    exit;
  }

  // Parse CSV
  $lines = explode("\n", $csvData);
  $contacts = [];
  $errors = [];

  foreach ($lines as $index => $line) {
    $line = trim($line);
    if (empty($line)) continue;

    $fields = str_getcsv($line);
    
    // Skip header row if it looks like a header
    if ($index === 0 && (strtolower($fields[0]) === 'name' || strtolower($fields[0]) === 'fullname')) {
      continue;
    }

    if (count($fields) < 2) {
      $errors[] = "Line " . ($index + 1) . ": Not enough fields";
      continue;
    }

    $name = trim($fields[0]);
    $phone = trim($fields[1]);

    // Validate and format phone number
    // Remove all non-numeric characters except +
    $phone = preg_replace('/[^0-9+]/', '', $phone);

    // Add country code if missing (assuming Pakistan +92)
    if (!str_starts_with($phone, '+')) {
      if (str_starts_with($phone, '92')) {
        $phone = '+' . $phone;
      } elseif (str_starts_with($phone, '0')) {
        $phone = '+92' . substr($phone, 1);
      } else {
        $phone = '+92' . $phone;
      }
    }

    // Validate phone format
    if (!preg_match('/^\+[1-9]\d{1,14}$/', $phone)) {
      $errors[] = "Line " . ($index + 1) . ": Invalid phone number format - $phone";
      continue;
    }

    $contacts[] = [
      'name' => $name,
      'phone' => $phone
    ];
  }

  echo json_encode([
    'success' => true,
    'contacts' => $contacts,
    'total' => count($contacts),
    'errors' => $errors
  ]);

} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}
