import * as THREE from 'three';

// D20 face-to-number mapping
// The icosahedron has 20 triangular faces
// We need to map each face index to its number value
// In a standard D20, opposite faces sum to 21
export const D20_FACE_VALUES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
];

// Face normals for detecting which face is up
// These are calculated from the icosahedron geometry
export function getD20FaceNormals(): THREE.Vector3[] {
  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const normals: THREE.Vector3[] = [];
  
  const positionAttr = geometry.getAttribute('position');
  
  // Each face is 3 vertices (triangle)
  for (let i = 0; i < positionAttr.count; i += 3) {
    const v0 = new THREE.Vector3().fromBufferAttribute(positionAttr, i);
    const v1 = new THREE.Vector3().fromBufferAttribute(positionAttr, i + 1);
    const v2 = new THREE.Vector3().fromBufferAttribute(positionAttr, i + 2);
    
    // Calculate face normal
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    
    normals.push(normal);
  }
  
  geometry.dispose();
  return normals;
}

// Standard D20 face-to-value mapping
// This maps the geometry face index to the number that should appear
export const FACE_TO_VALUE: Record<number, number> = {
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 8,
  8: 9,
  9: 10,
  10: 11,
  11: 12,
  12: 13,
  13: 14,
  14: 15,
  15: 16,
  16: 17,
  17: 18,
  18: 19,
  19: 20,
};

// Find which face is pointing most upward
export function getUpperFace(
  quaternion: THREE.Quaternion,
  faceNormals: THREE.Vector3[]
): number {
  const up = new THREE.Vector3(0, 1, 0);
  let maxDot = -Infinity;
  let topFace = 0;

  for (let i = 0; i < faceNormals.length; i++) {
    const rotatedNormal = faceNormals[i].clone().applyQuaternion(quaternion);
    const dot = rotatedNormal.dot(up);
    
    if (dot > maxDot) {
      maxDot = dot;
      topFace = i;
    }
  }

  return topFace;
}

// Get the rotation needed to make a specific value face up
export function getRotationForValue(
  targetValue: number,
  faceNormals: THREE.Vector3[]
): THREE.Quaternion {
  // Find which face has our target value
  let targetFaceIndex = 0;
  for (const [faceIdx, value] of Object.entries(FACE_TO_VALUE)) {
    if (value === targetValue) {
      targetFaceIndex = parseInt(faceIdx);
      break;
    }
  }

  const targetNormal = faceNormals[targetFaceIndex];
  const up = new THREE.Vector3(0, 1, 0);
  
  // Create quaternion that rotates target normal to point up
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(targetNormal, up);
  
  return quaternion;
}
