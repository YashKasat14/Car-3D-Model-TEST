import { ModelManifest } from '../types/model';

export type AcousticArchetype =
  | 'f1_turbo_hybrid'
  | 'f1_v10'
  | 'v8_supercar'
  | 'electric_hypercar'
  | 'jet_turbofan'
  | 'propeller_aircraft'
  | 'helicopter'
  | 'marine_ship'
  | 'animal_creature'
  | 'human_character'
  | 'none';

export interface AiSoundProfile {
  hasSound: boolean;
  archetype: AcousticArchetype;
  entityName: string;
  soundTitle: string;
  soundDescription: string;
  engineType: string;
  idleRpm: number;
  maxRpm: number;
  confidenceScore: number;
  acousticDetails: {
    harmonicType: 'sawtooth' | 'triangle' | 'sine' | 'square';
    fundamentalFreq: number; // Hz at idle
    maxFreq: number; // Hz at redline/max throttle
    hasTurboWhistle: boolean;
    hasExhaustBurble: boolean;
    hasPropChop: boolean;
    hasTurbineWhine: boolean;
    hasFogHorn: boolean;
    hasBiologicalGrowl: boolean;
  };
}

/**
 * AI 3D Model Acoustic Analyzer
 * Inspects geometry hierarchy, component names, categories, and vehicle metadata
 * to classify the authentic real-world acoustic signature of any 3D model.
 * If the model represents a static object without acoustic characteristics, hasSound is false.
 */
