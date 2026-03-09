# IPC CONTRACT - Desktop Orb Assistant Reference Template Baseline v1

## ⚠️ IMPORTANT LEGAL NOTICE

**THIS IS NOT AN OPEN SOURCE PROJECT**

This codebase is provided for **reference purposes only** and is **strictly read-only**. No part of this code may be copied, modified, distributed, or used in any commercial or non-commercial projects without explicit written permission from the copyright holder.

### Copyright © 2026 Spruked LLC. All Rights Reserved.

**Patent Pending**: This system incorporates proprietary technologies related to multi-orb operating system architecture.

---

## Inter-Process Communication Contract

This document specifies the complete IPC (Inter-Process Communication) contract between orbs (renderer processes) and the Dock Station (main Electron process).

### 🔒 **Security Model**

- **Context Isolation**: Enabled (`contextIsolation: true`)
- **Secure Bridge**: Only whitelisted channels allowed
- **No Direct Access**: Renderer cannot access Node.js APIs directly
- **Preload Script**: `preload.js` provides secure `window.electronAPI`

---

## 📡 **Available IPC Channels**

### **Renderer → Main (Send Only)**

#### **`orb-register`**
**Purpose**: Initial orb registration with Dock Station

**Payload**:
```typescript
{
  orb_id: string;           // Unique identifier: "[orb-type]_[timestamp]"
  orb_type: string;         // Orb type identifier
  plugin_version: string;   // Semantic version string
  capabilities: string[];   // Array of capability strings
  endpoints: {
    ws: string | null;      // WebSocket endpoint URL or null
    rest: string | null;    // REST API endpoint URL or null
  };
  status: {
    doctrine: string;       // Current doctrine ("none", "empirical", etc.)
    drift: number;          // Epistemic drift metric (0.0 - 1.0)
    ddr: number;            // Doctrine drift rate
    env: number;            // Environment confidence (0-1)
  };
}
```

**Example**:
```typescript
window.electronAPI.send('orb-register', {
  orb_id: "desktop_orb_assistant_1709923456789",
  orb_type: "desktop_orb_assistant",
  plugin_version: "1.0.0",
  capabilities: ["basic-ui"],
  endpoints: { ws: null, rest: null },
  status: { doctrine: "none", drift: 0, ddr: 0, env: 1 }
});
```

**Frequency**: Once per orb lifetime (on spawn)

---

#### **`orb-status`**
**Purpose**: Recurring heartbeat and status updates

**Payload**:
```typescript
{
  orb_id: string;           // Same ID from registration
  status: {
    doctrine: string;       // Current doctrine state
    drift: number;          // Epistemic drift (0.0 - 1.0)
    ddr: number;            // Doctrine drift rate
    env: number;            // Environment confidence (0-1)
  };
}
```

**Example**:
```typescript
window.electronAPI.send('orb-status', {
  orb_id: "desktop_orb_assistant_1709923456789",
  status: {
    doctrine: "none",
    drift: 0.05,
    ddr: 0.01,
    env: 0.95
  }
});
```

**Frequency**: Every 2 seconds (heartbeat interval)

---

### **Main → Renderer (Listen Only)**

#### **`orb-registered`** *(Future Use)*
**Purpose**: Confirmation of successful registration

**Payload**:
```typescript
{
  orb_id: string;
  success: boolean;
  timestamp: number;
}
```

#### **`orb-status-updated`** *(Future Use)*
**Purpose**: Status update acknowledgments

**Payload**:
```typescript
{
  orb_id: string;
  acknowledged: boolean;
  timestamp: number;
}
```

---

## 🔧 **Preload Script Implementation**

```javascript
// preload.js
import { contextBridge, ipcRenderer } from 'electron';

// Whitelist of allowed channels
const validSendChannels = ['orb-register', 'orb-status'];
const validReceiveChannels = ['orb-registered', 'orb-status-updated'];

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    } else {
      console.error(`Invalid IPC channel: ${channel}`);
    }
  },

  on: (channel, func) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },

  once: (channel, func) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    }
  }
});
```

---

## 🎯 **Main Process Handlers**

