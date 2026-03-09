import React, { useState } from 'react';
import { motion } from 'motion/react';
import { HLSpaceField, ConsensusGeometry } from '../lib/hlsf-substrate';
import { SpaceFieldCognition } from '../lib/space-field-cognition';
import { HLSFVisualizer } from './HLSFVisualizer';
import { GravityFieldVisualizer } from './GravityFieldVisualizer';

interface OrbVisualizationProps {
  scale: number;
  spinozaColor: string;
  kantColor: string;
  lockeColor: string;
  humeColor: string;
  hlsfField: HLSpaceField;
  gravity: SpaceFieldCognition;
  consensus: ConsensusGeometry;
  gravityStats: Record<string, number>;
  govOutput: any; // Use a more specific type if available
}

export const OrbVisualization: React.FC<OrbVisualizationProps> = ({
  scale,
  spinozaColor,
  kantColor,
  lockeColor,
  humeColor,
  hlsfField,
  gravity,
  consensus,
  gravityStats,
  govOutput,
}) => {
  const [viewMode, setViewMode] = useState<'hlsf' | 'gravity'>('hlsf');
  const colors = [spinozaColor, kantColor, lockeColor, humeColor];
  
  return (
    <div className="relative flex flex-col items-center justify-center gap-4">
      {/* View mode toggle */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setViewMode('hlsf')}
          className={`px-3 py-1 text-xs rounded ${
            viewMode === 'hlsf' 
              ? 'bg-blue-600 text-white' 
              : 'bg-neutral-700 text-neutral-300'
          }`}
        >
          HLSF (Philosophical)
        </button>
        <button
          onClick={() => setViewMode('gravity')}
          className={`px-3 py-1 text-xs rounded ${
            viewMode === 'gravity' 
              ? 'bg-purple-600 text-white' 
              : 'bg-neutral-700 text-neutral-300'
          }`}
        >
          Gravity (Neural)
        </button>
      </div>
      
      <div className="relative flex items-center justify-center" style={{ transform: `scale(${scale / 100})` }}>
        {/* Background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black rounded-full blur-3xl opacity-80" />
        
        {/* Sacred Geometry Pattern */}
        <svg
          width="500"
          height="500"
          viewBox="0 0 500 500"
          className="relative z-10"
        >
          {/* Outer circle */}
          <circle
            cx="250"
            cy="250"
            r="220"
            fill="none"
            stroke="rgba(100, 100, 100, 0.6)"
            strokeWidth="3"
          />
          
          {/* Geometric pattern - 6 circles around center */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i * Math.PI) / 3;
            const x = 250 + 120 * Math.cos(angle);
            const y = 250 + 120 * Math.sin(angle);
            
            return (
              <g key={i}>
                {/* Small circles at vertices */}
                <circle
                  cx={x}
                  cy={y}
                  r="35"
                  fill="rgba(60, 60, 60, 0.8)"
                  stroke="rgba(100, 100, 100, 0.8)"
                  strokeWidth="2"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="20"
                  fill="rgba(40, 40, 40, 0.9)"
                  stroke="rgba(80, 80, 80, 0.6)"
                  strokeWidth="1"
                />
              </g>
            );
          })}
          
          {/* Connecting lines forming hexagon */}
          <motion.path
            d="M 370 250 L 310 353.9 L 190 353.9 L 130 250 L 190 146.1 L 310 146.1 Z"
            fill="none"
            stroke="rgba(120, 120, 120, 0.5)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          
          {/* Central hexagon with glow */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={kantColor} stopOpacity="0.9" />
              <stop offset="50%" stopColor="#D4AF37" stopOpacity="1" />
              <stop offset="100%" stopColor={kantColor} stopOpacity="0.8" />
            </linearGradient>
            
            <radialGradient id="orbGlow">
              <stop offset="0%" stopColor={kantColor} stopOpacity="0.8" />
              <stop offset="50%" stopColor={kantColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={kantColor} stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Animated glow effect */}
          <motion.circle
            cx="250"
            cy="250"
            r="100"
            fill="url(#orbGlow)"
            animate={{
              r: [80, 120, 80],
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Main hexagon */}
          <motion.path
            d="M 310 205 L 310 295 L 250 340 L 190 295 L 190 205 L 250 160 Z"
            fill="url(#hexGradient)"
            stroke={kantColor}
            strokeWidth="3"
            filter="url(#glow)"
            animate={{
              filter: [
                "drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))",
                "drop-shadow(0 0 40px rgba(255, 215, 0, 0.9))",
                "drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Center content - Dual-field visualization */}
          <foreignObject x="160" y="160" width="180" height="180">
            <div className="w-full h-full flex items-center justify-center">
              {viewMode === 'hlsf' ? (
                <HLSFVisualizer field={hlsfField} consensus={consensus} size={180} />
              ) : (
                <GravityFieldVisualizer gravity={gravity} stats={gravityStats} size={180} />
              )}
            </div>
          </foreignObject>
          
          {/* Colored accent circles (philosophical colors) */}
          {colors.map((color, i) => {
            const angle = (i * Math.PI) / 2 - Math.PI / 4;
            const x = 250 + 160 * Math.cos(angle);
            const y = 250 + 160 * Math.sin(angle);
            
            return (
              <motion.circle
                key={i}
                cx={x}
                cy={y}
                r="8"
                fill={color}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            );
          })}
        </svg>
      </div>
      
      {/* Field layer indicator */}
      <div className="text-xs text-neutral-400 font-mono">
        {viewMode === 'hlsf' 
          ? 'Epistemic Geometry Layer' 
          : 'Neural Substrate Layer'}
      </div>
    </div>
  );
}