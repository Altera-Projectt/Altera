import { Component, Suspense, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useTexture, Decal, OrbitControls, Center, Bounds, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

type CanvasDesignLayer = {
  id: string;
  src: string;
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  locked?: boolean;
  zIndex?: number;
};

class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center rounded-xl bg-gray-50 border border-red-200 p-4">
          <div role="alert" className="rounded bg-white px-4 py-3 text-sm text-red-700 shadow border border-red-100 text-center">
            Could not load the 3D shirt model. Please refresh and try again.
          </div>
        </div>
      )
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
  
  // Ensure texture looks correct (transparency, color space)
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
  onReady?: () => void;
}

function ShirtModel({ 
  colorHex, 
  designImage, 
  designLayers = [],
  selectedLayerId,
  onLayerPositionChange: _onLayerPositionChange,
  onLayerSelect,
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
  onDragMove,
  onReady
}: ShirtModelProps) {
  // Load the GLTF model. Make sure you place `shirt.glb` in public/models/
  const { nodes } = useGLTF('/models/shirt.glb') as any;
  useEffect(() => { onReady?.() }, [onReady]);

  // Support both designImage and designLayers:
  const activeLayer = designLayers.find((layer) => layer.id === selectedLayerId) ?? designLayers[0];
  const activeImage = designImage || activeLayer?.src;
  const activeOpacity = decalOpacity ?? activeLayer?.opacity ?? 1;
  const activeRotation = decalRotationDegrees ?? activeLayer?.rotation ?? 0;
  const activeScaleMultiplier = decalScaleMultiplier ?? activeLayer?.scaleX ?? 1;
  const activeLocked = decalLocked ?? activeLayer?.locked ?? false;
  
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
                    if (isMainBody && activeImage) {
                      if (activeLocked) return; // Do not start dragging if the layer is locked
                      e.stopPropagation();
                      if (activeLayer && onLayerSelect) onLayerSelect(activeLayer.id);
                      onDragStart();
                    }
                  }}
                  onPointerUp={(e) => {
                    if (isMainBody && activeImage) {
                      e.stopPropagation();
                      onDragEnd();
                    }
                  }}
                  onPointerMissed={() => {
                    if (isDragging) onDragEnd();
                  }}
                  onPointerMove={(e) => {
                    if (isMainBody && activeImage) {
                      if (activeLocked) {
                        document.body.style.cursor = 'not-allowed';
                      } else {
                        document.body.style.cursor = isDragging ? 'grabbing' : 'grab';
                      }
                      
                      if (isDragging) {
                        e.stopPropagation();
                        
                        // Convert world point to local space of the mesh
                        const localPoint = e.object.worldToLocal(e.point.clone());
                        
                        // e.face.normal is usually in local space
                        const localNormal = e.face?.normal?.clone() || new THREE.Vector3(0, 0, 1);
                        
                        // Create a dummy object to calculate the correct rotation
                        const dummy = new THREE.Object3D();
                        dummy.position.copy(localPoint);
                        // Look at the normal direction to project flush against the surface
                        dummy.lookAt(localPoint.clone().add(localNormal));
                        
                        onDragMove(
                          [localPoint.x, localPoint.y, localPoint.z], 
                          [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]
                        );
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
                  
                  {/* Projecting the Design ONLY on the main body - free 3D surface dragging */}
                  {isMainBody && activeImage && (
                    <DesignDecal 
                      image={activeImage}
                      position={decalPosition}
                      rotation={[
                        decalRotation[0], 
                        decalRotation[1], 
                        decalRotation[2] + (activeRotation * Math.PI) / 180
                      ]}
                      scale={[
                        decalScale[0] * activeScaleMultiplier,
                        decalScale[1] * activeScaleMultiplier,
                        decalScale[2]
                      ]}
                      opacity={activeOpacity}
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
    <ModelErrorBoundary>
      <div id="r3f-shirt-canvas" data-model-ready={modelReady} className="w-full h-full relative min-h-[400px] rounded-xl overflow-hidden shadow-inner border border-gray-300">
        {/* HTML Loading Overlay nằm BÊN NGOÀI Canvas */}
        {!modelReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/70 backdrop-blur-[1px] pointer-events-none transition-opacity duration-300">
            <div className="rounded-lg bg-white/95 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-md border border-gray-200 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading shirt model…</span>
            </div>
          </div>
        )}

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
          {/* 3D Content - Suspense fallback={null} để không can thiệp DOM bên trong Canvas */}
          <Suspense fallback={null}>
            <ShirtModel 
              colorHex={shirtColor} 
              designImage={designImage}
              designLayers={designLayers}
              selectedLayerId={selectedLayerId}
              onLayerPositionChange={onLayerPositionChange}
              onLayerSelect={onLayerSelect}
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
              onReady={handleModelReady}
            />
          </Suspense>

          {/* Camera Controls */}
          <OrbitControls 
            makeDefault
            enabled={!isDragging}
            enableZoom={false}
            enablePan={false}
            enableRotate={true}
          />
        </Canvas>
      </div>
    </ModelErrorBoundary>
  );
}

// Preload the model so it loads faster when the component mounts
useGLTF.preload('/models/shirt.glb');
