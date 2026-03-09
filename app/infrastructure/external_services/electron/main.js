import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { startGovernanceAPI } from './governance-api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.disableHardwareAcceleration();

// Dock Station Registry
class DockRegistry {
  constructor() {
    this.orbs = new Map();
  }

  register(orbId, manifest) {
    this.orbs.set(orbId, manifest);
    console.log(`Orb registered: ${orbId}`, manifest);
  }

  updateStatus(orbId, status) {
    const orb = this.orbs.get(orbId);
    if (orb) {
      orb.status = status;
      console.log(`Orb status updated: ${orbId}`, status);
    }
  }

  getAllOrbs() {
    return Array.from(this.orbs.values());
  }

  getOrb(orbId) {
    return this.orbs.get(orbId);
  }
}

const dockRegistry = new DockRegistry();

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#111111',
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadURL('http://localhost:5174');
  win.webContents.openDevTools();
}

let governanceProc;
app.whenReady().then(() => {
  // IPC handlers for orb system
  ipcMain.on('orb-register', (event, manifest) => {
    dockRegistry.register(manifest.orb_id, manifest);
  });

  ipcMain.on('orb-status', (event, data) => {
    dockRegistry.updateStatus(data.orb_id, data.status);
  });

  // Start the FastAPI governance server (commented out for now due to import issues)
  // governanceProc = startGovernanceAPI();
  createWindow();
});

app.on('will-quit', () => {
  if (governanceProc) governanceProc.kill();
});