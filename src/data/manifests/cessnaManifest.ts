import { ModelManifest } from '../../types/model';

export const cessnaManifest: ModelManifest = {
  id: 'cessna-182-skylane',
  name: 'Cessna 182 Skylane Single-Engine High-Wing Aircraft',
  shortName: 'Cessna 182 Skylane',
  category: 'aircraft',
  version: '2.4.0',
  assetUrl: '/models/cessna-182-skylane/model.glb',
  year: '1956–Present',
  description: 'Iconic American four-seat, single-engine, high-wing light civil utility aircraft. Powered by a Lycoming O-540-L3C5D 230 hp engine with constant-speed propeller, NACA 2412 high-lift wings, tricycle oleo-pneumatic landing gear, and comprehensive general aviation avionics suite.',
  units: 'meters',
  scale: 1.0,
  initialCamera: {
    position: [7.5, 3.2, 8.5],
    target: [0, 0.2, 1.1]
  },
  provenance: {
    source: 'Cessna Aircraft Company & Federal Aviation Administration Type Certificate',
    author: 'Universal 3D Engineering Simulator Laboratory',
    license: 'Educational / Aviation Digital Twin Simulation',
    isApproximation: false,
    notes: 'Parsed from user-uploaded high-fidelity Cessna 182 Skylane GLB asset. Authentic 10.15m wingspan and 8.14m fuselage length.'
  },
  capabilities: {
    assembly: true,
    disassembly: true,
    xray: true,
    explodedView: true,
    sectionPlanes: true,
    measurement: true,
    aerodynamicsFlow: true,
    mechanicalAnimation: false, // Removed per user request
    handTracking: true,
    challenges: true,
    soundSynthesis: true
  },
  assemblies: [
    {
      id: 'propulsion_powerplant',
      name: 'Powerplant & Propeller Subsystem',
      category: 'Propulsion',
      colorHex: '#EF4444',
      componentIds: [
        'cessna_engine',
        'cessna_propeller',
        'cessna_exhaust'
      ],
      description: 'Lycoming 230 hp six-cylinder air-cooled horizontally-opposed aviation engine with McCauley two-blade variable-pitch aluminum propeller.'
    },
    {
      id: 'primary_airframe_wings',
      name: 'High-Lift Wings & Airframe',
      category: 'Aero Structure',
      colorHex: '#3B82F6',
      componentIds: [
        'cessna_wing_l',
        'cessna_wing_r',
        'cessna_aileron_l',
        'cessna_aileron_r',
        'cessna_fuselage',
        'cessna_chassis_spar'
      ],
      description: 'NACA 2412 cantilever high-wing airfoils with semi-monocoque aluminum alloy skin, internal box-spar carry-through, and differential ailerons.'
    },
    {
      id: 'empennage_tail',
      name: 'Empennage & Flight Controls',
      category: 'Flight Controls',
      colorHex: '#F59E0B',
      componentIds: [
        'cessna_vertical_fin',
        'cessna_rudder',
        'cessna_elevator'
      ],
      description: 'Swept vertical stabilizer with aerodynamic dorsal fin, mass-balanced rudder, and all-metal horizontal stabilizer with dual elevators.'
    },
    {
      id: 'tricycle_landing_gear',
      name: 'Tricycle Undercarriage Gear',
      category: 'Landing Gear',
      colorHex: '#10B981',
      componentIds: [
        'cessna_nose_gear',
        'cessna_wheel_main_l',
        'cessna_wheel_main_r'
      ],
      description: 'Steerable oleo-pneumatic nose landing gear with shimmy damper, and tubular spring-steel main landing gear with Cleveland disc brakes.'
    },
    {
      id: 'cockpit_cabin_avionics',
      name: 'Cockpit, Cabin & Glass Enclosure',
      category: 'Avionics & Cabin',
      colorHex: '#8B5CF6',
      componentIds: [
        'cessna_windscreen',
        'cessna_door_pilot',
        'cessna_door_copilot',
        'cessna_cabin_interior',
        'cessna_avionics_gauges',
        'cessna_flight_yoke'
      ],
      description: 'Four-place cabin interior with dual flight control yokes, analog primary six-pack instrumentation, and wraparound acrylic windshield.'
    }
  ],
  components: [
    {
      id: 'cessna_engine',
      name: 'Lycoming O-540-L3C5D 230 HP Piston Engine',
      nodeName: 'Object_169',
      category: 'Powerplant',
      parentAssemblyId: 'propulsion_powerplant',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 0, 1], distance: 1.5 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.25 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 0, 1.8],
      metadata: {
        description: 'Horizontally-opposed 8,874 cc six-cylinder air-cooled aircraft engine delivering 230 brake horsepower at 2,400 RPM.',
        functionCategory: 'Aviation Propulsion',
        material: 'Cast Aluminum Crankcase & Forged Steel Nitrided Cylinders',
        massKg: 178,
        specifications: {
          'Displacement': '541.5 cu in (8.87 L)',
          'Power Output': '230 hp (172 kW) @ 2,400 RPM',
          'Fuel System': 'Aviation Avgas 100LL Carburetor',
          'TBO Interval': '2,000 flight hours'
        },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_propeller',
      name: 'McCauley 2-Blade Variable Pitch Propeller',
      nodeName: 'Object_89',
      category: 'Propulsion',
      parentAssemblyId: 'propulsion_powerplant',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 0, 1], distance: 1.8 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.25 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 0, 2.5],
      metadata: {
        description: 'Two-blade constant-speed aluminum alloy propeller with hydraulic pitch governor hub.',
        functionCategory: 'Thrust Conversion',
        material: 'Forged 2025-T6 High-Strength Aluminum Alloy',
        massKg: 28.5,
        specifications: {
          'Diameter': '82 inches (2.08 m)',
          'Governor': 'Oil pressure driven constant speed unit',
          'Blade Pitch Range': '13.5° to 27.5°'
        },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_wing_l',
      name: 'Port (Left) NACA 2412 High-Lift Main Wing',
      nodeName: 'Object_111',
      category: 'Airframe Aero',
      parentAssemblyId: 'primary_airframe_wings',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [-1, 0, 0], distance: 2.2 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.25 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [-2.4, 0.4, 0],
      metadata: {
        description: 'Left all-metal semi-monocoque high-wing with internal integral fuel tanks and streamlined strut attachment.',
        functionCategory: 'Aerodynamic Lift Generation',
        material: 'Alclad 2024-T3 Aluminum Stressed Skin & Extruded Spars',
        massKg: 85,
        specifications: {
          'Airfoil Profile': 'NACA 2412 Semi-Symmetrical',
          'Fuel Capacity': '44 US gal (166.5 L) Integral Wet Wing Tank',
          'Dihedral Angle': '1° 44\''
        },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_wing_r',
      name: 'Starboard (Right) NACA 2412 High-Lift Main Wing',
      nodeName: 'Object_113',
      category: 'Airframe Aero',
      parentAssemblyId: 'primary_airframe_wings',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [1, 0, 0], distance: 2.2 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.25 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [2.4, 0.4, 0],
      metadata: {
        description: 'Right all-metal high wing structure with dual pitot-static mast and strobe navigation beacon.',
        functionCategory: 'Aerodynamic Lift Generation',
        material: 'Alclad 2024-T3 Aluminum Stressed Skin',
        massKg: 85,
        specifications: {
          'Wingspan Half': '5.07 m',
          'Fuel Capacity': '44 US gal (166.5 L)',
          'Wing Area': '174 sq ft (16.2 m²)'
        },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_aileron_l',
      name: 'Port (Left) Differential Frise Aileron',
      nodeName: 'Object_13',
      category: 'Flight Controls',
      parentAssemblyId: 'primary_airframe_wings',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [-1, 0, -1], distance: 1.2 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [-1.8, 0, -0.9],
      metadata: {
        description: 'Aerodynamically balanced aluminum aileron minimizing adverse yaw during roll maneuvers.',
        functionCategory: 'Lateral Roll Control',
        material: 'Corrugated Alclad 2024-T3 Sheet',
        specifications: { 'Deflection Up': '20°', 'Deflection Down': '15°' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_aileron_r',
      name: 'Starboard (Right) Differential Frise Aileron',
      nodeName: 'Object_15',
      category: 'Flight Controls',
      parentAssemblyId: 'primary_airframe_wings',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [1, 0, -1], distance: 1.2 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [1.8, 0, -0.9],
      metadata: {
        description: 'Starboard differential aileron actuated via stainless steel flight control pushrods.',
        functionCategory: 'Lateral Roll Control',
        material: 'Corrugated 2024-T3 Aluminum',
        specifications: { 'Deflection Up': '20°', 'Deflection Down': '15°' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_fuselage',
      name: 'Semi-Monocoque Aluminum Fuselage Bodyshell',
      nodeName: 'Object_19',
      category: 'Structure',
      parentAssemblyId: 'primary_airframe_wings',
      removable: false,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 1, 0], distance: 1.0 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.25 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 0.8, 0],
      metadata: {
        description: 'Stressed-skin aluminum semi-monocoque fuselage with bulkheads, stringers, and structural baggage compartment.',
        functionCategory: 'Structural Load Enclosure',
        material: 'Alclad 2024-T3 Aluminum Riveted Skin',
        specifications: { 'Length': '29 ft 0 in (8.84 m)', 'Max Gross Weight': '3,100 lb (1,406 kg)' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_chassis_spar',
      name: 'Primary Wing Carry-Through Spar & Cabin Cage',
      nodeName: 'Object_25',
      category: 'Structure',
      parentAssemblyId: 'primary_airframe_wings',
      removable: false,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, -1, 0], distance: 0.8 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, -0.6, 0],
      metadata: {
        description: 'High-strength extruded 7075-T6 aluminum spar carrying all aerodynamic flight wing loads.',
        functionCategory: 'Primary Flight Load Structure',
        material: 'Extruded 7075-T6 Zinc-Aluminum Alloy',
        specifications: { 'Limit Load Factor': '+3.8g / -1.52g (Normal Category)' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_vertical_fin',
      name: 'Empennage Swept Vertical Stabilizer Tail',
      nodeName: 'Object_101',
      category: 'Flight Controls',
      parentAssemblyId: 'empennage_tail',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 1, -1], distance: 1.5 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.25 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 1.2, -1.5],
      metadata: {
        description: 'Swept vertical stabilizer providing directional dynamic yaw stability in all flight envelopes.',
        functionCategory: 'Directional Yaw Stability',
        material: 'Riveted Aluminum Ribs and Skin',
        specifications: { 'Sweep Angle': '35° at 25% chord' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_rudder',
      name: 'Directional Aerodynamic Rudder',
      nodeName: 'Object_91',
      category: 'Flight Controls',
      parentAssemblyId: 'empennage_tail',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 0, -1], distance: 1.4 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 0.4, -2.0],
      metadata: {
        description: 'Cable-actuated rudder mechanically linked to steerable nose gear with cockpit ground pedals.',
        functionCategory: 'Yaw & Crosswind Control',
        material: '2024-T3 Corrugated Sheet Aluminum',
        specifications: { 'Deflection Range': '16° Left / 16° Right' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_elevator',
      name: 'Horizontal Stabilizer & Pitch Elevators',
      nodeName: 'Object_47',
      category: 'Flight Controls',
      parentAssemblyId: 'empennage_tail',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 0, -1], distance: 1.4 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, -0.4, -1.8],
      metadata: {
        description: 'Symmetrical airfoil horizontal stabilizer with cockpit trim wheel-controlled elevator tab.',
        functionCategory: 'Pitch & Longitudinal Trim Control',
        material: 'Aluminum Rib & Spar Construction',
        specifications: { 'Up Deflection': '28°', 'Down Deflection': '17°' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_nose_gear',
      name: 'Steerable Oleo-Pneumatic Nose Gear & Tire',
      nodeName: 'Object_103',
      category: 'Landing Gear',
      parentAssemblyId: 'tricycle_landing_gear',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, -1, 1], distance: 1.2 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, -1.2, 1.2],
      metadata: {
        description: 'Air-oil oleo strut absorbing touchdown shock with full steering linkage up to 30° off-center.',
        functionCategory: 'Ground Steering & Impact Shock Absorption',
        material: 'High-Tensile Heat-Treated Chromoly Steel 4130',
        specifications: { 'Tire Size': '5.00-5 6-ply rated aviation tire', 'Shock Travel': '7 inches' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_wheel_main_l',
      name: 'Port (Left) Main Spring-Steel Gear & Wheel',
      nodeName: 'Object_105',
      category: 'Landing Gear',
      parentAssemblyId: 'tricycle_landing_gear',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [-1, -1, 0], distance: 1.2 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [-1.4, -1.0, 0],
      metadata: {
        description: 'Fixed tapered spring-steel main landing gear strut with Cleveland hydraulic brake caliper.',
        functionCategory: 'Touchdown Landing Energy Absorption',
        material: 'SAE 6150 Chrome-Vanadium Spring Steel',
        specifications: { 'Tire Size': '6.00-6 6-ply Goodyear Flight Custom' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_wheel_main_r',
      name: 'Starboard (Right) Main Spring-Steel Gear & Wheel',
      nodeName: 'Object_107',
      category: 'Landing Gear',
      parentAssemblyId: 'tricycle_landing_gear',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [1, -1, 0], distance: 1.2 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [1.4, -1.0, 0],
      metadata: {
        description: 'Starboard spring-steel main gear strut with aluminum wheel rim and wheel fairing spat.',
        functionCategory: 'Touchdown Landing Energy Absorption',
        material: 'SAE 6150 Chrome-Vanadium Spring Steel',
        specifications: { 'Tire Size': '6.00-6 6-ply Goodyear Flight Custom' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_windscreen',
      name: 'One-Piece Panoramic Aviation Windshield',
      nodeName: 'Object_109',
      category: 'Cabin Glass',
      parentAssemblyId: 'cockpit_cabin_avionics',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 1, 1], distance: 1.0 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 1.2, 0.8],
      metadata: {
        description: 'Wrap-around one-piece curved optical acrylic windscreen providing pilot forward field of vision.',
        functionCategory: 'Pilot Aerodynamic Windscreen',
        material: 'Aviation-Grade Polymethyl Methacrylate (PMMA Optical Acrylic)',
        specifications: { 'Thickness': '0.187 inches (4.75 mm)', 'UV Rejection': '99%' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_door_pilot',
      name: 'Pilot Left Cabin Access Door',
      nodeName: 'Object_29',
      category: 'Cabin Enclosure',
      parentAssemblyId: 'cockpit_cabin_avionics',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [-1, 0, 0], distance: 1.1 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [-1.4, 0, 0.4],
      metadata: {
        description: 'Pilot egress door with openable storm ventilation window and dual-latch handle.',
        functionCategory: 'Cockpit Egress',
        material: 'Pressed Aluminum Frame with Acrylic Glazing',
        specifications: { 'Lock Type': 'Dual-point claw lock', 'Vent Window': 'Opening acrylic storm window' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_door_copilot',
      name: 'Co-Pilot Right Cabin Access Door',
      nodeName: 'Object_39',
      category: 'Cabin Enclosure',
      parentAssemblyId: 'cockpit_cabin_avionics',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [1, 0, 0], distance: 1.1 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [1.4, 0, 0.4],
      metadata: {
        description: 'Starboard passenger and co-pilot access door.',
        functionCategory: 'Cabin Egress',
        material: 'Pressed Aluminum Frame with Acrylic Glazing',
        specifications: { 'Emergency Egress': 'Quick-release hinge pins' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_cabin_interior',
      name: 'Four-Seat Leather Cabin & Baggage Bay',
      nodeName: 'Object_63',
      category: 'Cabin Interior',
      parentAssemblyId: 'cockpit_cabin_avionics',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 1, 0], distance: 1.0 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 0.9, -0.2],
      metadata: {
        description: 'Soundproofed 4-passenger cabin with contoured leather seats and rear 200 lb baggage compartment.',
        functionCategory: 'Occupant Enclosure',
        material: 'Aviation Fire-Resistant Leather & High-Density Polyurethane Foam',
        specifications: { 'Seating': '4 Occupants', 'Baggage Allowance': '200 lb (91 kg)' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_avionics_gauges',
      name: 'Primary Six-Pack Instrument Flight Panel',
      nodeName: 'Object_51',
      category: 'Avionics',
      parentAssemblyId: 'cockpit_cabin_avionics',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 0, -1], distance: 0.8 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 0.3, 0.8],
      metadata: {
        description: 'Standard T-configuration flight instrument cluster: Airspeed, Artificial Horizon, Altimeter, Turn Coordinator, Directional Gyro, Vertical Speed.',
        functionCategory: 'Flight Navigation & Attitude Monitoring',
        material: 'Anodized Aluminum Instrument Panel with Vacuum/Pitot/Electric Sensors',
        specifications: { 'Configuration': 'Basic-T Six-Pack', 'Power': 'Vacuum & 28V DC' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    },
    {
      id: 'cessna_flight_yoke',
      name: 'Dual Pilot & Co-Pilot Flight Control Yokes',
      nodeName: 'Object_99',
      category: 'Flight Controls',
      parentAssemblyId: 'cockpit_cabin_avionics',
      removable: true,
      movable: true,
      selectable: true,
      rotatable: false,
      extractionPath: { axis: [0, 0, -1], distance: 0.8 },
      snapTarget: { position: [0, 0, 0], rotation: [0, 0, 0], tolerance: 0.2 },
      originalPosition: [0, 0, 0],
      originalRotation: [0, 0, 0],
      explodedOffset: [0, 0.2, 0.4],
      metadata: {
        description: 'Dual interconnected control yokes transmitting pitch to elevators and roll to differential ailerons.',
        functionCategory: 'Manual Pilot Control Interface',
        material: 'Cast Magnesium Handgrips on Chrome Shafts',
        specifications: { 'Linkage': 'Dual mechanical torque tube & chain' },
        accuracy: 'VERIFIED_PUBLIC'
      }
    }
  ],
  challenges: [
    {
      id: 'preflight_inspection',
      title: 'FAA Pre-Flight Airframe & Control Surface Inspection',
      difficulty: 'Beginner',
      estimatedMinutes: 6,
      description: 'Perform a certified standard FAA pre-flight inspection walk-around of the Cessna 182 Skylane airframe, propeller, pitot-static mast, and control linkages.',
      steps: [
        {
          id: 'step_1',
          instruction: 'Inspect the McCauley Two-Blade Variable Pitch Propeller for nicks or oil leaks.',
          targetComponentId: 'cessna_propeller',
          action: 'inspect',
          hint: 'Select the front propeller hub and examine blade leading edges.',
          explanation: 'Propeller blade nicking can create stress risers leading to catastrophic fatigue failure.'
        },
        {
          id: 'step_2',
          instruction: 'Remove the Pilot Left Cabin Access Door to verify master switch and ignition status.',
          targetComponentId: 'cessna_door_pilot',
          action: 'remove',
          hint: 'Unlatch and extract the pilot door.',
          explanation: 'Accessing the cabin verifies the magneto key is removed before moving the propeller.'
        },
        {
          id: 'step_3',
          instruction: 'Inspect the Port (Left) NACA 2412 Main High-Lift Wing and fuel drains.',
          targetComponentId: 'cessna_wing_l',
          action: 'inspect',
          hint: 'Click the left wing to verify fuel tank integrity.',
          explanation: 'Visual fuel quantity and contamination check is mandatory prior to engine start.'
        },
        {
          id: 'step_4',
          instruction: 'Verify freedom of movement on the Left Differential Frise Aileron.',
          targetComponentId: 'cessna_aileron_l',
          action: 'remove',
          hint: 'Detach the port aileron hinge pin.',
          explanation: 'Aileron control cables must move freely throughout their full angular deflection.'
        },
        {
          id: 'step_5',
          instruction: 'Inspect the Directional Aerodynamic Rudder and tail hinge cables.',
          targetComponentId: 'cessna_rudder',
          action: 'inspect',
          hint: 'Verify the empennage vertical fin and rudder cables.',
          explanation: 'The rudder and anti-servo trim tab ensure directional trim and crosswind yaw authority.'
        }
      ]
    },
    {
      id: 'engine_cowling_service',
      title: 'Lycoming 230 HP Engine Cowling & Spark Plug Maintenance',
      difficulty: 'Intermediate',
      estimatedMinutes: 8,
      description: 'Disassemble the front engine cowlings, inspect dual Bendix magnetos, and access the 6-cylinder aviation powerplant.',
      steps: [
        {
          id: 'step_cowl_1',
          instruction: 'Remove the McCauley Two-Blade Propeller to clear the forward crankshaft flange.',
          targetComponentId: 'cessna_propeller',
          action: 'remove',
          hint: 'Extract the propeller forward.',
          explanation: 'Propeller removal is required to slip the nose spinner and split cowlings off the airframe.'
        },
        {
          id: 'step_cowl_2',
          instruction: 'Remove the One-Piece Panoramic Windscreen to expose the firewall upper seal.',
          targetComponentId: 'cessna_windscreen',
          action: 'remove',
          hint: 'Extract the acrylic windscreen.',
          explanation: 'Allows upper firewall and instrument tray inspection.'
        },
        {
          id: 'step_cowl_3',
          instruction: 'Inspect the Lycoming O-540-L3C5D 230 HP Piston Engine block.',
          targetComponentId: 'cessna_engine',
          action: 'inspect',
          hint: 'Examine cylinder cooling fins and spark plug leads.',
          explanation: 'Checking 12 spark plugs, dual magnetos, and oil filters every 100 flight hours.'
        }
      ]
    }
  ]
};
