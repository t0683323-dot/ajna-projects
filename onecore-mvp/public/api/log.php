<?php
require_once __DIR__ . '/_common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['error' => 'Method not allowed'], 405);
}

$body = read_request_body();
$entry = [
    'time' => gmdate('c'),
    'event' => $body['event'] ?? 'unknown_event',
    'deviceId' => $body['deviceId'] ?? null,
    'payload' => $body['payload'] ?? [],
];

append_jsonl(__DIR__ . '/../../storage/events.jsonl', $entry);
send_json(['status' => 'ok']);
