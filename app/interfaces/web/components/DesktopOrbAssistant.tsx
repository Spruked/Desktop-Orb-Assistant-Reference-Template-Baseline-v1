import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

// Desktop Orb Assistant Manifest
const manifest = {
  orb_id: "Desktop_Orb_Assistant_" + Date.now(),
  orb_type: "desktop_orb_assistant",
  plugin_version: "1.0.0",
  capabilities: ["basic-ui"],
  endpoints: {
    ws: null,
    rest: null
  },
  status: {
    doctrine: "none",
    drift: 0,
    ddr: 0,
    env: 1
  }
};

// Make manifest available globally
(window as any).__ORB_MANIFEST__ = manifest;

interface DesktopOrbAssistantProps {
  scale?: number;
}

export const DesktopOrbAssistant: React.FC<DesktopOrbAssistantProps> = ({
  scale = 100
}) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [status, setStatus] = useState(manifest.status);

  useEffect(() => {
    // Register with Dock Station on mount
    if (window.electronAPI?.send) {
      window.electronAPI.send('orb-register', manifest);
      setIsRegistered(true);

      // Start heartbeat
      const heartbeat = setInterval(() => {
        window.electronAPI?.send('orb-status', {
          orb_id: manifest.orb_id,
          status: manifest.status
        });
      }, 2000);

      return () => clearInterval(heartbeat);
    }
  }, []);

  const orbSize = (scale / 100) * 120; // Base size of 120px

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{
        width: orbSize,
        height: orbSize,
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(0, 150, 255, 0.3) 0%, transparent 70%)`,
          filter: 'blur(8px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main orb */}
      <motion.div
        className="relative rounded-full border-2 border-blue-400/50 bg-gradient-to-br from-blue-500/20 to-blue-700/20 backdrop-blur-sm"
        style={{
          width: '100%',
          height: '100%',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Inner content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="text-2xl font-bold mb-1">◎</div>
          <div className="text-xs text-center leading-tight">
            <div>Desktop</div>
            <div>Orb</div>
          </div>
        </div>

        {/* Status indicator */}
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-gray-900"
          animate={{
            opacity: isRegistered ? [0.7, 1, 0.7] : 0.3,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />

        {/* Status text overlay */}
        <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-blue-200 bg-black/50 rounded-b-full py-1">
          {isRegistered ? 'Docked' : 'Registering...'}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DesktopOrbAssistant;