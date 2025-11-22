import React, { useEffect, useState, useRef } from 'react';
import { FaceData, HandData } from '../types';

interface SmartHUDProps {
  faceDataRef: React.MutableRefObject<FaceData>;
  handDataRef: React.MutableRefObject<HandData>;
}

const dummyLogs = [
  "INITIALIZING PROTOCOL 7...",
  "CONNECTING TO SATELLITE ARRAY...",
  "BIOMETRIC SCAN: MATCH",
  "NEURAL LINK ESTABLISHED",
  "DOWNLOADING TERRAIN DATA...",
  "ATMOSPHERIC PRESSURE: STABLE",
  "TARGET ACQUIRED",
  "RENDERING PHYSICS ENGINE...",
  "QUANTUM ENCRYPTION: ACTIVE",
];

const SmartHUD: React.FC<SmartHUDProps> = ({ faceDataRef, handDataRef }) => {
  const [hudStyle, setHudStyle] = useState<React.CSSProperties>({});
  const [logs, setLogs] = useState<string[]>(dummyLogs);
  const [systemStatus, setSystemStatus] = useState("STANDBY");
  
  // Ref to hold the visual elements to update via requestAnimationFrame
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const updateHUD = () => {
      const face = faceDataRef.current;
      const hand = handDataRef.current;

      if (face.detected && containerRef.current) {
        // Calculate screen position based on normalized coordinates (0-1)
        // Flip X because webcam is usually mirrored
        const x = (1 - face.position.x) * window.innerWidth;
        const y = face.position.y * window.innerHeight;

        // Offset HUD to the right of the face
        const xOffset = 180; 
        const yOffset = -50;

        containerRef.current.style.transform = `translate(${x + xOffset}px, ${y + yOffset}px)`;
        containerRef.current.style.opacity = '1';
        setSystemStatus("ONLINE");
      } else if (containerRef.current) {
         // Fade out if lost
         containerRef.current.style.opacity = '0.3';
         setSystemStatus("SEARCHING...");
      }

      animationFrameId = requestAnimationFrame(updateHUD);
    };

    updateHUD();
    return () => cancelAnimationFrame(animationFrameId);
  }, [faceDataRef, handDataRef]);

  // Rolling logs effect
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLogs = [...prev.slice(1), prev[0]];
        return newLogs;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      
      {/* Dynamic HUD Tracking Head */}
      <div 
        ref={containerRef}
        className="absolute w-64 transition-transform duration-75 ease-out will-change-transform opacity-0"
        style={{ top: 0, left: 0 }}
      >
        <div className="relative border-l-2 border-cyan-400 pl-4 bg-black/40 backdrop-blur-sm p-4 rounded-r-lg shadow-[0_0_15px_rgba(0,255,255,0.3)]">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-2 border-b border-cyan-900 pb-1">
            <span className="text-xs text-cyan-200 font-bold tracking-widest">SYS.TRK.V4</span>
            <span className={`text-xs font-bold ${systemStatus === "ONLINE" ? "text-green-400 animate-pulse" : "text-red-400"}`}>
              [{systemStatus}]
            </span>
          </div>

          {/* Data Cluster */}
          <div className="space-y-2 font-mono text-[10px] text-cyan-300">
            <div className="flex justify-between">
              <span>CPU</span>
              <div className="w-16 h-2 bg-cyan-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 animate-[pulse_2s_infinite]" style={{width: '75%'}}></div>
              </div>
            </div>
            <div className="flex justify-between">
              <span>MEM</span>
              <div className="w-16 h-2 bg-cyan-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 animate-[pulse_3s_infinite]" style={{width: '45%'}}></div>
              </div>
            </div>
            
            {/* Waveform Visualization (Fake) */}
            <div className="h-8 flex items-end justify-between gap-[1px] opacity-80 mt-2">
               {[...Array(20)].map((_, i) => (
                 <div 
                   key={i} 
                   className="w-1 bg-cyan-500"
                   style={{
                     height: `${Math.random() * 100}%`,
                     transition: 'height 0.2s'
                   }}
                 />
               ))}
            </div>

            {/* Scrolling Logs */}
            <div className="mt-2 h-16 overflow-hidden border-t border-cyan-900 pt-1 text-cyan-500/80">
              {logs.map((log, i) => (
                 <div key={i} className="truncate">{`> ${log}`}</div>
              ))}
            </div>
          </div>
          
          {/* Decorative Corner */}
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-cyan-200"></div>
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-200"></div>
        </div>
      </div>

      {/* Static corner UI elements */}
      <div className="absolute top-8 right-8 text-right font-mono pointer-events-none hidden md:block">
        <h1 className="text-4xl text-cyan-400 font-black tracking-tighter drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">JARVIS</h1>
        <p className="text-cyan-600 text-sm tracking-[0.5em]">AUGMENTED REALITY SYSTEM</p>
      </div>

      <div className="absolute bottom-8 left-8 text-cyan-500 font-mono text-xs hidden md:block">
        <p>HAND TRACKING: {handDataRef.current.detected ? "ACTIVE" : "NO SIGNAL"}</p>
        <p>GESTURE: {handDataRef.current.isPinching ? "PINCH DETECTED" : "IDLE"}</p>
      </div>

    </div>
  );
};

export default SmartHUD;