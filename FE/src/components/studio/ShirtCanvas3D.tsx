import { Component, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useTexture, Decal, OrbitControls, Center, Bounds, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';

type CanvasDesignLayer = { id: string; src: string; x: number; y: number; rotation: number; scaleX: number; scaleY: number; opacity: number; locked: boolean; zIndex: number };

class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <Html center><div role="alert" className="rounded bg-white px-3 py-2 text-sm text-red-700 shadow">Could not load the 3D shirt model. Please refresh and try again.</div></Html>
      : this.props.children;
  }
}

// ----------------------------------------------------------------------
// 1. Decal Component for the Design
// (Separated to safely use the useTexture hook only when an image exists)
// ----------------------------------------------------------------------
function DesignDecal({ 
  image, 
  position, 
  rotation, 
  scale,
  opacity = 1
}: { 
  image: string; 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  scale: [number, number, number];
  opacity?: number;
}) {
  // Optimize Cloudinary URL for WebGL memory if applicable
  const optimizedImage = image.includes('cloudinary.com') 
    ? image.replace('/upload/', '/upload/q_auto,f_auto,w_1024/') 
    : image;
    
  const texture = useTexture(optimizedImage);
  
  // Optional: Ensure texture looks correct (transparency, color space)
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;

  return (
    <Decal 
      position={position} 
      rotation={rotation} 
      scale={scale}
    >
      <meshStandardMaterial 
        map={texture} 
        transparent={true} 
        opacity={opacity}
        depthTest={true} 
        depthWrite={false} 
        polygonOffset 
        polygonOffsetFactor={-1} 
      />
    </Decal>
  );
}

// ----------------------------------------------------------------------
// 2. The 3D Shirt Model
// ----------------------------------------------------------------------
interface ShirtModelProps {
  colorHex: string;
  designImage?: string | null;
  designLayers?: CanvasDesignLayer[];
  selectedLayerId?: string | null;
  onLayerPositionChange?: (id: string, x: number, y: number) => void;
  onLayerSelect?: (id: string) => void;
  onReady?: () => void;
  decalPosition?: [number, number, number];
  decalRotation?: [number, number, number];
  decalScale?: [number, number, number];
  decalOpacity?: number;
  decalRotationDegrees?: number;
  decalScaleMultiplier?: number;
  decalLocked?: boolean;
  printSide?: 'FRONT' | 'BACK' | 'BOTH';
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragMove: (pos: [number, number, number], rot: [number, number, number]) => void;
}

