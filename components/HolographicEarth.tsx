import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Color, AdditiveBlending } from 'three';
import { HandData } from '../types';

interface HolographicEarthProps {
  handDataRef: React.MutableRefObject<HandData>;
}

const HolographicEarth: React.FC<HolographicEarthProps> = ({ handDataRef }) => {
  const meshRef = useRef<Mesh>(null);
  const atmosphereRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);

  // Constants
  const baseScale = 2.5;
  const color = new Color("#00ffff");
  
  useFrame((state, delta) => {
    if (!meshRef.current || !atmosphereRef.current || !coreRef.current) return;

    const hand = handDataRef.current;

    // --- Interaction Logic ---
    
    // Rotation
    let rotationSpeed = 0.2;
    if (hand.detected) {
      // Map hand X position (0 = left, 1 = right) to rotation speed
      // Center (0.5) is stop, edges are fast spin
      const rotationFactor = (hand.position.x - 0.5) * 10; 
      rotationSpeed += rotationFactor;
    }
    
    meshRef.current.rotation.y += rotationSpeed * delta;
    atmosphereRef.current.rotation.y += (rotationSpeed * 0.8) * delta;
    coreRef.current.rotation.y -= (rotationSpeed * 0.5) * delta;

    // Scaling (Pinch)
    let targetScale = baseScale;
    if (hand.detected && hand.isPinching) {
      // Pinch distance usually ranges from 0.02 (closed) to 0.15 (open) roughly
      // We map this inverse: smaller distance = smaller scale? Or pinch to zoom in?
      // Let's do: Pinch close = shrink, Open = grow
      // Normalize pinch: 0 to 0.1
      const pinchFactor = Math.max(0, Math.min(1, hand.pinchDistance * 10));
      targetScale = baseScale * (0.5 + pinchFactor * 1.5);
    }
    
    // Smooth lerp for scale
    meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as any, 0.1);
    atmosphereRef.current.scale.lerp({ x: targetScale * 1.2, y: targetScale * 1.2, z: targetScale * 1.2 } as any, 0.1);
    coreRef.current.scale.lerp({ x: targetScale * 0.8, y: targetScale * 0.8, z: targetScale * 0.8 } as any, 0.1);
  });

  return (
    <group position={[-3, 0, 0]}>
      {/* Main Wireframe Globe */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1, 16]} />
        <meshBasicMaterial 
          color={color} 
          wireframe 
          transparent 
          opacity={0.3}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Outer Atmosphere Glow */}
      <mesh ref={atmosphereRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#0088ff" 
          transparent 
          opacity={0.1} 
          wireframe
          wireframeLinewidth={0.5}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

       {/* Inner Core */}
       <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.6, 4]} />
        <meshBasicMaterial 
          color="#ffffff" 
          wireframe 
          transparent 
          opacity={0.2}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Ambient Light for scene */}
      <ambientLight intensity={2} />
      <pointLight position={[10, 10, 10]} color="#00ffff" intensity={2} />
    </group>
  );
};

export default HolographicEarth;