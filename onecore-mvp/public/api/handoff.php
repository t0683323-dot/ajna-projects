<?php
require_once __DIR__ . '/_common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json(['error' => 'Method not allowed'], 405);
}

$body = read_request_body();
$taskId = trim((string)($body['taskId'] ?? ''));
$fromDevice = trim((string)($body['fromDevice'] ?? ''));
$toDevice = trim((string)($body['toDevice'] ?? ''));

if ($taskId === '' || $fromDevice === '' || $toDevice === '') {
    send_json(['error' => 'taskId, fromDevice, toDevice are required'], 400);
}

$storePath = __DIR__ . '/../../storage/shared-state.json';
$state = read_json_file($storePath, []);

if (!isset($state['tasks'])) {
    $state['tasks'] = [];
}

if (!isset($state['tasks'][$taskId])) {
    $state['tasks'][$taskId] = [
        'taskId' => $taskId,
        'title' => 'Task ' . $taskId,
        'ownerDevice' => $fromDevice,
        'status' => 'in_progress',
        'updatedAt' => gmdate('c'),
    ];
}

$state['tasks'][$taskId]['ownerDevice'] = $toDevice;
$state['tasks'][$taskId]['updatedAt'] = gmdate('c');
write_json_file($storePath, $state);

append_jsonl(__DIR__ . '/../../storage/events.jsonl', [
    'time' => gmdate('c'),
    'event' => 'task_handoff',
    'deviceId' => $toDevice,
    'payload' => [
        'taskId' => $taskId,
        'fromDevice' => $fromDevice,
        'toDevice' => $toDevice,
    ],
]);

send_json(['status' => 'ok', 'task' => $state['tasks'][$taskId]]);
