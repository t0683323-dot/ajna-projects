<?php
require_once __DIR__ . '/_common.php';

$storePath = __DIR__ . '/../../storage/shared-state.json';
$state = read_json_file($storePath, []);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $key = $_GET['key'] ?? '';
    if ($key === '') {
        send_json(['error' => 'Missing key'], 400);
    }
    if (!array_key_exists($key, $state)) {
        send_json(['error' => 'Key not found'], 404);
    }
    send_json($state[$key]);
}

if ($method === 'POST') {
    $body = read_request_body();
    $key = $body['key'] ?? '';
    $value = $body['value'] ?? null;

    if ($key === '' || $value === null) {
        send_json(['error' => 'Body must include key and value'], 400);
    }

    $state[$key] = $value;
    write_json_file($storePath, $state);
    send_json(['status' => 'ok', 'key' => $key]);
}

send_json(['error' => 'Method not allowed'], 405);
