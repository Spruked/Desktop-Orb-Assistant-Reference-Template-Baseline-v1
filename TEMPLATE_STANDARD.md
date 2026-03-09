# TEMPLATE STANDARD - Desktop Orb Assistant Reference Template Baseline v1

## ⚠️ IMPORTANT LEGAL NOTICE

**THIS IS NOT AN OPEN SOURCE PROJECT**

This codebase is provided for **reference purposes only** and is **strictly read-only**. No part of this code may be copied, modified, distributed, or used in any commercial or non-commercial projects without explicit written permission from the copyright holder.

### Copyright © 2026 Spruked LLC. All Rights Reserved.

**Patent Pending**: This system incorporates proprietary technologies related to multi-orb operating system architecture.

---

## What Future Orb Repos MUST Copy

This document specifies the **mandatory architectural patterns** that all future orb repositories must implement. These are the **locked-in** foundations that ensure compatibility with the Dock Station runtime.

### 🏗️ **1. Repository Structure (MANDATORY)**

Every orb repo MUST follow this exact structure:

```
orb-[name]/
├── 📄 package.json          # React + Vite dependencies only
├── 📄 vite.config.ts        # Standard Vite config with @ alias
├── 📄 index.html           # Standard HTML entry point
├── 📁 src/
│   ├── 📄 main.tsx         # Entry point with manifest injection
│   ├── 📄 App.tsx          # Main React component
│   ├── 📁 components/      # React components
│   ├── 📁 lib/            # Business logic (no Electron)
│   └── 📁 styles/         # CSS/styling
├── 📁 dist/               # Vite build output (gitignored)
└── 📄 README.md           # Orb-specific documentation
```

**Why**: Ensures clean separation between UI bundles and Dock Station runtime.

### 🚫 **2. No Electron Dependencies (MANDATORY)**

Orb repos MUST NOT contain:

- ❌ `electron` in package.json
- ❌ `main.js` or `main.ts`
- ❌ `preload.js` or `preload.ts`
- ❌ `BrowserWindow` usage
- ❌ Any Node.js runtime assumptions

**Why**: Electron lives ONLY in the Dock Station. Orbs are pure UI bundles.

### 📦 **3. Vite Build Configuration (MANDATORY)**

Every orb MUST have this exact `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false,
  },
})
```

**Why**: Ensures consistent build output and development experience.

### 🏷️ **4. Runtime Manifest Injection (MANDATORY)**

Every orb MUST inject its manifest at runtime:

```typescript
// In main.tsx or App.tsx
const manifest = {
  orb_id: "[orb-name]_" + Date.now(),
  orb_type: "[orb-name]",
  plugin_version: "1.0.0",
  capabilities: ["[capability-list]"],
  endpoints: { ws: null, rest: null },
  status: { doctrine: "none", drift: 0, ddr: 0, env: 1 }
};

(window as any).__ORB_MANIFEST__ = manifest;
```

**Why**: Enables Dock Station to identify and manage the orb.

### 🔌 **5. IPC Registration Pattern (MANDATORY)**

Every orb MUST register with the Dock Station:

```typescript
// In component useEffect
useEffect(() => {
  if (window.electronAPI?.send) {
    window.electronAPI.send('orb-register', manifest);
  }
}, []);
```

**Why**: Establishes the docking handshake.

### 💓 **6. Heartbeat Protocol (MANDATORY)**

Every orb MUST send recurring status updates:

```typescript
setInterval(() => {
  window.electronAPI?.send('orb-status', {
    orb_id: manifest.orb_id,
    status: manifest.status
  });
}, 2000);
```

**Why**: Allows Dock Station to monitor orb health.

### 📋 **7. TypeScript Interface Compliance (MANDATORY)**

Every orb MUST implement these interfaces:

```typescript
interface OrbManifest {
  orb_id: string;
  orb_type: string;
  plugin_version: string;
  capabilities: string[];
  endpoints: { ws: string | null; rest: string | null };
  status: { doctrine: string; drift: number; ddr: number; env: number };
}
```

**Why**: Ensures type safety across the ecosystem.

### 🎯 **8. Build Output Requirements (MANDATORY)**

Every orb MUST produce:

```
dist/index.html
dist/assets/*.js
dist/assets/*.css
```

**Why**: Dock Station loads these files directly.

### 📖 **9. Documentation Requirements (MANDATORY)**

Every orb repo MUST have:

- `README.md` - Orb purpose and usage
- Clear setup instructions
- API documentation if applicable

**Why**: Maintains ecosystem discoverability.

### 🔒 **10. Legal Compliance (MANDATORY)**

Every orb repo MUST include:

- Copyright notices
- Patent pending declarations
- Usage restrictions
- Contact information

**Why**: Protects intellectual property across the ecosystem.

---

## Implementation Checklist

Before an orb repo is considered "Dock Station compatible," it must pass this checklist:

- [ ] Repository structure matches template
- [ ] No Electron dependencies
- [ ] Vite config is standard
- [ ] Manifest injection implemented
- [ ] IPC registration implemented
- [ ] Heartbeat protocol implemented
- [ ] TypeScript interfaces used
- [ ] Builds cleanly to `dist/`
- [ ] Documentation complete
- [ ] Legal notices included

---

## Reference Implementation

This repository (`Desktop-Orb-Assistant-Reference-Template-Baseline-v1`) is the canonical implementation of all above requirements.

**Copy this repo** when creating new orbs, then modify the orb-specific logic while preserving the architectural patterns.

---

**© 2026 Spruked LLC. All Rights Reserved. Patent Pending.**