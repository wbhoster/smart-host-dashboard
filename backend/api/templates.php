<?php
function getTemplates($pdo) {
    $stmt = $pdo->query('SELECT * FROM whatsapp_templates');
    $templates = $stmt->fetchAll();
    echo json_encode($templates);
}

function updateTemplate($pdo, $id) {
    $data = json_decode(file_get_contents('php://input'), true);

    $stmt = $pdo->prepare('
        UPDATE whatsapp_templates 
        SET message = ?, updated_at = NOW()
        WHERE id = ?
    ');
    
    $stmt->execute([
        $data['message'],
        $id
    ]);

    $stmt = $pdo->prepare('SELECT * FROM whatsapp_templates WHERE id = ?');
    $stmt->execute([$id]);
    $updatedTemplate = $stmt->fetch();

    echo json_encode($updatedTemplate);
}
