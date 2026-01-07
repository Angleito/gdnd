'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface D20MeshProps {
  position?: [number, number, number];
  rotation?: THREE.Euler;
  quaternion?: THREE.Quaternion;
  color?: string;
  numberColor?: string;
  size?: number;
  isRolling?: boolean;
  targetValue?: number;
}

export function D20Mesh({
  position = [0, 0, 0],
  quaternion,
  color = '#1e40af',
  numberColor = '#ffffff',
  size = 1,
}: D20MeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create icosahedron geometry with face data
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(size, 0);
    return geo;
  }, [size]);

  // Calculate face centers and normals for number placement
  const faceData = useMemo(() => {
    const positionAttr = geometry.getAttribute('position');
    const faces: { center: THREE.Vector3; normal: THREE.Vector3 }[] = [];

    for (let i = 0; i < positionAttr.count; i += 3) {
      const v0 = new THREE.Vector3().fromBufferAttribute(positionAttr, i);
      const v1 = new THREE.Vector3().fromBufferAttribute(positionAttr, i + 1);
      const v2 = new THREE.Vector3().fromBufferAttribute(positionAttr, i + 2);

      // Center of the face
      const center = new THREE.Vector3()
        .add(v0)
        .add(v1)
        .add(v2)
        .divideScalar(3);

      // Normal of the face
      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v2, v0);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      faces.push({ center, normal });
    }

    return faces;
  }, [geometry]);

  // D20 standard numbering (opposite faces sum to 21)
  const faceNumbers = [
    20, 1, 12, 9, 8, 13, 4, 17, 16, 5,
    14, 7, 6, 15, 2, 19, 18, 3, 10, 11,
  ];

  return (
    <group position={position} quaternion={quaternion}>
      <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Numbers on each face */}
      {faceData.map((face, index) => {
        const number = faceNumbers[index];
        // Position slightly above the face center
        const textPos = face.center.clone().multiplyScalar(1.02);
        
        // Calculate rotation to face outward
        const lookAt = face.center.clone().add(face.normal);
        const textQuat = new THREE.Quaternion();
        const matrix = new THREE.Matrix4();
        matrix.lookAt(textPos, lookAt, new THREE.Vector3(0, 1, 0));
        textQuat.setFromRotationMatrix(matrix);

        return (
          <Text
            key={index}
            position={textPos}
            quaternion={textQuat}
            fontSize={size * 0.25}
            color={numberColor}
            anchorX="center"
            anchorY="middle"
            font="/fonts/Inter-Bold.woff"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {number}
          </Text>
        );
      })}
    </group>
  );
}
