
# Desktop Orb Assistant - Reference Template Baseline v1

## ⚠️ IMPORTANT LEGAL NOTICE

**THIS IS NOT AN OPEN SOURCE PROJECT**

This codebase is provided for **reference purposes only** and is **strictly read-only**. No part of this code may be copied, modified, distributed, or used in any commercial or non-commercial projects without explicit written permission from the copyright holder.

### Copyright © 2026 Spruked LLC. All Rights Reserved.

**Patent Pending**: This system incorporates proprietary technologies related to:
- Multi-orb operating system architecture
- Cognitive epistemic field simulation
- Philosophical agent modeling systems
- Dock station runtime environments
- High-level spatial field substrates

**Confidential and Proprietary**: The algorithms, architectures, and methodologies contained herein are trade secrets and intellectual property of Spruked LLC.

---

## System Overview

Desktop Orb Assistant is a cognitive epistemic system for visualizing and interacting with epistemic processes, inspired by philosophical and cognitive science models. It combines a dual-field architecture:

- **HLSF (High-Level Space Field) Substrate**: Models philosophical agents (SKGs) traversing a 3D epistemic field, converging toward consensus at the center. Based on epistemic geometry.
- **Neural Gravity Field (SpaceFieldCognition)**: Simulates neural substrate dynamics, with rapid turnover at the center (short-term memory) and persistence at the edges (long-term memory). Includes metabolic cycling and diffusion signaling.
- **Perceptual Context Engine (PCE)**: Tracks the user's epistemic hygiene by making explicit the user's mental model, risk of hallucination, and mismatch probability. Surfaces this awareness to the user for better epistemic self-regulation.

## Key Features

- **Philosophical SKGs**: Spinoza, Kant, Locke, and Hume are modeled as agents with unique epistemic policies.
- **Dual-Field Visualization**: Real-time visualization of both philosophical (HLSF) and neural (Gravity) fields.
- **Settings Panel**: Customize agent colors, field parameters, and simulation controls.
- **Epistemic Hygiene**: The PCE module helps users remain aware of their own cognitive projections and risks.
- **React + Electron**: Modern UI with React, running as a desktop app via Electron.


## New Folder Structure

```
app/
  interfaces/
    api/
    web/
      App.tsx
      components/
        GravityFieldVisualizer.tsx
        HLSFVisualizer.tsx
        OrbVisualization.tsx
        SettingsPanel.tsx
        figma/
          ImageWithFallback.tsx
        ui/
          ... (UI primitives)
      hooks/
        useHLSFSimulation.ts
      lib/
        hlsf-substrate.ts
        space-field-cognition.ts
        perceptual_context_engine.py
        perceptual_context_engine.ts
      styles/
        fonts.css
        index.css
        tailwind.css
        theme.css
    cli/
    events/
  application/
    services/
    use_cases/
    dto/
  domain/
    models/
      governance_layer/
        api.py
        core.py
        doctrine/
        extension/
        reflection/
        tests/
        vault/
    value_objects/
    rules/
    repositories/
  infrastructure/
    database/
      models/
      migrations/
      repositories/
    external_services/
      electron/
    storage/
    messaging/
  shared/
    config/
      package.json
      postcss.config.mjs
      vite.config.ts
    security/
    logging/
    utils/
  tests/
    unit/
    integration/
    system/
  docs/
    guidelines/
      Guidelines.md
    ATTRIBUTIONS.md
    LINK_BROWSER_EXTENSION.txt
    README.md
    requirements.txt
```


## Architecture Overview

This system is organized using a modular, domain-driven structure:

- **interfaces/**: Entry points for user/system interaction (web, API, CLI, events)
- **application/**: Orchestrates workflows and use cases
- **domain/**: Core business logic, models, rules, repositories
- **infrastructure/**: External systems, database, storage, messaging
- **shared/**: Cross-cutting utilities, config, security, logging
- **tests/**: Unit, integration, and system tests
- **docs/**: Documentation and guidelines

Refer to each folder for more details and inline documentation.

### HLSF Substrate (`src/app/lib/hlsf-substrate.ts`)
- Models epistemic field and agent traversal.
- Provides consensus geometry and field dynamics.

### SpaceFieldCognition (`src/app/lib/space-field-cognition.ts`)
- Simulates neural substrate with metabolic cycling and memory renewal.
- Used for the "gravity" field in the UI.

### Perceptual Context Engine (`src/app/lib/perceptual_context_engine.py` & `.ts`)
- Tracks user's perceptual frame, risk, and mismatch probability.
- Surfaces epistemic hygiene to the user.

### React Components
- `App.tsx`: Main application logic and state.
- `OrbVisualization.tsx`: Dual-field visualization.
- `SettingsPanel.tsx`: User controls.
- `HLSFVisualizer.tsx` & `GravityFieldVisualizer.tsx`: Render field states.

## How to Run

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the development server:
   ```sh
   npm run dev
   ```
3. (Optional) Launch Electron:
   ```sh
   npm run electron:dev
   ```

## Functionality Summary

- **Epistemic Field Simulation**: Models and visualizes epistemic convergence and tension among philosophical agents.
- **Neural Substrate Simulation**: Visualizes memory dynamics and metabolic cycling.
- **Perceptual Context Tracking**: Makes user's cognitive projections and risks explicit.
- **Customizable UI**: Change agent colors, simulation parameters, and view modes.
- **Modern Stack**: Built with React, TypeScript, Electron, and Tailwind CSS.

---

For more details, see the inline documentation in each module and the Guidelines in `guidelines/Guidelines.md`.
