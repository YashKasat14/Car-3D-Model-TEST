import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Polyfill minimal browser requirements for GLTFExporter in Node if needed
if (typeof FileReader === 'undefined') {
  global.FileReader = class {
    constructor() {
      this.onloadend = null;
      this.onload = null;
      this.result = null;
    }
    async readAsArrayBuffer(blob) {
      if (blob.arrayBuffer) {
        this.result = await blob.arrayBuffer();
      } else if (Buffer.isBuffer(blob)) {
        this.result = blob.buffer;
      } else {
        this.result = blob;
      }
      setTimeout(() => {
        if (this.onload) this.onload({ target: { result: this.result } });
        if (this.onloadend) this.onloadend();
      }, 0);
    }
  };
}

const rootGroup = new THREE.Group();
rootGroup.name = 'aircraft_assembly';

// Materials (Warm engineering palette with realistic PBR properties)
const whiteAirframeMat = new THREE.MeshStandardMaterial({
  color: 0xF3EFE6, // Luxury warm cream-white
  roughness: 0.25,
  metalness: 0.15,
  name: 'mat_airframe_white'
});

const bronzeAccentMat = new THREE.MeshStandardMaterial({
  color: 0xB86A2D, // Warm bronze accent
  roughness: 0.35,
  metalness: 0.75,
  name: 'mat_bronze_accent'
});

const darkMetalMat = new THREE.MeshStandardMaterial({
  color: 0x2A2421, // Deep espresso metallic
  roughness: 0.45,
  metalness: 0.85,
  name: 'mat_dark_titanium'
});

const chromeMat = new THREE.MeshStandardMaterial({
  color: 0xE8DFD5,
  roughness: 0.1,
  metalness: 0.95,
  name: 'mat_chrome'
});

const glassMat = new THREE.MeshStandardMaterial({
  color: 0x6E8594,
  roughness: 0.1,
  metalness: 0.1,
  transparent: true,
  opacity: 0.55,
  name: 'mat_cockpit_glass'
});

const rubberMat = new THREE.MeshStandardMaterial({
  color: 0x1E1A17,
  roughness: 0.85,
  metalness: 0.05,
  name: 'mat_tire_rubber'
});

const internalGoldMat = new THREE.MeshStandardMaterial({
  color: 0xD4A054, // Internal avionics & hydraulic lines
  roughness: 0.3,
  metalness: 0.8,
  name: 'mat_avionics_gold'
});

// 1. Fuselage Main (Tube)
const fuselageGeo = new THREE.CylinderGeometry(1.0, 0.95, 12.0, 32);
fuselageGeo.rotateZ(Math.PI / 2);
const fuselageMesh = new THREE.Mesh(fuselageGeo, whiteAirframeMat);
fuselageMesh.name = 'fuselage_main';
fuselageMesh.position.set(0, 1.2, 0);
rootGroup.add(fuselageMesh);

// 2. Fuselage Nose
const noseGeo = new THREE.ConeGeometry(0.95, 3.2, 32);
noseGeo.rotateZ(-Math.PI / 2);
const noseMesh = new THREE.Mesh(noseGeo, whiteAirframeMat);
noseMesh.name = 'fuselage_nose';
noseMesh.position.set(7.6, 1.2, 0);
rootGroup.add(noseMesh);

// 3. Cockpit Canopy / Windshield
const cockpitGeo = new THREE.CylinderGeometry(0.85, 0.95, 2.0, 16, 1, false, 0, Math.PI);
cockpitGeo.rotateZ(-Math.PI / 2);
cockpitGeo.rotateX(-Math.PI / 2);
const cockpitMesh = new THREE.Mesh(cockpitGeo, glassMat);
cockpitMesh.name = 'cockpit_canopy';
cockpitMesh.position.set(6.2, 1.7, 0);
rootGroup.add(cockpitMesh);