export function analyzeModelSound(manifest: ModelManifest | null | undefined): AiSoundProfile {
  if (!manifest) {
    return createSilentProfile('Unknown');
  }

  // Aggregate all linguistic identifiers across model metadata and CAD components
  const compNames = manifest.components ? manifest.components.map(c => `${c.name} ${c.nodeName} ${c.category}`).join(' ') : '';
  const searchCorpus = `${manifest.name} ${manifest.shortName || ''} ${manifest.category || ''} ${manifest.description || ''} ${manifest.vehicleType || ''} ${compNames}`.toLowerCase();

  // 1. Explicitly check for inanimate/silent static objects
  const silentKeywords = [
    'chair', 'table', 'desk', 'furniture', 'building', 'house', 'room',
    'architecture', 'monument', 'statue', 'sculpture', 'cube', 'cylinder',
    'bracket', 'plate', 'gearbox_standalone', 'static_bracket', 'wall',
    'structure', 'stand', 'pedestal', 'frame_only'
  ];

  const hasSilentKeyword = silentKeywords.some(kw => searchCorpus.includes(kw));
  const hasVehicleOrLivingKeyword = searchCorpus.match(
    /\b(car|racing|f1|formula|vehicle|engine|motor|aircraft|plane|jet|helicopter|ship|boat|animal|creature|dinosaur|human|propeller|turbofan|exhaust|wheels|chassis)\b/i
  );

  if (hasSilentKeyword && !hasVehicleOrLivingKeyword) {
    return createSilentProfile(manifest.name);
  }

  // 2. FORMULA 1 / GRAND PRIX TURBO HYBRID
  if (
    searchCorpus.includes('rb19') ||
    searchCorpus.includes('rb20') ||
    searchCorpus.includes('red bull') ||
    searchCorpus.includes('f1') ||
    searchCorpus.includes('formula 1') ||
    searchCorpus.includes('formula1') ||
    searchCorpus.includes('grand prix') ||
    (searchCorpus.includes('racing') && searchCorpus.includes('monoposto')) ||
    (searchCorpus.includes('sidepod') && searchCorpus.includes('halo'))
  ) {
    return {
      hasSound: true,
      archetype: 'f1_turbo_hybrid',
      entityName: manifest.name,
      soundTitle: 'Formula 1 1.6L V6 Turbo Hybrid (15,000 RPM)',
      soundDescription: 'High-revving turbocharged 90° V6 combustion scream with 125,000 RPM MGU-H turbo spool whine and ERS energy recovery regen.',
      engineType: '1.6L Turbocharged V6 Hybrid Power Unit',
      idleRpm: 4200,
      maxRpm: 15000,
      confidenceScore: 0.98,
      acousticDetails: {
        harmonicType: 'sawtooth',
        fundamentalFreq: 88,
        maxFreq: 310,
        hasTurboWhistle: true,
        hasExhaustBurble: true,
        hasPropChop: false,
        hasTurbineWhine: true,
        hasFogHorn: false,
        hasBiologicalGrowl: false
      }
    };
  }

  // 3. CLASSIC HIGH-REV V10 / V8 RACING ENGINE
  if (
    searchCorpus.includes('v10') ||
    searchCorpus.includes('f2004') ||
    searchCorpus.includes('f2002') ||
    searchCorpus.includes('mp4-20') ||
    searchCorpus.includes('naturally aspirated')
  ) {
    return {
      hasSound: true,
      archetype: 'f1_v10',
      entityName: manifest.name,
      soundTitle: '3.0L Naturally Aspirated V10 F1 Engine (19,000 RPM)',
      soundDescription: 'Legendary spine-tingling screaming high-frequency exhaust harmonic with 10-cylinder firing pulses.',
      engineType: '3.0L Naturally Aspirated 90° V10',
      idleRpm: 5000,
      maxRpm: 19000,
      confidenceScore: 0.96,
      acousticDetails: {
        harmonicType: 'sawtooth',
        fundamentalFreq: 110,
        maxFreq: 420,
        hasTurboWhistle: false,
        hasExhaustBurble: true,
        hasPropChop: false,
        hasTurbineWhine: false,
        hasFogHorn: false,
        hasBiologicalGrowl: false
      }
    };
  }

  // 4. COMMERCIAL JET / SUPERSONIC FIGHTER TURBOFAN
  if (
    searchCorpus.includes('jet') ||
    searchCorpus.includes('turbofan') ||
    searchCorpus.includes('boeing') ||
    searchCorpus.includes('airbus') ||
    searchCorpus.includes('f16') ||
    searchCorpus.includes('f22') ||
    searchCorpus.includes('f35') ||
    searchCorpus.includes('afterburner') ||
    searchCorpus.includes('supersonic')
  ) {
    return {
      hasSound: true,
      archetype: 'jet_turbofan',
      entityName: manifest.name,
      soundTitle: 'Dual-Spool High-Bypass Turbofan Jet Engine',
      soundDescription: 'Titanium fan blade air wash, high-pitch compressor turbine whine, and sub-bass exhaust blast thrust.',
      engineType: 'High-Bypass Turbofan / Afterburning Turbofan',
      idleRpm: 2500,
      maxRpm: 12000,
      confidenceScore: 0.97,
      acousticDetails: {
        harmonicType: 'sine',
        fundamentalFreq: 120,
        maxFreq: 460,
        hasTurboWhistle: false,
        hasExhaustBurble: false,
        hasPropChop: false,
        hasTurbineWhine: true,
        hasFogHorn: false,
        hasBiologicalGrowl: false
      }
    };
  }

  // 5. PROPELLER AIRCRAFT (Cessna, Piper, Warbird)
  if (
    searchCorpus.includes('cessna') ||
    searchCorpus.includes('propeller') ||
    searchCorpus.includes('piper') ||
    searchCorpus.includes('aircraft') ||
    searchCorpus.includes('airplane') ||
    searchCorpus.includes('aviation') ||
    searchCorpus.includes('plane')
  ) {
    return {
      hasSound: true,
      archetype: 'propeller_aircraft',
      entityName: manifest.name,
      soundTitle: 'Aviation Horizontally-Opposed 6-Cylinder Engine',
      soundDescription: 'Rhythmic 2,700 RPM propeller blade vortex chop, piston valve thrum, and aerodynamic prop wash.',
      engineType: 'Air-Cooled 6-Cylinder Piston Aero Engine',
      idleRpm: 750,
      maxRpm: 2800,
      confidenceScore: 0.95,
      acousticDetails: {
        harmonicType: 'triangle',
        fundamentalFreq: 45,
        maxFreq: 140,
        hasTurboWhistle: false,
        hasExhaustBurble: false,
        hasPropChop: true,
        hasTurbineWhine: false,
        hasFogHorn: false,
        hasBiologicalGrowl: false
      }
    };
  }

  // 6. HELICOPTER ROTORCRAFT
  if (
    searchCorpus.includes('helicopter') ||
    searchCorpus.includes('rotor') ||
    searchCorpus.includes('chopper') ||
    searchCorpus.includes('bell') ||
    searchCorpus.includes('blackhawk')
  ) {
    return {
      hasSound: true,
      archetype: 'helicopter',
      entityName: manifest.name,
      soundTitle: 'Turboshaft Main Rotor & Tail Blade Acoustic',
      soundDescription: 'Heavy low-frequency blade-slap vortex chop and high-frequency planetary reduction gearbox whine.',
      engineType: 'Turboshaft Engine & Heavy Articulated Rotor',
      idleRpm: 1200,
      maxRpm: 6000,
      confidenceScore: 0.94,
      acousticDetails: {
        harmonicType: 'square',
        fundamentalFreq: 32,
        maxFreq: 95,
        hasTurboWhistle: false,
        hasExhaustBurble: false,
        hasPropChop: true,
        hasTurbineWhine: true,
        hasFogHorn: false,
        hasBiologicalGrowl: false
      }
    };
  }

  // 7. MARINE VESSEL / SHIP / BOAT
  if (
    searchCorpus.includes('ship') ||
    searchCorpus.includes('boat') ||
    searchCorpus.includes('vessel') ||
    searchCorpus.includes('yacht') ||
    searchCorpus.includes('cargo') ||
    searchCorpus.includes('container') ||
    searchCorpus.includes('tanker') ||
    searchCorpus.includes('submarine') ||
    searchCorpus.includes('marine')
  ) {
    return {
      hasSound: true,
      archetype: 'marine_ship',
      entityName: manifest.name,
      soundTitle: 'Two-Stroke Marine Low-Speed Diesel & Acoustic Horn',
      soundDescription: 'Deep 85 RPM cylinder power strokes, hydrodynamic hull displacement wash, and resonant marine foghorn blast.',
      engineType: 'Direct-Drive Two-Stroke Marine Diesel Engine',
      idleRpm: 45,
      maxRpm: 120,
      confidenceScore: 0.93,
      acousticDetails: {
        harmonicType: 'sawtooth',
        fundamentalFreq: 26,
        maxFreq: 65,
        hasTurboWhistle: false,
        hasExhaustBurble: false,
        hasPropChop: false,
        hasTurbineWhine: false,
        hasFogHorn: true,
        hasBiologicalGrowl: false
      }
    };
  }

  // 8. V8 / V12 SUPERCAR / SPORTS AUTOMOTIVE
  if (
    searchCorpus.includes('car') ||
    searchCorpus.includes('automotive') ||
    searchCorpus.includes('supercar') ||
    searchCorpus.includes('hypercar') ||
    searchCorpus.includes('sports car') ||
    searchCorpus.includes('gt3') ||
    searchCorpus.includes('corvette') ||
    searchCorpus.includes('porsche') ||
    searchCorpus.includes('ferrari') ||
    searchCorpus.includes('lamborghini') ||
    searchCorpus.includes('mustang') ||
    searchCorpus.includes('v8') ||
    searchCorpus.includes('v12') ||
    searchCorpus.includes('exhaust')
  ) {
    return {
      hasSound: true,
      archetype: 'v8_supercar',
      entityName: manifest.name,
      soundTitle: 'Twin-Turbocharged Crossplane V8 Engine (8,500 RPM)',
      soundDescription: 'Aggressive low-end crossplane rumble, throat combustion bark, and overrun exhaust crackles.',
      engineType: '4.0L Twin-Turbocharged V8 Engine',
      idleRpm: 850,
      maxRpm: 8500,
      confidenceScore: 0.92,
      acousticDetails: {
        harmonicType: 'sawtooth',
        fundamentalFreq: 52,
        maxFreq: 240,
        hasTurboWhistle: true,
        hasExhaustBurble: true,
        hasPropChop: false,
        hasTurbineWhine: false,
        hasFogHorn: false,
        hasBiologicalGrowl: false
      }
    };
  }

  // 9. ELECTRIC HYPERCAR / EV
  if (
    searchCorpus.includes('electric') ||
    searchCorpus.includes('ev') ||
    searchCorpus.includes('tesla') ||
    searchCorpus.includes('rimac') ||
    searchCorpus.includes('nevera') ||
    searchCorpus.includes('taycan')
  ) {
    return {
      hasSound: true,
      archetype: 'electric_hypercar',
      entityName: manifest.name,
      soundTitle: 'Quad-Motor Permanent Magnet Synchronous Drivetrain',
      soundDescription: 'High-frequency silicon-carbide inverter switching whine and ultrasonic magnetic flux rotation.',
      engineType: 'Quad Axial-Flux Electric Motors (20,000 RPM)',
      idleRpm: 0,
      maxRpm: 20000,
      confidenceScore: 0.95,
      acousticDetails: {
        harmonicType: 'sine',
        fundamentalFreq: 280,
        maxFreq: 1400,
        hasTurboWhistle: false,
        hasExhaustBurble: false,
        hasPropChop: false,
        hasTurbineWhine: true,
        hasFogHorn: false,
        hasBiologicalGrowl: false
      }
    };
  }

  // 10. BIOLOGICAL ANIMAL / CREATURE / DINOSAUR
  if (
    searchCorpus.includes('animal') ||
    searchCorpus.includes('creature') ||
    searchCorpus.includes('dinosaur') ||
    searchCorpus.includes('rex') ||
    searchCorpus.includes('t-rex') ||
    searchCorpus.includes('lion') ||
    searchCorpus.includes('tiger') ||
    searchCorpus.includes('dragon') ||
    searchCorpus.includes('wolf') ||
    searchCorpus.includes('bear') ||
    searchCorpus.includes('beast')
  ) {
    return {
      hasSound: true,
      archetype: 'animal_creature',
      entityName: manifest.name,
      soundTitle: 'Apex Predator Biological Vocalization & Primal Roar',
      soundDescription: 'Massive chest cavity acoustic resonance, guttural sub-bass growl, and piercing territorial roar.',
      engineType: 'Biological Laryngeal Acoustic Apparatus',
      idleRpm: 20,
      maxRpm: 100,
      confidenceScore: 0.91,
      acousticDetails: {
        harmonicType: 'sawtooth',
        fundamentalFreq: 42,
        maxFreq: 180,
        hasTurboWhistle: false,
        hasExhaustBurble: false,
        hasPropChop: false,
        hasTurbineWhine: false,
        hasFogHorn: false,
        hasBiologicalGrowl: true
      }
    };
  }

  // 11. HUMAN / CHARACTER
  if (
    searchCorpus.includes('human') ||
    searchCorpus.includes('person') ||
    searchCorpus.includes('man') ||
    searchCorpus.includes('woman') ||
    searchCorpus.includes('character') ||
    searchCorpus.includes('astronaut') ||
    searchCorpus.includes('soldier') ||
    searchCorpus.includes('character_model')
  ) {
    return {
      hasSound: true,
      archetype: 'human_character',
      entityName: manifest.name,
      soundTitle: 'Human Biometric Acoustic Profile',
      soundDescription: 'Respiratory rhythm, ambient heartbeat pulse, and footsteps cadence.',
      engineType: 'Human Cardiovascular & Respiratory System',
      idleRpm: 60,
      maxRpm: 180,
      confidenceScore: 0.88,
      acousticDetails: {
        harmonicType: 'sine',
        fundamentalFreq: 60,
        maxFreq: 120,
        hasTurboWhistle: false,
        hasExhaustBurble: false,
        hasPropChop: false,
        hasTurbineWhine: false,
        hasFogHorn: false,
        hasBiologicalGrowl: false
      }
    };
  }

  // If no acoustic signature found, the model has NO sound (sound option is invisible)
  return createSilentProfile(manifest.name);
}

function createSilentProfile(name: string): AiSoundProfile {
  return {
    hasSound: false,
    archetype: 'none',
    entityName: name,
    soundTitle: 'No Acoustic Signature Detected',
    soundDescription: 'This 3D model represents a static object or structure without an internal combustion, propulsion, or biological acoustic signature.',
    engineType: 'Static Entity',
    idleRpm: 0,
    maxRpm: 0,
    confidenceScore: 0.99,
    acousticDetails: {
      harmonicType: 'sine',
      fundamentalFreq: 0,
      maxFreq: 0,
      hasTurboWhistle: false,
      hasExhaustBurble: false,
      hasPropChop: false,
      hasTurbineWhine: false,
      hasFogHorn: false,
      hasBiologicalGrowl: false
    }
  };
}
