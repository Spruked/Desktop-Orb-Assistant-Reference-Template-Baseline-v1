# ORB LIFECYCLE - Desktop Orb Assistant Reference Template Baseline v1

## ⚠️ IMPORTANT LEGAL NOTICE

**THIS IS NOT AN OPEN SOURCE PROJECT**

This codebase is provided for **reference purposes only** and is **strictly read-only**. No part of this code may be copied, modified, distributed, or used in any commercial or non-commercial projects without explicit written permission from the copyright holder.

### Copyright © 2026 Spruked LLC. All Rights Reserved.

**Patent Pending**: This system incorporates proprietary technologies related to multi-orb operating system architecture.

---

## Orb Lifecycle: Complete State Machine

This document describes the complete lifecycle of an orb within the Dock Station ecosystem, from spawning to shutdown.

### 📋 **Lifecycle Overview**

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│   SPAWNED   │ -> │ MANIFEST_READY  │ -> │  REGISTERED    │ -> │   ACTIVE    │
│             │    │                 │    │                 │    │             │
│ User clicks │    │ Runtime inject  │    │ IPC handshake  │    │ Heartbeat   │
│ "Spawn Orb" │    │ orb manifest    │    │ with Dock      │    │ every 2s    │
└─────────────┘    └─────────────────┘    └─────────────────┘    └─────────────┘
                                                                    │
                                                                    ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐
