import { useMemo } from 'react';
import { HLSpaceField, ConsensusGeometry, TraversalState } from '../lib/hlsf-substrate';

interface HLSFVisualizerProps {
  field: HLSpaceField;
  consensus: ConsensusGeometry;
  size?: number;
}

/**
 * HLSFVisualizer: Bridge between HLSF cognitive substrate and visual representation.
 * 
 * Renders HLSF state to canvas - does NOT create or own the field.
 * This is the TypeScript equivalent of HLSFSnapshotProvider.
 */
export function HLSFVisualizer({ field, consensus, size = 180 }: HLSFVisualizerProps) {
  const stateColors = useMemo(() => ({
    [TraversalState.STABILIZED]: 'rgba(0, 255, 128, 0.4)',
    [TraversalState.CONVERGING]: 'rgba(255, 200, 0, 0.4)',
    [TraversalState.EXPLORING]: 'rgba(0, 150, 255, 0.4)',
    [TraversalState.DIVERGENT]: 'rgba(255, 0, 80, 0.6)'
  }), []);

  const bgColor = stateColors[consensus.state] || 'rgba(100, 100, 100, 0.4)';
  
  // Normalize centroid position to circle coordinates
  const center = size / 2;
  const cx = center + ((consensus.centroid.x - 16) / 16) * (center * 0.6);
  const cy = center + ((consensus.centroid.y - 16) / 16) * (center * 0.6);
  
  // Confidence glow size
  const glowSize = 20 + consensus.avgConfidence * 30;
  const glowOpacity = 100 + consensus.avgConfidence * 155;
  
  // Dispersion ring
  const showRing = consensus.dispersion > 4;
  const ringSize = showRing ? Math.min(center, consensus.dispersion * 3) : 0;
  
  // Active traversals
  const traversals = field.getActiveTraversals();

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      <defs>
        {/* Field intensity gradient */}
        <radialGradient id="fieldGradient">
          <stop offset="0%" stopColor={bgColor} />
          <stop offset="70%" stopColor={bgColor.replace(/[\d.]+\)$/, '0.2)')} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        
        {/* Confidence glow */}
        <radialGradient id="confidenceGlow">
          <stop offset="0%" stopColor={`rgba(255, 255, 255, ${glowOpacity / 255})`} />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      
      {/* Background field intensity */}
      <circle
        cx={center}
        cy={center}
        r={center}
        fill="url(#fieldGradient)"
      />
      
      {/* Dispersion ring (tension indicator) */}
      {showRing && (
        <circle
          cx={center}
          cy={center}
          r={ringSize}
          fill="none"
          stroke="rgba(255, 100, 100, 0.4)"
          strokeWidth="2"
        />
      )}
      
      {/* Confidence glow around centroid */}
      <circle
        cx={cx}
        cy={cy}
        r={glowSize}
        fill="url(#confidenceGlow)"
      />
      
      {/* Core centroid point */}
      <circle
        cx={cx}
        cy={cy}
        r="4"
        fill="rgba(255, 255, 255, 1)"
      />
      
      {/* Individual traversal positions */}
      {traversals.map((t, idx) => {
        const tx = center + ((t.position.x - 16) / 16) * (center * 0.6);
        const ty = center + ((t.position.y - 16) / 16) * (center * 0.6);
        const tOpacity = 0.3 + t.confidence * 0.7;
        
        // SKG colors
        const skgColors: Record<string, string> = {
          spinoza: '#0096FF',
          kant: '#FFD700',
          locke: '#00FF00',
          hume: '#FF0000'
        };
        
        const color = skgColors[t.skgId] || '#FFFFFF';
        
        return (
          <g key={idx}>
            {/* Traversal point */}
            <circle
              cx={tx}
              cy={ty}
              r="3"
              fill={color}
              opacity={tOpacity}
            />
            {/* Force vector indicator */}
            <line
              x1={tx}
              y1={ty}
              x2={tx + t.forceVector[0] * 5}
              y2={ty + t.forceVector[1] * 5}
              stroke={color}
              strokeWidth="1"
              opacity={tOpacity * 0.5}
            />
          </g>
        );
      })}
      
      {/* Tension vector (if divergent) */}
      {consensus.tensionVector && (
        <line
          x1={cx}
          y1={cy}
          x2={cx + consensus.tensionVector[0] * 40}
          y2={cy + consensus.tensionVector[1] * 40}
          stroke="rgba(255, 0, 80, 0.8)"
          strokeWidth="2"
          strokeDasharray="4,4"
        />
      )}
      
      {/* State label */}
      <text
        x={center}
        y={size - 10}
        textAnchor="middle"
        fontSize="10"
        fill="rgba(255, 255, 255, 0.6)"
        fontFamily="monospace"
      >
        {consensus.state}
      </text>
    </svg>
  );
}