// 4. Main Wings (Left and Right)
function createWing(isLeft) {
  const wingGroup = new THREE.Group();
  wingGroup.name = isLeft ? 'wing_assembly_left' : 'wing_assembly_right';
  const sign = isLeft ? 1 : -1;

  // Main airfoil slab
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(2.4, 0);
  wingShape.lineTo(1.6, 8.5);
  wingShape.lineTo(0.6, 8.5);
  wingShape.closePath();

  const extrudeSettings = { depth: 0.22, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  wingGeo.rotateX(-Math.PI / 2);
  wingGeo.rotateY(sign * 0.08); // Slight dihedral angle

  const wingMesh = new THREE.Mesh(wingGeo, whiteAirframeMat);
  wingMesh.name = isLeft ? 'wing_left' : 'wing_right';
  wingMesh.position.set(-1.0, 1.0, sign * 0.9);
  if (!isLeft) {
    wingMesh.scale.set(1, 1, -1);
  }
  wingGroup.add(wingMesh);

  // Winglet
  const wingletGeo = new THREE.BoxGeometry(0.8, 1.2, 0.08);
  const winglet = new THREE.Mesh(wingletGeo, bronzeAccentMat);
  winglet.name = isLeft ? 'winglet_left' : 'winglet_right';
  winglet.position.set(0.1, 1.7, sign * 9.5);
  winglet.rotation.set(0, 0, sign * 0.3);
  wingGroup.add(winglet);

  // Aileron (movable)
  const aileronGeo = new THREE.BoxGeometry(0.45, 0.12, 2.6);
  const aileron = new THREE.Mesh(aileronGeo, bronzeAccentMat);
  aileron.name = isLeft ? 'aileron_left' : 'aileron_right';
  aileron.position.set(-1.2, 1.1, sign * 7.2);
  wingGroup.add(aileron);

  // Flap (movable)
  const flapGeo = new THREE.BoxGeometry(0.65, 0.15, 3.4);
  const flap = new THREE.Mesh(flapGeo, darkMetalMat);
  flap.name = isLeft ? 'flap_left' : 'flap_right';
  flap.position.set(-1.3, 1.05, sign * 3.8);
  wingGroup.add(flap);

  return wingGroup;
}

rootGroup.add(createWing(true));
rootGroup.add(createWing(false));

// 5. Tail Empennage
// Vertical Fin & Rudder
const vFinGeo = new THREE.BoxGeometry(2.8, 3.4, 0.22);
const vFinMesh = new THREE.Mesh(vFinGeo, whiteAirframeMat);
vFinMesh.name = 'vertical_stabilizer';
vFinMesh.position.set(-5.6, 3.2, 0);
vFinMesh.rotation.z = -0.3;
rootGroup.add(vFinMesh);

const rudderGeo = new THREE.BoxGeometry(0.7, 3.1, 0.18);
const rudderMesh = new THREE.Mesh(rudderGeo, bronzeAccentMat);
rudderMesh.name = 'rudder';
rudderMesh.position.set(-6.8, 3.1, 0);
rudderMesh.rotation.z = -0.3;
rootGroup.add(rudderMesh);

// Horizontal Stabilizers (Left & Right)
function createHorizontalTail(isLeft) {
  const sign = isLeft ? 1 : -1;
  const tailGroup = new THREE.Group();
  tailGroup.name = isLeft ? 'horizontal_stabilizer_left' : 'horizontal_stabilizer_right';

  const stabGeo = new THREE.BoxGeometry(1.6, 0.14, 2.8);
  const stabMesh = new THREE.Mesh(stabGeo, whiteAirframeMat);
  stabMesh.position.set(-6.2, 1.8, sign * 1.6);
  tailGroup.add(stabMesh);

  const elevGeo = new THREE.BoxGeometry(0.48, 0.1, 2.7);
  const elevMesh = new THREE.Mesh(elevGeo, bronzeAccentMat);
  elevMesh.name = isLeft ? 'elevator_left' : 'elevator_right';
  elevMesh.position.set(-7.1, 1.8, sign * 1.6);
  tailGroup.add(elevMesh);

  return tailGroup;
}
rootGroup.add(createHorizontalTail(true));
rootGroup.add(createHorizontalTail(false));

// 6. Turbofan Engines (Left & Right)
function createTurbofan(isLeft) {
  const sign = isLeft ? 1 : -1;
  const engineGroup = new THREE.Group();
  engineGroup.name = isLeft ? 'engine_assembly_left' : 'engine_assembly_right';
  engineGroup.position.set(0.6, 0.1, sign * 3.4);

  // Pylon
  const pylonGeo = new THREE.BoxGeometry(1.8, 0.8, 0.2);
  const pylonMesh = new THREE.Mesh(pylonGeo, darkMetalMat);
  pylonMesh.position.set(0, 0.6, 0);
  engineGroup.add(pylonMesh);

  // Nacelle Outer Casing
  const nacelleGeo = new THREE.CylinderGeometry(0.75, 0.7, 3.2, 28, 1, true);
  nacelleGeo.rotateZ(Math.PI / 2);
  const nacelleMesh = new THREE.Mesh(nacelleGeo, whiteAirframeMat);
  nacelleMesh.name = isLeft ? 'engine_left_nacelle' : 'engine_right_nacelle';
  nacelleMesh.position.set(0, 0, 0);
  engineGroup.add(nacelleMesh);

  // Fan Spinner & Blades
  const fanGroup = new THREE.Group();
  fanGroup.name = isLeft ? 'engine_left_fan' : 'engine_right_fan';
  fanGroup.position.set(1.2, 0, 0);

  const spinnerGeo = new THREE.ConeGeometry(0.24, 0.6, 16);
  spinnerGeo.rotateZ(-Math.PI / 2);
  const spinnerMesh = new THREE.Mesh(spinnerGeo, bronzeAccentMat);
  fanGroup.add(spinnerMesh);

  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const bladeGeo = new THREE.BoxGeometry(0.08, 0.5, 0.08);
    const bladeMesh = new THREE.Mesh(bladeGeo, darkMetalMat);
    bladeMesh.position.set(0, Math.sin(angle) * 0.42, Math.cos(angle) * 0.42);
    bladeMesh.rotation.x = angle;
    bladeMesh.rotation.y = 0.35;
    fanGroup.add(bladeMesh);
  }
  engineGroup.add(fanGroup);

  // Internal Core (Exposed during X-ray/inspection)
  const coreGeo = new THREE.CylinderGeometry(0.38, 0.32, 2.4, 20);
  coreGeo.rotateZ(Math.PI / 2);
  const coreMesh = new THREE.Mesh(coreGeo, darkMetalMat);
  coreMesh.name = isLeft ? 'engine_left_core' : 'engine_right_core';
  coreMesh.position.set(-0.2, 0, 0);
  engineGroup.add(coreMesh);

  // Exhaust nozzle
  const exhaustGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.6, 24);
  exhaustGeo.rotateZ(Math.PI / 2);
  const exhaustMesh = new THREE.Mesh(exhaustGeo, bronzeAccentMat);
  exhaustMesh.position.set(-1.7, 0, 0);
  engineGroup.add(exhaustMesh);

  return engineGroup;
}
rootGroup.add(createTurbofan(true));
rootGroup.add(createTurbofan(false));

