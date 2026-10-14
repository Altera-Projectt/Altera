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
  locked?: boolean;
  zIndex?: number;
  visible?: boolean;
  name?: string;
  type?: string;
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
  polygonOffsetFactor = -1
}: { 
  image: string; 
  position: [number, number, number]; 
  rotation: [number, number, number]; 
  scale: [number, number, number];
  opacity?: number;
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
        polygonOffsetFactor={polygonOffsetFactor} 
      />
    </Decal>
  );
}

// Helper to convert 2D layer properties into 3D decal transforms
function layerTo3DTransform(
  layer: CanvasDesignLayer, 
  isBack: boolean
): { position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] } {
  const lx = layer.x ?? 50;
  const ly = layer.y ?? 50;
  const rotDeg = layer.rotation ?? 0;
  const sx = (layer.scaleX ?? 1) * 0.25;
  const sy = (layer.scaleY ?? 1) * 0.25;

  const posX = isBack ? -(((lx - 50) / 100) * 0.6) : (((lx - 50) / 100) * 0.6);
  const posY = 0.1 + ((50 - ly) / 100) * 0.6;
  const posZ = isBack ? -0.155 + (posX * posX) * 0.12 : 0.155 - (posX * posX) * 0.12;

  const rotation: [number, number, number] = isBack
    ? [Math.PI / 2, Math.PI, -(rotDeg * Math.PI) / 180]
    : [Math.PI / 2, 0, (rotDeg * Math.PI) / 180];

  return {
    position: [posX, posY, posZ],
    rotation,
    scale: [sx, sy, 0.3]
  };
}

// Hit-test: find the top layer under the click point
function findLayerAtPoint(layers: CanvasDesignLayer[], x: number, y: number): CanvasDesignLayer | null {
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (layer.locked || layer.visible === false) continue;
    const lx = layer.x ?? 50;
    const ly = layer.y ?? 50;
    const halfW = ((0.25 * (layer.scaleX ?? 1)) / 0.6) * 50;
    const halfH = ((0.25 * (layer.scaleY ?? 1)) / 0.6) * 50;
    if (x >= lx - halfW && x <= lx + halfW && y >= ly - halfH && y <= ly + halfH) {
      return layer;
    }
  }
  return null;
}

// ----------------------------------------------------------------------
// 2. The 3D Shirt Model
// ----------------------------------------------------------------------
interface DragState {
  id: string;
  pos: [number, number, number];
  rot: [number, number, number];
  x: number;
  y: number;
  dragOffset?: { x: number; y: number };
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
  // Load the GLTF model. Make sure you place `shirt.glb` in public/models/
  const { nodes } = useGLTF('/models/shirt.glb') as any;
  useEffect(() => { onReady?.() }, [onReady]);

  const isBack = printSide === 'BACK';

  // Filter and sort layers by zIndex
  const sortedLayers = useMemo(() => {
    return [...designLayers]
      .filter((layer) => Boolean(layer.src) && layer.visible !== false)
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  }, [designLayers]);

  // Legacy single active layer check for cursor state
  const activeLayer = sortedLayers.find((layer) => layer.id === (draggingLayer?.id || selectedLayerId))
    ?? sortedLayers[sortedLayers.length - 1];
  const isLocked = activeLayer?.locked || (designImage && !sortedLayers.length && decalLocked);

