import { Component, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, useTexture, Decal, OrbitControls, Center, Bounds, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

export type CanvasDesignLayer = {
  id: string;
  src: string;
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  blendMode?: 'normal' | 'screen' | 'multiply';
  locked?: boolean;
  zIndex?: number;
  visible?: boolean;
  name?: string;
  type?: string;
  position3D?: [number, number, number];
  rotation3D?: [number, number, number];
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
  opacity = 1,
  blendMode = 'normal',
  polygonOffsetFactor = -1
}: { 
  image: string; 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  scale: [number, number, number];
  opacity?: number;
  blendMode?: 'normal' | 'screen' | 'multiply';
  polygonOffsetFactor?: number;
}) {
  // Optimize Cloudinary URL for WebGL memory if applicable
  const optimizedImage = image.includes('cloudinary.com') 
    ? image.replace('/upload/', '/upload/q_auto,f_auto,w_1024/') 
    : image;
    
  const texture = useTexture(optimizedImage);
  
  // Ensure texture looks correct (transparency, color space)
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;

  const threeBlending = useMemo(() => {
    if (blendMode === 'screen') return THREE.AdditiveBlending;
    if (blendMode === 'multiply') return THREE.MultiplyBlending;
    return THREE.NormalBlending;
  }, [blendMode]);

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
        blending={threeBlending}
        depthTest={true} 
        depthWrite={false} 
        polygonOffset 
        polygonOffsetFactor={polygonOffsetFactor} 
      />
    </Decal>
  );
}

// Helper to determine initial 3D position if a layer does not have position3D yet
function getInitialLayer3D(
  layer: CanvasDesignLayer, 
  isBack: boolean
): { pos: [number, number, number]; rot: [number, number, number] } {
  if (layer.position3D && layer.rotation3D) {
    return { pos: layer.position3D, rot: layer.rotation3D };
  }
  const lx = layer.x ?? 50;
  const ly = layer.y ?? 50;
  const posX = isBack ? -(((lx - 50) / 100) * 0.6) : (((lx - 50) / 100) * 0.6);
  const posY = 0.35 - (ly / 100) * 0.7;
  const posZ = isBack ? -0.155 : 0.155;
  return {
    pos: [posX, posY, posZ],
    rot: isBack ? [Math.PI / 2, Math.PI, 0] : [Math.PI / 2, 0, 0]
  };
}

// ----------------------------------------------------------------------
// 2. The 3D Shirt Model
// ----------------------------------------------------------------------
interface DragState {
  id: string;
  pos: [number, number, number];
  rot: [number, number, number];
}

interface ShirtModelProps {
  colorHex: string;
  designImage?: string | null;
  designLayers?: CanvasDesignLayer[];
  selectedLayerId?: string | null;
  decalPosition?: [number, number, number];
  decalRotation?: [number, number, number];
  decalScale?: [number, number, number];
  decalOpacity?: number;
  decalRotationDegrees?: number;
  decalScaleMultiplier?: number;
  decalLocked?: boolean;
  printSide?: 'FRONT' | 'BACK' | 'BOTH';
  isDragging: boolean;
  draggingLayer: DragState | null;
  onDragStart: (targetLayer: CanvasDesignLayer | null, localPoint: THREE.Vector3, normal: THREE.Vector3) => void;
  onDragMove: (localPoint: THREE.Vector3, normal: THREE.Vector3) => void;
  onDragEnd: () => void;
  onReady?: () => void;
}