// 7. Landing Gear
// Front Nose Gear
const noseGearGroup = new THREE.Group();
noseGearGroup.name = 'landing_gear_nose';
noseGearGroup.position.set(6.0, 0.5, 0);

const noseStrutGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 16);
const noseStrut = new THREE.Mesh(noseStrutGeo, chromeMat);
noseStrut.name = 'landing_gear_front_strut';
noseStrut.position.set(0, -0.4, 0);
noseGearGroup.add(noseStrut);

const wheelGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.16, 20);
wheelGeo.rotateX(Math.PI / 2);
const noseWheelL = new THREE.Mesh(wheelGeo, rubberMat);
noseWheelL.name = 'nose_wheel_left';
noseWheelL.position.set(0, -1.0, 0.14);
noseGearGroup.add(noseWheelL);

const noseWheelR = new THREE.Mesh(wheelGeo, rubberMat);
noseWheelR.name = 'nose_wheel_right';
noseWheelR.position.set(0, -1.0, -0.14);
noseGearGroup.add(noseWheelR);

rootGroup.add(noseGearGroup);

// Main Gear (Left & Right)
function createMainGear(isLeft) {
  const sign = isLeft ? 1 : -1;
  const gearGroup = new THREE.Group();
  gearGroup.name = isLeft ? 'landing_gear_main_left' : 'landing_gear_main_right';
  gearGroup.position.set(-0.5, 0.6, sign * 2.2);

  const mainStrutGeo = new THREE.CylinderGeometry(0.09, 0.08, 1.8, 16);
  const mainStrut = new THREE.Mesh(mainStrutGeo, darkMetalMat);
  mainStrut.position.set(0, -0.5, 0);
  gearGroup.add(mainStrut);

  const mainWheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.22, 24);
  mainWheelGeo.rotateX(Math.PI / 2);

  const wheelFront = new THREE.Mesh(mainWheelGeo, rubberMat);
  wheelFront.name = isLeft ? 'main_wheel_left_front' : 'main_wheel_right_front';
  wheelFront.position.set(0.35, -1.2, sign * 0.18);
  gearGroup.add(wheelFront);

  const wheelRear = new THREE.Mesh(mainWheelGeo, rubberMat);
  wheelRear.name = isLeft ? 'main_wheel_left_rear' : 'main_wheel_right_rear';
  wheelRear.position.set(-0.35, -1.2, sign * 0.18);
  gearGroup.add(wheelRear);

  return gearGroup;
}
rootGroup.add(createMainGear(true));
rootGroup.add(createMainGear(false));

