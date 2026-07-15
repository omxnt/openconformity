/**
 * Demo project loader.
 *
 * Adds a new "Hydraulic Press 200T (demo)" project to the workspace and
 * makes it active. Existing projects in the workspace are left alone —
 * this is *additive*, like opening a file.
 *
 * The demo content is built through the same state mutations a user
 * would perform, so adding new fields to types.js doesn't break it
 * (defaults fill in cleanly). Numerical inputs in the calculator run
 * through the real compute function so the stored result is consistent
 * with the formula.
 *
 * Disclaimer: this is illustrative content for demonstration only, not
 * regulatory advice.
 */

import * as state from './state.js';
import { runCalculator } from './calculators/index.js';

/**
 * Build the demo project, append it to the workspace, and select an
 * artifact with rich relationships so the trace pane is interesting.
 * @returns {string} the new project's workspace id
 */
export function loadDemoProject() {
  const projectId = state.createProject({
    name: 'Hydraulic Press 200T (demo)',
    makeActive: true,
  });

  // Convenience: pre-bind projectId so the rest reads cleanly.
  const add = (typeKey, data) => state.addArtifact(projectId, typeKey, data);

  // --- Systems --------------------------------------------------------

  const sysPress = add('architectureElement', {
    name: 'Hydraulic Press 200T',
    description:
      'C-frame hydraulic press, 200-tonne capacity, intended for cold forming of mild-steel sheet up to 6 mm.',
  });

  const sysHpu = add('architectureElement', {
    name: 'Hydraulic Power Unit',
    parentId: sysPress,
    description:
      'Reservoir, electric motor, axial-piston pump, manifold, and pressure-relief valve. Operates at up to 250 bar.',
  });
  add('architectureElement', {
    name: 'Main pump',
    parentId: sysHpu,
    description: 'Axial-piston pump, 90 cm³/rev, driven by a 30 kW asynchronous motor.',
  });
  add('architectureElement', {
    name: 'Pressure relief valve',
    parentId: sysHpu,
    description: 'Pilot-operated relief valve set to 250 bar; secondary protective device against overpressure.',
  });

  const sysFrame = add('architectureElement', {
    name: 'Press frame and platen',
    parentId: sysPress,
    description: 'Welded steel C-frame; upper platen driven by main cylinder; lower platen fixed.',
  });

  const sysControl = add('architectureElement', {
    name: 'Control system',
    parentId: sysPress,
    description: 'Safety-rated PLC with redundant outputs to the main valve and brake.',
  });
  add('architectureElement', {
    name: 'Two-hand control unit',
    parentId: sysControl,
    description: 'Type IIIC two-hand control with synchronisation < 0.5 s.',
  });
  add('architectureElement', {
    name: 'Light curtain',
    parentId: sysControl,
    description: 'Type 4 ESPE, resolution 30 mm, mounted at the front access of the working zone.',
  });

  // --- Legislation + essential requirements --------------------------

  const legMachinery = add('legislation', {
    libraryRef: 'machinery-2023-1230',
    name: 'Machinery Regulation',
    reference: '(EU) 2023/1230',
    notes: 'Primary applicable EU legislation for this product.',
  });

  const er112 = add('essentialRequirement', {
    legislationId: legMachinery,
    libraryRef: 'machinery-2023-1230:1.1.2',
    code: '1.1.2',
    title: 'Principles of safety integration',
    text:
      'Machinery shall be designed and constructed so as to be fit for its function and to be operated, adjusted and maintained without putting persons at risk when these operations are carried out under the conditions foreseen, taking also into account any reasonably foreseeable misuse.',
    applicabilityNote: 'Applies in full.',
  });

  const er137 = add('essentialRequirement', {
    legislationId: legMachinery,
    libraryRef: 'machinery-2023-1230:1.3.7',
    code: '1.3.7',
    title: 'Risks related to moving parts',
    text:
      'The moving parts of machinery shall be designed and constructed in such a way as to prevent risks of contact which could lead to accidents or, where risks persist, be fitted with guards or protective devices.',
    applicabilityNote: 'Applies — closing motion of the upper platen is the dominant moving-parts hazard.',
  });

  const er161 = add('essentialRequirement', {
    legislationId: legMachinery,
    libraryRef: 'machinery-2023-1230:1.6.1',
    code: '1.6.1',
    title: 'Machinery maintenance',
    text:
      'Adjustment and maintenance points shall be located outside danger zones. It shall be possible to carry out adjustment, maintenance, repair, cleaning and servicing operations while the machinery is at a standstill.',
    applicabilityNote: 'Applies — energy isolation and lockout-tagout required for hydraulic system maintenance.',
  });

  // --- Preliminary hazards ------------------------------------------

  const phazCrush = add('preliminaryHazard', {
    name: 'Crushing at platen during closing',
    description: 'Operator hand or upper limb in the closing zone of the platen during a normal cycle.',
    architectureId: sysFrame,
    lifecyclePhase: 'normal-use',
    energySource: 'mechanical',
  });

  const phazPinch = add('preliminaryHazard', {
    name: 'Pinching during tool change',
    description: 'Hand pinched between tool and platen during manual tool installation.',
    architectureId: sysFrame,
    lifecyclePhase: 'maintenance',
    energySource: 'mechanical',
  });

  const phazHotOil = add('preliminaryHazard', {
    name: 'Hot oil burn during maintenance',
    description: 'Contact with hot hydraulic oil when opening the reservoir or replacing the filter.',
    architectureId: sysHpu,
    lifecyclePhase: 'maintenance',
    energySource: 'thermal',
  });

  const phazPressureOil = add('preliminaryHazard', {
    name: 'Pressurised oil release during maintenance',
    description: 'Stored hydraulic energy in accumulators or hoses released unexpectedly when the system is opened.',
    architectureId: sysHpu,
    lifecyclePhase: 'maintenance',
    energySource: 'mechanical',
  });

  add('preliminaryHazard', {
    name: 'Slip on hydraulic oil leak',
    description: 'Floor contamination near the press from a slow oil leak.',
    architectureId: sysPress,
    lifecyclePhase: 'normal-use',
    energySource: 'ergonomic',
  });

  // --- Consolidated hazards ----------------------------------------

  const chazPlatten = add('consolidatedHazard', {
    name: 'Crushing at platen during cycle',
    description:
      'Body part in the closing zone of the upper platen during normal operation. Consolidates the platen-crush and tool-change pinching hazards because both relate to the same mechanism and zone.',
    architectureId: sysPress,
    derivedFromPreliminaryIds: [phazCrush, phazPinch],
    severityId: 's3',
    probabilityId: 'p3',
    riskLevelId: 'high',
    rationale:
      'Severity: critical (irreversible injury, e.g. crush amputation). Probability: occasional given the manual loading workflow and reach distances.',
  });

  const chazHotPressure = add('consolidatedHazard', {
    name: 'Hot pressurised hydraulic system during maintenance',
    description:
      'Maintenance personnel exposed to thermal burns and uncontrolled release of stored hydraulic energy when servicing the HPU.',
    architectureId: sysHpu,
    derivedFromPreliminaryIds: [phazHotOil, phazPressureOil],
    severityId: 's2',
    probabilityId: 'p2',
    riskLevelId: 'medium',
    rationale:
      'Severity: marginal (reversible burns or impact). Probability: remote given that maintenance is carried out by trained staff under documented procedures.',
  });

  // --- Risk-reducing measures --------------------------------------

  const calcInputs = {
    approachSpeed: 1600,
    overallResponseTime: 120,
    detectionCapability: 30,
  };
  const calcResult = runCalculator('iso-13855', calcInputs);

  const rrmLightCurtain = add('riskReducingMeasure', {
    name: 'Light curtain with two-hand control',
    description:
      'Type 4 ESPE (light curtain) at the front access combined with a Type IIIC two-hand control. Both must be intact for a cycle to start; light-curtain interruption halts the closing motion.',
    category: 'safeguarding',
    addressedHazardIds: [chazPlatten],
    calculator: {
      type: 'iso-13855',
      inputs: calcInputs,
      result: calcResult,
      snapshotStandardVersion: 'ISO 13855:2010',
    },
    residualSeverityId: 's3',
    residualProbabilityId: 'p1',
    residualRiskLevelId: 'medium',
  });

  const rrmLOTO = add('riskReducingMeasure', {
    name: 'Lockout / tagout procedure for hydraulic maintenance',
    description:
      'Documented procedure: cool down, isolate the main supply, vent residual pressure to zero, lock and tag, verify zero pressure before opening the system.',
    category: 'information',
    addressedHazardIds: [chazHotPressure],
    residualSeverityId: 's2',
    residualProbabilityId: 'p1',
    residualRiskLevelId: 'low',
  });

  // --- Safety function ---------------------------------------------

  const sfStop = add('safetyFunction', {
    name: 'Stop on light-curtain interruption',
    description:
      'When the light curtain detects an intrusion during the closing motion, the safety relay opens the main directional valve and engages the brake.',
    methodology: 'iso-13849',
    S: 'S2',
    F: 'F2',
    P: 'P1',
    requiredPL: 'd',
    addressedHazardIds: [chazPlatten],
    implementedByMeasureIds: [rrmLightCurtain],
  });

  // --- Derived requirements ---------------------------------------

  const dreqStopTime = add('derivedRequirement', {
    text: 'The press shall stop within 200 ms of any light-curtain interruption during closing.',
    rationale:
      'Stopping time is the dominant component of total response time T in the ISO 13855 safety-distance calculation. 200 ms keeps the required mounting distance under 290 mm at K=1600 mm/s with d=30 mm intrusion distance.',
    acceptanceCriteria: 'Measured stop time < 200 ms across 10 trials at full hydraulic temperature.',
    verificationMethod: 'test',
    priority: 'must',
    status: 'approved',
    originatingRefs: [
      { type: 'safetyFunction', id: sfStop },
      { type: 'essentialRequirement', id: er137 },
    ],
    allocatedArchitectureId: sysControl,
  });

  add('derivedRequirement', {
    text: 'Maintenance access points shall be lockable in the energy-isolated state.',
    rationale:
      'Required to enforce the lockout/tagout procedure that mitigates the hot-pressurised-system hazard.',
    acceptanceCriteria: 'Inspection: every maintenance access has a lockable disconnect or padlock provision.',
    verificationMethod: 'inspection',
    priority: 'must',
    status: 'draft',
    originatingRefs: [
      { type: 'riskReducingMeasure', id: rrmLOTO },
      { type: 'essentialRequirement', id: er161 },
    ],
    allocatedArchitectureId: sysHpu,
  });

  add('derivedRequirement', {
    text: 'The reservoir filler cap shall be marked "HOT — wait until cool" with a pictogram visible from the maintenance position.',
    rationale: 'Information measure: warns maintenance personnel of the residual thermal hazard.',
    acceptanceCriteria: 'Inspection: durable, legible marking present, ISO 7010 W017 (Hot surface) used.',
    verificationMethod: 'inspection',
    priority: 'should',
    status: 'draft',
    originatingRefs: [
      { type: 'consolidatedHazard', id: chazHotPressure },
      { type: 'essentialRequirement', id: er112 },
    ],
    allocatedArchitectureId: sysHpu,
  });

  // --- Verification activity -------------------------------------

  add('verificationActivity', {
    requirementId: dreqStopTime,
    method: 'test',
    procedure:
      'Bench test rig BTR-04. Trigger light curtain at mid-closing motion; record stop time via calibrated photo gate. Repeat 10 times at hydraulic-temperature steady state.',
    expectedResult: 'Stop time < 200 ms in every trial; standard deviation < 20 ms.',
    actualResult: '',
    status: 'planned',
    executor: 'Test engineering',
  });

  state.select({ projectId, artifactId: chazPlatten });
  return projectId;
}
