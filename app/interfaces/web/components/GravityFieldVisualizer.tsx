import { useMemo } from 'react';
import { SpaceFieldCognition, CoherenceState } from '../lib/space-field-cognition';

interface GravityFieldVisualizerProps {
  gravity: SpaceFieldCognition;
  stats: Record<string, number>;
  size?: number;
}

/**
 * GravityFieldVisualizer: Shows neural substrate metabolic activity
 * 
 * Visualizes:
 * - Center consumption (rapid TTL decay, high churn)
 * - Edge persistence (slow TTL decay, memory)
 * - Coherence states (CONTRADICTORY/NEUTRAL/COHERENT)
 * - Diffusion field activity
 */
export function GravityFieldVisualizer({ 
  gravity, 
  stats, 
  size = 180 
}: GravityFieldVisualizerProps) {
  
  // Sample field state for visualization (center and edge cubes)
  const fieldSample = useMemo(() => {
    const centerIdx = 16 * 32 * 32 + 16 * 32 + 16; // Center cube
    const edgeIndices = [
      0, // Corner
      31 * 32 * 32 + 31 * 32 + 31, // Opposite corner
      15 * 32 * 32 + 16 * 32 + 16, // Near center
    ];
    
    const samples = [centerIdx, ...edgeIndices].map(idx => {
      const activation = gravity.cubes.activation[idx];
      const ttl = gravity.cubes.ttl[idx];
      const maxTtl = gravity.cubes.maxTtl[idx];
      const coherence = [
        gravity.cubes.coherence[idx * 3],
        gravity.cubes.coherence[idx * 3 + 1],
        gravity.cubes.coherence[idx * 3 + 2]
      ];
      
      return {
        activation,
        ttl,
        ttlRatio: maxTtl > 0 ? ttl / maxTtl : 0,
        coherence,
        dominantState: coherence.indexOf(Math.max(...coherence))
      };
    });
    
    return samples;
  }, [gravity]);
  
  const center = size / 2;
  
  // Entropy colors
  const getEntropyColor = (entropy: number) => {
    // Low entropy (ordered) = blue, high entropy (chaotic) = red
    const normalized = Math.min(1, entropy / 2);
    const r = Math.floor(normalized * 255);
    const b = Math.floor((1 - normalized) * 255);
    return `rgb(${r}, 100, ${b})`;
  };
  
  const centerEntropy = stats.center_entropy || 0;
  const middleEntropy = stats.middle_entropy || 0;
  const outerEntropy = stats.outer_entropy || 0;
  const renewalPressure = stats.renewal_pressure || 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      <defs>
        {/* Shell gradients */}
        <radialGradient id="gravityShells">
          <stop offset="0%" stopColor={getEntropyColor(centerEntropy)} stopOpacity="0.6" />
          <stop offset="40%" stopColor={getEntropyColor(middleEntropy)} stopOpacity="0.4" />
          <stop offset="80%" stopColor={getEntropyColor(outerEntropy)} stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        
        {/* Pulse for renewal pressure */}
        <radialGradient id="renewalPulse">
          <stop offset="0%" stopColor="rgba(255, 100, 100, ${renewalPressure})" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      
      {/* Background shells showing metabolic zones */}
      <circle
        cx={center}
        cy={center}
        r={center}
        fill="url(#gravityShells)"
      />
      
      {/* Center consumption zone (rapid churn) */}
      <circle
        cx={center}
        cy={center}
        r={center * 0.3}
        fill="url(#renewalPulse)"
        opacity={0.5 + renewalPressure * 0.5}
      />
      
      {/* Shell boundaries */}
      <circle
        cx={center}
        cy={center}
        r={center * 0.3}
        fill="none"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="1"
        strokeDasharray="2,2"
      />
      <circle
        cx={center}
        cy={center}
        r={center * 0.6}
        fill="none"
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="1"
        strokeDasharray="2,2"
      />
      
      {/* Sample cube states */}
      {fieldSample.map((sample, idx) => {
        const angle = (idx * Math.PI * 2) / fieldSample.length;
        const radius = idx === 0 ? 20 : center * 0.8;
        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        
        // Coherence state colors
        const stateColors = [
          'rgba(255, 50, 50, 0.8)',  // CONTRADICTORY
          'rgba(200, 200, 200, 0.6)', // NEUTRAL
          'rgba(50, 255, 50, 0.8)'    // COHERENT
        ];
        
        const color = stateColors[sample.dominantState];
        const cubeSize = 6 + sample.ttlRatio * 4;
        
        return (
          <g key={idx}>
            {/* TTL decay ring */}
            <circle
              cx={x}
              cy={y}
              r={cubeSize + 2}
              fill="none"
              stroke={color}
              strokeWidth="1"
              opacity={sample.ttlRatio}
            />
            
            {/* Cube state */}
            <rect
              x={x - cubeSize / 2}
              y={y - cubeSize / 2}
              width={cubeSize}
              height={cubeSize}
              fill={color}
              opacity={0.6 + sample.activation * 0.4}
            />
            
            {/* Label for center */}
            {idx === 0 && (
              <text
                x={x}
                y={y - cubeSize - 5}
                textAnchor="middle"
                fontSize="8"
                fill="rgba(255, 255, 255, 0.8)"
                fontFamily="monospace"
              >
                CENTER
              </text>
            )}
          </g>
        );
      })}
      
      {/* Stats overlay */}
      <g transform={`translate(5, ${size - 45})`}>
        <text fontSize="9" fill="rgba(255, 255, 255, 0.6)" fontFamily="monospace">
          <tspan x="0" dy="0">Center: {centerEntropy.toFixed(2)} ent</tspan>
          <tspan x="0" dy="12">Middle: {middleEntropy.toFixed(2)} ent</tspan>
          <tspan x="0" dy="12">Outer: {outerEntropy.toFixed(2)} ent</tspan>
          <tspan x="0" dy="12">Renewal: {(renewalPressure * 100).toFixed(0)}%</tspan>
        </text>
      </g>
      
      {/* Legend */}
      <g transform={`translate(${size - 70}, 10)`}>
        <text fontSize="8" fill="rgba(255, 255, 255, 0.5)" fontFamily="monospace">
          Coherence:
        </text>
        <rect x="0" y="12" width="8" height="8" fill="rgba(255, 50, 50, 0.8)" />
        <text x="10" y="19" fontSize="7" fill="rgba(255, 255, 255, 0.5)" fontFamily="monospace">
          Contra
        </text>
        <rect x="0" y="24" width="8" height="8" fill="rgba(200, 200, 200, 0.6)" />
        <text x="10" y="31" fontSize="7" fill="rgba(255, 255, 255, 0.5)" fontFamily="monospace">
          Neutral
        </text>
        <rect x="0" y="36" width="8" height="8" fill="rgba(50, 255, 50, 0.8)" />
        <text x="10" y="43" fontSize="7" fill="rgba(255, 255, 255, 0.5)" fontFamily="monospace">
          Coherent
        </text>
      </g>
    </svg>
  );
}
