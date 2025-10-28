<?php
// public/index.php - Simple router using Twig. Run with: php -S localhost:8000 -t public
require_once __DIR__ . '/../vendor/autoload.php';

use Twig\Environment;
use Twig\Loader\FilesystemLoader;

$loader = new FilesystemLoader(__DIR__ . '/../templates');
$twig = new Environment($loader);

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$routes = [
    '/' => 'landing.twig',
    '/auth/login' => 'auth_login.twig',
    '/auth/signup' => 'auth_signup.twig',
    '/dashboard' => 'dashboard.twig',
    '/tickets' => 'tickets.twig'
];

if (array_key_exists($uri, $routes)) {
    echo $twig->render($routes[$uri], ['base' => '/']);
    exit;
}

// serve assets directly if path exists in public
$file = __DIR__ . $uri;
if (file_exists($file) && is_file($file)) {
    return false; // let PHP built-in server serve the file
}

// fallback 404
http_response_code(404);
echo $twig->render('404.twig', ['base' => '/']);
