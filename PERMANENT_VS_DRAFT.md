# PERMANENT vs DRAFT - Desktop Orb Assistant Reference Template Baseline v1

## ⚠️ IMPORTANT LEGAL NOTICE

**THIS IS NOT AN OPEN SOURCE PROJECT**

This codebase is provided for **reference purposes only** and is **strictly read-only**. No part of this code may be copied, modified, distributed, or used in any commercial or non-commercial projects without explicit written permission from the copyright holder.

### Copyright © 2026 Spruked LLC. All Rights Reserved.

**Patent Pending**: This system incorporates proprietary technologies related to multi-orb operating system architecture.

---

## Architectural Decisions: Locked vs Evolving

This document clarifies which aspects of the multi-orb ecosystem are **permanently locked-in** and which remain **draft** for future evolution.

### 🔒 **PERMANENT (Locked-In Foundation)**

These architectural decisions are final and must be preserved in all future orb repositories:

#### **1. Electron Architecture**
- **LOCKED**: Electron lives ONLY in the Dock Station
- **LOCKED**: Orb repos are pure UI bundles (React + Vite)
- **LOCKED**: No Electron dependencies in orb repositories
- **LOCKED**: Dock Station spawns BrowserWindows for orbs

**Rationale**: Clean separation prevents dependency conflicts and enables runtime flexibility.

#### **2. Manifest System**
- **LOCKED**: Runtime manifest injection via `window.__ORB_MANIFEST__`
- **LOCKED**: Manifest contains: `orb_id`, `orb_type`, `plugin_version`, `capabilities`, `endpoints`, `status`
- **LOCKED**: Unique `orb_id` generation with timestamp
- **LOCKED**: Manifest available globally for Dock Station access

**Rationale**: Enables runtime identification and capability negotiation.

#### **3. IPC Communication**
- **LOCKED**: `orb-register` event for initial docking
- **LOCKED**: `orb-status` event for heartbeat updates
- **LOCKED**: 2-second heartbeat interval
- **LOCKED**: Secure preload script exposing `window.electronAPI`

**Rationale**: Standardized communication protocol ensures reliable orb monitoring.

#### **4. Build System**
- **LOCKED**: Vite as build tool for all orbs
- **LOCKED**: Standard `vite.config.ts` with React plugin
- **LOCKED**: `@` alias pointing to `./src`
- **LOCKED**: Clean `dist/` output structure
- **LOCKED**: No source maps in production

**Rationale**: Consistent development and deployment experience.

#### **5. Repository Structure**
- **LOCKED**: `src/main.tsx` as entry point
- **LOCKED**: `src/App.tsx` as main component
- **LOCKED**: `src/components/` for UI components
- **LOCKED**: `src/lib/` for business logic
- **LOCKED**: `src/styles/` for styling

**Rationale**: Predictable codebase organization across all orbs.

#### **6. TypeScript Compliance**
- **LOCKED**: `OrbManifest` interface must be implemented
- **LOCKED**: Type-safe IPC communication
- **LOCKED**: Consistent type definitions across ecosystem

**Rationale**: Prevents runtime errors and ensures API compatibility.

---

### 📝 **DRAFT (Still Evolving)**

These aspects are subject to change and should not be considered final:

#### **1. Manifest Schema Details**
- **DRAFT**: Exact capability strings and their meanings
- **DRAFT**: Status field semantics (doctrine, drift, ddr, env)
- **DRAFT**: Version numbering scheme
- **DRAFT**: Endpoint specification format

**Evolution Path**: Will be finalized when OUCM integration is complete.

#### **2. OUCM Bridge Contract**
- **DRAFT**: API endpoint specifications
- **DRAFT**: Data payload formats
- **DRAFT**: Authentication mechanisms
- **DRAFT**: Error handling protocols

**Evolution Path**: Will stabilize after first end-to-end pipeline integration.

#### **3. Governance Coupling**
- **DRAFT**: How governance layer connects to orbs
- **DRAFT**: Doctrine influence on orb behavior
- **DRAFT**: Consensus feedback mechanisms
- **DRAFT**: Epistemic hygiene integration

**Evolution Path**: Will be defined during governance system integration.

#### **4. Plugin System**
- **DRAFT**: Hot-loading mechanisms
- **DRAFT**: Plugin discovery and registration
- **DRAFT**: Capability negotiation protocols
- **DRAFT**: Resource management policies

**Evolution Path**: Will be implemented when multi-orb ecosystem expands.

#### **5. Multi-Orb Coordination**
- **DRAFT**: Inter-orb communication protocols
- **DRAFT**: Shared state management
- **DRAFT**: Conflict resolution strategies
- **DRAFT**: Resource sharing policies

**Evolution Path**: Will emerge as more orbs are developed.

#### **6. Dock Station Features**
- **DRAFT**: Tray menu implementation
- **DRAFT**: Window management policies
- **DRAFT**: Performance monitoring
- **DRAFT**: Error recovery mechanisms

**Evolution Path**: Will be built incrementally as ecosystem grows.

---

## Migration Strategy

When evolving draft features:

1. **Document Changes**: Update this file with new decisions
2. **Version Bumping**: Increment baseline version (v1 → v2)
3. **Backward Compatibility**: Ensure existing orbs continue working
4. **Migration Path**: Provide clear upgrade instructions
5. **Testing**: Validate against existing orb implementations

---

## Current Baseline Status

**Baseline v1** locks in the fundamental architecture while keeping integration details flexible. The next major baseline (v2) will likely be created after successful OUCM integration and governance coupling.

**Key Milestone**: End-to-end pipeline from Desktop Orb Assistant → Dock Station → OUCM → back to orb.

---

**© 2026 Spruked LLC. All Rights Reserved. Patent Pending.**