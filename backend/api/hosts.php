<?php
function getHosts($pdo) {
    $stmt = $pdo->query('SELECT * FROM host_urls ORDER BY created_at DESC');
    $hosts = $stmt->fetchAll();
    echo json_encode($hosts);
}

function createHost($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = uniqid('host_', true);
    $createdAt = date('Y-m-d H:i:s');

    $stmt = $pdo->prepare('
        INSERT INTO host_urls (id, url, name, is_active, created_at)
        VALUES (?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $id,
        $data['url'],
        $data['name'],
        $data['isActive'] ? 1 : 0,
        $createdAt
    ]);

    $newHost = [
        'id' => $id,
        'url' => $data['url'],
        'name' => $data['name'],
        'is_active' => $data['isActive'],
        'created_at' => $createdAt
    ];

    http_response_code(201);
    echo json_encode($newHost);
}

function updateHost($pdo, $id) {
    $data = json_decode(file_get_contents('php://input'), true);

    $stmt = $pdo->prepare('
        UPDATE host_urls 
        SET url = ?, name = ?, is_active = ?
        WHERE id = ?
    ');
    
    $stmt->execute([
        $data['url'],
        $data['name'],
        $data['isActive'] ? 1 : 0,
        $id
    ]);

    $stmt = $pdo->prepare('SELECT * FROM host_urls WHERE id = ?');
    $stmt->execute([$id]);
    $updatedHost = $stmt->fetch();

    echo json_encode($updatedHost);
}

function deleteHost($pdo, $id) {
    $stmt = $pdo->prepare('DELETE FROM host_urls WHERE id = ?');
    $stmt->execute([$id]);
    
    http_response_code(204);
}
