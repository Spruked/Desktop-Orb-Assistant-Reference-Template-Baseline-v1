import React, { useState, useMemo, useRef } from 'react';
import { OrbVisualization } from './components/OrbVisualization';
import { SettingsPanel } from './components/SettingsPanel';
import { GovernancePanel } from './components/GovernancePanel';
import { DesktopOrbAssistant } from './components/DesktopOrbAssistant';
import { Settings, Activity, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { useHLSFSimulation } from './hooks/useHLSFSimulation';
import { PerceptualContextEngine } from './lib/perceptual_context_engine';
import { DEFAULT_CONFIG } from './lib/space-field-cognition';
import { FieldPosition } from './lib/hlsf-substrate';

// Default settings
const DEFAULT_SETTINGS = {
  wakeWord: 'Cali',
  spinozaColor: '#0096FF',
  kantColor: '#FFD700',
  lockeColor: '#00FF00',
  humeColor: '#FF0000',
  repulsionRadius: 50,
  glideSpeed: 50,
  orbScale: 100,
};

const pce = new PerceptualContextEngine();
const initialFrame = pce.initializeFrame({ tone_marker: 'neutral', vocabulary_age: 'adult', domain_signals: 'generalist' });

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [wakeWord, setWakeWord] = useState(DEFAULT_SETTINGS.wakeWord);
  const [spinozaColor, setSpinozaColor] = useState(DEFAULT_SETTINGS.spinozaColor);
  const [kantColor, setKantColor] = useState(DEFAULT_SETTINGS.kantColor);
  const [lockeColor, setLockeColor] = useState(DEFAULT_SETTINGS.lockeColor);
  const [humeColor, setHumeColor] = useState(DEFAULT_SETTINGS.humeColor);
  const [repulsionRadius, setRepulsionRadius] = useState(DEFAULT_SETTINGS.repulsionRadius);
  const [glideSpeed, setGlideSpeed] = useState(DEFAULT_SETTINGS.glideSpeed);
  const [orbScale, setOrbScale] = useState(DEFAULT_SETTINGS.orbScale);
  const [isListening, setIsListening] = useState(false);

  // HLSF Cognitive Substrate (the brain)
  const { hlsf, gravity, consensus, gravityStats, isActive, setIsActive, signature } = useHLSFSimulation();

  // Governance engine output state
  type DoctrineBalance = {
    empirical?: number;
    skeptical?: number;
    structural?: number;
    necessitarian?: number;
  };

  type GovOutput = {
    doctrine_balance?: DoctrineBalance;
    ping_time_ms?: number;
    convergence_score?: number;
    bullshit_score?: number;
    [key: string]: any;
  } | null;

  const [govOutput, setGovOutput] = useState<GovOutput>(null);
  const prevConvergenceRef = useRef<number | null>(null);

  // Spawned orbs state
  const [spawnedOrbs, setSpawnedOrbs] = useState<Array<{ id: string; type: string; position: { x: number; y: number } }>>([]);

  const handleGovernanceUpdate = (output: NonNullable<GovOutput>) => {
    // Update gov output state
    setGovOutput(output);

    try {
      // Compute perturbation metrics
      const doctrine = output.doctrine_balance || {};
      const votes = Object.values(doctrine).map((v) => (typeof v === 'number' ? v : 0));
      const mean = votes.length ? votes.reduce((a, b) => a + b, 0) / votes.length : 0;
      const variance = votes.length ? votes.reduce((s, v) => s + (v - mean) ** 2, 0) / votes.length : 0;
      const hallucination = typeof output.bullshit_score === 'number' ? output.bullshit_score : 0;

      // drift delta: compare to previous convergence score
      const prevConv = prevConvergenceRef.current ?? null;
      const newConv = typeof output.convergence_score === 'number' ? output.convergence_score : null;
      const driftDelta = prevConv !== null && newConv !== null ? Math.abs(newConv - prevConv) : 0;

      // strength mapping (tuned empirically)
      let strength = Math.min(1, variance * 4 + hallucination * 2 + driftDelta * 2);

      // Small floor so minor governance changes still perturb slightly
      if (strength > 0 && strength < 0.02) strength = 0.02;

      // Broadcast a short impulse into the gravity field at center
      const dim = 32;
      const channels = DEFAULT_CONFIG.DIFFUSION_CHANNELS || 4;
      const signal = new Float32Array(dim * dim * dim * channels);
      const centerIdx = 16 * dim * dim + 16 * dim + 16;
      for (let c = 0; c < channels; c++) {
        signal[centerIdx * channels + c] = Math.min(1, strength * (0.5 + c * 0.25));
      }

      // also sprinkle in a small neighborhood proportional to strength
      const radius = Math.min(4, Math.ceil(strength * 8));
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dz = -radius; dz <= radius; dz++) {
            const nx = 16 + dx;
            const ny = 16 + dy;
            const nz = 16 + dz;
            if (nx >= 0 && nx < dim && ny >= 0 && ny < dim && nz >= 0 && nz < dim) {
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
              const decay = 1 / (1 + dist);
              const idx = (nx * dim * dim + ny * dim + nz) * channels;
              for (let c = 0; c < channels; c++) {
                signal[idx + c] = signal[idx + c] + (Math.min(1, strength * 0.6) * decay);
              }
            }
          }
        }
      }

      // Inject into gravity substrate
      try {
        gravity.broadcastToField(signal);
      } catch (e) {
        console.warn('Failed to broadcast to gravity field:', e);
      }

      // Also register traversals into HLSF for each doctrine to create directional forces
      const mapping: Record<string, [number, number, number]> = {
        empirical: [8, 16, 16],
        skeptical: [24, 16, 20],
        structural: [16, 8, 12],
        necessitarian: [16, 24, 14]
      };

      Object.entries(doctrine).forEach(([k, v]) => {
        const vote = typeof v === 'number' ? v : 0;
        const pos = mapping[k] || [16, 16, 16];
        const confidence = Math.min(1, Math.max(0.05, vote));
        const forceMag = Math.min(2.0, strength * (0.5 + vote));
        const forceVector: [number, number, number] = [
          (Math.random() - 0.5) * forceMag,
          (Math.random() - 0.5) * forceMag,
          (Math.random() - 0.5) * forceMag
        ];

        try {
          hlsf.registerTraversal({
            skgId: k,
            position: new FieldPosition(pos[0], pos[1], pos[2]),
            confidence,
            forceVector,
            timestamp: Date.now(),
            metadata: { injectedBy: 'governance', strength }
          });
        } catch (e) {
          console.warn('Failed to register traversal for', k, e);
        }
      });

      // store convergence score for next delta calculation
      prevConvergenceRef.current = newConv ?? prevConvergenceRef.current;
    } catch (e) {
      console.warn('Error applying governance perturbation:', e);
    }
  };

  // Save handler for settings panel
  const handleSave = () => {
    toast.success('Settings saved!');
  };

  // Restore default settings handler
  const handleRestoreDefaults = () => {
    setWakeWord(DEFAULT_SETTINGS.wakeWord);
    setSpinozaColor(DEFAULT_SETTINGS.spinozaColor);
    setKantColor(DEFAULT_SETTINGS.kantColor);
    setLockeColor(DEFAULT_SETTINGS.lockeColor);
    setHumeColor(DEFAULT_SETTINGS.humeColor);
    setRepulsionRadius(DEFAULT_SETTINGS.repulsionRadius);
    setGlideSpeed(DEFAULT_SETTINGS.glideSpeed);
    setOrbScale(DEFAULT_SETTINGS.orbScale);
    toast.success('Settings restored to defaults!');
  };

  // Spawn orb handler
  const handleSpawnOrb = (orbType: string) => {
    const newOrb = {
      id: `${orbType}_${Date.now()}`,
      type: orbType,
      position: {
        x: Math.random() * (window.innerWidth - 200) + 100,
        y: Math.random() * (window.innerHeight - 200) + 100
      }
    };
    setSpawnedOrbs(prev => [...prev, newOrb]);
    toast.success(`Spawned ${orbType} orb!`);
  };

  // Activate / Deactivate handler (controls listening + simulation state)
  const handleActivate = () => {
    setIsListening((s) => {
      const next = !s;
      setIsActive(next);
      toast.success(next ? 'Activated' : 'Deactivated');
      return next;
    });
  };

  // Prepare dynamic footer metrics so all govOutput fields are displayed
  const formatValue = (v: any) => {
    if (v === null || v === undefined) return '--';
    if (typeof v === 'number') return Number.isFinite(v) ? v.toFixed(2) : String(v);
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'string') return v;
    try {
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  };

  // Human-friendly numeric formatter for dashboard values
  // - shows 4 decimals
  // - displays '<0.0001' for tiny non-zero values to avoid implying exact zero
  // - shows '—' for missing values
  const fmt = (n?: number) => {
    if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
    if (n === 0) return '0.0000';
    if (Math.abs(n) < 0.0001) return '<0.0001';
    return n.toFixed(4);
  };

  const substrateFields = useMemo(() => {
    return [
      { key: 'active', label: 'Active', value: isActive },
      { key: 'signature', label: 'Signature', value: signature },
      { key: 'consensus', label: 'Consensus', value: consensus },
      { key: 'gravityStats', label: 'GravityStats', value: gravityStats },
    ];
  }, [isActive, signature, consensus, gravityStats]);

  const governanceFields = useMemo(() => {
    if (!govOutput) return [] as { key: string; label: string; value: any }[];
    const entries: { key: string; label: string; value: any }[] = [];

    if (govOutput.doctrine_balance && typeof govOutput.doctrine_balance === 'object') {
      Object.entries(govOutput.doctrine_balance).forEach(([k, v]) => {
        entries.push({ key: `doctrine_${k}`, label: k, value: v });
      });
    }

    Object.entries(govOutput).forEach(([k, v]) => {
      if (k === 'doctrine_balance') return;
      entries.push({ key: k, label: k, value: v });
    });

    return entries;
  }, [govOutput]);

  return (
    <>
      {/* Header */}
      <motion.header className="fixed top-4 left-4 right-4 z-30 flex items-center justify-between px-6 py-3 bg-transparent">
        <div className="text-lg font-semibold">DESKTOP ORB ASSISTANT</div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isActive ? 'text-green-400' : 'text-neutral-500'}`} />
            <span className="text-xs text-neutral-400 font-mono">
              {consensus && consensus.state ? consensus.state : '--'} • {signature ? signature.slice(0, 8) : '--'}
            </span>
          </div>

          <button
            onClick={handleActivate}
            className={`px-4 py-2 rounded-lg transition-all ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isListening ? 'Deactivate' : 'Activate'}
          </button>

          <button
            onClick={() => handleSpawnOrb('desktop_orb_assistant')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Spawn Orb
          </button>

          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <Settings className="w-6 h-6 text-neutral-300" />
          </button>
        </div>
      </motion.header>

      <Toaster />

      {/* Spawned Orbs */}
      {spawnedOrbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="fixed z-40"
          style={{
            left: orb.position.x,
            top: orb.position.y,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          drag
          dragMomentum={false}
        >
          <DesktopOrbAssistant scale={orbScale} />
        </motion.div>
      ))}

      {/* Main Content */}

      <div className="relative z-20 flex items-center justify-center gap-16 px-8" style={{ minHeight: 'calc(100vh - 120px)', paddingBottom: 140 }}>
        {/* Orb Visualization - Always visible, metrics update with real data */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <OrbVisualization
            scale={orbScale}
            spinozaColor={spinozaColor}
            kantColor={kantColor}
            lockeColor={lockeColor}
            humeColor={humeColor}
            hlsfField={hlsf}
            gravity={gravity}
            consensus={consensus}
            gravityStats={gravityStats}
            govOutput={govOutput}
          />
          {!govOutput && (
            <div className="absolute top-2 left-2 bg-neutral-800/80 text-yellow-300 px-3 py-1 rounded text-xs shadow">
              Waiting for governance output...
            </div>
          )}
        </motion.div>

        {/* Governance Panel and Settings Panel (toggles together) */}
        {settingsOpen && (
          <>
            <GovernancePanel onUpdate={handleGovernanceUpdate} />
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              <SettingsPanel
                wakeWord={wakeWord}
                setWakeWord={setWakeWord}
                spinozaColor={spinozaColor}
                setSpinozaColor={setSpinozaColor}
                kantColor={kantColor}
                setKantColor={setKantColor}
                lockeColor={lockeColor}
                setLockeColor={setLockeColor}
                humeColor={humeColor}
                setHumeColor={setHumeColor}
                repulsionRadius={repulsionRadius}
                setRepulsionRadius={setRepulsionRadius}
                glideSpeed={glideSpeed}
                setGlideSpeed={setGlideSpeed}
                orbScale={orbScale}
                setOrbScale={setOrbScale}
                onSave={handleSave}
                onRestoreDefaults={handleRestoreDefaults}
              />
            </motion.div>
          </>
        )}
      </div>

      {/* Bottom Footer: 3-column grid (Monitoring | Substrate | Governance) */}
      <motion.div
        className="fixed bottom-4 left-4 right-4 z-10 pointer-events-auto"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
      >
        <div className="w-full bg-zinc-900 text-zinc-200 mt-2 backdrop-blur-sm rounded-2xl border border-zinc-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

              {/* Monitoring */}
              <div>
                <h3 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">Monitoring</h3>
                <p className="text-xs text-zinc-500 mt-1">Live governance & substrate metrics</p>
              </div>

              {/* Substrate (Live) */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-zinc-300">Substrate (Live)</h4>

                <div className="bg-zinc-800 rounded-lg p-3 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span>Active</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${isActive ? 'bg-green-600 text-white' : 'bg-zinc-600 text-zinc-200'}`}>{isActive ? 'YES' : 'NO'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Signature</span>
                    <span className="text-zinc-400">{typeof signature === 'string' ? (signature.slice(0, 8) + (signature.length > 8 ? '…' : '')) : formatValue(signature)}</span>
                  </div>

                  <div>
                    <div className="font-medium">State: {consensus?.state ?? '—'} · Dispersion: {fmt(consensus?.dispersion)}</div>
                    <div className="text-zinc-500">Centroid: [{consensus?.centroid ? `${consensus.centroid.x}, ${consensus.centroid.y}, ${consensus.centroid.z}` : '—'}] · AvgConf: {fmt(consensus?.avgConfidence)}</div>
                  </div>

                  <div className="text-zinc-500">Center: {fmt(gravityStats?.center_entropy)} · Middle: {fmt(gravityStats?.middle_entropy)} · Outer: {fmt(gravityStats?.outer_entropy)}</div>
                  <div className="text-zinc-500">Renewal: {fmt(gravityStats?.renewal_pressure)}</div>
                </div>
              </div>

              {/* Governance (Last Verdict) */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-zinc-300">Governance (Last Verdict)</h4>

                {govOutput ? (
                  <div className="bg-zinc-800 rounded-lg p-3 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span>Empirical</span>
                      <span>{govOutput.doctrine_balance?.empirical !== undefined ? formatValue(govOutput.doctrine_balance.empirical) : '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Skeptical</span>
                      <span>{govOutput.doctrine_balance?.skeptical !== undefined ? formatValue(govOutput.doctrine_balance.skeptical) : '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Structural</span>
                      <span>{govOutput.doctrine_balance?.structural !== undefined ? formatValue(govOutput.doctrine_balance.structural) : '--'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Necessitarian</span>
                      <span>{govOutput.doctrine_balance?.necessitarian !== undefined ? formatValue(govOutput.doctrine_balance.necessitarian) : '--'}</span>
                    </div>

                    <div className="border-t border-zinc-700 pt-2 mt-2 text-zinc-500">
                      Speed: {govOutput.ping_time_ms !== undefined ? `${formatValue(govOutput.ping_time_ms)} ms` : '--'} · Drift: {govOutput.convergence_score !== undefined ? formatValue(govOutput.convergence_score) : '--'} · Hallucination: {govOutput.bullshit_score !== undefined ? (govOutput.bullshit_score > 0.5 ? 'Likely' : 'Low') : '--'}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 italic">Awaiting governance verdict…</div>
                )}
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
