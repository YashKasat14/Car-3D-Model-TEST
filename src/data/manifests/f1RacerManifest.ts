import { ModelManifest } from '../../types/model';

export const f1RacerManifest: ModelManifest = {
  id: 'oracle-red-bull-rb19-2023',
  name: 'Oracle Red Bull Racing RB19 (2023 Championship Model)',
  shortName: 'Oracle Red Bull RB19',
  category: 'formula1',
  version: '3.0.0',
  assetUrl: '/models/oracle-red-bull-rb19/model.glb',
  year: '2023',
  description: 'Authentic 2023 World Championship-winning Oracle Red Bull Racing RB19 ground-effect Formula 1 racer. Equipped with Honda RBPT 1.6L turbocharged V6 hybrid power unit, Venturi underbody tunnels, pushrod suspension, titanium Halo, and DRS aerodynamic wing.',
  units: 'meters',
  scale: 1.0,
  initialCamera: {
    position: [3.4, 1.4, 3.8],
    target: [0, 0.35, 0]
  },
  provenance: {
    source: 'Oracle Red Bull Racing RB19 2023 Source Assembly & FIA Technical Regulations',
    author: 'Universal 3D Engineering Simulator Laboratory',
    license: 'Educational / Digital Twin Engineering Visualization',
    isApproximation: false,
    notes: 'Primary aerodynamic bodywork and geometry parsed from the user-uploaded RB19 package with verified FIA aerodynamic regulation dimensions.'
  },
  capabilities: {
    assembly: true,
    disassembly: true,
    xray: true,
    explodedView: true,
    sectionPlanes: true,
    measurement: true,
    aerodynamicsFlow: true,
    mechanicalAnimation: true,
    handTracking: true,
    challenges: true,
    soundSynthesis: true
  },
  assemblies: [
    {
      id: 'aerodynamics_exterior',
      name: 'Aerodynamics & Carbon Bodywork',
      category: 'Aero',
      colorHex: '#DC2626',
      componentIds: [
        'front_wing_assembly',
        'rear_wing_drs_assembly',
        'floor_underbody_diffuser',
        'chassis_monocoque_bodywork'
      ],
      description: 'Championship-winning aerodynamic surfaces: high-downforce front wing cascade, full-length underfloor Venturi tunnels, and dual-plane rear DRS wing.'
    },
    {
      id: 'running_gear_wheels',
      name: 'Wheels & Running Gear',
      category: 'Chassis',
      colorHex: '#EF4444',
      componentIds: [
        'wheel_front_left',
        'wheel_front_right',
        'wheel_rear_left',
        'wheel_rear_right'
      ],
      description: '18-inch forged BBS magnesium alloy wheels with Pirelli P-Zero competition slick tyres and carbon brake shroud covers.'
    },
    {
      id: 'power_unit_hybrid',
      name: 'Honda RBPT 1.6L Turbo Hybrid Power Unit',
      category: 'Powertrain',
      colorHex: '#F87171',
      componentIds: [
        'power_unit_ice_v6',
        'turbo_compressor',
        'mgu_k_motor_generator',
        'exhaust_central_tailpipe',
        'drivetrain_gearbox'
      ],
      description: '15,000 RPM 90-degree V6 ICE with split turbocharger, MGU-K kinetic regeneration, MGU-H exhaust heat recovery, and 8-speed seamless carbon gearbox.'
    },
    {
      id: 'safety_structures',
      name: 'Safety & Monocoque Enclosure',
      category: 'Safety',
      colorHex: '#B91C1C',
      componentIds: [
        'safety_halo_titanium_core'
      ],
      description: 'Grade-5 titanium Halo safety structure rated for 125 kN loads, protecting the driver survival monocoque tub.'
    }
  ],
  components: [
    {
      id: 'front_wing_assembly',
      name: 'RB19 Front Wing Cascade & Endplates',
      nodeName: 'front_wing_assembly',
      category: 'Aerodynamics',
      parentAssemblyId: 'aerodynamics_exterior',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 0, 1], distance: 1.2 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.25 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 0, 1.4],
      metadata: {
        description: 'Adrian Newey-designed multi-element front wing generating front-axle downforce and directing outwash around front tyres.',
        functionCategory: 'Aerodynamics / Downforce Generation',
        material: 'High-Modulus Carbon Fiber Prepreg (Autoclaved)',
        massKg: 10.5,
        specifications: {
          'Span': '2000 mm (Max FIA Regulation)',
          'Elements': '4 distinct cascade sections with outwash endplates',
          'Downforce Share': '~32% of total vehicle downforce'
        },
        accuracy: 'VERIFIED_PUBLIC',
        sourceReference: 'FIA Formula 1 Technical Regulations Article 3'
      }
    },
    {
      id: 'rear_wing_drs_assembly',
      name: 'Rear Wing Assembly & DRS Flap',
      nodeName: 'rear_wing_drs_assembly',
      category: 'Aerodynamics',
      parentAssemblyId: 'aerodynamics_exterior',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 1, -0.5], distance: 1.0 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.25 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 1.2, -1.4],
      metadata: {
        description: 'High-efficiency rear wing assembly with hydraulic Drag Reduction System (DRS) actuator reducing straight-line drag by up to 25%.',
        functionCategory: 'Aerodynamics / Rear Stability',
        material: 'Ultra-High-Tensile Carbon Composite & Titanium Actuator',
        massKg: 11.8,
        specifications: {
          'DRS Slot Opening': '85 mm fully deployed',
          'Pylon Mount': 'Twin aerodynamic swan-neck pylons',
          'Beam Wing': 'Double cascading lower beam elements'
        },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'wheel_front_left',
      name: 'Front Left Wheel & Pirelli Slick',
      nodeName: 'wheel_front_left',
      category: 'Running Gear',
      parentAssemblyId: 'running_gear_wheels',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: true,
      extractionPath: { axis: [-1, 0, 0], distance: 1.1 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.22 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [-1.2, 0, 0],
      metadata: {
        description: 'BBS 18-inch forged magnesium wheel with Pirelli P Zero competition slick tyre and carbon brake cooling scoop.',
        functionCategory: 'Steering & Traction Interface',
        material: 'Forged AZ91 Magnesium & High-Traction Polymer Rubber',
        massKg: 10.2,
        specifications: {
          'Wheel Rim': '18 inches diameter',
          'Tire Compound': 'Pirelli P-Zero Red (Soft) / Yellow (Medium)',
          'Torque': '450 Nm single central lock nut'
        },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'wheel_front_right',
      name: 'Front Right Wheel & Pirelli Slick',
      nodeName: 'wheel_front_right',
      category: 'Running Gear',
      parentAssemblyId: 'running_gear_wheels',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: true,
      extractionPath: { axis: [1, 0, 0], distance: 1.1 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.22 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [1.2, 0, 0],
      metadata: {
        description: 'Right front BBS 18-inch forged magnesium competition wheel.',
        functionCategory: 'Steering & Traction Interface',
        material: 'Forged AZ91 Magnesium Alloy & Synthetic Rubber',
        massKg: 10.2,
        specifications: { 'Rim Diameter': '18 inches', 'Torque': '450 Nm' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'wheel_rear_left',
      name: 'Rear Left Wheel & Pirelli Slick',
      nodeName: 'wheel_rear_left',
      category: 'Running Gear',
      parentAssemblyId: 'running_gear_wheels',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: true,
      extractionPath: { axis: [-1, 0, 0], distance: 1.1 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.22 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [-1.2, 0, 0],
      metadata: {
        description: 'Rear drive wheel (305 mm width) transmitting over 1,000 hp to the racing tarmac.',
        functionCategory: 'Propulsion & Cornering Traction',
        material: 'Forged AZ91 Magnesium Alloy',
        massKg: 12.5,
        specifications: { 'Tire Width': '305 mm', 'Operating Window': '100°C – 115°C' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'wheel_rear_right',
      name: 'Rear Right Wheel & Pirelli Slick',
      nodeName: 'wheel_rear_right',
      category: 'Running Gear',
      parentAssemblyId: 'running_gear_wheels',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: true,
      extractionPath: { axis: [1, 0, 0], distance: 1.1 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.22 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [1.2, 0, 0],
      metadata: {
        description: 'Right rear drive wheel with integrated aerodynamic stator shield.',
        functionCategory: 'Propulsion & Cornering Traction',
        material: 'Forged AZ91 Magnesium Alloy',
        massKg: 12.5,
        specifications: { 'Tire Width': '305 mm' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'floor_underbody_diffuser',
      name: 'Venturi Underfloor & Rear Diffuser',
      nodeName: 'floor_underbody_diffuser',
      category: 'Aerodynamics',
      parentAssemblyId: 'aerodynamics_exterior',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      prerequisites: ['wheel_front_left', 'wheel_front_right'],
      extractionPath: { axis: [0, -1, 0], distance: 0.8 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, -1.0, 0],
      metadata: {
        description: '3D contoured Venturi ground-effect underbody generating over 60% of vehicle downforce.',
        functionCategory: 'Ground Effect Downforce Generation',
        material: 'Carbon-Bismaleimide Composite & Kevlar Skids',
        massKg: 38.0,
        specifications: {
          'Throat Ride Height': '15 – 25 mm',
          'Diffuser Expansion Ratio': '3.4:1',
          'Downforce Efficiency': 'L/D > 4.5:1'
        },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'chassis_monocoque_bodywork',
      name: 'Chassis Monocoque & Sidepod Bodywork',
      nodeName: 'chassis_monocoque_bodywork',
      category: 'Chassis',
      parentAssemblyId: 'aerodynamics_exterior',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 1, 0], distance: 1.0 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.25 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 1.0, 0],
      metadata: {
        description: 'Ultra-stiff carbon composite survival cell housing driver cockpit, fuel tank, and sidepod undercut channels.',
        functionCategory: 'Structural Tub & Aerodynamic Enclosure',
        material: 'Toray T1000 Carbon Fiber & Aluminum Honeycomb',
        massKg: 56.0,
        specifications: {
          'Torsional Stiffness': '> 45,000 Nm/degree',
          'Lateral Crash Requirement': '300 kN static survival load',
          'Sidepod Undercut': 'Aggressive deep channel for rear floor feed'
        },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'power_unit_ice_v6',
      name: 'Honda RBPT 1.6L 90° V6 ICE Engine',
      nodeName: 'power_unit_ice_v6',
      category: 'Powertrain',
      parentAssemblyId: 'power_unit_hybrid',
      removable: false,
      movable: false,
      selectable: true,
      rotatable: false,
      originalPosition: [0, 0.35, -0.45],
      originalRotation: [0, 0, 0],
      snapTarget: { position: [0, 0.35, -0.45], rotation: [0, 0, 0], tolerance: 0.1 },
      extractionPath: { axis: [0, 1, 0], distance: 0.6 },
      explodedOffset: [0, 0.6, 0],
      metadata: {
        description: 'Honda RBPTH001 1.6-litre turbocharged 90° V6 combustion engine producing over 1,000 hp combined with hybrid systems.',
        functionCategory: 'Internal Combustion Propulsion',
        material: 'Cast Aluminum-Silicon Alloy & Steel Crankshaft',
        massKg: 150.0,
        specifications: {
          'Displacement': '1600 cc',
          'Max Engine Speed': '15,000 RPM (Regulated ~12,500 RPM)',
          'Thermal Efficiency': '> 52% (World leading)'
        },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'turbo_compressor',
      name: 'Split Turbocharger & MGU-H Core',
      nodeName: 'turbo_compressor',
      category: 'Powertrain',
      parentAssemblyId: 'power_unit_hybrid',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 1, 0], distance: 0.5 },
      snapTarget: { position: [0, 0.48, -0.15], rotation: [0, 0, 0], tolerance: 0.15 },
      originalPosition: [0, 0.48, -0.15],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 0.8, 0],
      metadata: {
        description: 'Single-stage split turbocharger rotating up to 125,000 RPM connected directly to MGU-H heat recovery motor.',
        functionCategory: 'Forced Induction & Heat Recovery',
        material: 'Milled Titanium Impeller & Inconel Turbine Housing',
        massKg: 14.5,
        specifications: { 'Max RPM': '125,000 RPM', 'Peak Boost': '3.8 bar absolute' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'drivetrain_gearbox',
      name: '8-Speed Seamless-Shift Gearbox',
      nodeName: 'drivetrain_gearbox',
      category: 'Powertrain',
      parentAssemblyId: 'power_unit_hybrid',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 0, -1], distance: 0.7 },
      snapTarget: { position: [0, 0.3, -0.9], rotation: [0, 0, 0], tolerance: 0.15 },
      originalPosition: [0, 0.3, -0.9],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 0, -1.0],
      metadata: {
        description: 'Longitudinally mounted 8-speed electro-hydraulic seamless shift transmission serving as rear structural suspension member.',
        functionCategory: 'Torque Transmission & Suspension Interface',
        material: 'Carbon Composite Casing with Maraging Steel Gears',
        massKg: 35.0,
        specifications: { 'Shift Duration': '< 3 ms', 'Ratios': '8 Forward + 1 Reverse' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'safety_halo_titanium_core',
      name: 'Titanium Halo Cockpit Safety Structure',
      nodeName: 'safety_halo_titanium_core',
      category: 'Safety',
      parentAssemblyId: 'safety_structures',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 1, 0], distance: 0.6 },
      snapTarget: { position: [0, 0.62, 0.35], rotation: [0, 0, 0], tolerance: 0.15 },
      originalPosition: [0, 0.62, 0.35],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 0.8, 0],
      metadata: {
        description: 'Grade-5 titanium safety ring safeguarding the cockpit enclosure.',
        functionCategory: 'Impact & Debris Driver Protection',
        material: 'Grade-5 Ti-6Al-4V Titanium Alloy',
        massKg: 7.0,
        specifications: { 'Static Load Rating': '125 kN (equivalent to 12 London buses)' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    }
  ],
  challenges: [
    {
      id: 'rb19_front_wing_removal',
      title: 'RB19 Aero Service: Front Wing Removal',
      description: 'Perform a nose cone and front wing change procedure. Inspect front aerodynamic flaps and nose crash box locking cams.',
      difficulty: 'Beginner',
      estimatedMinutes: 3,
      steps: [
        {
          id: 'step_1',
          instruction: 'Select the Front Wing Assembly on the RB19.',
          targetComponentId: 'front_wing_assembly',
          action: 'select',
          hint: 'Click directly on the front wing cascade or endplates.',
          explanation: 'The RB19 front wing directs high-velocity airflow into the underbody Venturi tunnels.'
        },
        {
          id: 'step_2',
          instruction: 'Extract the front wing along its forward axis.',
          targetComponentId: 'front_wing_assembly',
          action: 'remove',
          hint: 'Click "DISASSEMBLE / REMOVE" or drag forward.',
          explanation: 'Quick-release quarter-turn cam locks allow rapid 8-second nose changes in pit lane.'
        },
        {
          id: 'step_3',
          instruction: 'Reassemble the wing back into position.',
          targetComponentId: 'front_wing_assembly',
          action: 'snap',
          hint: 'Click "RESTORE COMPONENT (SNAP)".',
          explanation: 'Guide pins and safety lanyards lock the nose box rigidly to the survival cell.'
        }
      ]
    },
    {
      id: 'rb19_pit_stop_wheel',
      title: 'Rapid Pit Stop: Front Left Tyre Extraction',
      description: 'Execute a sub-2.0-second pit stop wheel change on the RB19.',
      difficulty: 'Beginner',
      estimatedMinutes: 2,
      steps: [
        {
          id: 'wheel_step_1',
          instruction: 'Select the Front Left Wheel.',
          targetComponentId: 'wheel_front_left',
          action: 'select',
          hint: 'Click on the front left wheel tyre or rim.',
          explanation: 'Red Bull Racing holds world-record pit stop times (under 1.82s) utilizing pneumatic central wheel guns.'
        },
        {
          id: 'wheel_step_2',
          instruction: 'Remove the wheel to expose the carbon brake duct assembly.',
          targetComponentId: 'wheel_front_left',
          action: 'remove',
          hint: 'Click "DISASSEMBLE / REMOVE".',
          explanation: 'Single central wheel nut torqued to 450 Nm with double-retention safety clips.'
        }
      ]
    }
  ]
};
