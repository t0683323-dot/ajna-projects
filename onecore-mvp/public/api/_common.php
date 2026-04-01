<?php
function read_json_file($path, $default) {
    if (!file_exists($path)) {
        return $default;
    }
    $raw = file_get_contents($path);
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $default;
}

function write_json_file($path, $data) {
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
}

function append_jsonl($path, $entry) {
    $dir = dirname($path);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
    file_put_contents($path, json_encode($entry) . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function send_json($payload, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($payload);
    exit;
}

function read_request_body() {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        send_json(['error' => 'Invalid JSON body'], 400);
    }
    return $decoded;
}
