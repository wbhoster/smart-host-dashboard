<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load database configuration
require_once __DIR__ . '/config/database.php';

// Get the request URI and method
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string and base path
$path = parse_url($requestUri, PHP_URL_PATH);
$path = str_replace('/api', '', $path);

// Route the request
try {
    switch (true) {
        // Auth routes
        case $path === '/auth/login' && $requestMethod === 'POST':
            require __DIR__ . '/api/auth.php';
            handleLogin($pdo);
            break;
        case $path === '/auth/logout' && $requestMethod === 'POST':
            require __DIR__ . '/api/auth.php';
            handleLogout();
            break;
        case $path === '/auth/check' && $requestMethod === 'GET':
            require __DIR__ . '/api/auth.php';
            handleAuthCheck();
            break;

        // Client routes
        case $path === '/clients' && $requestMethod === 'GET':
            require __DIR__ . '/api/clients.php';
            getClients($pdo);
            break;
        case $path === '/clients' && $requestMethod === 'POST':
            require __DIR__ . '/api/clients.php';
            createClient($pdo);
            break;
        case preg_match('/^\/clients\/([a-zA-Z0-9-]+)$/', $path, $matches) && $requestMethod === 'PUT':
            require __DIR__ . '/api/clients.php';
            updateClient($pdo, $matches[1]);
            break;
        case preg_match('/^\/clients\/([a-zA-Z0-9-]+)$/', $path, $matches) && $requestMethod === 'DELETE':
            require __DIR__ . '/api/clients.php';
            deleteClient($pdo, $matches[1]);
            break;
        case preg_match('/^\/clients\/([a-zA-Z0-9-]+)\/renew$/', $path, $matches) && $requestMethod === 'POST':
            require __DIR__ . '/api/clients.php';
            renewClient($pdo, $matches[1]);
            break;

        // Host routes
        case $path === '/hosts' && $requestMethod === 'GET':
            require __DIR__ . '/api/hosts.php';
            getHosts($pdo);
            break;
        case $path === '/hosts' && $requestMethod === 'POST':
            require __DIR__ . '/api/hosts.php';
            createHost($pdo);
            break;
        case preg_match('/^\/hosts\/([a-zA-Z0-9-]+)$/', $path, $matches) && $requestMethod === 'PUT':
            require __DIR__ . '/api/hosts.php';
            updateHost($pdo, $matches[1]);
            break;
        case preg_match('/^\/hosts\/([a-zA-Z0-9-]+)$/', $path, $matches) && $requestMethod === 'DELETE':
            require __DIR__ . '/api/hosts.php';
            deleteHost($pdo, $matches[1]);
            break;

        // Template routes
        case $path === '/templates' && $requestMethod === 'GET':
            require __DIR__ . '/api/templates.php';
            getTemplates($pdo);
            break;
        case preg_match('/^\/templates\/([a-zA-Z0-9-]+)$/', $path, $matches) && $requestMethod === 'PUT':
            require __DIR__ . '/api/templates.php';
            updateTemplate($pdo, $matches[1]);
            break;

        // Settings routes
        case $path === '/settings' && $requestMethod === 'GET':
            require __DIR__ . '/api/settings.php';
            getSettings($pdo);
            break;
        case $path === '/settings' && $requestMethod === 'PUT':
            require __DIR__ . '/api/settings.php';
            updateSettings($pdo);
            break;

        // Health check
        case $path === '/health' && $requestMethod === 'GET':
            echo json_encode(['status' => 'OK', 'timestamp' => date('c')]);
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
