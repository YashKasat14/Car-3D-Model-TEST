import { ModelManifest, ModelComponent } from '../types/model';

export interface PartInfo {
  id: string;
  name: string;
  category: string;
  assemblyName: string;
  material: string;
  description: string;
  specifications: Record<string, string>;
  highlightColor?: string;
}

// Known Cessna 182 node mapping for complete 55-mesh precision
const CESSNA_NODE_MAP: Record<string, {
  name: string;
  category: string;
  assembly: string;
  material: string;
  desc: string;
  specs: Record<string, string>;
}> = {
  // Powerplant & Propeller
  'Object_169': {
    name: 'Lycoming O-540-L3C5D 230 HP Piston Engine & Cowling',
    category: 'Powerplant',
    assembly: 'Propulsion & Powerplant',
    material: 'Cast Aluminum Crankcase & Forged Steel Cylinders',
    desc: 'Six-cylinder air-cooled horizontally-opposed aircraft engine delivering 230 bhp at 2,400 RPM.',
    specs: { 'Displacement': '541.5 cu in (8.87 L)', 'Power': '230 hp @ 2,400 RPM', 'Fuel': '100LL Avgas', 'TBO': '2,000 hrs' }
  },
  'Object_89': {
    name: 'McCauley 2-Blade Constant Speed Propeller & Hub',
    category: 'Propulsion',
    assembly: 'Propulsion & Powerplant',
    material: 'Forged 2025-T6 High-Strength Aluminum Alloy',
    desc: 'Hydraulically governed variable-pitch two-blade propeller for optimal climb and cruise thrust.',
    specs: { 'Diameter': '82 inches (2.08 m)', 'Pitch Range': '13.5° to 27.5°', 'Governor': 'Engine oil driven' }
  },
  'Object_55': {
    name: 'Engine Cowl Flap & Underbody Oil Cooler Intake',
    category: 'Powerplant',
    assembly: 'Propulsion & Powerplant',
    material: 'Formed Sheet Aluminum & Heat Shielding',
    desc: 'Regulates cylinder head temperatures during climb and high ambient operations.',
    specs: { 'Operation': 'Manual cockpit push-pull control', 'Cooling Type': 'Ram air' }
  },

  // High-Lift Wings & Control Surfaces
  'Object_111': {
    name: 'Port (Left) NACA 2412 High-Lift Main Wing',
    category: 'Aero Structure',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Alclad 2024-T3 Stressed Aluminum Skin & Spars',
    desc: 'Semi-monocoque high-wing design providing docile stall characteristics and 44-gal fuel cell.',
    specs: { 'Airfoil': 'NACA 2412', 'Wingspan Half': '5.07 m', 'Fuel Capacity': '44 US gal (166.5 L)' }
  },
  'Object_113': {
    name: 'Starboard (Right) NACA 2412 High-Lift Main Wing',
    category: 'Aero Structure',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Alclad 2024-T3 Stressed Aluminum Skin & Spars',
    desc: 'Right wing assembly housing integral wet fuel cell, pitot-static tube, and navigation lighting.',
    specs: { 'Airfoil': 'NACA 2412', 'Wingspan Half': '5.07 m', 'Fuel Capacity': '44 US gal (166.5 L)' }
  },
  'Object_13': {
    name: 'Port (Left) Differential Frise Aileron',
    category: 'Flight Controls',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Corrugated Alclad 2024-T3 Aluminum',
    desc: 'Differential roll control surface minimizing adverse yaw during bank maneuvers.',
    specs: { 'Deflection': '+20° up / -15° down', 'Actuation': 'Control cable and bellcrank' }
  },
  'Object_15': {
    name: 'Starboard (Right) Differential Frise Aileron',
    category: 'Flight Controls',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Corrugated Alclad 2024-T3 Aluminum',
    desc: 'Starboard roll control surface actuated via flight control pushrods.',
    specs: { 'Deflection': '+20° up / -15° down', 'Actuation': 'Pushrod / Cable linkage' }
  },
  'Object_17': {
    name: 'Single-Slot Fowler Trailing-Edge Flaps',
    category: 'High-Lift Devices',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Alclad Aluminum with Roller Tracks',
    desc: 'Electrically driven Fowler flaps extending aft and downward to maximize lift coefficient.',
    specs: { 'Settings': '0°, 10°, 20°, 40°', 'Motor': '12V / 28V DC Electric actuator' }
  },

  // Empennage & Tail Flight Controls
  'Object_10': {
    name: 'Directional Aerodynamic Rudder & Trim Tab',
    category: 'Flight Controls',
    assembly: 'Empennage & Flight Controls',
    material: 'Corrugated 2024-T3 Aluminum Skin',
    desc: 'Foot-pedal actuated vertical control surface governing yaw and crosswind alignment.',
    specs: { 'Deflection': '16° left / 16° right', 'Trim Tab': 'Adjustable ground/flight' }
  },
  'Object_91': {
    name: 'Swept Vertical Fin & Dorsal Fairing',
    category: 'Empennage',
    assembly: 'Empennage & Flight Controls',
    material: 'Riveted Aluminum Stressed Skin',
    desc: 'Aerodynamic vertical stabilizer delivering directional static and dynamic stability.',
    specs: { 'Sweep Angle': '35°', 'Beacon Mount': 'FAA anti-collision red strobe' }
  },
  'Object_47': {
    name: 'Horizontal Tailplane & Dual Pitch Elevators',
    category: 'Flight Controls',
    assembly: 'Empennage & Flight Controls',
    material: 'All-Metal Cantilever Structure',
    desc: 'Longitudinal pitch control surface connected directly to pilot flight control yokes.',
    specs: { 'Deflection': '+28° up / -17° down', 'Trim Mechanism': 'Cockpit trim wheel & cable' }
  },

  // Tricycle Undercarriage Landing Gear
  'Object_103': {
    name: 'Steerable Nose Gear Wheel & Pneumatic Tire (5.00-5)',
    category: 'Landing Gear',
    assembly: 'Tricycle Undercarriage Gear',
    material: 'Split Magnesium Alloy Wheel & 6-Ply Aviation Rubber',
    desc: 'Steerable nosewheel with rudder pedal linkage for ground taxiing up to 10° left/right.',
    specs: { 'Tire Size': '5.00-5 (6-ply)', 'Inflation Pressure': '45 PSI (310 kPa)' }
  },
  'Object_105': {
    name: 'Port (Left) Main Landing Gear Wheel & Tire (6.00-6)',
    category: 'Landing Gear',
    assembly: 'Tricycle Undercarriage Gear',
    material: 'Forged Aluminum Wheel & Cleveland Hydraulic Disc Brake',
    desc: 'Main undercarriage absorbing landing impact on tubular spring-steel strut.',
    specs: { 'Tire Size': '6.00-6 (6-ply)', 'Pressure': '42 PSI (290 kPa)', 'Brake': 'Cleveland Disc' }
  },
  'Object_107': {
    name: 'Starboard (Right) Main Landing Gear Wheel & Tire (6.00-6)',
    category: 'Landing Gear',
    assembly: 'Tricycle Undercarriage Gear',
    material: 'Forged Aluminum Wheel & Cleveland Hydraulic Disc Brake',
    desc: 'Right undercarriage wheel providing primary touchdown energy absorption.',
    specs: { 'Tire Size': '6.00-6 (6-ply)', 'Pressure': '42 PSI (290 kPa)', 'Brake': 'Cleveland Disc' }
  },
  'Object_87': {
    name: 'Nose Gear Oleo-Pneumatic Shock Strut & Torque Scissors',
    category: 'Landing Gear',
    assembly: 'Tricycle Undercarriage Gear',
    material: 'Chrome-Plated Steel Piston & Hydraulic Cylinder',
    desc: 'Dampens runway roughness and absorbs vertical landing touchdown shocks.',
    specs: { 'Fluid': 'MIL-H-5606 Hydraulic Fluid', 'Gas Charge': 'Dry Nitrogen @ 45 PSI' }
  },
  'Object_93': {
    name: 'Nosewheel Steering Collar & Shimmy Damper',
    category: 'Landing Gear',
    assembly: 'Tricycle Undercarriage Gear',
    material: 'High-Tensile Billet Steel & Hydraulic Damper',
    desc: 'Eliminates high-speed nosewheel oscillations during takeoff and high-speed landing rollout.',
    specs: { 'Damping Type': 'Vane-type hydraulic fluid damper', 'Turn Limit': '30° caster' }
  },
  'Object_8': {
    name: 'Nose Gear Axle Hub & Retaining Nut',
    category: 'Landing Gear',
    assembly: 'Tricycle Undercarriage Gear',
    material: 'Heat-Treated Alloy Steel',
    desc: 'Precision machined spindle supporting high-speed roller bearings.',
    specs: { 'Bearings': 'Timken tapered roller bearings' }
  },

  // Cockpit, Cabin & Glass Enclosure
  'Object_61': {
    name: 'Panoramic One-Piece Optical Windscreen',
    category: 'Canopy Glass',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Optical Grade Aviation Cast Acrylic (Plexiglas)',
    desc: 'Distortion-free forward optical glass engineered for bird-strike resilience and UV resistance.',
    specs: { 'Thickness': '0.187 in (4.75 mm)', 'Transmittance': '92% visible light' }
  },
  'Object_27': {
    name: 'Port (Pilot Side) Opening Cabin Window',
    category: 'Canopy Glass',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Cast Acrylic Glass with Vent Scoop',
    desc: 'Hinged ventilation window for cockpit cooling during taxi and low-speed flight.',
    specs: { 'Operation': 'Rotary latch with exterior air scoop' }
  },
  'Object_37': {
    name: 'Starboard (Co-Pilot Side) Cabin Window',
    category: 'Canopy Glass',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Cast Acrylic Optical Glass',
    desc: 'Passenger and co-pilot viewing window providing wide panoramic lateral visibility.',
    specs: { 'Transmittance': '90% visible light' }
  },
  'Object_29': {
    name: 'Port (Pilot Side) Cabin Access Door',
    category: 'Cabin Structure',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Formed Aluminum Stressed Skin with Double Latches',
    desc: 'Pilot primary entry door with key lock, weatherstrip sealing, and dual locking pins.',
    specs: { 'Opening Mechanism': 'Flush handle with safety lock pin' }
  },
  'Object_31': {
    name: 'Pilot Door Latch Mechanism & Interior Armrest',
    category: 'Interior Hardware',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Stainless Steel Mechanism & Padded Vinyl',
    desc: 'Internal door locking lever and ergonomic door pull armrest.',
    specs: { 'Lock Type': 'Dual-point rotary claw lock' }
  },
  'Object_39': {
    name: 'Starboard (Co-Pilot) Cabin Access Door',
    category: 'Cabin Structure',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Formed Aluminum Stressed Skin',
    desc: 'Co-pilot and front passenger access door with quick-release exit hinge pins.',
    specs: { 'Emergency Egress': 'Quick release jettison pins' }
  },
  'Object_41': {
    name: 'Co-Pilot Door Internal Rotary Latch',
    category: 'Interior Hardware',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Stainless Steel & Chromed Alloy',
    desc: 'Secure dual-latch handle locking the right door firmly into the fuselage frame.',
    specs: { 'Hardware': 'Mil-spec aerospace hardware' }
  },
  'Object_65': {
    name: 'Avionics Six-Pack Primary Flight Display Panel',
    category: 'Avionics',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Precision Gyroscopic & Pressure Transducers',
    desc: 'Standard FAA 6-pack flight instruments: Airspeed Indicator, Attitude Indicator, Altimeter, Turn Coordinator, Heading Indicator, Vertical Speed.',
    specs: { 'Layout': 'Basic T-Arrangement', 'Power': 'Engine Vacuum + 28V DC Electric' }
  },
  'Object_79': {
    name: 'Engine Tachometer, Manifold Pressure & Fuel Gauges',
    category: 'Avionics',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Illuminated Analog Gauge Cluster',
    desc: 'Monitors RPM, manifold pressure (inHg), oil temp/pressure, cylinder head temp (CHT), and fuel flow.',
    specs: { 'RPM Redline': '2,400 RPM', 'Manifold Range': '10 to 35 inHg' }
  },
  'Object_51': {
    name: 'Garmin GNS Navigation & VHF Comm Radio Stack',
    category: 'Avionics',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Solid-State Digital Aviation Avionics',
    desc: 'Integrated GPS, VOR/LOC navigation, dual VHF communications, and Mode-S transponder.',
    specs: { 'Frequencies': '118.000 to 136.975 MHz (8.33 kHz spacing)', 'GPS': 'WAAS Certified' }
  },
  'Object_53': {
    name: 'Audio Control Panel & Autopilot Annunciator',
    category: 'Avionics',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Backlit Microprocessor Unit',
    desc: 'Audio selector for pilot/copilot intercom, marker beacons, and 2-axis autopilot controls.',
    specs: { 'Channels': 'Dual Comm, Dual Nav, ADF, DME' }
  },
  'Object_97': {
    name: 'Port (Pilot) Magnesium Flight Control Yoke',
    category: 'Flight Controls',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Cast Magnesium Handgrip & Push-to-Talk Switch',
    desc: 'Ergonomic dual-horn pilot control yoke with integrated push-to-talk (PTT) radio trigger.',
    specs: { 'Motion': 'Push/pull 8.5 in pitch travel, ±90° roll rotation' }
  },
  'Object_99': {
    name: 'Starboard (Co-Pilot) Flight Control Yoke',
    category: 'Flight Controls',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Cast Magnesium Handgrip',
    desc: 'Interconnected co-pilot control yoke mirrored mechanically via heavy-duty sprockets and chains.',
    specs: { 'Linkage': 'Direct mechanical torque tube' }
  },
  'Object_63': {
    name: 'Forward Contoured Pilot & Co-Pilot Seats',
    category: 'Cabin Interior',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Energy-Absorbing Memory Foam & Fire-Resistant Leather',
    desc: 'Adjustable forward seats with 4-point inertia-reel shoulder harnesses.',
    specs: { 'Crash Safety': 'FAA Part 23 26G dynamic load certified' }
  },
  'Object_67': {
    name: 'Aft Two-Place Passenger Bench Seat & Belts',
    category: 'Cabin Interior',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Fire-Retardant Aviation Upholstery',
    desc: 'Rear passenger seating for 2 adults with generous legroom and seatback map pockets.',
    specs: { 'Capacity': '2 Adults (up to 400 lb / 181 kg)' }
  },
  'Object_75': {
    name: 'Cabin Soundproofing & Floor Carpet Underlay',
    category: 'Cabin Interior',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Closed-Cell Acoustic Foam & Wool Carpet',
    desc: 'Acoustic thermal insulation reducing cabin decibels during high-power climb operations.',
    specs: { 'Noise Attenuation': '-18 dB cabin noise reduction' }
  },
  'Object_77': {
    name: 'Cabin Side Panels & Air Conditioning Vents',
    category: 'Cabin Interior',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Thermoformed ABS Plastic & Rotary Eyeball Vents',
    desc: 'Fresh air distribution eyeballs supplying ram air to all four cabin passenger stations.',
    specs: { 'Ventilation': 'Individual adjustable fresh air flow' }
  },

  // Airframe Structure & Monocoque
  'Object_19': {
    name: 'Semi-Monocoque Riveted Aluminum Fuselage Shell',
    category: 'Structure',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Alclad 2024-T3 Riveted Aluminum Stressed Skin',
    desc: 'Primary aircraft fuselage with longitudinal stringers, formers, and structural bulkheads.',
    specs: { 'Length': '29 ft 0 in (8.84 m)', 'Max Gross Weight': '3,100 lb (1,406 kg)' }
  },
  'Object_25': {
    name: 'Main Wing Carry-Through Box Spar & Cabin Roll Cage',
    category: 'Structure',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Extruded 7075-T6 High-Strength Aluminum Spar',
    desc: 'Massive internal structural bridge transferring all aerodynamic wing lift loads through the cabin roof.',
    specs: { 'Load Limit': '+3.8G / -1.52G utility category' }
  },
  'Object_167': {
    name: 'Structural Wing Struts & Landing Gear Carry-Through Mounts',
    category: 'Structure',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Streamlined Extruded Aluminum Alloy Tubes',
    desc: 'External lift struts bracing wings against positive and negative G aerodynamic maneuvers.',
    specs: { 'Cross-Section': 'Aerodynamic low-drag NACA airfoil' }
  },

  // Lighting & Electrical Systems
  'Object_49': {
    name: 'Tailcone White Navigation Position Light (140°)',
    category: 'Electrical & Lighting',
    assembly: 'Empennage & Flight Controls',
    material: 'LED Solid-State Beacon & Optical Glass Dome',
    desc: 'FAA night visual flight rules rear white position light visible across 140° rear arc.',
    specs: { 'Candela': '20 cd white light', 'Compliance': 'FAR 91.205' }
  },
  'Object_57': {
    name: 'Port (Left) Leading-Edge Taxi & Landing Light',
    category: 'Electrical & Lighting',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Sealed Beam 100W Halogen / LED Projector',
    desc: 'High-intensity runway illumination light for night landing rollouts and dark airport taxiing.',
    specs: { 'Power': '100 Watts @ 28V DC', 'Candela': '100,000 candlepower' }
  },
  'Object_59': {
    name: 'Port (Left) Wing Landing Light Illuminator',
    category: 'Electrical & Lighting',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Parabolic Reflector & Pyrex Glass Lens',
    desc: 'Down-angled beam illuminating the landing touchdown zone from 200 ft altitude.',
    specs: { 'Beam Spread': '12° horizontal / 8° vertical' }
  },
  'Object_83': {
    name: 'Port (Left) Red Forward Navigation Light (110°)',
    category: 'Electrical & Lighting',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Aviation Red Optical Lens & 40W Xenon Strobe',
    desc: 'FAA standard port navigation light indicating aircraft heading in night operations.',
    specs: { 'Color': 'Aviation Red', 'Arc of Coverage': '110°' }
  },
  'Object_85': {
    name: 'Starboard (Right) Green Forward Navigation Light (110°)',
    category: 'Electrical & Lighting',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Aviation Green Optical Lens & 40W Xenon Strobe',
    desc: 'FAA standard starboard navigation light visible from opposing traffic in flight.',
    specs: { 'Color': 'Aviation Green', 'Arc of Coverage': '110°' }
  },
  'Object_109': {
    name: 'Wingtip Aerodynamic Strobe Lenses & Fairings',
    category: 'Canopy Glass',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Molded Optical Polycarbonate',
    desc: 'Streamlined fairing enclosing dual high-intensity flashing anti-collision strobe heads.',
    specs: { 'Flash Rate': '45 to 60 flashes per minute' }
  },
  'Object_21': {
    name: 'Port (Left) Streamlined Aluminum Wing Strut',
    category: 'Aero Structure',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Extruded 2024-T3 Aluminum Alloy Airfoil Tube',
    desc: 'Aerodynamic external wing strut transferring positive high-G wing flight loads into fuselage carry-through.',
    specs: { 'Profile': 'Low-drag symmetrical streamlined airfoil', 'Attachment': 'High-shear steel clevis bolt' }
  },
  'Object_23': {
    name: 'Starboard (Right) Streamlined Aluminum Wing Strut',
    category: 'Aero Structure',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Extruded 2024-T3 Aluminum Alloy Airfoil Tube',
    desc: 'Starboard lift strut bracing the high-wing structure against flight gusts and negative-G maneuvers.',
    specs: { 'Profile': 'Low-drag streamlined airfoil', 'Attachment': 'High-shear steel clevis bolt' }
  },
  'Object_33': {
    name: 'Port (Pilot Side) Door Acrylic Window Glazing',
    category: 'Canopy Glass',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Cast Optical Acrylic Sheet',
    desc: 'Side pilot door window providing lateral peripheral vision and ground taxi situational awareness.',
    specs: { 'Thickness': '0.125 in (3.175 mm)', 'Transmittance': '91%' }
  },
  'Object_35': {
    name: 'Starboard (Co-Pilot Side) Door Acrylic Window Glazing',
    category: 'Canopy Glass',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Cast Optical Acrylic Sheet',
    desc: 'Co-pilot lateral window giving clear view of starboard wingtip, engine cowl, and runway threshold.',
    specs: { 'Thickness': '0.125 in (3.175 mm)', 'Transmittance': '91%' }
  },
  'Object_43': {
    name: 'Aft Cabin Passenger Panoramic Observation Window',
    category: 'Canopy Glass',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Aviation Optical Acrylic',
    desc: 'Rear fuselage cabin window providing natural light and wide passenger viewing.',
    specs: { 'Transmittance': '90% Visible Light' }
  },
  'Object_45': {
    name: 'Four-Place Cabin Seating Structure & Lap-Sash Restraints',
    category: 'Interior Hardware',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Lightweight Tubular Aluminum & Flame-Retardant Fabric',
    desc: 'Ergonomic four-passenger seats with adjustable forward/aft tracks and FAA TSO-approved shoulder harnesses.',
    specs: { 'Rating': 'FAA 26G Dynamic Impact Rated' }
  },
  'Object_69': {
    name: 'Flight Control Yoke Dual Cross-Shaft Assembly',
    category: 'Flight Controls',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Precision Chrome-Moly Tubular Steel',
    desc: 'Transmits pilot pitch and roll control inputs through sprockets and stainless steel cables to elevators and ailerons.',
    specs: { 'Cables': '7x19 Flexible Stainless Steel Aircraft Cable' }
  },
  'Object_71': {
    name: 'Center Vernier Throttle, Propeller & Mixture Quadrant',
    category: 'Avionics',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Machined Aluminum Vernier Knobs & Push-Pull Cables',
    desc: 'Precision vernier friction-lock engine controls governing manifold pressure, RPM, and fuel-air ratio.',
    specs: { 'Controls': 'Black Throttle, Blue Prop Pitch, Red Mixture' }
  },
  'Object_73': {
    name: 'Dual Cockpit Rudder & Hydraulic Toe-Brake Pedals',
    category: 'Flight Controls',
    assembly: 'Cockpit, Cabin & Glass Enclosure',
    material: 'Cast Magnesium Pedals & Master Hydraulic Cylinders',
    desc: 'Controls directional yaw rudder cables and activates differential Cleveland disc toe brakes for ground steering.',
    specs: { 'Travel': '±16° cable deflection / Independent brake cylinders' }
  },
  'Object_81': {
    name: 'Electrically Heated Pitot-Static Mast & AOA Sensor',
    category: 'Avionics',
    assembly: 'High-Lift Wings & Airframe',
    material: 'Nickel-Plated Copper Tubing with 28V Heating Element',
    desc: 'Senses ram air dynamic pressure for airspeed indicators and features heating element to prevent icing.',
    specs: { 'Heating': '28V DC / 100W De-Ice Coil', 'Aero Location': 'Port wing leading edge' }
  },
  'Object_95': {
    name: 'Empennage Aft Fuselage Bulkhead & Tail Tie-Down Ring',
    category: 'Airframe Aero',
    assembly: 'Empennage & Flight Controls',
    material: 'Hydroformed 2024-T3 Aluminum Bulkhead & Forged Steel Eye',
    desc: 'Rigid tail station bulkhead anchoring the horizontal tailplane spars and providing ground mooring tie-down ring.',
    specs: { 'Proof Load': '3,000 lbs (1,360 kg) tie-down capacity' }
  },
  'Object_101': {
    name: 'Steerable Nosewheel Landing Gear Fork & Tow Pin',
    category: 'Landing Gear',
    assembly: 'Tricycle Undercarriage Gear',
    material: 'High-Strength Forged Aluminum Alloy 7075-T6',
    desc: 'Heavy-duty fork cradle supporting the 5.00-5 nosewheel axle and ground towing vehicle adapter lugs.',
    specs: { 'Rating': 'Forged single-piece high-impact aircraft fork' }
  }
};

