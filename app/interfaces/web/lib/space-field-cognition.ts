/**
 * SpaceFieldCognition - Neural Gravity Field Substrate
 * 
 * 32³ cubes with synaptic dynamics:
 * - Center cubes DIE FAST (TTL ~100) - rapid metabolic turnover
 * - Edge cubes PERSIST (TTL ~1000) - long-term memory
 * - Renewal: Center consumption → rebuild from edge statistics
 * - Diffusion field for broadcast signaling
 */

export interface SpaceFieldConfig {
  DIM: number;
  NEIGHBORS: number;
  WEIGHT_DIM: number;
  
  // Renewal parameters (Poisson means by shell)
  CENTER_TTL_MEAN: number;
  MIDDLE_TTL_MEAN: number;
  OUTER_TTL_MEAN: number;
  
  // Geometry thresholds
  CENTER_RADIUS: number;
  MIDDLE_RADIUS: number;
  
  // Update cadence
  CENTER_UPDATE_EVERY: number;
  MIDDLE_UPDATE_EVERY: number;
  OUTER_UPDATE_EVERY: number;
  
  // Diffusion
  DIFFUSION_DECAY: number;
  DIFFUSION_CHANNELS: number;
  
  TEMP_MIN: number;
  TEMP_MAX: number;
}

export const DEFAULT_CONFIG: SpaceFieldConfig = {
  DIM: 32,
  NEIGHBORS: 6,
  WEIGHT_DIM: 8,
  
  CENTER_TTL_MEAN: 100.0,
  MIDDLE_TTL_MEAN: 500.0,
  OUTER_TTL_MEAN: 1000.0,
  
  CENTER_RADIUS: 6,
  MIDDLE_RADIUS: 12,
  
  CENTER_UPDATE_EVERY: 1,
  MIDDLE_UPDATE_EVERY: 2,
  OUTER_UPDATE_EVERY: 4,
  
  DIFFUSION_DECAY: 0.8,
  DIFFUSION_CHANNELS: 4,
  
  TEMP_MIN: 0.1,
  TEMP_MAX: 2.0
};

export enum CoherenceState {
  CONTRADICTORY = 0,
  NEUTRAL = 1,
  COHERENT = 2
}

class CubeTensorState {
  private config: SpaceFieldConfig;
  private nCubes: number;
  
  // Core tensors (flattened 32³)
  public activation: Float32Array;
  public weights: Float32Array; // [nCubes * WEIGHT_DIM]
  public ttl: Float32Array;
  public maxTtl: Float32Array;
  public coherence: Float32Array; // [nCubes * 3] for 3-way softmax
  
  // Geometry
  public positions: Float32Array; // [nCubes * 3]
  public temperature: Float32Array;
  public neighborIndices: Int32Array; // [nCubes * 6]
  public ttlMeans: Float32Array;
  
  // Shell masks
  public centerMask: Uint8Array;
  public middleMask: Uint8Array;
  public outerMask: Uint8Array;
  
  constructor(config: SpaceFieldConfig) {
    this.config = config;
    this.nCubes = config.DIM ** 3;
    
    this.activation = new Float32Array(this.nCubes);
    this.weights = new Float32Array(this.nCubes * config.WEIGHT_DIM);
    this.ttl = new Float32Array(this.nCubes);
    this.maxTtl = new Float32Array(this.nCubes);
    this.coherence = new Float32Array(this.nCubes * 3);
    
    this.positions = new Float32Array(this.nCubes * 3);
    this.temperature = new Float32Array(this.nCubes);
    this.neighborIndices = new Int32Array(this.nCubes * 6).fill(-1);
    this.ttlMeans = new Float32Array(this.nCubes);
    
    this.centerMask = new Uint8Array(this.nCubes);
    this.middleMask = new Uint8Array(this.nCubes);
    this.outerMask = new Uint8Array(this.nCubes);
    
    this.initPositions();
    this.initTemperature();
    this.initShells();
    this.initTTLMeans();
    this.initNeighbors();
    this.respawnAll();
  }
  
  private initPositions() {
    const dim = this.config.DIM;
    for (let i = 0; i < this.nCubes; i++) {
      const x = Math.floor(i / (dim * dim));
      const y = Math.floor((i % (dim * dim)) / dim);
      const z = i % dim;
      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;
    }
  }
  
