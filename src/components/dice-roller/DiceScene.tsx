'use client';

import { useRef, useState, useEffect, useMemo, Component, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { DiceFallback } from './DiceFallback';

// Error boundary for WebGL failures
interface ErrorBoundaryState {
  hasError: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface DiceSceneProps {
  targetValue: number;
  onRollComplete: () => void;
  isRolling: boolean;
  onStartRoll: () => void;
  diceColor?: string;
  numberColor?: string;
}

// Standard D20 face numbering - opposite faces sum to 21
const D20_FACE_NUMBERS = [
  20, 2, 8, 14, 12,
  6, 18, 4, 16, 10, 
  11, 9, 3, 17, 7,
  13, 5, 15, 19, 1
];

// Calculate face centers and normals for an icosahedron
function getIcosahedronFaces(radius: number) {
  const geometry = new THREE.IcosahedronGeometry(radius, 0);
  const positions = geometry.getAttribute('position');
  const faces: { center: THREE.Vector3; normal: THREE.Vector3; quaternion: THREE.Quaternion }[] = [];

  for (let i = 0; i < positions.count; i += 3) {
    const v0 = new THREE.Vector3().fromBufferAttribute(positions, i);
    const v1 = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
    const v2 = new THREE.Vector3().fromBufferAttribute(positions, i + 2);

    const center = new THREE.Vector3().add(v0).add(v1).add(v2).divideScalar(3);
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 0, 1);
    quaternion.setFromUnitVectors(up, normal);

    faces.push({ center, normal, quaternion });
  }

  geometry.dispose();
  return faces;
}

// D20 Numbers Component
function D20Numbers({ 
  radius, 
  numberColor,
  criticalColor,
  fumbleColor,
}: { 
  radius: number; 
  numberColor: string;
  criticalColor: string;
  fumbleColor: string;
}) {
  const faces = useMemo(() => getIcosahedronFaces(radius), [radius]);

  return (
    <group>
      {faces.map((face, index) => {
        const number = D20_FACE_NUMBERS[index];
        const position = face.center.clone().add(face.normal.clone().multiplyScalar(0.01));

        let color = numberColor;
        if (number === 20) color = criticalColor;
        if (number === 1) color = fumbleColor;

        return (
          <Text
            key={index}
            position={position}
            quaternion={face.quaternion}
            fontSize={radius * 0.28}
            color={color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#000000"
            font="/fonts/Cinzel-Bold.ttf"
          >
            {number}
          </Text>
        );
      })}
    </group>
  );
}

// Camera setup
function Camera() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0.5, 4);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

// Animation phases
type AnimationPhase = 'idle' | 'spinning' | 'complete';

// Animation configuration
const ANIMATION_CONFIG = {
  totalDuration: 3.0,
  wobbleAmplitude: 0.15,
  wobbleFrequency: 3,
  minRotations: 6,
  maxRotations: 8,
};

// Get rotation to show a specific value facing camera
// Returns Euler angles in YXZ order for proper spin animation
function getRotationForValue(value: number): THREE.Euler {
  // These rotations position the face with 'value' toward the camera
  // Tuned for YXZ euler order - Y is the main spin axis
  const faceRotations: Record<number, [number, number, number]> = {
    1:  [2.034, 0.628, 0],
    2:  [1.017, 0.322, 0.951],
    3:  [0.561, -1.017, -0.322],
    4:  [1.571, 0, -0.628],
    5:  [2.511, 0.322, -0.951],
    6:  [0.561, 1.017, 0.322],
    7:  [2.034, -0.628, 0],
    8:  [1.017, -0.322, -0.951],
    9:  [2.511, -0.322, 0.951],
    10: [1.571, 0, 0.628],
    11: [1.571, Math.PI, -0.628],
    12: [0.628, -1.571, 0],
    13: [2.511, Math.PI - 0.322, -0.951],
    14: [1.017, Math.PI + 0.322, 0.951],
    15: [0.561, Math.PI + 1.017, 0.322],
    16: [1.017, Math.PI - 0.322, -0.951],
    17: [2.511, Math.PI - 0.322, 0.951],
    18: [0.561, Math.PI - 1.017, -0.322],
    19: [2.034, Math.PI - 0.628, 0],
    20: [0, 0, 0],
  };

  const [x, y, z] = faceRotations[value] || [0, 0, 0];
  return new THREE.Euler(x, y, z, 'YXZ');
}

// Easing function - exponential ease out for natural deceleration
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// Animation state for calculated spin path
interface SpinPath {
  targetX: number;
  targetY: number;  // Includes full rotations
  targetZ: number;
  finalEuler: THREE.Euler;  // The actual final rotation
}

// BG3-style spinning dice component
function SpinningDie({
  targetValue,
  onAnimationComplete,
  isRolling,
  diceColor = '#4f46e5',
  numberColor = '#ffffff',
  criticalColor = '#fbbf24',
  fumbleColor = '#ef4444',
}: {
  targetValue: number;
  onAnimationComplete: () => void;
  isRolling: boolean;
  diceColor?: string;
  numberColor?: string;
  criticalColor?: string;
  fumbleColor?: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const innerGroupRef = useRef<THREE.Group>(null);
  
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  
  const animationStartTime = useRef(0);
  const spinPathRef = useRef<SpinPath | null>(null);
  const hasCompletedRef = useRef(false);

  const DICE_RADIUS = 0.8;

  // Memoize geometries
  const diceGeometry = useMemo(() => new THREE.IcosahedronGeometry(DICE_RADIUS, 0), []);
  const edgeGeometry = useMemo(() => new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(DICE_RADIUS + 0.01, 0)), []);

  // Cleanup geometries
  useEffect(() => {
    return () => {
      diceGeometry.dispose();
      edgeGeometry.dispose();
    };
  }, [diceGeometry, edgeGeometry]);

  // Start rolling animation - calculate path to land on target
  useEffect(() => {
    if (isRolling && phase === 'idle' && groupRef.current) {
      setPhase('spinning');
      hasCompletedRef.current = false;
      animationStartTime.current = Date.now();
      
      // Reset dice to starting position
      groupRef.current.rotation.set(0, 0, 0, 'YXZ');
      
      // Get target rotation for the rolled value
      const targetEuler = getRotationForValue(targetValue);
      
      // Add full rotations to Y axis for the spin effect
      const fullRotations = ANIMATION_CONFIG.minRotations + 
        Math.random() * (ANIMATION_CONFIG.maxRotations - ANIMATION_CONFIG.minRotations);
      const totalYRotation = targetEuler.y + (fullRotations * Math.PI * 2);
      
      // Also add some X rotation for the tumbling diamond effect
      const extraXRotations = 2 + Math.random() * 2; // 2-4 tumbles
      const totalXRotation = targetEuler.x + (extraXRotations * Math.PI * 2);
      
      spinPathRef.current = {
        targetX: totalXRotation,
        targetY: totalYRotation,
        targetZ: targetEuler.z,
        finalEuler: targetEuler,
      };
    }
  }, [isRolling, phase, targetValue]);

  // Reset when not rolling
  useEffect(() => {
    if (!isRolling) {
      if (phase === 'complete') {
        // Keep showing result until explicitly reset
      } else if (phase === 'spinning') {
        // Animation was interrupted
        setPhase('idle');
        spinPathRef.current = null;
      }
    }
  }, [isRolling, phase]);

  // Reset to idle when modal closes
  useEffect(() => {
    if (!isRolling && phase === 'complete') {
      setPhase('idle');
      spinPathRef.current = null;
      hasCompletedRef.current = false;
    }
  }, [isRolling, phase]);

  // Animation loop
  useFrame(() => {
    if (!groupRef.current || !innerGroupRef.current) return;

    if (phase === 'idle') {
      // Gentle idle rotation
      groupRef.current.rotation.y += 0.005;
      groupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.05;
      return;
    }

    if (phase === 'spinning' && spinPathRef.current) {
      const elapsed = (Date.now() - animationStartTime.current) / 1000;
      const progress = Math.min(elapsed / ANIMATION_CONFIG.totalDuration, 1);
      const easedProgress = easeOutExpo(progress);
      
      const { targetX, targetY, targetZ } = spinPathRef.current;
      
      // Interpolate rotation using Euler angles
      // This naturally spins through the full rotations and lands on target
      const currentX = targetX * easedProgress;
      const currentY = targetY * easedProgress;
      const currentZ = targetZ * easedProgress;
      
      groupRef.current.rotation.set(currentX, currentY, currentZ, 'YXZ');
      
      // Apply wobble (precession) - fades out as we slow down
      const wobbleFade = 1 - easedProgress;
      const wobbleTime = elapsed * ANIMATION_CONFIG.wobbleFrequency * Math.PI * 2;
      innerGroupRef.current.rotation.x = Math.sin(wobbleTime) * ANIMATION_CONFIG.wobbleAmplitude * wobbleFade;
      innerGroupRef.current.rotation.z = Math.cos(wobbleTime * 0.7) * ANIMATION_CONFIG.wobbleAmplitude * 0.5 * wobbleFade;
      
      // Check if animation complete
      if (progress >= 1 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setPhase('complete');
        
        // Ensure we're at exact final rotation (no extra full rotations)
        const { finalEuler } = spinPathRef.current;
        groupRef.current.rotation.copy(finalEuler);
        innerGroupRef.current.rotation.set(0, 0, 0);
        
        // Notify parent that animation is done
        onAnimationComplete();
      }
    }
    
    if (phase === 'complete') {
      // Keep dice still at final position with subtle bob
      groupRef.current.position.y = Math.sin(Date.now() * 0.002) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <group ref={innerGroupRef}>
        {/* D20 icosahedron mesh */}
        <mesh geometry={diceGeometry} castShadow>
          <meshStandardMaterial
            color={diceColor}
            metalness={0.4}
            roughness={0.35}
            emissive={diceColor}
            emissiveIntensity={0.08}
          />
        </mesh>

        {/* Edge highlights */}
        <lineSegments geometry={edgeGeometry}>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </lineSegments>

        {/* Numbers on faces */}
        <D20Numbers
          radius={DICE_RADIUS}
          numberColor={numberColor}
          criticalColor={criticalColor}
          fumbleColor={fumbleColor}
        />
      </group>
    </group>
  );
}

export function DiceScene({
  targetValue,
  onRollComplete,
  isRolling,
  onStartRoll,
  diceColor = '#4f46e5',
  numberColor = '#ffffff',
}: DiceSceneProps) {
  const [webglSupported, setWebglSupported] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
      }
    } catch {
      setWebglSupported(false);
    }
  }, []);

  useEffect(() => {
    if (contextLost) {
      const timer = setTimeout(() => {
        setContextLost(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [contextLost]);

  // Reset continue button when starting a new roll
  useEffect(() => {
    if (isRolling) {
      setShowContinueButton(false);
    }
  }, [isRolling]);

  // Handle animation complete - show continue button
  const handleAnimationComplete = () => {
    setShowContinueButton(true);
  };

  // Handle continue click - dismiss modal
  const handleContinueClick = () => {
    setShowContinueButton(false);
    onRollComplete();
  };

  if (!webglSupported || contextLost) {
    return (
      <DiceFallback
        targetValue={targetValue}
        isRolling={isRolling}
        onRollComplete={onRollComplete}
        onStartRoll={onStartRoll}
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      <WebGLErrorBoundary
        fallback={
          <DiceFallback
            targetValue={targetValue}
            isRolling={isRolling}
            onRollComplete={onRollComplete}
            onStartRoll={onStartRoll}
          />
        }
      >
        <Canvas
          shadows
          camera={{ position: [0, 0.5, 4], fov: 50 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false,
          }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor(0x000000, 0);
            camera.lookAt(0, 0, 0);
            
            const canvas = gl.domElement;
            const handleContextLost = (e: Event) => {
              e.preventDefault();
              setContextLost(true);
            };
            const handleContextRestored = () => {
              setContextLost(false);
            };
            canvas.addEventListener('webglcontextlost', handleContextLost);
            canvas.addEventListener('webglcontextrestored', handleContextRestored);
          }}
        >
          <Camera />

          <ambientLight intensity={0.8} />
          <directionalLight
            position={[3, 6, 3]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={512}
            shadow-mapSize-height={512}
          />
          <pointLight position={[-3, 3, -2]} intensity={0.4} color="#818cf8" />
          <pointLight position={[3, 2, 2]} intensity={0.3} color="#f472b6" />

          <SpinningDie
            targetValue={targetValue}
            onAnimationComplete={handleAnimationComplete}
            isRolling={isRolling}
            diceColor={diceColor}
            numberColor={numberColor}
            criticalColor="#fbbf24"
            fumbleColor="#ef4444"
          />
        </Canvas>
      </WebGLErrorBoundary>

      {/* Click to roll overlay */}
      {!isRolling && !showContinueButton && (
        <button
          onClick={onStartRoll}
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-transparent hover:bg-white/5 transition-colors"
        >
          <span className="px-6 py-3 bg-accent/30 border border-accent/60 rounded-xl text-accent font-bold text-lg shadow-lg shadow-accent/20 animate-pulse">
            Click to Roll
          </span>
        </button>
      )}

      {/* Continue button - shown after dice lands */}
      {showContinueButton && (
        <button
          onClick={handleContinueClick}
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-transparent hover:bg-white/5 transition-colors"
        >
          <span className="px-6 py-3 bg-accent/30 border border-accent/60 rounded-xl text-accent font-bold text-lg shadow-lg shadow-accent/20">
            Continue
          </span>
        </button>
      )}
    </div>
  );
}