function ShirtModel({ 
  colorHex, 
  designImage, 
  designLayers = [],
  selectedLayerId,
  onLayerPositionChange,
  onLayerSelect,
  onReady,
  decalPosition = [0, 0.1, 0.15], 
  decalRotation = [Math.PI / 2, 0, 0], 
  decalScale = [0.25, 0.25, 0.25],
  decalOpacity = 1,
  decalRotationDegrees = 0,
  decalScaleMultiplier = 1,
  decalLocked = false,
  printSide = 'FRONT',
  isDragging,
  onDragStart,
  onDragEnd,
  onDragMove
}: ShirtModelProps) {
  // Load the GLTF model. Make sure you place `shirt.glb` in public/models/
  const { nodes } = useGLTF('/models/shirt.glb') as any;
  useEffect(() => { onReady?.() }, [onReady]);
  
  return (
    <group dispose={null} rotation={[-Math.PI / 2, 0, printSide === 'BACK' ? Math.PI : 0]}>
      <Bounds fit clip observe margin={1.2}>
        <Center>
          {Object.values(nodes).map((node: any) => {
            if (node.isMesh) {
              // Heuristic to find the main body mesh for the Decal (usually has the most vertices)
              const isMainBody = node.geometry.attributes.position.count > 1500; 
              
              return (
                <mesh 
                  key={node.uuid}
                  castShadow 
                  receiveShadow 
                  geometry={node.geometry}
                  dispose={null}
                  onPointerDown={(e) => {
                    if (isMainBody && (designLayers.length || designImage)) {
                      const activeLayer = designLayers.find((layer) => layer.id === selectedLayerId)
                        ?? [...designLayers].sort((a, b) => a.zIndex - b.zIndex).at(-1);
                      if (activeLayer?.locked || (designImage && decalLocked)) return;
                      e.stopPropagation();
                      if (activeLayer) onLayerSelect?.(activeLayer.id);
                      onDragStart();
                    }
                  }}
                  onPointerUp={(e) => {
                    if (isMainBody && (designLayers.length || designImage)) {
                      e.stopPropagation();
                      onDragEnd();
                    }
                  }}
                  onPointerMissed={() => {
                    if (isDragging) onDragEnd();
                  }}
                  onPointerMove={(e) => {
                    if (isMainBody && (designLayers.length || designImage)) {
                      const activeLayer = designLayers.find((layer) => layer.id === selectedLayerId);
                      if (activeLayer?.locked || (designImage && decalLocked)) {
                        document.body.style.cursor = 'not-allowed';
                      } else {
                        document.body.style.cursor = isDragging ? 'grabbing' : 'grab';
                      }
                      
                      if (isDragging) {
                        e.stopPropagation();
                        
                        // Convert world point to local space of the mesh
                        const localPoint = e.eventObject.worldToLocal(e.point.clone());
                        
                        // e.face.normal is usually in local space
                        const localNormal = e.face?.normal?.clone() || new THREE.Vector3(0, 0, 1);
                        
                        // Create a dummy object to calculate the correct rotation
                        const dummy = new THREE.Object3D();
                        dummy.position.copy(localPoint);
                        // Look at the normal direction to project flush against the surface
                        dummy.lookAt(localPoint.clone().add(localNormal));
                        
                        if (activeLayer && onLayerPositionChange) {
                          const x = Math.max(5, Math.min(95, ((localPoint.x + 0.3) / 0.6) * 100));
                          const y = Math.max(5, Math.min(95, 50 - ((localPoint.y - 0.1) / 0.6) * 100));
                          onLayerPositionChange(activeLayer.id, x, y);
                        } else {
                          onDragMove([localPoint.x, localPoint.y, localPoint.z], [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]);
                        }
                      }
                    }
                  }}
                  onPointerOut={() => {
                    if (isMainBody) {
                      document.body.style.cursor = 'auto';
                    }
                  }}
                >
                  {/* Dynamic Color Changing applied to ALL parts (body, collar, sleeves) */}
                  <meshStandardMaterial 
                    color={colorHex} 
                    roughness={0.8}
                    metalness={0.1}
                  />
                  
                  {/* Projecting the Design ONLY on the main body */}
                  {isMainBody && designLayers.length > 0 ? designLayers.map((layer) => (
                    <DesignDecal
                      key={layer.id}
                      image={layer.src}
                      position={[(layer.x / 100) * 0.6 - 0.3, 0.1 + ((50 - layer.y) / 100) * 0.6, 0.16]}
                      rotation={[Math.PI / 2, 0, (layer.rotation * Math.PI) / 180]}
                      scale={[0.25 * layer.scaleX, 0.25 * layer.scaleY, 0.25]}
                      opacity={layer.opacity}
                    />
                  )) : isMainBody && designImage && (
                    <DesignDecal 
                      image={designImage}
                      position={decalPosition}
                      rotation={[
                        decalRotation[0], 
                        decalRotation[1], 
                        decalRotation[2] + (decalRotationDegrees * Math.PI) / 180
                      ]}
                      scale={[
                        decalScale[0] * decalScaleMultiplier,
                        decalScale[1] * decalScaleMultiplier,
                        decalScale[2]
                      ]}
                      opacity={decalOpacity}
                    />
                  )}
                </mesh>
              );
            }
            return null;
          })}
        </Center>
      </Bounds>
    </group>
  );
}

