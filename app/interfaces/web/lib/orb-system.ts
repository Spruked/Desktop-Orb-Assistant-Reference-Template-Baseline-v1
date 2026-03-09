// Orb Plugin System
export interface OrbManifest {
  orb_id: string;
  orb_type: string;
  plugin_version: string;
  capabilities: string[];
  endpoints: {
    ws: string | null;
    rest: string | null;
  };
  status: {
    doctrine: string;
    drift: number;
    ddr: number;
    env: number;
  };
}

export interface OrbPlugin {
  name: string;
  description: string;
  component: () => Promise<{ default: React.ComponentType<any> }>;
  icon: string;
  defaultSize: { width: number; height: number };
  capabilities: string[];
}

export const ORB_PLUGINS: Record<string, OrbPlugin> = {
  desktop_orb_assistant: {
    name: "Desktop Orb Assistant",
    description: "Basic orb for docking tests",
    component: () => import("./DesktopOrbAssistant"),
    icon: "◎",
    defaultSize: { width: 150, height: 150 },
    capabilities: ["basic-ui"]
  }
};

// Dock Station Registry
export class DockRegistry {
  private orbs: Map<string, OrbManifest> = new Map();

  register(orbId: string, manifest: OrbManifest) {
    this.orbs.set(orbId, manifest);
    console.log(`Orb registered: ${orbId}`);
  }

  updateStatus(orbId: string, status: OrbManifest['status']) {
    const orb = this.orbs.get(orbId);
    if (orb) {
      orb.status = status;
      console.log(`Orb status updated: ${orbId}`, status);
    }
  }

  getAllOrbs(): OrbManifest[] {
    return Array.from(this.orbs.values());
  }

  getOrb(orbId: string): OrbManifest | undefined {
    return this.orbs.get(orbId);
  }
}