  return (
    <group dispose={null} rotation={[-Math.PI / 2, 0, isBack ? Math.PI : 0]}>
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
                    if (isMainBody && (sortedLayers.length > 0 || designImage)) {
                      const targetObj = e.eventObject || e.object;
                      const localPoint = targetObj.worldToLocal(e.point.clone());
                      const localNormal = e.face?.normal?.clone() || new THREE.Vector3(0, 0, 1);

                      const clickX = isBack
                        ? Math.max(0, Math.min(100, Math.round(((-localPoint.x + 0.3) / 0.6) * 100)))
                        : Math.max(0, Math.min(100, Math.round(((localPoint.x + 0.3) / 0.6) * 100)));
                      const clickY = Math.max(0, Math.min(100, Math.round(50 - ((localPoint.y - 0.1) / 0.6) * 100)));

                      const hitLayer = findLayerAtPoint(sortedLayers, clickX, clickY);
                      const targetLayer = hitLayer
                        ?? sortedLayers.find((layer) => layer.id === selectedLayerId)
                        ?? [...sortedLayers].reverse().find((layer) => !layer.locked)
                        ?? sortedLayers[sortedLayers.length - 1]
                        ?? null;

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
                  {/* Dynamic Color Changing applied to ALL parts (body, collar, sleeves) */}
                  <meshStandardMaterial 
                    color={colorHex} 
                    roughness={0.8}
                    metalness={0.1}
                  />
                  
                  {/* Multi-layer Decals: Render all layers currently in the designLayers array */}
                  {isMainBody && sortedLayers.length > 0 ? (
                    sortedLayers.map((layer, index) => {
                      const isBeingDragged = isDragging && draggingLayer?.id === layer.id;
                      const transform = layerTo3DTransform(layer, isBack);

                      // Outside-in reactive properties:
                      const scale: [number, number, number] = [
                        0.25 * (layer.scaleX ?? 1),
                        0.25 * (layer.scaleY ?? 1),
                        0.3
                      ];
                      const opacity = layer.opacity ?? 1;

                      let position = transform.position;
                      let rotation = transform.rotation;

                      if (isBeingDragged && draggingLayer) {
                        position = draggingLayer.pos;
                        const rotDeg = layer.rotation ?? 0;
                        rotation = [
                          draggingLayer.rot[0],
                          draggingLayer.rot[1],
                          draggingLayer.rot[2] + ((rotDeg * Math.PI) / 180)
                        ];
                      }

                      return (
                        <DesignDecal
                          key={layer.id}
                          image={layer.src}
                          position={position}
                          rotation={rotation}
                          scale={scale}
                          opacity={opacity}
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

    const clickX = isBack
      ? Math.max(0, Math.min(100, Math.round(((-localPoint.x + 0.3) / 0.6) * 100)))
      : Math.max(0, Math.min(100, Math.round(((localPoint.x + 0.3) / 0.6) * 100)));
    const clickY = Math.max(0, Math.min(100, Math.round(50 - ((localPoint.y - 0.1) / 0.6) * 100)));

    const layerX = targetLayer?.x ?? 50;
    const layerY = targetLayer?.y ?? 50;
    const distX = clickX - layerX;
    const distY = clickY - layerY;
    const keepOffset = Math.hypot(distX, distY) <= 30;
    const offsetX = keepOffset ? distX : 0;
    const offsetY = keepOffset ? distY : 0;

    const targetX = Math.max(5, Math.min(95, Math.round(clickX - offsetX)));
    const targetY = Math.max(5, Math.min(95, Math.round(clickY - offsetY)));

    const posX = isBack ? -(((targetX - 50) / 100) * 0.6) : (((targetX - 50) / 100) * 0.6);
    const posY = 0.1 + ((50 - targetY) / 100) * 0.6;
    const posZ = isBack ? -0.155 + (posX * posX) * 0.12 : 0.155 - (posX * posX) * 0.12;

    const dummy = new THREE.Object3D();
    dummy.position.set(posX, posY, posZ);
    dummy.lookAt(dummy.position.clone().add(normal));

    const initialDrag: DragState = {
      id: targetLayer ? targetLayer.id : '__fallback__',
      pos: [posX, posY, posZ],
      rot: [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z],
      x: targetX,
      y: targetY,
      dragOffset: { x: offsetX, y: offsetY }
    };

    setDraggingLayer(initialDrag);
    setPos([posX, posY, posZ]);
    setRot([dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]);
    setIsDragging(true);
  }, [isBack, onLayerSelect, selectedLayerId]);

  const handleDragMove = useCallback((localPoint: THREE.Vector3, normal: THREE.Vector3) => {
    setDraggingLayer((prev) => {
      if (!prev) return null;

      const rawX = isBack
        ? ((-localPoint.x + 0.3) / 0.6) * 100
        : ((localPoint.x + 0.3) / 0.6) * 100;
      const rawY = 50 - ((localPoint.y - 0.1) / 0.6) * 100;

      const offsetX = prev.dragOffset?.x ?? 0;
      const offsetY = prev.dragOffset?.y ?? 0;

      const clampedX = Math.max(5, Math.min(95, Math.round(rawX - offsetX)));
      const clampedY = Math.max(5, Math.min(95, Math.round(rawY - offsetY)));

      const posX = isBack ? -(((clampedX - 50) / 100) * 0.6) : (((clampedX - 50) / 100) * 0.6);
      const posY = 0.1 + ((50 - clampedY) / 100) * 0.6;
      const posZ = isBack ? -0.155 + (posX * posX) * 0.12 : 0.155 - (posX * posX) * 0.12;

      const dummy = new THREE.Object3D();
      dummy.position.set(posX, posY, posZ);
      dummy.lookAt(dummy.position.clone().add(normal));

      const newPos: [number, number, number] = [posX, posY, posZ];
      const newRot: [number, number, number] = [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z];

      setPos(newPos);
      setRot(newRot);

      return {
        ...prev,
        pos: newPos,
        rot: newRot,
        x: clampedX,
        y: clampedY
      };
    });
  }, [isBack]);

  const handleDragEnd = useCallback(() => {
    setDraggingLayer((current) => {
      if (current && current.id !== '__fallback__') {
        if (onUpdateLayer) {
          onUpdateLayer(current.id, { x: current.x, y: current.y });
        } else if (onLayerPositionChange) {
          onLayerPositionChange(current.id, current.x, current.y);
        }
      }
      return null;
    });
    setIsDragging(false);
  }, [onLayerPositionChange, onUpdateLayer]);

  return (
    <ModelErrorBoundary>
      <div id="r3f-shirt-canvas" data-model-ready={modelReady} className="w-full h-full relative min-h-[400px] rounded-xl overflow-hidden shadow-inner border border-gray-300">
        {/* HTML Loading Overlay nằm BÊN NGOÀI Canvas để tránh removeChild crash */}
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
          
          {/* 3D Content - Suspense fallback={null} để không can thiệp DOM bên trong Canvas */}
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

          {/* Camera Controls - disable when dragging decals */}
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