│  SHUTDOWN   │ <- │   ERROR        │ <- │   TIMEOUT      │ <- │   STALE     │
│             │    │                 │    │                 │    │             │
│ Clean exit  │    │ Recovery       │    │ Auto-recovery  │    │ Heartbeat   │
│             │    │ attempt        │    │ attempt        │    │ missed      │
└─────────────┘    └─────────────────┘    └─────────────────┘    └─────────────┘
```

---

## 🔄 **Phase 1: SPAWNED**

### **Trigger**
- User clicks "Spawn Orb" button in Dock Station UI
- Programmatic spawn via API call
- Tray menu selection

### **Actions**
1. **Window Creation**: Dock Station creates new BrowserWindow
2. **Bundle Loading**: Window loads `orb-[type]/dist/index.html`
3. **React Initialization**: Vite bundle executes, React app starts
4. **Component Mounting**: Orb's main component renders

### **State**
- **UI**: Orb appears on screen (may show loading state)
- **IPC**: Not yet connected
- **Registry**: Not registered
- **Heartbeat**: Not started

### **Duration**
- Typically 1-3 seconds (depends on bundle size)

---

## 🏷️ **Phase 2: MANIFEST_READY**

### **Trigger**
- Orb component's `useEffect` executes
- Manifest injection code runs

### **Actions**
1. **Manifest Creation**: Orb generates unique manifest object
2. **Global Assignment**: `window.__ORB_MANIFEST__ = manifest`
3. **ID Generation**: `orb_id: "[orb-type]_" + Date.now()`
4. **Capability Declaration**: Orb announces its capabilities

### **Manifest Structure**
```typescript
{
  orb_id: "desktop_orb_assistant_1709923456789",
  orb_type: "desktop_orb_assistant",
  plugin_version: "1.0.0",
  capabilities: ["basic-ui"],
  endpoints: { ws: null, rest: null },
  status: { doctrine: "none", drift: 0, ddr: 0, env: 1 }
}
```

### **State**
- **UI**: Orb fully rendered
- **IPC**: Ready to connect
- **Registry**: Still unregistered
- **Heartbeat**: Not started

### **Duration**
- Instantaneous (< 100ms)

---

## 🔌 **Phase 3: REGISTERED**

### **Trigger**
- `window.electronAPI.send('orb-register', manifest)` executes

### **Actions**
1. **IPC Transmission**: Manifest sent to Dock Station main process
2. **Registry Update**: `dockRegistry.register(orbId, manifest)`
3. **State Storage**: Orb added to active orbs map
4. **Logging**: Registration event logged

### **Dock Station Response**
```javascript
ipcMain.on('orb-register', (event, manifest) => {
  dockRegistry.register(manifest.orb_id, manifest);
  console.log(`Orb registered: ${manifest.orb_id}`);
});
```

### **State**
- **UI**: Orb shows "Docked" status
- **IPC**: Bidirectional communication established
- **Registry**: Orb appears in active orbs list
- **Heartbeat**: Still not started

### **Duration**
- Instantaneous (< 50ms)

---

## 💓 **Phase 4: ACTIVE**

### **Trigger**
- Heartbeat interval starts in orb component

### **Actions**
1. **Heartbeat Start**: `setInterval()` begins
2. **Status Updates**: Every 2 seconds, status sent via IPC
3. **Registry Updates**: Dock Station updates orb status
4. **Health Monitoring**: Dock Station tracks orb responsiveness

### **Heartbeat Payload**
```typescript
{
  orb_id: "desktop_orb_assistant_1709923456789",
  status: {
    doctrine: "none",
    drift: 0,
    ddr: 0,
    env: 1
  }
}
```

### **State**
- **UI**: Orb shows green "Docked" indicator
- **IPC**: Active bidirectional communication
- **Registry**: Orb marked as healthy
- **Heartbeat**: Running every 2 seconds

### **Duration**
- Indefinite (until shutdown or error)

---

## ⚠️ **Error States**

### **STALE (Heartbeat Missed)**
- **Trigger**: Heartbeat not received for > 4 seconds
- **Actions**: Dock Station marks orb as stale
- **Recovery**: Automatic transition to ACTIVE on next heartbeat
- **UI**: Orb shows yellow warning indicator

### **TIMEOUT (Extended Failure)**
- **Trigger**: Heartbeat missed for > 10 seconds
- **Actions**: Dock Station attempts auto-recovery
- **Recovery**: Force refresh orb window
- **UI**: Orb shows red error indicator

### **ERROR (Critical Failure)**
- **Trigger**: IPC communication completely lost
- **Actions**: Dock Station logs error, attempts recovery
- **Recovery**: Restart orb process if possible
- **UI**: Orb shows error state

---

## 🛑 **Phase 5: SHUTDOWN**

### **Trigger**
- User closes orb window
- Dock Station initiates shutdown
- Application termination

### **Actions**
1. **Heartbeat Stop**: `clearInterval()` called
2. **IPC Cleanup**: Communication channels closed
3. **Registry Removal**: Orb removed from active orbs
4. **Window Destruction**: BrowserWindow closed
5. **Resource Cleanup**: Memory and handles released

### **Clean Shutdown Sequence**
```typescript
// In orb component
useEffect(() => {
  const heartbeat = setInterval(() => {
    // send heartbeat
  }, 2000);

  return () => {
    clearInterval(heartbeat);
    // cleanup resources
  };
}, []);
```

### **State**
- **UI**: Orb window disappears
- **IPC**: Communication terminated
- **Registry**: Orb removed from active list
- **Heartbeat**: Stopped

---

## 🔍 **Monitoring & Debugging**

### **Health Checks**
- **Heartbeat Monitoring**: Dock Station tracks all active orbs
- **Status Dashboard**: Real-time orb health display
- **Error Logging**: All state transitions logged
- **Performance Metrics**: Response times and resource usage

### **Debug Information**
- **Orb ID**: Unique identifier for tracking
- **Registration Time**: When orb was spawned
- **Last Heartbeat**: Timestamp of last status update
- **Error Count**: Number of recovery attempts
- **Capabilities**: What the orb can do

---

## 📊 **State Transition Table**

| From State | To State | Trigger | Duration |
|------------|----------|---------|----------|
| SPAWNED | MANIFEST_READY | Component mount | < 100ms |
| MANIFEST_READY | REGISTERED | IPC register | < 50ms |
| REGISTERED | ACTIVE | Heartbeat start | Indefinite |
| ACTIVE | STALE | Missed heartbeat | > 4s |
| STALE | ACTIVE | Heartbeat received | Instant |
| ACTIVE | TIMEOUT | Extended failure | > 10s |
| TIMEOUT | ACTIVE | Recovery success | < 2s |
| ANY | ERROR | Critical failure | Variable |
| ERROR | ACTIVE | Recovery success | < 5s |
| ANY | SHUTDOWN | User/window close | < 1s |

---

## 🎯 **Implementation Notes**

### **Thread Safety**
- All IPC communication is asynchronous
- Registry updates are atomic
- Heartbeat timing is independent

### **Error Resilience**
- Network failures don't crash orbs
- IPC disconnections trigger recovery
- Window refreshes maintain state

### **Performance**
- 2-second heartbeat is lightweight
- Registry operations are O(1)
- Window creation is optimized

---

**© 2026 Spruked LLC. All Rights Reserved. Patent Pending.**