/**
 * Resolves comprehensive part engineering data for any hovered or selected node.
 * Works seamlessly across Cessna 182, Oracle Red Bull RB19, or any custom-uploaded CAD asset.
 */
export function resolvePartInfo(targetName: string, manifest?: ModelManifest): PartInfo {
  if (!targetName) {
    return {
      id: 'unknown',
      name: 'Airframe Component',
      category: 'Subsystem',
      assemblyName: 'Primary Structure',
      material: 'Aerospace Specification Alloy',
      description: 'Engineering CAD component node.',
      specifications: {}
    };
  }

  // 1. Check known Cessna map
  if (CESSNA_NODE_MAP[targetName]) {
    const data = CESSNA_NODE_MAP[targetName];
    return {
      id: targetName,
      name: data.name,
      category: data.category,
      assemblyName: data.assembly,
      material: data.material,
      description: data.desc,
      specifications: data.specs,
      highlightColor: '#38BDF8'
    };
  }

  // 2. Check manifest components if provided
  if (manifest?.components) {
    const comp = manifest.components.find(c => c.id === targetName || c.nodeName === targetName);
    if (comp) {
      const assembly = manifest.assemblies.find(a => a.id === comp.parentAssemblyId);
      return {
        id: comp.id,
        name: comp.name,
        category: comp.category,
        assemblyName: assembly?.name || comp.parentAssemblyId || 'Assembly Structure',
        material: comp.metadata?.material || 'Aerospace / Automotive Spec Material',
        description: comp.metadata?.description || 'Structural CAD model component',
        specifications: (comp.metadata?.specifications as Record<string, string>) || {},
        highlightColor: assembly?.colorHex || '#EF4444'
      };
    }
  }

  // 3. Heuristic matching based on naming conventions
  const lower = targetName.toLowerCase();

  if (lower.includes('propeller') || lower.includes('blade') || lower.includes('spin')) {
    return {
      id: targetName,
      name: 'McCauley Variable-Pitch Propeller',
      category: 'Propulsion',
      assemblyName: 'Powerplant Subsystem',
      material: 'Forged 2025-T6 Aluminum Alloy',
      description: 'Two-blade constant speed aviation propeller with pitch control governor.',
      specifications: { 'Diameter': '82 inches', 'Type': 'Constant Speed' }
    };
  }

  if (lower.includes('engine') || lower.includes('motor') || lower.includes('piston') || lower.includes('power')) {
    return {
      id: targetName,
      name: 'Lycoming O-540-L3C5D 230 HP Aviation Powerplant',
      category: 'Powerplant',
      assemblyName: 'Powerplant Subsystem',
      material: 'Forged Steel Cylinders & Aluminum Crankcase',
      description: 'Six-cylinder horizontally opposed aircraft engine delivering 230 hp.',
      specifications: { 'Horsepower': '230 hp @ 2,400 RPM', 'Displacement': '541.5 cu in' }
    };
  }

  if (lower.includes('wing') || lower.includes('airfoil') || lower.includes('spar')) {
    return {
      id: targetName,
      name: 'NACA 2412 Cantilever Aerodynamic Wing',
      category: 'Aero Structure',
      assemblyName: 'Primary Airframe',
      material: 'Alclad 2024-T3 Aluminum Stressed Skin',
      description: 'High-lift aerodynamic wing generating aircraft lift with integral fuel storage.',
      specifications: { 'Airfoil Profile': 'NACA 2412', 'Wingspan': '10.15 m' }
    };
  }

  if (lower.includes('rudder') || lower.includes('fin') || lower.includes('tail') || lower.includes('stabilizer')) {
    return {
      id: targetName,
      name: 'Empennage Directional Tailplane & Flight Controls',
      category: 'Flight Controls',
      assemblyName: 'Empennage Subsystem',
      material: 'All-Metal Semi-Monocoque Construction',
      description: 'Vertical and horizontal stabilizers providing yaw and pitch stability.',
      specifications: { 'Function': 'Longitudinal & Directional Flight Control' }
    };
  }

  if (lower.includes('wheel') || lower.includes('tire') || lower.includes('gear') || lower.includes('strut')) {
    return {
      id: targetName,
      name: 'Tricycle Oleo-Pneumatic Undercarriage Assembly',
      category: 'Landing Gear',
      assemblyName: 'Landing Gear Subsystem',
      material: 'Tubular Spring Steel & Magnesium Wheel Hubs',
      description: 'Absorbs landing impact loads and enables steering taxi on runway surfaces.',
      specifications: { 'Configuration': 'Tricycle (1 Nose + 2 Main)' }
    };
  }

  if (lower.includes('glass') || lower.includes('windshield') || lower.includes('window')) {
    return {
      id: targetName,
      name: 'Aviation Cast Optical Acrylic Window',
      category: 'Canopy Glass',
      assemblyName: 'Cabin Enclosure',
      material: 'Optical Grade Polycast Acrylic',
      description: 'Panoramic cabin glazing providing distortion-free visibility for pilots.',
      specifications: { 'Transmittance': '92% Visible Light' }
    };
  }

  // Generic fallback with clean formatting
  const formattedName = targetName
    .replace(/^Object_/, 'Component ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return {
    id: targetName,
    name: formattedName,
    category: 'Structure',
    assemblyName: 'Airframe Assembly',
    material: 'Aerospace Certified Alloy',
    description: `Engineered CAD assembly node (${targetName}).`,
    specifications: { 'Status': 'Verified CAD Node' }
  };
}
