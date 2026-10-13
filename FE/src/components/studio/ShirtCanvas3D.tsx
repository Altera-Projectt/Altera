import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  useGLTF,
  useTexture,
  Decal,
  OrbitControls,
  Center,
  Bounds,
  PerspectiveCamera,
  Html,
} from '@react-three/drei';
import * as THREE from 'three';

type CanvasDesignLayer = {
  id: string;
  src: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  locked: boolean;
  zIndex: number;
};

// ──────────────────────────────────────────────────────────────────────────────
// Error boundary
// ──────────────────────────────────────────────────────────────────────────────
class ModelErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Html center>
        <div
          role="alert"
          className="rounded bg-white px-3 py-2 text-sm text-red-700 shadow"
        >
          Could not load the 3D shirt model. Please refresh and try again.
        </div>
      </Html>
    ) : (
      this.props.children
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// 1. DesignDecal – renders one sticker onto the mesh via Three.js Decal
// ──────────────────────────────────────────────────────────────────────────────
function DesignDecal({
  image,
  position,
  rotation,
  scale,
  opacity = 1,
}: {
  image: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  opacity?: number;
}) {
  const optimizedImage = image.includes('cloudinary.com')
    ? image.replace('/upload/', '/upload/q_auto,f_auto,w_1024/')
    : image;

  const texture = useTexture(optimizedImage);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;

  return (
    <Decal position={position} rotation={rotation} scale={scale}>
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthTest
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </Decal>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 2. LayerBoundsOverlay – selection box shown for the active layer
// ──────────────────────────────────────────────────────────────────────────────
function LayerBoundsOverlay({
  layer,
  isDragging,
  groupRotation,
}: {
  layer: CanvasDesignLayer;
  isDragging: boolean;
  groupRotation: [number, number, number];
}) {
  const { camera, size } = useThree();

  // Decal local position (same formula used when rendering the decal)
  const lx = (layer.x / 100) * 0.6 - 0.3;
  const ly = 0.1 + ((50 - layer.y) / 100) * 0.6;
  const lz = 0.16;

  // Apply group euler to get world-space position
  const euler = new THREE.Euler(...groupRotation);
  const worldPos = new THREE.Vector3(lx, ly, lz).applyEuler(euler);

  // Project into NDC then into canvas pixels
  const ndc = worldPos.clone().project(camera);
  const px = ((ndc.x + 1) / 2) * size.width;
  const py = ((-ndc.y + 1) / 2) * size.height;

  // Estimate pixel footprint of the decal
  const edgeNdc = new THREE.Vector3(lx + 0.25 * layer.scaleX, ly, lz)
    .applyEuler(euler)
    .project(camera);
  const unitPx = Math.abs(edgeNdc.x - ndc.x) * size.width * 0.5;
  const bw = Math.max(28, unitPx * layer.scaleX * 2);
  const bh = Math.max(28, unitPx * layer.scaleY * 2);

  const color = isDragging ? '#f97316' : '#3b82f6';

  // px/py not used directly here but kept for reference
  void px; void py;

  return (
    <Html
      position={[worldPos.x, worldPos.y, worldPos.z]}
      style={{ pointerEvents: 'none', overflow: 'visible' }}
      zIndexRange={[10, 20]}
    >
      <div
        style={{
          position: 'absolute',
          left: -bw / 2,
          top: -bh / 2,
          width: bw,
          height: bh,
          border: `2px dashed ${color}`,
          borderRadius: 4,
          boxShadow: `0 0 0 1px ${color}33`,
          transition: 'border-color .15s, box-shadow .15s',
          transform: `rotate(${layer.rotation}deg)`,
          pointerEvents: 'none',
        }}
      >
        {([[-1,-1],[1,-1],[1,1],[-1,1]] as [number,number][]).map(([cx, cy], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: 2,
              background: color,
              left: cx === -1 ? -4 : 'auto',
              right: cx === 1 ? -4 : 'auto',
              top: cy === -1 ? -4 : 'auto',
              bottom: cy === 1 ? -4 : 'auto',
            }}
          />
        ))}
        <div
          style={{
            position: 'absolute',
            top: -22,
            left: 0,
            background: color,
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: 3,
            whiteSpace: 'nowrap',
            maxWidth: 140,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {layer.locked ? '🔒 ' : ''}{isDragging ? 'Moving…' : 'Selected'}
        </div>
      </div>
    </Html>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 3. ShirtModel
// ──────────────────────────────────────────────────────────────────────────────
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
  onDragMove,
}: ShirtModelProps) {
  const { nodes } = useGLTF('/models/shirt.glb') as any;
  const { camera, gl } = useThree();

  const bodyMeshRef = useRef<THREE.Mesh | null>(null);
  const draggingLayerIdRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => { onReady?.(); }, [onReady]);

  const groupRotation: [number, number, number] = [
    -Math.PI / 2,
    0,
    printSide === 'BACK' ? Math.PI : 0,
  ];

  // ── Window-level drag: keeps drag alive even when cursor leaves the mesh ──
  useEffect(() => {
    const raycaster = new THREE.Raycaster();

    function getLocalHit(clientX: number, clientY: number): THREE.Vector3 | null {
      const mesh = bodyMeshRef.current;
      if (!mesh) return null;
      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      const hits = raycaster.intersectObject(mesh, false);
      if (!hits.length) return null;
      return mesh.worldToLocal(hits[0].point.clone());
    }

    function localToXY(local: THREE.Vector3) {
      const x = Math.max(5, Math.min(95, ((local.x + 0.3) / 0.6) * 100));
      const y = Math.max(5, Math.min(95, 50 - ((local.y - 0.1) / 0.6) * 100));
      return { x, y };
    }

    function handleMove(e: PointerEvent) {
      if (!isDraggingRef.current) return;
      const local = getLocalHit(e.clientX, e.clientY);
      if (!local) return;

      const layerId = draggingLayerIdRef.current;
      if (layerId && onLayerPositionChange) {
        const { x, y } = localToXY(local);
        onLayerPositionChange(layerId, x, y);
      } else {
        const dummy = new THREE.Object3D();
        dummy.position.copy(local);
        onDragMove([local.x, local.y, local.z], [dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]);
      }
    }

    function handleUp() {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      draggingLayerIdRef.current = null;
      document.body.style.cursor = 'auto';
      onDragEnd();
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, gl, onLayerPositionChange, onDragMove, onDragEnd]);

  useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);

  return (
    <group dispose={null} rotation={groupRotation}>
      <Bounds fit clip observe margin={1.2}>
        <Center>
          {Object.values(nodes).map((node: any) => {
            if (!node.isMesh) return null;
            const isMainBody = node.geometry.attributes.position.count > 1500;

            return (
              <mesh
                key={node.uuid}
                ref={(el) => { if (isMainBody && el) bodyMeshRef.current = el; }}
                castShadow
                receiveShadow
                geometry={node.geometry}
                dispose={null}
                onPointerDown={(e) => {
                  if (!isMainBody) return;
                  if (!designLayers.length && !designImage) return;

                  const activeLayer =
                    designLayers.find((l) => l.id === selectedLayerId) ??
                    [...designLayers].sort((a, b) => b.zIndex - a.zIndex)[0] ??
                    null;

                  if (activeLayer?.locked || (designImage && decalLocked)) return;

                  e.stopPropagation();
                  if (activeLayer) onLayerSelect?.(activeLayer.id);

                  draggingLayerIdRef.current = activeLayer?.id ?? null;
                  isDraggingRef.current = true;
                  document.body.style.cursor = 'grabbing';
                  onDragStart();
                }}
                onPointerUp={(e) => {
                  if (!isMainBody) return;
                  e.stopPropagation();
                  if (isDraggingRef.current) {
                    isDraggingRef.current = false;
                    draggingLayerIdRef.current = null;
                    document.body.style.cursor = 'auto';
                    onDragEnd();
                  }
                }}
                onPointerEnter={() => {
                  if (!isMainBody) return;
                  if (isDraggingRef.current) document.body.style.cursor = 'grabbing';
                  else if (designLayers.length || designImage) document.body.style.cursor = 'grab';
                }}
                onPointerLeave={() => {
                  if (isMainBody && !isDraggingRef.current) document.body.style.cursor = 'auto';
                }}
              >
                <meshStandardMaterial color={colorHex} roughness={0.8} metalness={0.1} />

                {isMainBody && designLayers.length > 0
                  ? designLayers.map((layer) => (
                      <DesignDecal
                        key={layer.id}
                        image={layer.src}
                        position={[(layer.x / 100) * 0.6 - 0.3, 0.1 + ((50 - layer.y) / 100) * 0.6, 0.16]}
                        rotation={[Math.PI / 2, 0, (layer.rotation * Math.PI) / 180]}
                        scale={[0.25 * layer.scaleX, 0.25 * layer.scaleY, 0.25]}
                        opacity={layer.opacity}
                      />
                    ))
                  : isMainBody && designImage && (
                      <DesignDecal
                        image={designImage}
                        position={decalPosition}
                        rotation={[decalRotation[0], decalRotation[1], decalRotation[2] + (decalRotationDegrees * Math.PI) / 180]}
                        scale={[decalScale[0] * decalScaleMultiplier, decalScale[1] * decalScaleMultiplier, decalScale[2]]}
                        opacity={decalOpacity}
                      />
                    )}

                {isMainBody && designLayers.length > 0 &&
                  designLayers
                    .filter((l) => l.id === selectedLayerId)
                    .map((layer) => (
                      <LayerBoundsOverlay
                        key={`overlay-${layer.id}`}
                        layer={layer}
                        isDragging={isDragging}
                        groupRotation={groupRotation}
                      />
                    ))}
              </mesh>
            );
          })}
        </Center>
      </Bounds>
    </group>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// 4. ShirtCanvas3D – public export
// ──────────────────────────────────────────────────────────────────────────────
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
  printSide = 'FRONT',
}: ShirtCanvas3DProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState<[number, number, number]>(decalPosition ?? [0, 0.1, 0.15]);
  const [rot, setRot] = useState<[number, number, number]>([Math.PI / 2, 0, 0]);
  const [modelReady, setModelReady] = useState(false);
  const handleModelReady = useCallback(() => setModelReady(true), []);

  return (
    <div
      id="r3f-shirt-canvas"
      data-model-ready={modelReady}
      className="w-full h-full relative min-h-[400px] rounded-xl overflow-hidden shadow-inner border border-gray-300"
    >
      <Canvas shadows style={{ backgroundColor: 'transparent' }} gl={{ preserveDrawingBuffer: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 5]} intensity={1.2} castShadow shadow-mapSize={1024} />
        <directionalLight position={[-3, 0, 4]} intensity={0.8} />
        <directionalLight position={[0, 2, -5]} intensity={1.5} />
        <directionalLight position={[0, 5, 0]} intensity={0.5} />

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
              decalScale={decalScale ?? [0.25, 0.25, 0.25]}
              decalOpacity={decalOpacity}
              decalRotationDegrees={decalRotationDegrees}
              decalScaleMultiplier={decalScaleMultiplier}
              decalLocked={decalLocked}
              printSide={printSide}
              isDragging={isDragging}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              onDragMove={(newPos, newRot) => { setPos(newPos); setRot(newRot); }}
            />
          </Suspense>
        </ModelErrorBoundary>

        <OrbitControls makeDefault enabled={!isDragging} enableZoom enablePan={false} enableRotate />
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/shirt.glb');