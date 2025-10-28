<?php
function getClients($pdo) {
    $stmt = $pdo->query('SELECT * FROM clients ORDER BY created_at DESC');
    $clients = $stmt->fetchAll();
    echo json_encode($clients);
}

function createClient($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = uniqid('client_', true);
    $createdAt = date('Y-m-d H:i:s');
    $expiryDate = date('Y-m-d H:i:s', strtotime("+{$data['packageDuration']} months"));
    
    // Calculate status
    $daysUntilExpiry = (strtotime($expiryDate) - time()) / (60 * 60 * 24);
    if ($daysUntilExpiry < 0) {
        $status = 'expired';
    } elseif ($daysUntilExpiry <= 7) {
        $status = 'expiring-soon';
    } else {
        $status = 'active';
    }

    $stmt = $pdo->prepare('
        INSERT INTO clients (id, full_name, username, password, host_url, package_duration, 
                           created_at, expiry_date, status, whatsapp_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $id,
        $data['fullName'],
        $data['username'],
        $data['password'],
        $data['hostUrl'],
        $data['packageDuration'],
        $createdAt,
        $expiryDate,
        $status,
        $data['whatsappNumber']
    ]);

    $newClient = [
        'id' => $id,
        'full_name' => $data['fullName'],
        'username' => $data['username'],
        'password' => $data['password'],
        'host_url' => $data['hostUrl'],
        'package_duration' => $data['packageDuration'],
        'created_at' => $createdAt,
        'expiry_date' => $expiryDate,
        'status' => $status,
        'whatsapp_number' => $data['whatsappNumber']
    ];

    http_response_code(201);
    echo json_encode($newClient);
}

function updateClient($pdo, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Calculate new expiry date if package duration changed
    $stmt = $pdo->prepare('SELECT created_at FROM clients WHERE id = ?');
    $stmt->execute([$id]);
    $client = $stmt->fetch();
    
    $expiryDate = date('Y-m-d H:i:s', strtotime($client['created_at'] . " +{$data['packageDuration']} months"));
    
    // Calculate status
    $daysUntilExpiry = (strtotime($expiryDate) - time()) / (60 * 60 * 24);
    if ($daysUntilExpiry < 0) {
        $status = 'expired';
    } elseif ($daysUntilExpiry <= 7) {
        $status = 'expiring-soon';
    } else {
        $status = 'active';
    }

    $stmt = $pdo->prepare('
        UPDATE clients 
        SET full_name = ?, username = ?, password = ?, host_url = ?, 
            package_duration = ?, expiry_date = ?, status = ?, whatsapp_number = ?
        WHERE id = ?
    ');
    
    $stmt->execute([
        $data['fullName'],
        $data['username'],
        $data['password'],
        $data['hostUrl'],
        $data['packageDuration'],
        $expiryDate,
        $status,
        $data['whatsappNumber'],
        $id
    ]);

    $stmt = $pdo->prepare('SELECT * FROM clients WHERE id = ?');
    $stmt->execute([$id]);
    $updatedClient = $stmt->fetch();

    echo json_encode($updatedClient);
}

function deleteClient($pdo, $id) {
    $stmt = $pdo->prepare('DELETE FROM clients WHERE id = ?');
    $stmt->execute([$id]);
    
    http_response_code(204);
}

function renewClient($pdo, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $newExpiryDate = date('Y-m-d H:i:s', strtotime("+{$data['months']} months"));
    
    $stmt = $pdo->prepare('
        UPDATE clients 
        SET expiry_date = ?, status = ?, package_duration = package_duration + ?
        WHERE id = ?
    ');
    
    $stmt->execute([$newExpiryDate, 'active', $data['months'], $id]);

    $stmt = $pdo->prepare('SELECT * FROM clients WHERE id = ?');
    $stmt->execute([$id]);
    $updatedClient = $stmt->fetch();

    echo json_encode($updatedClient);
}
