/**
 * High-Level Space Field (HLSF) Substrate
 * Based on Alex London's epistemic geometry papers.
 * 
 * Core concept: A 32³ discrete field where philosophical SKGs traverse as force vectors,
 * CONVERGING TOWARD CENTER through field dynamics - NOT random exploration.
 * 
 * This is Caleon Prime's cognitive substrate, not a graphics engine.
 */

export enum TraversalState {
  EXPLORING = 'EXPLORING',      // Seeking gradient toward truth
  CONVERGING = 'CONVERGING',    // Moving toward consensus at center
  STABILIZED = 'STABILIZED',    // Reached local equilibrium at center
  DIVERGENT = 'DIVERGENT'       // Irreconcilable tension detected
}

export class FieldPosition {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number
  ) {
    if (x < 0 || x >= 32 || y < 0 || y >= 32 || z < 0 || z >= 32) {
      throw new Error(`Coordinates must be in [0,31], got (${x}, ${y}, ${z})`);
    }
  }

  toVector(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  distanceTo(other: FieldPosition): number {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}

export interface TraversalVerdict {
  skgId: string;              // "locke", "hume", "kant", "spinoza"
  position: FieldPosition;
  confidence: number;         // 0.0-1.0 based on evidence strength
  forceVector: [number, number, number];  // Direction and magnitude of epistemic "push"
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ConsensusGeometry {
  centroid: FieldPosition;
  dispersion: number;          // Max distance from centroid (tension indicator)
  avgConfidence: number;
  state: TraversalState;
  tensionVector?: [number, number, number];  // Direction of maximum disagreement
}

export class HLSpaceField {
  private resolution: number;
  private intensity: Float64Array;  // Flattened 32³ field
  private persistence: Float64Array;
  private topology: Float64Array;
  
  private activeTraversals: Map<string, TraversalVerdict> = new Map();
  private traversalHistory: Map<string, TraversalVerdict>[] = [];
  private maxHistory = 100;
  
  // Convergence parameters (from London papers)
  private consensusRadius = 4.0;
  private tensionThreshold = 12.0;
  private persistenceDecay = 0.95;

  constructor(resolution = 32) {
    this.resolution = resolution;
    const size = resolution * resolution * resolution;
    
    this.intensity = new Float64Array(size);
    this.persistence = new Float64Array(size);
    this.topology = new Float64Array(size).fill(1.0);
  }

  private getIndex(x: number, y: number, z: number): number {
    return x * this.resolution * this.resolution + y * this.resolution + z;
  }

  setEthicalTopology(constraintPositions: FieldPosition[], barrierStrength = 0.0) {
    /**
     * Modify field topology to create ethical constraints.
     * Low values = high resistance (cannot traverse)
     * High values = low resistance (easy traversal)
     */
    for (const pos of constraintPositions) {
      for (let dx = -3; dx <= 3; dx++) {
        for (let dy = -3; dy <= 3; dy++) {
          for (let dz = -3; dz <= 3; dz++) {
            const nx = pos.x + dx;
            const ny = pos.y + dy;
            const nz = pos.z + dz;
            
            if (nx >= 0 && nx < this.resolution && 
                ny >= 0 && ny < this.resolution && 
                nz >= 0 && nz < this.resolution) {
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (dist > 0) {
                const idx = this.getIndex(nx, ny, nz);
                this.topology[idx] *= (1.0 - barrierStrength / dist);
              }
            }
          }
        }
      }
    }
  }

  registerTraversal(verdict: TraversalVerdict) {
    /**
     * A philosophical SKG reports its position and force in the field.
     * SKGs are ATTRACTED TO CENTER - not random wandering.
     */
    if (verdict.confidence < 0 || verdict.confidence > 1) {
      throw new Error('Confidence must be [0,1]');
    }

    this.activeTraversals.set(verdict.skgId, verdict);
    
    // Add to field intensity at position (with confidence weighting)
    const pos = verdict.position;
    const forceNorm = Math.sqrt(
      verdict.forceVector[0] ** 2 + 
      verdict.forceVector[1] ** 2 + 
      verdict.forceVector[2] ** 2
    );
    const intensityAdd = verdict.confidence * forceNorm;
    
    const idx = this.getIndex(pos.x, pos.y, pos.z);
    this.intensity[idx] += intensityAdd;
    this.persistence[idx] = 1.0;
    
    // Apply force vector to neighboring cells (field propagation)
    this.propagateForce(verdict);
  }

  private propagateForce(verdict: TraversalVerdict, radius = 3) {
    /**
     * Propagate epistemic force through local field geometry.
     */
    const pos = verdict.position;
    const [fx, fy, fz] = verdict.forceVector;
    
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dz = -radius; dz <= radius; dz++) {
          const nx = Math.floor(pos.x + dx + fx * 0.1);
          const ny = Math.floor(pos.y + dy + fy * 0.1);
          const nz = Math.floor(pos.z + dz + fz * 0.1);
          
          if (nx >= 0 && nx < this.resolution && 
              ny >= 0 && ny < this.resolution && 
              nz >= 0 && nz < this.resolution) {
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
            const decay = 1.0 / (1.0 + dist);
            const idx = this.getIndex(nx, ny, nz);
            this.intensity[idx] += verdict.confidence * decay * 0.1;
          }
        }
      }
    }
  }

  /**
   * Calculate attractor force toward center (16, 16, 16)
   * SKGs converge at the center for consumption by gravity field
   */
  public calculateCenterAttraction(position: FieldPosition): [number, number, number] {
    const center = 16;
    const dx = center - position.x;
    const dy = center - position.y;
    const dz = center - position.z;
    
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.1;
    
    // Normalize and scale by distance (stronger when far from center)
    const force = Math.min(2.0, dist * 0.3);
    
    return [
      (dx / dist) * force,
      (dy / dist) * force,
      (dz / dist) * force
    ];
  }

  calculateConsensus(): ConsensusGeometry {
    /**
     * Calculate geometric consensus of current traversals.
     * This is the CORE HLSF operation - where philosophy becomes geometry.
     */
    if (this.activeTraversals.size < 2) {
      return {
        centroid: new FieldPosition(16, 16, 16),
        dispersion: 32.0,
        avgConfidence: 0.0,
        state: TraversalState.DIVERGENT
      };
    }

    const verdicts = Array.from(this.activeTraversals.values());
    const positions = verdicts.map(v => v.position.toVector());
    const confidences = verdicts.map(v => v.confidence);

    // Weighted centroid
    const totalWeight = confidences.reduce((a, b) => a + b, 0);
    const centroidVec: [number, number, number] = [0, 0, 0];
    
    for (let i = 0; i < positions.length; i++) {
      const weight = confidences[i] / totalWeight;
      centroidVec[0] += positions[i][0] * weight;
      centroidVec[1] += positions[i][1] * weight;
      centroidVec[2] += positions[i][2] * weight;
    }

    const centroid = new FieldPosition(
      Math.min(31, Math.max(0, Math.floor(centroidVec[0]))),
      Math.min(31, Math.max(0, Math.floor(centroidVec[1]))),
      Math.min(31, Math.max(0, Math.floor(centroidVec[2])))
    );

    // Calculate dispersion (tension indicator)
    const distances = positions.map(p => {
      const dx = p[0] - centroidVec[0];
      const dy = p[1] - centroidVec[1];
      const dz = p[2] - centroidVec[2];
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    });
    
    const dispersion = Math.max(...distances);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;

    // Determine state
    let state: TraversalState;
    if (dispersion <= this.consensusRadius) {
      state = TraversalState.STABILIZED;
    } else if (dispersion <= this.consensusRadius * 2) {
      state = TraversalState.CONVERGING;
    } else if (dispersion > this.tensionThreshold) {
      state = TraversalState.DIVERGENT;
    } else {
      state = TraversalState.EXPLORING;
    }

    // Calculate tension vector (direction of max disagreement)
    let tensionVector: [number, number, number] | undefined;
    if (state === TraversalState.DIVERGENT) {
      const maxDistIdx = distances.indexOf(Math.max(...distances));
      const farthestPos = positions[maxDistIdx];
      const norm = dispersion + 0.001;
      tensionVector = [
        (farthestPos[0] - centroidVec[0]) / norm,
        (farthestPos[1] - centroidVec[1]) / norm,
        (farthestPos[2] - centroidVec[2]) / norm
      ];
    }

    return {
      centroid,
      dispersion,
      avgConfidence,
      state,
      tensionVector
    };
  }

  step() {
    /**
     * Evolve field forward one time step (persistence decay).
     */
    for (let i = 0; i < this.intensity.length; i++) {
      this.intensity[i] *= this.persistenceDecay * this.topology[i];
      this.persistence[i] *= this.persistenceDecay;
    }

    // Store history
    if (this.activeTraversals.size > 0) {
      this.traversalHistory.push(new Map(this.activeTraversals));
      if (this.traversalHistory.length > this.maxHistory) {
        this.traversalHistory.shift();
      }
    }
  }

  getFieldSignature(): string {
    /**
     * Cryptographic hash of current field state (for audit trails).
     */
    // Simple hash for web - in production use crypto.subtle
    let hash = 0;
    for (let i = 0; i < this.intensity.length; i++) {
      hash = ((hash << 5) - hash + this.intensity[i]) | 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0').slice(0, 16);
  }

  queryGradient(position: FieldPosition): [number, number, number] {
    /**
     * Get truth-seeking gradient at specific field position.
     */
    const grads: [number, number, number] = [0, 0, 0];
    
    for (let axis = 0; axis < 3; axis++) {
      const posPlus = position.toVector();
      const posMinus = position.toVector();
      
      posPlus[axis] = Math.min(31, posPlus[axis] + 1);
      posMinus[axis] = Math.max(0, posMinus[axis] - 1);
      
      const idxPlus = this.getIndex(posPlus[0], posPlus[1], posPlus[2]);
      const idxMinus = this.getIndex(posMinus[0], posMinus[1], posMinus[2]);
      
      grads[axis] = (this.intensity[idxPlus] - this.intensity[idxMinus]) / 2.0;
    }
    
    return grads;
  }

  getActiveTraversals(): TraversalVerdict[] {
    return Array.from(this.activeTraversals.values());
  }

  getIntensityAt(x: number, y: number, z: number): number {
    if (x < 0 || x >= 32 || y < 0 || y >= 32 || z < 0 || z >= 32) {
      return 0;
    }
    return this.intensity[this.getIndex(x, y, z)];
  }
}