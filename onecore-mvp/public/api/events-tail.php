<?php
$path = __DIR__ . '/../../storage/events.jsonl';
if (!file_exists($path)) {
    echo "No events yet.\n";
    exit;
}

$lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$tail = array_slice($lines, -30);

echo implode(PHP_EOL, $tail);