  private initTemperature() {
    const center = (this.config.DIM - 1) / 2;
    const maxDist = this.config.DIM * 1.5;
    
    for (let i = 0; i < this.nCubes; i++) {
      const x = this.positions[i * 3];
      const y = this.positions[i * 3 + 1];
      const z = this.positions[i * 3 + 2];
      const dist = Math.abs(x - center) + Math.abs(y - center) + Math.abs(z - center);
      const t = dist / maxDist;
      this.temperature[i] = this.config.TEMP_MIN + t * (this.config.TEMP_MAX - this.config.TEMP_MIN);
    }
  }
  
  private initShells() {
    const center = (this.config.DIM - 1) / 2;
    
    for (let i = 0; i < this.nCubes; i++) {
      const x = this.positions[i * 3];
      const y = this.positions[i * 3 + 1];
      const z = this.positions[i * 3 + 2];
      const dist = Math.abs(x - center) + Math.abs(y - center) + Math.abs(z - center);
      
      if (dist < this.config.CENTER_RADIUS) {
        this.centerMask[i] = 1;
      } else if (dist < this.config.MIDDLE_RADIUS) {
        this.middleMask[i] = 1;
      } else {
        this.outerMask[i] = 1;
      }
    }
  }
  
  private initTTLMeans() {
    for (let i = 0; i < this.nCubes; i++) {
      if (this.centerMask[i]) {
        this.ttlMeans[i] = this.config.CENTER_TTL_MEAN;
      } else if (this.middleMask[i]) {
        this.ttlMeans[i] = this.config.MIDDLE_TTL_MEAN;
      } else {
        this.ttlMeans[i] = this.config.OUTER_TTL_MEAN;
      }
    }
  }
  
  private initNeighbors() {
    const dim = this.config.DIM;
    const dirs = [
      [-1, 0, 0], [1, 0, 0],
      [0, -1, 0], [0, 1, 0],
      [0, 0, -1], [0, 0, 1]
    ];
    
    for (let i = 0; i < this.nCubes; i++) {
      const x = this.positions[i * 3];
      const y = this.positions[i * 3 + 1];
      const z = this.positions[i * 3 + 2];
      
      for (let d = 0; d < 6; d++) {
        const nx = x + dirs[d][0];
        const ny = y + dirs[d][1];
        const nz = z + dirs[d][2];
        
        if (nx >= 0 && nx < dim && ny >= 0 && ny < dim && nz >= 0 && nz < dim) {
          const neighborIdx = nx * (dim * dim) + ny * dim + nz;
          this.neighborIndices[i * 6 + d] = neighborIdx;
        }
      }
    }
  }
  
  private poissonSample(mean: number): number {
    // Approximation for Poisson distribution
    const L = Math.exp(-mean);
    let k = 0;
    let p = 1;
    
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    
    return k - 1;
  }
  
  private respawnAll() {
    for (let i = 0; i < this.nCubes; i++) {
      this.ttl[i] = this.poissonSample(this.ttlMeans[i]);
      this.maxTtl[i] = this.ttl[i];
      
      // Initialize weights with small random values
      for (let w = 0; w < this.config.WEIGHT_DIM; w++) {
        this.weights[i * this.config.WEIGHT_DIM + w] = (Math.random() - 0.5) * 0.02;
      }
    }
  }
  
  public respawnCubes(deadIndices: number[], useEdgeStats: boolean) {
    if (deadIndices.length === 0) return;
    
    for (const idx of deadIndices) {
      // Fresh template weights
      for (let w = 0; w < this.config.WEIGHT_DIM; w++) {
        this.weights[idx * this.config.WEIGHT_DIM + w] = (Math.random() - 0.5) * 0.02;
      }
      
      // Statistical initialization from edges if center cube
      if (useEdgeStats) {
        // Sample from outer shell
        const edgeIndices: number[] = [];
        for (let i = 0; i < this.nCubes; i++) {
          if (this.outerMask[i]) edgeIndices.push(i);
        }
        
        if (edgeIndices.length > 0) {
          const sampleIdx = edgeIndices[Math.floor(Math.random() * edgeIndices.length)];
          this.activation[idx] = this.activation[sampleIdx] * 0.1 + (Math.random() - 0.5) * 0.05;
        }
      } else {
        this.activation[idx] = 0;
      }
      
      // Reset TTL
      this.ttl[idx] = this.poissonSample(this.ttlMeans[idx]);
      this.maxTtl[idx] = this.ttl[idx];
    }
  }
}