```javascript
// main.js
import { ipcMain } from 'electron';

// Orb registration handler
ipcMain.on('orb-register', (event, manifest) => {
  try {
    dockRegistry.register(manifest.orb_id, manifest);
    console.log(`Orb registered: ${manifest.orb_id}`);

    // Optional: Send confirmation back to renderer
    // event.sender.send('orb-registered', {
    //   orb_id: manifest.orb_id,
    //   success: true,
    //   timestamp: Date.now()
    // });
  } catch (error) {
    console.error('Registration failed:', error);
    // event.sender.send('orb-registered', {
    //   orb_id: manifest.orb_id,
    //   success: false,
    //   error: error.message,
    //   timestamp: Date.now()
    // });
  }
});

// Status update handler
ipcMain.on('orb-status', (event, data) => {
  try {
    dockRegistry.updateStatus(data.orb_id, data.status);

    // Optional: Send acknowledgment
    // event.sender.send('orb-status-updated', {
    //   orb_id: data.orb_id,
    //   acknowledged: true,
    //   timestamp: Date.now()
    // });
  } catch (error) {
    console.error('Status update failed:', error);
  }
});
```

---

## 📊 **Data Validation**

### **Orb ID Format**
- **Pattern**: `[orb_type]_[timestamp]`
- **Example**: `desktop_orb_assistant_1709923456789`
- **Uniqueness**: Guaranteed by timestamp
- **Length**: Variable, but typically 30-50 characters

### **Capability Strings** *(Draft)*
Current defined capabilities:
- `"basic-ui"` - Basic user interface
- `"governance"` - Governance layer integration
- `"epistemic"` - Epistemic processing
- `"visualization"` - Data visualization

### **Status Field Ranges**
- **doctrine**: String enum (`"none"`, `"empirical"`, `"skeptical"`, etc.)
- **drift**: Float 0.0 - 1.0 (epistemic uncertainty)
- **ddr**: Float (doctrine drift rate, typically -1.0 to 1.0)
- **env**: Float 0.0 - 1.0 (environment confidence)

---

## 🚨 **Error Handling**

### **Renderer Side**
```typescript
// Safe API usage
if (window.electronAPI?.send) {
  window.electronAPI.send('orb-register', manifest);
} else {
  console.warn('Electron API not available - running in browser mode');
}
```

### **Main Process Side**
```javascript
// Error boundaries
ipcMain.on('orb-register', (event, manifest) => {
  if (!manifest?.orb_id) {
    console.error('Invalid manifest: missing orb_id');
    return;
  }

  if (!manifest?.orb_type) {
    console.error('Invalid manifest: missing orb_type');
    return;
  }

  // Proceed with registration...
});
```

---

## 🔄 **Connection Lifecycle**

1. **Orb Spawn**: Window created, preload script injected
2. **API Available**: `window.electronAPI` becomes available
3. **Registration**: Orb sends `orb-register` with manifest
4. **Acknowledgment**: Dock Station registers orb
5. **Heartbeat**: Orb begins sending `orb-status` every 2s
6. **Monitoring**: Dock Station tracks orb health
7. **Shutdown**: IPC channels closed, resources cleaned up

---

## 📈 **Performance Considerations**

- **Message Size**: Keep payloads under 1KB
- **Frequency**: Heartbeat every 2 seconds (not more frequent)
- **Async**: All IPC is asynchronous, no blocking
- **Error Resilience**: Network failures don't crash processes
- **Memory**: No persistent references to prevent leaks

---

## 🔮 **Future Extensions**

### **Planned Channels**
- `orb-config-update` - Runtime configuration changes
- `orb-shutdown` - Graceful shutdown requests
- `orb-reload` - Hot reload triggers
- `orb-log` - Structured logging from orbs

### **Advanced Features**
- **Streaming**: Large data transfers
- **File Transfer**: Binary data exchange
- **Shared State**: Inter-orb communication
- **Plugin API**: Dynamic capability loading

---

## 🧪 **Testing Contract**

### **Unit Tests**
```typescript
// Test manifest validation
describe('Orb Manifest', () => {
  it('should have required fields', () => {
    expect(manifest.orb_id).toBeDefined();
    expect(manifest.orb_type).toBeDefined();
    expect(manifest.capabilities).toBeInstanceOf(Array);
  });
});
```

### **Integration Tests**
```javascript
// Test IPC communication
describe('IPC Contract', () => {
  it('should register orb successfully', async () => {
    const mockManifest = createMockManifest();
    ipcRenderer.send('orb-register', mockManifest);

    // Verify registry contains orb
    expect(dockRegistry.getOrb(mockManifest.orb_id)).toEqual(mockManifest);
  });
});
```

---

**© 2026 Spruked LLC. All Rights Reserved. Patent Pending.**