import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { initializeVision, getFaceLandmarker, getHandLandmarker } from './services/visionService';
import HolographicEarth from './components/HolographicEarth';
import SmartHUD from './components/SmartHUD';
import { FaceData, HandData, Vector3 } from './types';

// Initial state
const initialFaceData: FaceData = {
  detected: false,
  position: { x: 0.5, y: 0.5, z: 0 },
  tilt: 0,
};

const initialHandData: HandData = {
  detected: false,
  isPinching: false,
  pinchDistance: 0,
  position: { x: 0, y: 0, z: 0 },
};

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // We use refs for tracking data to avoid React re-renders on every frame (60fps)
  // This allows the Canvas and HUD to update smoothly via their own loops
  const faceDataRef = useRef<FaceData>(initialFaceData);
  const handDataRef = useRef<HandData>(initialHandData);

  useEffect(() => {
    const startApp = async () => {
      try {
        await initializeVision();
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 1280, 
            height: 720,
            facingMode: 'user' 
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to initialize camera or AI models.");
      }
    };

    startApp();
  }, []);

  const predictWebcam = () => {
    const video = videoRef.current;
    const faceLandmarker = getFaceLandmarker();
    const handLandmarker = getHandLandmarker();

    if (!video || !faceLandmarker || !handLandmarker) return;

    let lastVideoTime = -1;

    const renderLoop = () => {
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        
        // 1. Detect Face
        const faceResult = faceLandmarker.detectForVideo(video, performance.now());
        if (faceResult.faceLandmarks.length > 0) {
          const landmarks = faceResult.faceLandmarks[0];
          // Use nose tip (index 1) for position
          const nose = landmarks[1];
          faceDataRef.current = {
            detected: true,
            position: { x: nose.x, y: nose.y, z: nose.z },
            tilt: 0 // Could calculate roll angle here if needed
          };
        } else {
          faceDataRef.current = { ...faceDataRef.current, detected: false };
        }

        // 2. Detect Hands
        const handResult = handLandmarker.detectForVideo(video, performance.now());
        if (handResult.landmarks.length > 0) {
          const landmarks = handResult.landmarks[0];
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          
          // Euclidean distance for pinch
          const distance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
            Math.pow(thumbTip.y - indexTip.y, 2)
          );

          // Centroid approximation (wrist) or Index MCP
          const handPos = landmarks[0];

          handDataRef.current = {
            detected: true,
            isPinching: distance < 0.05, // Threshold for pinch
            pinchDistance: distance,
            position: { x: handPos.x, y: handPos.y, z: handPos.z }
          };
        } else {
          handDataRef.current = { ...handDataRef.current, detected: false };
        }
      }
      requestAnimationFrame(renderLoop);
    };

    renderLoop();
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      
      {/* 0. Scanline Overlay Effect */}
      <div className="scan-line z-30"></div>

      {/* 1. Loading / Error Screen */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black text-cyan-400 font-mono">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-t-cyan-400 border-r-cyan-400 border-b-cyan-900 border-l-cyan-900 rounded-full animate-spin mx-auto"></div>
            <p className="animate-pulse tracking-widest">INITIALIZING JARVIS PROTOCOLS...</p>
          </div>
        </div>
      )}
      
      {error && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black text-red-500 font-bold">
            {error}
         </div>
      )}

      {/* 2. Webcam Feed (Background Layer) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 z-0 opacity-80" 
        style={{ filter: 'grayscale(30%) contrast(1.1) brightness(0.8)' }} // Cinematic look
      />
      
      {/* 3. Vignette Overlay for Depth */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.8)_100%)]"></div>

      {/* 4. Three.js AR Scene (Holograms) */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
           <HolographicEarth handDataRef={handDataRef} />
        </Canvas>
      </div>

      {/* 5. 2D HUD Interface */}
      <SmartHUD faceDataRef={faceDataRef} handDataRef={handDataRef} />

      {/* 6. Footer Controls / Status */}
      <div className="absolute bottom-0 w-full p-4 z-40 flex justify-center pointer-events-none">
         <div className="flex gap-4 text-[10px] text-cyan-600 font-mono opacity-60">
            <span>CAM: ACTIVE</span>
            <span>GPU: ONLINE</span>
            <span>AI: MEDIAPIPE</span>
            <span>VIZ: THREE.JS</span>
         </div>
      </div>

    </div>
  );
}

export default App;