// ----------------------------------------------------------------------
// 3. The Main Canvas Wrapper
// ----------------------------------------------------------------------
export interface ShirtCanvas3DProps {
  shirtColor?: string;
  designImage?: string | null;
  designLayers?: CanvasDesignLayer[];
  selectedLayerId?: string | null;
  onLayerPositionChange?: (id: string, x: number, y: number) => void;
  onLayerSelect?: (id: string) => void;
  decalPosition?: [number, number, number];
  decalScale?: [number, number, number];
  decalOpacity?: number;
  decalRotationDegrees?: number;
  decalScaleMultiplier?: number;
  decalLocked?: boolean;
  printSide?: 'FRONT' | 'BACK' | 'BOTH';
}

export default function ShirtCanvas3D({ 
  shirtColor = '#111111', 
  designImage, 
  designLayers,
  selectedLayerId,
  onLayerPositionChange,
  onLayerSelect,
  decalPosition, 
  decalScale,
  decalOpacity = 1,
  decalRotationDegrees = 0,
  decalScaleMultiplier = 1,
  decalLocked = false,
  printSide = 'FRONT'
}: ShirtCanvas3DProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState<[number, number, number]>(decalPosition || [0, 0.1, 0.15]);
  const [rot, setRot] = useState<[number, number, number]>([Math.PI / 2, 0, 0]);
  const [modelReady, setModelReady] = useState(false);
  const handleModelReady = useCallback(() => setModelReady(true), []);

  return (
    <div id="r3f-shirt-canvas" data-model-ready={modelReady} className="w-full h-full relative min-h-[400px] rounded-xl overflow-hidden shadow-inner border border-gray-300">
      <Canvas 
        shadows 
        style={{ backgroundColor: 'transparent' }}
        gl={{ preserveDrawingBuffer: true, alpha: true }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        {/* Lighting Setup */}
        <ambientLight intensity={0.6} />
        {/* Main Key Light (Front Right) */}
        <directionalLight 
          position={[2, 2, 5]} 
          intensity={1.2}  
          castShadow 
          shadow-mapSize={1024}
        />
        {/* Fill Light (Front Left) */}
        <directionalLight 
          position={[-3, 0, 4]} 
          intensity={0.8}  
        />
        {/* Back Light (Rim Light) */}
        <directionalLight 
          position={[0, 2, -5]} 
          intensity={1.5}  
        />
        {/* Top Light */}
        <directionalLight 
          position={[0, 5, 0]} 
          intensity={0.5}  
        />
        {/* Realistic reflections without fetching external HDR files */}
        {/* 3D Content */}
        <ModelErrorBoundary>
          <Suspense fallback={<Html center><div className="rounded bg-white/90 px-3 py-2 text-sm text-gray-700 shadow">Loading shirt model…</div></Html>}>
            <ShirtModel
            colorHex={shirtColor} 
            designImage={designImage}
            designLayers={designLayers}
            selectedLayerId={selectedLayerId}
            onLayerPositionChange={onLayerPositionChange}
            onLayerSelect={onLayerSelect}
            onReady={handleModelReady}
            decalPosition={pos}
            decalRotation={rot}
            decalScale={decalScale || [0.25, 0.25, 0.25]}
            decalOpacity={decalOpacity}
            decalRotationDegrees={decalRotationDegrees}
            decalScaleMultiplier={decalScaleMultiplier}
            decalLocked={decalLocked}
            printSide={printSide}
            isDragging={isDragging}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            onDragMove={(newPos, newRot) => {
              setPos(newPos);
              setRot(newRot);
            }}
            />
          </Suspense>
        </ModelErrorBoundary>

        {/* Camera Controls */}
        <OrbitControls 
          makeDefault
          enabled={!isDragging}
          enableZoom={true}
          enablePan={false}
          enableRotate={true}
        />
      </Canvas>
    </div>
  );
}

// Preload the model so it loads faster when the component mounts
useGLTF.preload('/models/shirt.glb');
