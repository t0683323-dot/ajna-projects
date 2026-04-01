<?php
require_once __DIR__ . '/_common.php';

$devicesPath = __DIR__ . '/../../storage/devices.json';
$devices = read_json_file($devicesPath, []);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $maxAgeSec = 45;
    $now = time();
    $result = [];

    foreach ($devices as $deviceId => $device) {
        $lastSeen = isset($device['lastSeen']) ? strtotime($device['lastSeen']) : 0;
        $device['online'] = ($now - $lastSeen) <= $maxAgeSec;
        $result[$deviceId] = $device;
    }

    send_json($result);
}

if ($method === 'POST') {
    $body = read_request_body();
    $deviceId = trim((string)($body['deviceId'] ?? ''));

    if ($deviceId === '') {
        send_json(['error' => 'deviceId is required'], 400);
    }

    $existing = $devices[$deviceId] ?? [];
    $devices[$deviceId] = [
        'deviceId' => $deviceId,
        'displayName' => $body['displayName'] ?? $deviceId,
        'capabilities' => $body['capabilities'] ?? ($existing['capabilities'] ?? []),
        'lastSeen' => gmdate('c'),
    ];

    write_json_file($devicesPath, $devices);
    append_jsonl(__DIR__ . '/../../storage/events.jsonl', [
        'time' => gmdate('c'),
        'event' => 'device_heartbeat',
        'deviceId' => $deviceId,
        'payload' => ['capabilities' => $devices[$deviceId]['capabilities']],
    ]);

    send_json(['status' => 'ok', 'device' => $devices[$deviceId]]);
}

send_json(['error' => 'Method not allowed'], 405);
