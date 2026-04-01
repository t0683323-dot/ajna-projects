# OneCore MVP

This MVP reuses the prepared AISITE primitives:

- shared key/value state (`save.php`)
- append-only event log (`log.php`)
- device registry + heartbeat (`devices.php`)
- task handoff (`handoff.php`)

## Run

```bash
cd onecore-mvp
php -S localhost:8088 -t public
```

Open `http://localhost:8088`.

### Windows recommended run (auto PHP detection)

From repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\start-onecore-mvp.ps1
```

This script tries `php` from PATH first, then WinGet PHP locations.

### VS Code task

Run task: `OneCore MVP: Start Server`

## What to test

1. Register one device (or two browser tabs with different device IDs).
2. Enable auto heartbeat on at least one device.
3. Execute handoff from one device to another.
4. Confirm updates in:
   - Current Devices
   - Shared State (tasks)
   - Event Log (tail)

## Storage files

Data is stored in `onecore-mvp/storage`:

- `devices.json`
- `shared-state.json`
- `events.jsonl`

No database is required for this prototype.