// 8. Internal Systems (visible in X-Ray / Inspection)
const internalSystemsGroup = new THREE.Group();
internalSystemsGroup.name = 'internal_systems';

// Forward Avionics Rack
const avionicsGeo = new THREE.BoxGeometry(1.4, 0.9, 0.9);
const avionicsMesh = new THREE.Mesh(avionicsGeo, internalGoldMat);
avionicsMesh.name = 'avionics_bay';
avionicsMesh.position.set(4.5, 0.8, 0);
internalSystemsGroup.add(avionicsMesh);

// Center Wing Fuel Cell
const fuelTankGeo = new THREE.BoxGeometry(2.4, 0.6, 2.0);
const fuelTankMesh = new THREE.Mesh(fuelTankGeo, darkMetalMat);
fuelTankMesh.name = 'fuel_tank_center';
fuelTankMesh.position.set(-0.5, 0.9, 0);
internalSystemsGroup.add(fuelTankMesh);

// Hydraulic Distribution Lines
const linesGeo = new THREE.CylinderGeometry(0.04, 0.04, 8.5, 8);
linesGeo.rotateZ(Math.PI / 2);
const hydLines = new THREE.Mesh(linesGeo, bronzeAccentMat);
hydLines.name = 'hydraulic_lines_trunk';
hydLines.position.set(-1.0, 0.5, 0.4);
internalSystemsGroup.add(hydLines);

rootGroup.add(internalSystemsGroup);

// Export to GLB
const exporter = new GLTFExporter();
exporter.parse(
  rootGroup,
  function (glbArrayBuffer) {
    const outputPath = path.join(process.cwd(), 'public/models/airplane/model.glb');
    fs.writeFileSync(outputPath, Buffer.from(glbArrayBuffer));
    console.log('Successfully generated Airplane GLB model at:', outputPath, '(' + fs.statSync(outputPath).size + ' bytes)');
  },
  function (error) {
    console.error('An error occurred during GLTF export:', error);
  },
  { binary: true }
);