class DiffusionField {
  private config: SpaceFieldConfig;
  private field: Float32Array; // [DIM * DIM * DIM * CHANNELS]
  
  constructor(config: SpaceFieldConfig) {
    this.config = config;
    const size = config.DIM ** 3 * config.DIFFUSION_CHANNELS;
    this.field = new Float32Array(size);
  }
  
  public broadcast(signal: Float32Array) {
    // Additive injection (heat injection model)
    for (let i = 0; i < this.field.length; i++) {
      this.field[i] += signal[i];
      // Clamp to prevent overflow
      this.field[i] = Math.max(-10, Math.min(10, this.field[i]));
    }
  }
  
  public step() {
    const dim = this.config.DIM;
    const channels = this.config.DIFFUSION_CHANNELS;
    const newField = new Float32Array(this.field.length);
    
    // 6-directional diffusion
    for (let x = 0; x < dim; x++) {
      for (let y = 0; y < dim; y++) {
        for (let z = 0; z < dim; z++) {
          const idx = (x * dim * dim + y * dim + z) * channels;
          
          for (let c = 0; c < channels; c++) {
            let sum = this.field[idx + c];
            let count = 1;
            
            // Average with neighbors
            const neighbors = [
              [x-1, y, z], [x+1, y, z],
              [y, y-1, z], [x, y+1, z],
              [x, y, z-1], [x, y, z+1]
            ];
            
            for (const [nx, ny, nz] of neighbors) {
              if (nx >= 0 && nx < dim && ny >= 0 && ny < dim && nz >= 0 && nz < dim) {
                const nIdx = (nx * dim * dim + ny * dim + nz) * channels;
                sum += this.field[nIdx + c] * 0.1;
                count++;
              }
            }
            
            newField[idx + c] = sum * this.config.DIFFUSION_DECAY;
          }
        }
      }
    }
    
    this.field = newField;
  }
  
  public readLocal(cubeIdx: number): number[] {
    const channels = this.config.DIFFUSION_CHANNELS;
    const idx = cubeIdx * channels;
    return Array.from(this.field.slice(idx, idx + channels));
  }
  
  public getField(): Float32Array {
    return this.field;
  }
}

export class SpaceFieldCognition {
  private config: SpaceFieldConfig;
  public cubes: CubeTensorState;
  public diffusion: DiffusionField;
  
  private stepCount = 0;
  
  constructor(config: SpaceFieldConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.cubes = new CubeTensorState(config);
    this.diffusion = new DiffusionField(config);
  }
  
  private localUpdate(mask: Uint8Array, shellType: 'center' | 'middle' | 'outer') {
    const indices: number[] = [];
    for (let i = 0; i < mask.length; i++) {
      if (mask[i]) indices.push(i);
    }
    
    if (indices.length === 0) return;
    
    for (const idx of indices) {
      // Calculate local pressure from neighbors
      let localPressure = 0;
      let validCount = 0;
      
      for (let n = 0; n < 6; n++) {
        const neighborIdx = this.cubes.neighborIndices[idx * 6 + n];
        if (neighborIdx >= 0) {
          localPressure += this.cubes.activation[neighborIdx];
          validCount++;
        }
      }
      
      if (validCount > 0) {
        localPressure /= validCount;
      }
      
      // Hebbian weight update
      for (let w = 0; w < this.config.WEIGHT_DIM; w++) {
        const weightIdx = idx * this.config.WEIGHT_DIM + w;
        const delta = localPressure * this.cubes.weights[weightIdx] * 0.01;
        this.cubes.weights[weightIdx] = Math.max(-1, Math.min(1, this.cubes.weights[weightIdx] + delta));
        
        // Clutter cleaning
        if (Math.abs(this.cubes.weights[weightIdx]) < 0.001) {
          this.cubes.weights[weightIdx] = 0;
        }
      }
      
      // Diffusion input
      const diffusionLocal = this.diffusion.readLocal(idx);
      const diffusionInput = diffusionLocal.reduce((a, b) => a + b, 0) / diffusionLocal.length;
      
      // Shock gating for outer shell
      let shockDamping = 1.0;
      let shockDeath = 0;
      
      if (shellType === 'outer') {
        const shockMag = diffusionLocal.reduce((a, b) => a + Math.abs(b), 0) / diffusionLocal.length;
        shockDamping = 1.0 / (1.0 + 3.0 * shockMag);
        shockDeath = shockMag > 0.5 ? 3 : 0;
      }
      
      // Update activation
      const neighborScale = validCount / this.config.NEIGHBORS;
      const localInput = 
        localPressure * shockDamping +
        this.cubes.activation[idx] * 0.5 * neighborScale +
        diffusionInput * 0.1 * shockDamping;
      
      this.cubes.activation[idx] = Math.tanh(localInput);
      
      // 3-way coherence (CONTRADICTORY/NEUTRAL/COHERENT)
      let neighborStd = 0;
      if (validCount > 1) {
        const neighborValues: number[] = [];
        for (let n = 0; n < 6; n++) {
          const neighborIdx = this.cubes.neighborIndices[idx * 6 + n];
          if (neighborIdx >= 0) {
            neighborValues.push(this.cubes.activation[neighborIdx]);
          }
        }
        const mean = neighborValues.reduce((a, b) => a + b, 0) / neighborValues.length;
        neighborStd = Math.sqrt(neighborValues.reduce((a, b) => a + (b - mean) ** 2, 0) / neighborValues.length);
      }
      
      const coherenceScore = localPressure - this.cubes.activation[idx];
      const incoherenceScore = neighborStd;
      
      const logits = [
        incoherenceScore,
        -Math.abs(coherenceScore),
        -incoherenceScore
      ];
      
      // Softmax with temperature
      const temp = this.cubes.temperature[idx];
      const expLogits = logits.map(l => Math.exp(l / temp));
      const sumExp = expLogits.reduce((a, b) => a + b, 0);
      
      for (let c = 0; c < 3; c++) {
        this.cubes.coherence[idx * 3 + c] = expLogits[c] / sumExp;
      }
      
      // Decay TTL
      this.cubes.ttl[idx] -= (1.0 + shockDeath);
    }
  }
  
