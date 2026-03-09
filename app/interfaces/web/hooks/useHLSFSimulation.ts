import { useState, useEffect, useRef } from 'react';
import { 
  HLSpaceField, 
  FieldPosition, 
  TraversalVerdict, 
  ConsensusGeometry 
} from '../lib/hlsf-substrate';
import { SpaceFieldCognition, DEFAULT_CONFIG } from '../lib/space-field-cognition';

/**
 * useHLSFSimulation: Dual-field cognitive architecture
 * 
 * HLSF: Philosophical SKGs traverse toward center
 * Gravity Field: Neural substrate with metabolic cycling (center dies, edge persists)
 * 
 * Flow: SKGs converge → inject verdicts → center consumption → edge renewal
 */
export function useHLSFSimulation() {
  const hlsfRef = useRef<HLSpaceField>(new HLSpaceField(32));
  const gravityRef = useRef<SpaceFieldCognition>(new SpaceFieldCognition(DEFAULT_CONFIG));
  
  const [consensus, setConsensus] = useState<ConsensusGeometry>(
    hlsfRef.current.calculateConsensus()
  );
  const [isActive, setIsActive] = useState(false);
  const [gravityStats, setGravityStats] = useState(gravityRef.current.getFieldStats());
  
  // SKG positions (they CONVERGE toward center 16,16,16 - not random!)
  const skgStates = useRef({
    spinoza: { pos: [8, 16, 16] as [number, number, number] },
    kant: { pos: [24, 16, 20] as [number, number, number] },
    locke: { pos: [16, 8, 12] as [number, number, number] },
    hume: { pos: [16, 24, 14] as [number, number, number] },
  });

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const hlsf = hlsfRef.current;
      const gravity = gravityRef.current;
      
      // Update each SKG's traversal - CONVERGE TO CENTER
      Object.entries(skgStates.current).forEach(([skgId, state]) => {
        try {
          const currentPos = new FieldPosition(
            Math.floor(state.pos[0]),
            Math.floor(state.pos[1]),
            Math.floor(state.pos[2])
          );
          
          // Calculate center attraction (main force)
          const centerForce = hlsf.calculateCenterAttraction(currentPos);
          
          // Add field gradient (truth-seeking)
          const gradient = hlsf.queryGradient(currentPos);
          
          // Combined force vector
          const forceVector: [number, number, number] = [
            centerForce[0] + gradient[0] * 0.1,
            centerForce[1] + gradient[1] * 0.1,
            centerForce[2] + gradient[2] * 0.1
          ];
          
          // Move toward center with force
          state.pos = state.pos.map((coord, i) => {
            const newCoord = coord + forceVector[i] * 0.5;
            return Math.max(0, Math.min(31, newCoord));
          }) as [number, number, number];
          
          // Distance to center for confidence calculation
          const distToCenter = Math.sqrt(
            (state.pos[0] - 16) ** 2 +
            (state.pos[1] - 16) ** 2 +
            (state.pos[2] - 16) ** 2
          );
          
          // Confidence increases as SKG approaches center
          const confidence = 0.4 + (1.0 - Math.min(1.0, distToCenter / 16)) * 0.5;
          
          // Register traversal verdict in HLSF
          const verdict: TraversalVerdict = {
            skgId,
            position: new FieldPosition(
              Math.floor(state.pos[0]),
              Math.floor(state.pos[1]),
              Math.floor(state.pos[2])
            ),
            confidence,
            forceVector,
            timestamp: Date.now(),
            metadata: {
              distanceToCenter: distToCenter
            }
          };
          
          hlsf.registerTraversal(verdict);
          
          // If near center, inject into gravity field (broadcast verdict)
          if (distToCenter < 8) {
            const signal = new Float32Array(32 * 32 * 32 * DEFAULT_CONFIG.DIFFUSION_CHANNELS);
            const centerIdx = 16 * 32 * 32 + 16 * 32 + 16;
            
            // Inject philosophical "heat" at center
            for (let c = 0; c < DEFAULT_CONFIG.DIFFUSION_CHANNELS; c++) {
              signal[centerIdx * DEFAULT_CONFIG.DIFFUSION_CHANNELS + c] = confidence * 0.5;
            }
            
            gravity.broadcastToField(signal);
          }
        } catch (e) {
          console.warn(`Invalid position for ${skgId}:`, state.pos);
        }
      });
      
      // Step both fields
      hlsf.step();
      gravity.step(); // This triggers center consumption and edge renewal!
      
      // Calculate new consensus
      setConsensus(hlsf.calculateConsensus());
      setGravityStats(gravity.getFieldStats());
    }, 500);

    return () => clearInterval(interval);
  }, [isActive]);

  return {
    hlsf: hlsfRef.current,
    gravity: gravityRef.current,
    consensus,
    gravityStats,
    isActive,
    setIsActive,
    signature: hlsfRef.current.getFieldSignature()
  };
}