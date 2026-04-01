# OneCore Concept

OneCore is a product direction for making many devices behave like one coordinated system instead of a set of isolated endpoints.

This direction should not be built from scratch. Earlier aisite work already established the right primitives:

- a central orchestrator
- a capability registry for dynamic routing
- a shared key/value state API
- an append-only event/log stream

The practical goal now is to adapt those primitives from multi-AI orchestration into multi-device orchestration.

## Core idea

Every device keeps its own local runtime, but all devices share the same:

- identity
- policy
- task graph
- state synchronization model
- event stream

The result is a mesh where a phone, laptop, desktop, kiosk, or embedded device can pick up work from the same shared core.

## Existing foundations to reuse

### 1. Orchestrator pattern

The previous architecture already used a hierarchical orchestrator that accepted work, selected the right specialist, and delegated execution. For OneCore, keep the same pattern, but treat devices as execution targets in addition to agents.

### 2. Capability registry

The previous solution already identified capability-based routing as the key scaling mechanism. Reuse that directly for devices. Each device should advertise its available capabilities and runtime state so routing is driven by what the device can do, not by hardcoded device roles.

### 3. Shared state API

There is already a simple key/value persistence model that can act as the first shared state layer. It is enough for:

- current session state
- active task ownership
- selected device
- cross-device handoff metadata

### 4. Event log

There is already an append-style logging mechanism. That should become the basis for:

- audit trail
- device heartbeat history
- task lifecycle history
- sync and reconciliation diagnostics

## Design goals

- One identity across all devices and sessions
- Shared state with fast local reads and conflict-safe sync
- Capabilities discovered dynamically per device
- Tasks routed to the best available device
- Offline-first behavior with delayed reconciliation
- Admin visibility into every device, session, and action

## Reference architecture

```mermaid
flowchart LR
    U[User Identity] --> C[OneCore Control Plane]
    A[Phone] --> E[Event Bus]
    B[Laptop] --> E
    D[Desktop] --> E
    K[Edge Device] --> E
    E --> C
    C --> S[Shared State Store]
    C --> P[Policy Engine]
    C --> R[Task Router]
    R --> A
    R --> B
    R --> D
    R --> K
    C --> O[Observability + Audit]
```

## System layers

### 1. Identity layer

All devices attach to the same user or workspace identity. Device trust, session lifecycle, and access rights are managed centrally.

### 2. Capability layer

Each device advertises what it can do, for example:

- camera
- microphone
- GPU inference
- background sync
- local storage
- large display output

This allows the system to route work by capability instead of hardcoding device roles.

### 3. Sync layer

Each device keeps a local cache and syncs through append-only events plus snapshot materialization. The preferred model is:

- local-first writes
- event sourcing for auditability
- CRDT or version-vector conflict handling where concurrent edits matter
- background reconciliation when connectivity returns

### 4. Orchestration layer

The task router decides where work runs. Example rules:

- notifications go to the phone
- heavy processing goes to the desktop
- camera capture goes to the mobile device
- presentation mode goes to the largest available screen

### 5. Experience layer

The UI should feel like one session that can move between devices. Users should be able to start an action on one device and continue it on another without manual export, relogin, or reconfiguration.

## MVP scope

The smallest credible OneCore-style implementation should include:

1. One shared account across devices
2. Device registration and presence tracking
3. Shared task inbox synchronized in near real time
4. Cross-device handoff for one workflow
5. Unified audit trail of actions and device state

## Suggested stack

- Frontend: responsive web app plus installable PWA shell
- Sync: WebSocket or SSE for live updates, durable queue for retries
- Backend: API plus event log and materialized read models
- Storage: relational database for core entities, append-only event table for history
- Auth: one workspace identity with device-bound sessions
- Observability: per-device heartbeat, action logs, and replayable traces

## Suggested next build sequence

1. Reuse the existing orchestrator model as the OneCore control plane
2. Extend the shared key/value model with device, session, task, and handoff records
3. Use the logging pipeline as an event stream for audit and presence history
4. Build device registration and heartbeat API
5. Add a shared task timeline and cross-device handoff UI
6. Add policy rules that route work based on capability and presence

## What this means for this repository

For `ajna-projects`, the next practical step is to evolve the current static site into a product landing page that explains OneCore as a platform built on already-proven aisite patterns:

- one account
- one control plane
- many devices
- one continuous workflow

After that, the next code step should be a small web prototype with:

- device registration
- shared session state backed by the existing key/value pattern
- live presence indicators derived from heartbeat events
- cross-device task handoff managed by the orchestrator