function ShirtModel({ 
  colorHex, 
  designImage, 
  designLayers = [],
  selectedLayerId,
  decalPosition = [0, 0.1, 0.15], 
  decalRotation = [Math.PI / 2, 0, 0], 
  decalScale = [0.25, 0.25, 0.25],
  decalOpacity = 1,
  decalRotationDegrees = 0,
  decalScaleMultiplier = 1,
  decalLocked = false,
  printSide = 'FRONT',
  isDragging,
  draggingLayer,
  onDragStart,
  onDragMove,
  onDragEnd,
  onReady
}: ShirtModelProps) {
  const { nodes } = useGLTF('/models/shirt.glb') as any;
  useEffect(() => { onReady?.() }, [onReady]);

  const isBack = printSide === 'BACK';

  // Filter and sort layers by zIndex
  const sortedLayers = useMemo(() => {
    return [...designLayers]
      .filter((layer) => Boolean(layer.src) && layer.visible !== false)
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  }, [designLayers]);

  const activeLayer = sortedLayers.find((layer) => layer.id === (draggingLayer?.id || selectedLayerId))
    ?? sortedLayers[sortedLayers.length - 1];
  const isLocked = activeLayer?.locked || (designImage && !sortedLayers.length && decalLocked);

  return (
    <group dispose={null} rotation={[-Math.PI / 2, 0, isBack ? Math.PI : 0]}>
      <Bounds fit clip observe margin={1.2}>
        <Center>
          {Object.values(nodes).map((node: any) => {
            if (node.isMesh) {
              const isMainBody = node.geometry.attributes.position.count > 1500; 
              
              return (
                <mesh 
                  key={node.uuid}
                  castShadow 
                  receiveShadow 
                  geometry={node.geometry}
                  dispose={null}
                  onPointerDown={(e) => {
                    if (isMainBody && (sortedLayers.length > 0 || designImage)) {
                      const targetObj = e.eventObject || e.object;
                      const localPoint = targetObj.worldToLocal(e.point.clone());
                      const localNormal = e.face?.normal?.clone() || new THREE.Vector3(0, 0, 1);

                      // Find closest unlocked layer to click point in 3D
                      let targetLayer: CanvasDesignLayer | null = null;
                      let minDistance = Infinity;

                      for (let i = sortedLayers.length - 1; i >= 0; i--) {
                        const layer = sortedLayers[i];
                        if (layer.locked || layer.visible === false) continue;
                        const layerInit = getInitialLayer3D(layer, isBack);
                        const layerPos = new THREE.Vector3(...(layer.position3D || layerInit.pos));
                        const radius = 0.25 * Math.max(layer.scaleX ?? 1, layer.scaleY ?? 1);
                        const dist = localPoint.distanceTo(layerPos);
                        if (dist <= radius && dist < minDistance) {
                          minDistance = dist;
                          targetLayer = layer;
                        }
                      }

                      // Fallback to active/selected layer
                      if (!targetLayer) {
                        targetLayer = sortedLayers.find((layer) => layer.id === selectedLayerId)
                          ?? [...sortedLayers].reverse().find((layer) => !layer.locked)
                          ?? sortedLayers[sortedLayers.length - 1]
                          ?? null;
                      }

                      if (targetLayer?.locked || (designImage && !sortedLayers.length && decalLocked)) {
                        return;
                      }

                      e.stopPropagation();
                      onDragStart(targetLayer, localPoint, localNormal);
                    }
                  }}
                  onPointerUp={(e) => {
                    if (isMainBody && isDragging) {
                      e.stopPropagation();
                      onDragEnd();
                    }
                  }}
                  onPointerMissed={() => {
                    if (isDragging) onDragEnd();
                  }}
                  onPointerMove={(e) => {
                    if (isMainBody && (sortedLayers.length > 0 || designImage)) {
                      if (isLocked) {
                        document.body.style.cursor = 'not-allowed';
                      } else {
                        document.body.style.cursor = isDragging ? 'grabbing' : 'grab';
                      }
                      
                      if (isDragging) {
                        e.stopPropagation();
                        const targetObj = e.eventObject || e.object;
                        const localPoint = targetObj.worldToLocal(e.point.clone());
                        const localNormal = e.face?.normal?.clone() || new THREE.Vector3(0, 0, 1);
                        onDragMove(localPoint, localNormal);
                      }
                    }
                  }}
                  onPointerOut={() => {
                    if (isMainBody && !isDragging) {
                      document.body.style.cursor = 'auto';
                    }
                  }}
                >
                  <meshStandardMaterial 
                    color={colorHex} 
                    roughness={0.8}
                    metalness={0.1}
                  />
                  
                  {/* Multi-layer Decals: Free 3D surface dragging across the entire shirt */}
                  {isMainBody && sortedLayers.length > 0 ? (
                    sortedLayers.map((layer, index) => {
                      const isBeingDragged = isDragging && draggingLayer?.id === layer.id;
                      const initial = getInitialLayer3D(layer, isBack);

                      let position = layer.position3D || initial.pos;
                      let baseRotation = layer.rotation3D || initial.rot;

                      if (isBeingDragged && draggingLayer) {
                        position = draggingLayer.pos;
                        baseRotation = draggingLayer.rot;
                      }

                      // Reactive rotation slider (outside-in)
                      const rotDeg = layer.rotation ?? 0;
                      const rotation: [number, number, number] = [
                        baseRotation[0],
                        baseRotation[1],
                        baseRotation[2] + ((rotDeg * Math.PI) / 180)
                      ];

                      // Reactive resize slider (outside-in)
                      const scale: [number, number, number] = [
                        0.25 * (layer.scaleX ?? 1),
                        0.25 * (layer.scaleY ?? 1),
                        0.45 * Math.max(layer.scaleX ?? 1, layer.scaleY ?? 1)
                      ];

                      return (
                        <DesignDecal
                          key={layer.id}
                          image={layer.src}
                          position={position}
                          rotation={rotation}
                          scale={scale}
                          opacity={layer.opacity ?? 1}
                          blendMode={layer.blendMode ?? 'normal'}
                          polygonOffsetFactor={-1 - (index * 2)}
                        />
                      );
                    })
                  ) : isMainBody && designImage ? (
                    /* Fallback when designLayers is empty but designImage exists */
                    <DesignDecal 
                      image={designImage}
                      position={isDragging && draggingLayer ? draggingLayer.pos : decalPosition}
                      rotation={
                        isDragging && draggingLayer
                          ? draggingLayer.rot
                          : [
                              decalRotation[0], 
                              decalRotation[1], 
                              decalRotation[2] + (decalRotationDegrees * Math.PI) / 180
                            ]
                      }
                      scale={[
                        decalScale[0] * decalScaleMultiplier,
                        decalScale[1] * decalScaleMultiplier,
                        decalScale[2]
                      ]}
                      opacity={decalOpacity}
                      polygonOffsetFactor={-1}
                    />
                  ) : null}
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
  onUpdateLayer?: (id: string, patch: Partial<CanvasDesignLayer>) => void;
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
  designLayers = [],
  selectedLayerId,
  onLayerPositionChange,
  onUpdateLayer,
  onLayerSelect,
  decalPosition = [0, 0.1, 0.15], 
  decalScale,
  decalOpacity = 1,
  decalRotationDegrees = 0,
  decalScaleMultiplier = 1,
  decalLocked = false,
  printSide = 'FRONT'
}: ShirtCanvas3DProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggingLayer, setDraggingLayer] = useState<DragState | null>(null);
  const [pos, setPos] = useState<[number, number, number]>(decalPosition);
  const [rot, setRot] = useState<[number, number, number]>([Math.PI / 2, 0, 0]);
  const [modelReady, setModelReady] = useState(false);
  const handleModelReady = useCallback(() => setModelReady(true), []);

  const isBack = printSide === 'BACK';

  const handleDragStart = useCallback((targetLayer: CanvasDesignLayer | null, localPoint: THREE.Vector3, normal: THREE.Vector3) => {
    if (targetLayer && onLayerSelect && targetLayer.id !== selectedLayerId) {
      onLayerSelect(targetLayer.id);
    }

    // Direct 3D mesh surface point & orientation (pure free dragging)
    const dummy = new THREE.Object3D();
    dummy.position.copy(localPoint);
    dummy.lookAt(localPoint.clone().add(normal));

    const newPos: [number, number, number] = [localPoint.x, localPoint.y, localPoint.z];
    const newRot: [number, number, number] = [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z];

    const initialDrag: DragState = {
      id: targetLayer ? targetLayer.id : '__fallback__',
      pos: newPos,
      rot: newRot,
    };

    setDraggingLayer(initialDrag);
    setPos(newPos);
    setRot(newRot);
    setIsDragging(true);
  }, [onLayerSelect, selectedLayerId]);

  const handleDragMove = useCallback((localPoint: THREE.Vector3, normal: THREE.Vector3) => {
    // Pure free 3D surface dragging: follows mouse wherever it touches the shirt mesh
    const dummy = new THREE.Object3D();
    dummy.position.copy(localPoint);
    dummy.lookAt(localPoint.clone().add(normal));

    const newPos: [number, number, number] = [localPoint.x, localPoint.y, localPoint.z];
    const newRot: [number, number, number] = [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z];

    setPos(newPos);
    setRot(newRot);

    setDraggingLayer((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        pos: newPos,
        rot: newRot,
      };
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingLayer((current) => {
      if (current && current.id !== '__fallback__') {
        const p = current.pos;
        // Approximate 2D percentages for thumbnails and saved draft compatibility
        const x = isBack
          ? Math.max(0, Math.min(100, Math.round(((-p[0] + 0.3) / 0.6) * 100)))
          : Math.max(0, Math.min(100, Math.round(((p[0] + 0.3) / 0.6) * 100)));
        const y = Math.max(0, Math.min(100, Math.round(((0.35 - p[1]) / 0.7) * 100)));

        if (onUpdateLayer) {
          onUpdateLayer(current.id, {
            position3D: p,
            rotation3D: current.rot,
            x,
            y,
          });
        } else if (onLayerPositionChange) {
          onLayerPositionChange(current.id, x, y);
        }
      }
      return null;
    });
    setIsDragging(false);
  }, [isBack, onLayerPositionChange, onUpdateLayer]);

  return (
    <ModelErrorBoundary>
      <div id="r3f-shirt-canvas" data-model-ready={modelReady} className="w-full h-full relative min-h-[400px] rounded-xl overflow-hidden shadow-inner border border-gray-300">
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
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[2, 2, 5]} 
            intensity={1.2}  
            castShadow 
            shadow-mapSize={1024}
          />
          <directionalLight 
            position={[-3, 0, 4]} 
            intensity={0.8}  
          />
          <directionalLight 
            position={[0, 2, -5]} 
            intensity={1.5}  
          />
          <directionalLight 
            position={[0, 5, 0]} 
            intensity={0.5}  
          />
          
          <Suspense fallback={null}>
            <ShirtModel 
              colorHex={shirtColor} 
              designImage={designImage}
              designLayers={designLayers}
              selectedLayerId={selectedLayerId}
              decalPosition={pos}
              decalRotation={rot}
              decalScale={decalScale || [0.25, 0.25, 0.25]}
              decalOpacity={decalOpacity}
              decalRotationDegrees={decalRotationDegrees}
              decalScaleMultiplier={decalScaleMultiplier}
              decalLocked={decalLocked}
              printSide={printSide}
              isDragging={isDragging}
              draggingLayer={draggingLayer}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onReady={handleModelReady}
            />
          </Suspense>

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

useGLTF.preload('/models/shirt.glb');
