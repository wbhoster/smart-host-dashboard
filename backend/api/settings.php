<?php
function getSettings($pdo) {
    $stmt = $pdo->query('SELECT * FROM settings');
    $settings = $stmt->fetchAll();
    
    $result = [];
    foreach ($settings as $setting) {
        $result[$setting['setting_key']] = $setting['setting_value'];
    }
    
    echo json_encode($result);
}

function updateSettings($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);

    foreach ($data as $key => $value) {
        $stmt = $pdo->prepare('
            INSERT INTO settings (setting_key, setting_value, updated_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()
        ');
        
        $stmt->execute([$key, $value, $value]);
    }

    echo json_encode(['success' => true]);
}
