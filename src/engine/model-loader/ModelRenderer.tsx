import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF, TransformControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useSimulationStore, ComponentOffset } from '../../stores/simulationStore';
import { ModelManifest } from '../../types/model';
import { handTrackingEngine } from '../gestures/HandTrackingEngine';

interface ModelRendererProps {
  manifest: ModelManifest;
}

export const ModelRenderer: React.FC<ModelRendererProps> = ({ manifest }) => {
  const { scene } = useGLTF(manifest.assetUrl);
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const rootGroupRef = useRef<THREE.Group>(null);
  const aeroGroupRef = useRef<THREE.Group>(null);

  const {
    selectedComponentId,
    hoveredComponentId,
    removedComponentIds,
    hiddenComponentIds,
    isolatedComponentId,
    explodedPercent,
    xrayMode,
    airflowActive,
    aerodynamics,
    selectComponent,
    setHoveredComponent,
    removeComponent,
    setInspectionDetailMode,
    componentOffsets,
    detachedComponentIds,
    detachComponent,
    isMoveModeActive,
    isGizmoDragging,
    handTrackingActive,
    setComponentOffset,
    setGizmoDragging,
    pushHistorySnapshot
  } = useSimulationStore();

  // Map of component IDs and node names
  const componentMap = useMemo(() => {
    const map = new Map<string, typeof manifest.components[0]>();
    manifest.components.forEach(c => {
      map.set(c.nodeName, c);
      map.set(c.id, c);
    });
    return map;
  }, [manifest]);

  // Compute model geometric center and bounding metrics
  const modelMetrics = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const radius = Math.max(box.min.distanceTo(box.max) / 2, 0.1);
    const maxDim = Math.max(size.x, size.y, size.z, 0.1);
    return { box, center, size, radius, maxDim };
  }, [clonedScene]);

  // Store original transforms and materials keyed by mesh UUID for 100% collision-free tracking
  const originalTransforms = useRef<Map<string, { position: THREE.Vector3; rotation: THREE.Euler }>>(new Map());
  const originalWorldPositions = useRef<Map<string, THREE.Vector3>>(new Map());
  const originalMaterials = useRef<Map<string, THREE.Material | THREE.Material[]>>(new Map());
  const originalEmissiveMap = useRef<Map<string, { color: THREE.Color; intensity: number }>>(new Map());
  const calculatedExplodeVectors = useRef<Map<string, THREE.Vector3>>(new Map());
  const edgeLinesMap = useRef<Map<string, THREE.LineSegments>>(new Map());

  const { camera, gl } = useThree();

  // Interactive 3D Move Gizmo State & Controls
  const [selectedMesh, setSelectedMesh] = useState<THREE.Object3D | null>(null);
  const transformControlsRef = useRef<any>(null);

  // Direct Free Dragging in 3D Space (real-time 60/120 FPS buttery smooth motion)
  const isDirectDraggingRef = useRef(false);
  const dragCompIdRef = useRef<string | null>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());
  const dragStartIntersectionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const dragStartOffsetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const activeDragOffsetRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  // Spatial Hand Gesture Dragging Refs (silky smooth 60 FPS, 0-stutter, 0-sound)
  const handDragCompIdRef = useRef<string | null>(null);
  const handDragPlaneRef = useRef<THREE.Plane | null>(null);
  const handDragStartIntersectionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const handDragStartOffsetRef = useRef<ComponentOffset>({ x: 0, y: 0, z: 0 });
  const wasSinglePinchingRef = useRef<boolean>(false);
  const handRaycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const handNdcRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const probeNdcRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const handCamDirRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const handIntersectionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const tempTargetWorldRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // Center model so its base sits on the showcase platform
  useEffect(() => {
    const { center } = modelMetrics;
    clonedScene.position.set(-center.x, -center.y, -center.z);
  }, [clonedScene, modelMetrics]);

  // Clean up previous model refs, edge lines, and gizmos when switching models
  useEffect(() => {
    originalTransforms.current.clear();
    originalWorldPositions.current.clear();
    originalMaterials.current.clear();
    originalEmissiveMap.current.clear();
    calculatedExplodeVectors.current.clear();
    edgeLinesMap.current.forEach(line => {
      line.parent?.remove(line);
      line.geometry?.dispose();
      if (Array.isArray(line.material)) {
        line.material.forEach(m => m.dispose());
      } else {
        line.material?.dispose();
      }
    });
    edgeLinesMap.current.clear();
    setSelectedMesh(null);
  }, [manifest.id]);

  // Sync selectedMesh with selectedComponentId
  useEffect(() => {
    if (!selectedComponentId) {
      setSelectedMesh(null);
      return;
    }
    let found: THREE.Object3D | null = null;
    clonedScene.traverse((obj) => {
      if (found) return;
      if ((obj as THREE.Mesh).isMesh) {
        const comp = componentMap.get(obj.name) || componentMap.get(obj.parent?.name || '');
        const id = comp ? comp.id : obj.name;
        if (id === selectedComponentId || obj.name === selectedComponentId || obj.uuid === selectedComponentId) {
          found = obj;
        }
      }
    });
    setSelectedMesh(found);
  }, [selectedComponentId, clonedScene, componentMap]);

  // Wire TransformControls events for real-time 3D translation without lag
  useEffect(() => {
    const controls = transformControlsRef.current;
    if (!controls) return;

    const handleDragging = (e: any) => {
      const isDragging = Boolean(e.value);
      if (isDragging) {
        pushHistorySnapshot();
      }
      setGizmoDragging(isDragging);
      if (!isDragging && selectedComponentId) {
        // Commit final offset when user releases gizmo handle
        setComponentOffset(selectedComponentId, { ...activeDragOffsetRef.current });
      }
    };

    const handleChange = () => {
      if (!selectedMesh || !selectedComponentId) return;
      const origWorld = originalWorldPositions.current.get(selectedMesh.uuid);
      if (!origWorld) return;

      const explodeVec = calculatedExplodeVectors.current.get(selectedMesh.uuid);
      const factor = explodedPercent / 100;
      const curExplodeX = (explodeVec && factor > 0) ? explodeVec.x * factor : 0;
      const curExplodeY = (explodeVec && factor > 0) ? explodeVec.y * factor : 0;
      const curExplodeZ = (explodeVec && factor > 0) ? explodeVec.z * factor : 0;

      const curWorldPos = new THREE.Vector3();
      selectedMesh.getWorldPosition(curWorldPos);

      // World delta from original position (minus current explode)
      activeDragOffsetRef.current = {
        x: curWorldPos.x - origWorld.x - curExplodeX,
        y: curWorldPos.y - origWorld.y - curExplodeY,
        z: curWorldPos.z - origWorld.z - curExplodeZ
      };
    };

    controls.addEventListener('dragging-changed', handleDragging);
    controls.addEventListener('objectChange', handleChange);

    return () => {
      controls.removeEventListener('dragging-changed', handleDragging);
      controls.removeEventListener('objectChange', handleChange);
    };
  }, [selectedMesh, selectedComponentId, explodedPercent, setGizmoDragging, setComponentOffset]);

  // Window listeners for Direct Free Mouse Dragging anywhere in the 3D viewport
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDirectDraggingRef.current || !dragCompIdRef.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      const mouseRay = new THREE.Raycaster();
      mouseRay.setFromCamera(new THREE.Vector2(x, y), camera);

      const intersection = new THREE.Vector3();
      if (mouseRay.ray.intersectPlane(dragPlaneRef.current, intersection)) {
        const delta = new THREE.Vector3().subVectors(intersection, dragStartIntersectionRef.current);
        activeDragOffsetRef.current = {
          x: dragStartOffsetRef.current.x + delta.x,
          y: dragStartOffsetRef.current.y + delta.y,
          z: dragStartOffsetRef.current.z + delta.z
        };
      }
    };

    const handlePointerUp = () => {
      if (isDirectDraggingRef.current && dragCompIdRef.current) {
        const targetId = dragCompIdRef.current;
        const finalOffset = { ...activeDragOffsetRef.current };
        isDirectDraggingRef.current = false;
        dragCompIdRef.current = null;
        setGizmoDragging(false);
        setComponentOffset(targetId, finalOffset);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Determine if a part is being dragged, clicked/selected, or hovered
      const targetId = dragCompIdRef.current || selectedComponentId || hoveredComponentId;
      if (!targetId) return;

      // Stop canvas from zooming the camera when user scrolls on an object
      e.preventDefault();
      e.stopPropagation();

      // Find the target mesh to get its exact 3D world position
      let targetMesh: THREE.Object3D | null = selectedMesh;
      if (!targetMesh || (selectedComponentId !== targetId)) {
        clonedScene.traverse((obj) => {
          if (targetMesh) return;
          if ((obj as THREE.Mesh).isMesh) {
            const comp = componentMap.get(obj.name) || componentMap.get(obj.parent?.name || '');
            const id = comp ? comp.id : obj.name;
            if (id === targetId || obj.name === targetId || obj.uuid === targetId) {
              targetMesh = obj;
            }
          }
        });
      }

      // Vector pointing directly from the object towards the viewer's screen (camera position)
      const towardsScreen = new THREE.Vector3();
      if (targetMesh) {
        const objWorldPos = new THREE.Vector3();
        targetMesh.getWorldPosition(objWorldPos);
        towardsScreen.subVectors(camera.position, objWorldPos).normalize();
      } else {
        // Fallback: camera eye direction (towards screen)
        camera.getWorldDirection(towardsScreen).negate();
      }

      // Scroll Up (-deltaY): move forward directly TOWARDS the screen
      // Scroll Down (+deltaY): move backward directly AWAY into the screen
      const depthStep = -Math.sign(e.deltaY) * 0.16;

      const current = { ...(activeDragOffsetRef.current || componentOffsets[targetId] || { x: 0, y: 0, z: 0 }) };
      const nextOffset: ComponentOffset = {
        x: current.x + towardsScreen.x * depthStep,
        y: current.y + towardsScreen.y * depthStep,
        z: current.z + towardsScreen.z * depthStep
      };

      activeDragOffsetRef.current = nextOffset;
      dragStartOffsetRef.current = { ...nextOffset };

      // Update dragPlane so subsequent mouse screen motion remains consistent with the new depth
      if (dragPlaneRef.current && isDirectDraggingRef.current) {
        dragPlaneRef.current.translate(towardsScreen.clone().multiplyScalar(depthStep));
      }

      if (!detachedComponentIds.includes(targetId)) {
        detachComponent(targetId, nextOffset);
      } else {
        setComponentOffset(targetId, nextOffset);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    gl.domElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      gl.domElement.removeEventListener('wheel', handleWheel);
    };
  }, [camera, gl, setGizmoDragging, setComponentOffset, detachComponent, selectedComponentId, hoveredComponentId, componentOffsets, detachedComponentIds, selectedMesh, clonedScene, componentMap, isMoveModeActive]);

  // Spatial Single-Hand Pinch: "if i pinch with one hand i can move the objects"
  // Completely silent with 0 audio triggers and buttery-smooth 60 FPS rendering
  useEffect(() => {
    if (!handTrackingActive) {
      if (handDragCompIdRef.current) {
        handDragCompIdRef.current = null;
        dragCompIdRef.current = null;
        isDirectDraggingRef.current = false;
        useSimulationStore.getState().setGizmoDragging(false);
      }
      wasSinglePinchingRef.current = false;
      return;
    }

    const unsub = handTrackingEngine.subscribe((status) => {
      if (!status.active || !status.tracking) {
        if (handDragCompIdRef.current) {
          handDragCompIdRef.current = null;
          dragCompIdRef.current = null;
          isDirectDraggingRef.current = false;
          useSimulationStore.getState().setGizmoDragging(false);
        }
        wasSinglePinchingRef.current = false;
        return;
      }

      const left = status.leftHand;
      const right = status.rightHand;

      // Single hand pinch: exactly one hand is detected and pinching (NOT both pinching, which moves screen)
      const isBothPinching = left.detected && right.detected && left.isPinching && right.isPinching;
      const isSinglePinch = !isBothPinching && ((right.detected && right.isPinching) || (left.detected && left.isPinching));
      const pinchingHand = (right.detected && right.isPinching) ? right : left;

      // Screen & Canvas NDC Transformation: map exact gesture dot pixel to 3D ray
      const rect = gl.domElement.getBoundingClientRect();
      const clientX = pinchingHand.x * window.innerWidth;
      const clientY = pinchingHand.y * window.innerHeight;
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
      handNdcRef.current.set(ndcX, ndcY);

      if (isSinglePinch) {
        if (!wasSinglePinchingRef.current || !handDragCompIdRef.current) {
          // Pinch START: Raycast directly under the hand gesture dot!
          handRaycasterRef.current.setFromCamera(handNdcRef.current, camera);
          const visibleMeshes: THREE.Mesh[] = [];
          clonedScene.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh && obj.visible) {
              visibleMeshes.push(obj as THREE.Mesh);
            }
          });

          const hits = handRaycasterRef.current.intersectObjects(visibleMeshes, false);
          let targetId: string | null = null;
          let hitPoint: THREE.Vector3 | null = null;

          const storeState = useSimulationStore.getState();
          // High-precision raycast targeting: checks direct hit first, then fine-grained proximity probe
          if (hits.length > 0) {
            const hitMesh = hits[0].object;
            hitPoint = hits[0].point;
            const comp = componentMap.get(hitMesh.name) || componentMap.get(hitMesh.parent?.name || '');
            targetId = comp ? comp.id : hitMesh.name;
          } else {
            // Proximity probe: if user aimed within ~12px of a part edge, lock onto it reliably
            const probeOffsets = [
              { x: 0.012, y: 0 },
              { x: -0.012, y: 0 },
              { x: 0, y: 0.012 },
              { x: 0, y: -0.012 },
              { x: 0.009, y: 0.009 },
              { x: -0.009, y: -0.009 }
            ];
            const probeRay = handRaycasterRef.current;
            for (const off of probeOffsets) {
              probeNdcRef.current.set(handNdcRef.current.x + off.x, handNdcRef.current.y + off.y);
              probeRay.setFromCamera(probeNdcRef.current, camera);
              const probeHits = probeRay.intersectObjects(visibleMeshes, false);
              if (probeHits.length > 0) {
                const hitMesh = probeHits[0].object;
                hitPoint = probeHits[0].point;
                const comp = componentMap.get(hitMesh.name) || componentMap.get(hitMesh.parent?.name || '');
                targetId = comp ? comp.id : hitMesh.name;
                break;
              }
            }
          }

          if (targetId) {
            // SILENT selection: pass silent=true so no audio click plays
            storeState.selectComponent(targetId, true);
            storeState.pushHistorySnapshot();
            handDragCompIdRef.current = targetId;
            dragCompIdRef.current = targetId;
            isDirectDraggingRef.current = true;
            storeState.setGizmoDragging(true);

            // Find object world position
            let targetMesh: THREE.Object3D | null = null;
            clonedScene.traverse((obj) => {
              if (targetMesh) return;
              if ((obj as THREE.Mesh).isMesh) {
                const comp = componentMap.get(obj.name) || componentMap.get(obj.parent?.name || '');
                const id = comp ? comp.id : obj.name;
                if (id === targetId || obj.name === targetId || obj.uuid === targetId) {
                  targetMesh = obj;
                }
              }
            });

            const objWorldPos = new THREE.Vector3();
            if (targetMesh) {
              (targetMesh as THREE.Object3D).getWorldPosition(objWorldPos);
            }

            // Create plane facing camera passing through the exact hit point (or object center)
            camera.getWorldDirection(handCamDirRef.current);
            const planePoint = hitPoint || objWorldPos;
            handDragPlaneRef.current = new THREE.Plane().setFromNormalAndCoplanarPoint(handCamDirRef.current.negate(), planePoint);

            // Set start intersection point to the hit point for 1:1 zero-parallax alignment with the dot!
            handDragStartIntersectionRef.current.copy(planePoint);

            const currOffsets = storeState.componentOffsets;
            const startOffset = { ...(currOffsets[targetId] || { x: 0, y: 0, z: 0 }) };
            handDragStartOffsetRef.current = startOffset;
            activeDragOffsetRef.current = { ...startOffset };
            wasSinglePinchingRef.current = true;
          }
        } else if (handDragPlaneRef.current && handDragCompIdRef.current) {
          // Pinch DRAG: update object 3D position in real time coplanar to camera
          handRaycasterRef.current.setFromCamera(handNdcRef.current, camera);

          if (handRaycasterRef.current.ray.intersectPlane(handDragPlaneRef.current, handIntersectionRef.current)) {
            const deltaX = handIntersectionRef.current.x - handDragStartIntersectionRef.current.x;
            const deltaY = handIntersectionRef.current.y - handDragStartIntersectionRef.current.y;
            const deltaZ = handIntersectionRef.current.z - handDragStartIntersectionRef.current.z;

            // Update active drag offset ref directly — useFrame renders this smoothly at 60 FPS!
            // No React re-renders, no Zustand store dispatches, and NO SOUNDS!
            activeDragOffsetRef.current = {
              x: handDragStartOffsetRef.current.x + deltaX,
              y: handDragStartOffsetRef.current.y + deltaY,
              z: handDragStartOffsetRef.current.z + deltaZ
            };
          }
        }
      } else {
        // Pinch RELEASE
        if (wasSinglePinchingRef.current && handDragCompIdRef.current) {
          const compId = handDragCompIdRef.current;
          const finalOffset = { ...activeDragOffsetRef.current };
          // Commit final offset silently to store once on release
          useSimulationStore.getState().setComponentOffset(compId, finalOffset);
          useSimulationStore.getState().setGizmoDragging(false);
          // When hand gesture dot is removed / released, immediately stop moving and clear selection so it doesn't stay sticky
          useSimulationStore.getState().selectComponent(null, true);

          handDragCompIdRef.current = null;
          dragCompIdRef.current = null;
          isDirectDraggingRef.current = false;
        }
        wasSinglePinchingRef.current = false;
      }
    });

    return () => {
      unsub();
      if (handDragCompIdRef.current) {
        useSimulationStore.getState().setGizmoDragging(false);
        useSimulationStore.getState().selectComponent(null, true);
        handDragCompIdRef.current = null;
        dragCompIdRef.current = null;
        isDirectDraggingRef.current = false;
      }
      wasSinglePinchingRef.current = false;
    };
  }, [handTrackingActive, camera, clonedScene, componentMap, gl.domElement]);

  // Reference-site quality X-Ray Materials (matching rb19-simulator.vercel.app)
  const xrayMaterials = useMemo(() => {
    // 1. Transparent Shell: Physical glass/carbon transparent shell
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x9fb3cf,
      metalness: 0.1,
      roughness: 0.25,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // 2. Holographic Fresnel X-Ray Shader (from rb19-simulator bundle)
    const fresnelMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color(0x7fa8d8) },
        uPower: { value: 2.4 },
        uBase: { value: 0.04 }
      },
      vertexShader: `
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uPower;
        uniform float uBase;
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPower);
          gl_FragColor = vec4(uColor * (uBase + f * 0.85), uBase + f * 0.65);
        }
      `
    });

    // 3. Illuminated Internal Engineering Metal
    const internalMat = new THREE.MeshStandardMaterial({
      color: 0xc8d1de,
      metalness: 0.65,
      roughness: 0.42,
      emissive: 0x24374f,
      emissiveIntensity: 0.65
    });

    // 4. Highlighted Selected Component Material
    const highlightMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      metalness: 0.4,
      roughness: 0.3,
      emissive: 0x0284c7,
      emissiveIntensity: 0.95
    });

    // 5. Technical CAD Edge Line Material
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x9cc3ea,
      transparent: true,
      opacity: 0.55
    });

    return { shellMat, fresnelMat, internalMat, highlightMat, edgeMat };
  }, []);

  // Compute 70% scaled explode vectors for EVERY mesh (Requirement: 70% is now 100%)
  useEffect(() => {
    const { center, maxDim } = modelMetrics;
    let meshCounter = 0;

    // Explode distance scaled so previous 50% is now the 100% maximum (user requirement)
    const explodeDistance = maxDim * 0.425;

    clonedScene.traverse((obj) => {
      const isMesh = (obj as THREE.Mesh).isMesh;

      if (isMesh) {
        const mesh = obj as THREE.Mesh;
        meshCounter++;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (!originalTransforms.current.has(mesh.uuid)) {
          originalTransforms.current.set(mesh.uuid, {
            position: mesh.position.clone(),
            rotation: mesh.rotation.clone()
          });
        }

        if (!originalWorldPositions.current.has(mesh.uuid)) {
          mesh.updateWorldMatrix(true, false);
          const wPos = new THREE.Vector3();
          mesh.getWorldPosition(wPos);
          originalWorldPositions.current.set(mesh.uuid, wPos);
        }

        if (!originalMaterials.current.has(mesh.uuid)) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map(m => m.clone());
          } else if (mesh.material) {
            mesh.material = mesh.material.clone();
          }
          originalMaterials.current.set(mesh.uuid, mesh.material);

          // Deep-cache pristine original emissive color and intensity for authentic material preservation
          const cacheMatEmissive = (mat: any) => {
            if (mat && mat.emissive && !originalEmissiveMap.current.has(mat.uuid)) {
              originalEmissiveMap.current.set(mat.uuid, {
                color: mat.emissive.clone(),
                intensity: typeof mat.emissiveIntensity === 'number' ? mat.emissiveIntensity : 0
              });
            }
          };

          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(cacheMatEmissive);
          } else if (mesh.material) {
            cacheMatEmissive(mesh.material);
          }
        }

        // Generate edge geometry for technical engineering X-ray
        if (!edgeLinesMap.current.has(mesh.uuid)) {
          try {
            const edgeGeo = new THREE.EdgesGeometry(mesh.geometry, 30);
            const edgeLines = new THREE.LineSegments(edgeGeo, xrayMaterials.edgeMat);
            edgeLines.visible = false;
            edgeLines.raycast = () => {}; // Never intercept pointer clicks
            mesh.add(edgeLines);
            edgeLinesMap.current.set(mesh.uuid, edgeLines);
          } catch (e) {
            // EdgesGeometry may skip non-indexed or degenerate geometry
          }
        }

        const meshBox = new THREE.Box3().setFromObject(mesh);
        const meshCenter = new THREE.Vector3();
        meshBox.getCenter(meshCenter);

        let dir = new THREE.Vector3().subVectors(meshCenter, center);
        if (dir.length() < 0.05) {
          const angle = (meshCounter * 137.5 * Math.PI) / 180;
          dir.set(Math.cos(angle) * 0.7, 0.35 + (meshCounter % 3) * 0.25, Math.sin(angle) * 0.7);
        }
        dir.normalize();

        // Ensure vertical explode movement stays above the ground/land
        const liftComponent = Math.max(0.04, dir.y + 0.16);

        const explodeVec = new THREE.Vector3(
          dir.x * explodeDistance,
          liftComponent * explodeDistance,
          dir.z * explodeDistance
        );
        calculatedExplodeVectors.current.set(mesh.uuid, explodeVec);
      }
    });
  }, [clonedScene, modelMetrics, xrayMaterials]);

  // Keyboard shortcut: Delete or Backspace to remove selected part however the user wants
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeTag = (document.activeElement?.tagName || '').toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea') return;

        if (selectedComponentId) {
          e.preventDefault();
          removeComponent(selectedComponentId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, removeComponent]);

  // Apply X-Ray, Visibility, Removal, and Selection Shaders
  useEffect(() => {
    clonedScene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;

      const comp = componentMap.get(mesh.name) || componentMap.get(mesh.parent?.name || '');
      const compId = comp ? comp.id : mesh.name;

      const isHidden = hiddenComponentIds.includes(compId) || hiddenComponentIds.includes(mesh.name) || hiddenComponentIds.includes(mesh.uuid);
      const isDetached = detachedComponentIds.includes(compId) || detachedComponentIds.includes(mesh.name) || Boolean(componentOffsets[compId] || componentOffsets[mesh.name] || componentOffsets[mesh.uuid]);
      const isSelected = selectedComponentId === compId || selectedComponentId === mesh.name || selectedComponentId === mesh.uuid;
      const isHovered = hoveredComponentId === compId || hoveredComponentId === mesh.name || hoveredComponentId === mesh.uuid;

      // Handle Component Visibility
      if (isolatedComponentId) {
        mesh.visible = (compId === isolatedComponentId || mesh.name === isolatedComponentId || mesh.uuid === isolatedComponentId);
      } else if (isHidden) {
        // Part explicitly hidden by user
        mesh.visible = false;
        const edgeLine = edgeLinesMap.current.get(mesh.uuid);
        if (edgeLine) edgeLine.visible = false;
        return;
      } else {
        // Part remains visible in 3D space, even when detached/extracted
        mesh.visible = true;
      }

      const origMat = originalMaterials.current.get(mesh.uuid);
      const edgeLine = edgeLinesMap.current.get(mesh.uuid);

      // Handle X-Ray Modes matching rb19-simulator
      if (xrayMode === 'engineering') {
        if (isSelected) {
          mesh.material = xrayMaterials.highlightMat;
        } else {
          // Exterior surfaces receive Fresnel holographic shader, inner parts receive solid illuminated metal
          mesh.material = xrayMaterials.fresnelMat;
        }
        if (edgeLine) edgeLine.visible = true;
      } else if (xrayMode === 'shell') {
        if (isSelected) {
          mesh.material = xrayMaterials.highlightMat;
        } else {
          mesh.material = xrayMaterials.shellMat;
        }
        if (edgeLine) edgeLine.visible = false;
      } else {
        // Normal Solid Mode: Restore pristine original materials and 100% authentic vehicle colors
        if (origMat) {
          mesh.material = origMat;
        }

        // Always restore 100% original color and emissive properties.
        // Never change color or turn the object red when moved, detached, or inspected!
        const restorePristineMaterial = (mat: any) => {
          if (!mat || !mat.emissive) return;
          const origEm = originalEmissiveMap.current.get(mat.uuid);
          if (origEm) {
            mat.emissive.copy(origEm.color);
            mat.emissiveIntensity = origEm.intensity;
          } else {
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0.0;
          }
        };

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(restorePristineMaterial);
        } else {
          restorePristineMaterial(mesh.material);
        }

        // Technical CAD edge outline for selected component (non-destructive; does not alter vehicle paint/textures)
        if (edgeLine) {
          edgeLine.visible = isSelected;
        }
      }
    });
  }, [
    clonedScene,
    selectedComponentId,
    hoveredComponentId,
    removedComponentIds,
    hiddenComponentIds,
    isolatedComponentId,
    xrayMode,
    componentMap,
    xrayMaterials
  ]);

  // Frame update:
  // 1. Exploded View (scaled so current 70% is 100%)
  // 2. 3D Component Position Offsets (Feature 1: move items anywhere in 3D space)
  // 3. Physical Aerodynamic Movement
  useFrame(({ clock }) => {
    const factor = explodedPercent / 100;

    // 0. Explode Elevation Lift: lift model up into the air as it explodes so parts NEVER penetrate or clip the base/land!
    if (rootGroupRef.current) {
      const explodeLiftY = factor * (modelMetrics.size.y * 0.32);
      rootGroupRef.current.position.y = THREE.MathUtils.lerp(rootGroupRef.current.position.y, explodeLiftY, 0.14);
    }

    // 1. Exploded View & Component Spatial Relocation: smooth displacement
    clonedScene.traverse((obj) => {
      const isMesh = (obj as THREE.Mesh).isMesh;
      if (!isMesh) return;

      const mesh = obj as THREE.Mesh;
      const orig = originalTransforms.current.get(mesh.uuid);
      if (!orig) return;

      const comp = componentMap.get(mesh.name) || componentMap.get(mesh.parent?.name || '');
      const compId = comp ? comp.id : mesh.name;

      const isTarget = selectedComponentId === compId || selectedComponentId === mesh.name || selectedComponentId === mesh.uuid;
      const isDirectBeingDragged = isDirectDraggingRef.current && dragCompIdRef.current === compId;
      const isGizmoBeingDragged = isGizmoDragging && isTarget;

      // Extract user-defined 3D relocation offset (from active real-time drag or persistent store)
      let offsetX = 0;
      let offsetY = 0;
      let offsetZ = 0;

      if (isDirectBeingDragged || isGizmoBeingDragged) {
        offsetX = activeDragOffsetRef.current.x;
        offsetY = activeDragOffsetRef.current.y;
        offsetZ = activeDragOffsetRef.current.z;
      } else {
        const offset = componentOffsets[compId] || componentOffsets[mesh.name] || componentOffsets[mesh.uuid];
        if (offset) {
          offsetX = offset.x;
          offsetY = offset.y;
          offsetZ = offset.z;
        }
      }

      const explodeVec = calculatedExplodeVectors.current.get(mesh.uuid);
      const curExplodeX = (explodeVec && factor > 0) ? explodeVec.x * factor : 0;
      const curExplodeY = (explodeVec && factor > 0) ? explodeVec.y * factor : 0;
      const curExplodeZ = (explodeVec && factor > 0) ? explodeVec.z * factor : 0;

      // Calculate world target using initialWorldPos
      const origWorld = originalWorldPositions.current.get(mesh.uuid);
      if (origWorld && mesh.parent) {
        tempTargetWorldRef.current.set(
          origWorld.x + curExplodeX + offsetX,
          origWorld.y + curExplodeY + offsetY,
          origWorld.z + curExplodeZ + offsetZ
        );

        // Use mesh.parent.worldToLocal to perfectly map world target into local space
        const targetLocal = mesh.parent.worldToLocal(tempTargetWorldRef.current);

        if (isDirectBeingDragged) {
          // Direct free mouse drag: lock to cursor with 0 lag
          mesh.position.copy(targetLocal);
        } else if (isGizmoBeingDragged && mesh === selectedMesh) {
          // TransformControls controls selectedMesh directly
        } else {
          mesh.position.lerp(targetLocal, 0.24);
        }
      } else {
        const targetX = orig.position.x + curExplodeX + offsetX;
        const targetY = orig.position.y + curExplodeY + offsetY;
        const targetZ = orig.position.z + curExplodeZ + offsetZ;

        if (isDirectBeingDragged) {
          mesh.position.set(targetX, targetY, targetZ);
        } else if (isGizmoBeingDragged && mesh === selectedMesh) {
          // TransformControls controls selectedMesh directly
        } else {
          mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, targetX, 0.22);
          mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, 0.22);
          mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, targetZ, 0.22);
        }
      }
    });

    // 2. Physical Aerodynamics: vehicle physically compresses, tilts, and buffets
    if (aeroGroupRef.current) {
      if (airflowActive) {
        const t = clock.getElapsedTime();
        const speedRatio = Math.min(2.5, aerodynamics.airflowSpeedKmh / 240);

        const targetDownforceY = - (aerodynamics.downforceN / 45000) * 0.22;
        const microBuffetY = Math.sin(t * 22) * 0.007 * speedRatio;
        const targetY = targetDownforceY + microBuffetY;

        const targetDragZ = - (aerodynamics.dragN / 30000) * 0.12;
        const targetPitch = (aerodynamics.pitchDeg * Math.PI) / 180 + Math.sin(t * 14) * 0.005 * speedRatio;

        aeroGroupRef.current.position.y = THREE.MathUtils.lerp(aeroGroupRef.current.position.y, targetY, 0.09);
        aeroGroupRef.current.position.z = THREE.MathUtils.lerp(aeroGroupRef.current.position.z, targetDragZ, 0.09);
        aeroGroupRef.current.rotation.x = THREE.MathUtils.lerp(aeroGroupRef.current.rotation.x, targetPitch, 0.09);
      } else {
        aeroGroupRef.current.position.y = THREE.MathUtils.lerp(aeroGroupRef.current.position.y, 0, 0.12);
        aeroGroupRef.current.position.z = THREE.MathUtils.lerp(aeroGroupRef.current.position.z, 0, 0.12);
        aeroGroupRef.current.rotation.x = THREE.MathUtils.lerp(aeroGroupRef.current.rotation.x, 0, 0.12);
      }
    }
  });

  return (
    <group ref={rootGroupRef} name="ModelRendererRoot">
      <group ref={aeroGroupRef} name="AerodynamicChassisSuspensionGroup">
        <primitive
          object={clonedScene}
          onPointerDown={(e: any) => {
            e.stopPropagation();
            const mesh = e.object as THREE.Mesh;
            const comp = componentMap.get(mesh.name) || componentMap.get(mesh.parent?.name || '');
            const targetId = comp ? comp.id : mesh.name;

            // Select clicked part and open Full Details inspector
            selectComponent(targetId);
            setInspectionDetailMode('details');
            dragCompIdRef.current = targetId;

            // Direct Free Dragging: click & drag any part freely across 3D space
            if (isMoveModeActive) {
              pushHistorySnapshot();
              const hitPoint = e.point.clone();

              if (e.shiftKey) {
                // Ground plane lock (XZ plane at hit height)
                dragPlaneRef.current.setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 1, 0), hitPoint);
              } else {
                // Camera-facing screen plane through hit point
                const camDir = new THREE.Vector3();
                camera.getWorldDirection(camDir).negate();
                dragPlaneRef.current.setFromNormalAndCoplanarPoint(camDir, hitPoint);
              }

              dragStartIntersectionRef.current.copy(hitPoint);

              const existingOffset = componentOffsets[targetId] || { x: 0, y: 0, z: 0 };
              dragStartOffsetRef.current = { ...existingOffset };
              activeDragOffsetRef.current = { ...existingOffset };

              dragCompIdRef.current = targetId;
              isDirectDraggingRef.current = true;
              setGizmoDragging(true); // Pauses camera orbit while dragging
            }
          }}
          onPointerOver={(e: any) => {
            e.stopPropagation();
            const mesh = e.object as THREE.Mesh;
            const comp = componentMap.get(mesh.name) || componentMap.get(mesh.parent?.name || '');
            setHoveredComponent(comp ? comp.id : mesh.name);
          }}
          onPointerOut={() => {
            setHoveredComponent(null);
          }}
        />

        {/* 3D Translation Gizmo on selected part with comfortable, enlarged handles */}
        {selectedMesh && isMoveModeActive && (
          <TransformControls
            ref={transformControlsRef}
            object={selectedMesh}
            mode="translate"
            size={0.85}
            space="world"
          />
        )}
      </group>
    </group>
  );
};
