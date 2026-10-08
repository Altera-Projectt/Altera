import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useTexture, Decal, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

// ----------------------------------------------------------------------
// 1. Decal Component for the Design
// (Separated to safely use the useTexture hook only when an image exists)
// ----------------------------------------------------------------------
function DesignDecal({ 
  image, 
  position, 
  rotation, 
  scale 
}: { 
  image: string; 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  scale: [number, number, number];
}) {
  const texture = useTexture(image);
  
  // Optional: Ensure texture looks correct (transparency, color space)
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;

  return (
    <Decal 
      position={position} 
      rotation={rotation} 
      scale={scale}
      map={texture}
      // You can adjust depthTest or polygonOffset if there's z-fighting
    />
  );
}

// ----------------------------------------------------------------------
// 2. The 3D Shirt Model
// ----------------------------------------------------------------------
interface ShirtModelProps {
  colorHex: string;
  designImage?: string | null;
  decalPosition?: [number, number, number];
  decalRotation?: [number, number, number];
  decalScale?: [number, number, number];
}

function ShirtModel({ 
  colorHex, 
  designImage, 
  // Default values for where the print sits on the chest
  decalPosition = [0, 0.04, 0.15], 
  decalRotation = [0, 0, 0], 
  decalScale = [0.2, 0.2, 0.2] 
}: ShirtModelProps) {
  // Load the GLTF model. Make sure you place `shirt.glb` in public/models/
  const { nodes } = useGLTF('/models/shirt.glb') as any;
  
  // We assume the first mesh found in the GLTF is the shirt.
  // If your model has a specific name, use nodes['Shirt_Mesh_Name'] instead.
  const mainMesh = Object.values(nodes).find((node: any) => node.isMesh) as THREE.Mesh;

  return (
    <group dispose={null}>
      {mainMesh && (
        <mesh 
          castShadow 
          receiveShadow 
          geometry={mainMesh.geometry}
          // If the model comes with a default position/scale, apply it here,
          // or just rely on the defaults.
        >
          {/* Dynamic Color Changing */}
          <meshStandardMaterial 
            color={colorHex} 
            roughness={0.8}
            metalness={0.1}
          />
          
          {/* Projecting the Design */}
          {designImage && (
            <DesignDecal 
              image={designImage}
              position={decalPosition}
              rotation={decalRotation}
              scale={decalScale}
            />
          )}
        </mesh>
      )}
    </group>
  );
}

// ----------------------------------------------------------------------
// 3. The Main Canvas Wrapper
// ----------------------------------------------------------------------
export interface ShirtCanvas3DProps {
  shirtColor?: string;
  designImage?: string | null;
  decalPosition?: [number, number, number];
  decalScale?: [number, number, number];
}

export default function ShirtCanvas3D({ 
  shirtColor = '#ffffff', 
  designImage, 
  decalPosition, 
  decalScale 
}: ShirtCanvas3DProps) {
  return (
    <div className="w-full h-full relative min-h-[400px] bg-gray-100 rounded-xl overflow-hidden shadow-inner">
      <Canvas shadows camera={{ position: [0, 0, 2.5], fov: 45 }}>
        {/* Lighting Setup */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={1024}
        />
        {/* Realistic reflections */}
        <Environment preset="city" />
        
        {/* 3D Content */}
        <Suspense fallback={null}>
          <ShirtModel 
            colorHex={shirtColor} 
            designImage={designImage}
            decalPosition={decalPosition}
            decalScale={decalScale}
          />
        </Suspense>

        {/* Camera Controls */}
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3} // Prevent looking from too far above
          maxPolarAngle={Math.PI / 1.5} // Prevent looking from under the shirt
        />
      </Canvas>
    </div>
  );
}

// Preload the model so it loads faster when the component mounts
useGLTF.preload('/models/shirt.glb');