  private consumeAndRenew() {
    const centerDead: number[] = [];
    const otherDead: number[] = [];
    
    for (let i = 0; i < this.cubes.ttl.length; i++) {
      if (this.cubes.ttl[i] <= 0) {
        if (this.cubes.centerMask[i]) {
          centerDead.push(i);
        } else {
          otherDead.push(i);
        }
      }
    }
    
    // Rebuild from edge for center cubes (metabolic folding)
    this.cubes.respawnCubes(centerDead, true);
    this.cubes.respawnCubes(otherDead, false);
  }
  
  public step() {
    this.stepCount++;
    
    // Staggered updates by shell
    if (this.stepCount % this.config.CENTER_UPDATE_EVERY === 0) {
      this.localUpdate(this.cubes.centerMask, 'center');
    }
    
    if (this.stepCount % this.config.MIDDLE_UPDATE_EVERY === 0) {
      this.localUpdate(this.cubes.middleMask, 'middle');
    }
    
    if (this.stepCount % this.config.OUTER_UPDATE_EVERY === 0) {
      this.localUpdate(this.cubes.outerMask, 'outer');
    }
    
    // Diffusion decay
    this.diffusion.step();
    
    // Folding/renewal
    this.consumeAndRenew();
  }
  
  public broadcastToField(signal: Float32Array) {
    this.diffusion.broadcast(signal);
  }
  
  public getFieldStats() {
    // Calculate entropy by shell
    const stats: Record<string, number> = {};
    
    for (const [shellName, mask] of [
      ['center', this.cubes.centerMask],
      ['middle', this.cubes.middleMask],
      ['outer', this.cubes.outerMask]
    ] as const) {
      let entropy = 0;
      let count = 0;
      
      for (let i = 0; i < mask.length; i++) {
        if (mask[i]) {
          const probs = [
            this.cubes.coherence[i * 3],
            this.cubes.coherence[i * 3 + 1],
            this.cubes.coherence[i * 3 + 2]
          ];
          
          entropy += -probs.reduce((sum, p) => sum + (p > 0 ? p * Math.log(p) : 0), 0);
          count++;
        }
      }
      
      stats[`${shellName}_entropy`] = count > 0 ? entropy / count : 0;
    }
    
    // Renewal pressure
    let dying = 0;
    for (let i = 0; i < this.cubes.ttl.length; i++) {
      if (this.cubes.ttl[i] < this.cubes.maxTtl[i] * 0.1) {
        dying++;
      }
    }
    stats.renewal_pressure = dying / this.cubes.ttl.length;
    
    return stats;
  }
  
  public getStepCount(): number {
    return this.stepCount;
  }
}
