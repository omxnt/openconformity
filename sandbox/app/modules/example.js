/**
 * A hardcoded example model: a generic machine, kept deliberately terse. It
 * exercises every entity type in metamodel 2.3 and every relationship in 2.4,
 * so the demo shows what the metamodel can express.
 *
 * The content is illustrative and holds no engineering judgement. No text from
 * any standard is reproduced: the standard requirements carry a clause number
 * and a topic, nothing more.
 */

import { addEntity, addFolder, addRelationship, createModel } from './model.js';

/**
 * The folders the example is filed into, each named with the folder that holds
 * it. Four at the top, following the work: what the machine is, what the law
 * asks of it, what can go wrong, and what is required and checked as a result.
 * @type {Array<[string, string|null]>}
 */
const FOLDERS = [
  ['System', null],
  ['Elements', 'System'],
  ['Actors', 'System'],
  ['Tasks', 'System'],
  ['Phases', 'System'],

  ['Legislation and standards', null],
  ['Legislation', 'Legislation and standards'],
  ['Standards', 'Legislation and standards'],
  ['Conformity assessment', 'Legislation and standards'],

  ['Risk assessment', null],
  ['Accident scenarios', 'Risk assessment'],
  ['Risk reduction measures', 'Risk assessment'],
  ['Safety functions', 'Risk assessment'],

  ['Requirements and verification', null],
  ['System requirements', 'Requirements and verification'],
  ['Verification activities', 'Requirements and verification'],
];

/**
 * Where each entity is filed: a folder by name, or another entity by
 * identifier. Filing is free and means nothing to the metamodel, so none of
 * this is enforced — but an entity filed under another is filed there because
 * the two are bound in the model, which is how a user would keep it. The
 * requirements a legislation defines sit under that legislation, the
 * requirements a standard defines under that standard, the hazards an element
 * exhibits under that element, and anything that decomposes into something
 * sits under what it came from.
 * @type {Object<string, string>}
 */
const FILING = {
  // The machine, part by part, each part holding the hazards it exhibits.
  'ELM-001': 'Elements',
  'ELM-002': 'ELM-001',
  'ELM-003': 'ELM-002',
  'ELM-004': 'ELM-002',
  'ELM-005': 'ELM-001',
  'ELM-006': 'ELM-001',
  'ELM-007': 'ELM-006',
  'ELM-008': 'ELM-001',
  'HAZ-001': 'ELM-005',
  'HAZ-002': 'ELM-005',
  'HAZ-003': 'ELM-002',
  'HAZ-004': 'ELM-008',
  'HAZ-005': 'ELM-008',
  'HAZ-006': 'ELM-005',

  // Who uses the machine, what they do, and when.
  'ACT-001': 'Actors',
  'ACT-002': 'Actors',
  'ACT-003': 'Actors',
  'TSK-001': 'Tasks',
  'TSK-002': 'Tasks',
  'TSK-003': 'Tasks',
  'TSK-004': 'Tasks',
  'PHS-001': 'Phases',
  'PHS-002': 'Phases',
  'PHS-003': 'Phases',
  'PHS-004': 'Phases',

  // The law, holding the essential requirements it defines.
  'LEG-001': 'Legislation',
  'LEG-002': 'Legislation',
  'ESR-001': 'LEG-001',
  'ESR-002': 'LEG-001',
  'ESR-003': 'LEG-001',
  'ESR-004': 'LEG-001',
  'ESR-005': 'LEG-001',
  'ESR-006': 'LEG-002',
  'ESR-007': 'LEG-002',

  // Each standard, holding the requirements it defines.
  'STD-001': 'Standards',
  'STD-002': 'Standards',
  'STD-003': 'Standards',
  'STD-004': 'Standards',
  'STR-001': 'STD-001',
  'STR-002': 'STD-001',
  'STR-003': 'STD-002',
  'STR-004': 'STD-002',
  'STR-005': 'STD-003',
  'STR-006': 'STD-003',
  'STR-007': 'STD-004',
  'STR-008': 'STD-004',

  // The assessment, holding the body it involves.
  'CAS-001': 'Conformity assessment',
  'CAS-002': 'Conformity assessment',
  'NTB-001': 'CAS-002',

  // What can go wrong, and what is done about it.
  'SCN-001': 'Accident scenarios',
  'SCN-002': 'Accident scenarios',
  'SCN-003': 'Accident scenarios',
  'SCN-004': 'Accident scenarios',
  'RRM-001': 'Risk reduction measures',
  'RRM-002': 'Risk reduction measures',
  'RRM-003': 'Risk reduction measures',
  'RRM-004': 'Risk reduction measures',
  'RRM-005': 'Risk reduction measures',
  'RRM-006': 'Risk reduction measures',
  'SAF-001': 'Safety functions',
  'SAF-002': 'Safety functions',
  'SAF-003': 'SAF-002',
  'SAF-004': 'SAF-002',

  // What the machine must do, and what shows that it does.
  'REQ-001': 'System requirements',
  'REQ-002': 'REQ-001',
  'REQ-003': 'REQ-001',
  'REQ-004': 'System requirements',
  'REQ-005': 'System requirements',
  'VER-001': 'Verification activities',
  'VER-002': 'Verification activities',
  'VER-003': 'Verification activities',
  'VER-004': 'Verification activities',
};

/** @type {Array<[string, string, Object<string, string>]>} */
const ENTITIES = [
  // --- System Context ---------------------------------------------------
  ['ELM-001', 'ELM', { title: 'Machine', description: 'The machinery placed on the market.' }],
  ['ELM-002', 'ELM', { title: 'Control System', description: 'Controls the machine and evaluates the safety inputs.' }],
  ['ELM-003', 'ELM', { title: 'Safety Controller', description: 'Safety-related part of the control system.' }],
  ['ELM-004', 'ELM', { title: 'Emergency Stop Device', description: 'Mushroom-head device at the operating position.' }],
  ['ELM-005', 'ELM', { title: 'Drive Unit', description: 'Motor and gearbox driving the moving parts.' }],
  ['ELM-006', 'ELM', { title: 'Guarding', description: 'Fixed panels enclosing the drive area, with one access door.' }],
  ['ELM-007', 'ELM', { title: 'Interlock Switch', description: 'Coded interlocking device on the guard door.' }],
  ['ELM-008', 'ELM', { title: 'Electrical Cabinet', description: 'Houses the supply, the drives and the control gear.' }],

  ['ACT-001', 'ACT', { title: 'Operator', description: 'Runs the machine and clears jams.' }],
  ['ACT-002', 'ACT', { title: 'Maintenance Technician', description: 'Services the machine with the guards open.' }],
  ['ACT-003', 'ACT', { title: 'Cleaner', description: 'Cleans the machine after a production run.' }],

  ['TSK-001', 'TSK', { title: 'Load Material', description: 'Material is fed into the machine.' }],
  ['TSK-002', 'TSK', { title: 'Clear Jam', description: 'A blockage in the product path is freed by hand.' }],
  ['TSK-003', 'TSK', { title: 'Replace Part', description: 'A worn part is exchanged inside the guarding.' }],
  ['TSK-004', 'TSK', { title: 'Clean Machine', description: 'Residue is removed from the product path.' }],

  ['PHS-001', 'PHS', { title: 'Installation', description: 'The machine is put in place and connected.' }],
  ['PHS-002', 'PHS', { title: 'Operation', description: 'The machine runs the production programme.' }],
  ['PHS-003', 'PHS', { title: 'Maintenance', description: 'Planned service and repair.' }],
  ['PHS-004', 'PHS', { title: 'Decommissioning', description: 'The machine is taken out of service.' }],

  // --- Legislative Framework -------------------------------------------
  ['LEG-001', 'LEG', { title: 'Machinery Regulation (EU) 2023/1230', description: 'Applies to the machine as placed on the market.' }],
  ['LEG-002', 'LEG', { title: 'EMC Directive 2014/30/EU', description: 'Applies to the electrical equipment of the machine.' }],

  ['STD-001', 'STD', { title: 'EN ISO 12100 Safety of machinery — General principles for design', description: 'Type A standard. The framework for the risk assessment.' }],
  ['STD-002', 'STD', { title: 'EN ISO 13849-1 Safety-related parts of control systems', description: 'Type B standard. Applied to the safety functions.' }],
  ['STD-003', 'STD', { title: 'EN ISO 14119 Interlocking devices associated with guards', description: 'Type B standard. Applied to the guard interlock.' }],
  ['STD-004', 'STD', { title: 'EN 60204-1 Electrical equipment of machines', description: 'Type B standard. Applied to the electrical equipment.' }],

  ['CAS-001', 'CAS', { title: 'Internal Control', description: 'Assessed by the manufacturer, without a notified body.' }],
  ['CAS-002', 'CAS', { title: 'EU Type-Examination', description: 'Assessed by a notified body for the safety component.' }],

  ['NTB-001', 'NTB', { title: 'Notified Body', description: 'Placeholder. No real body is named in this example.' }],

  // --- Risk Assessment --------------------------------------------------
  ['HAZ-001', 'HAZ', { title: 'Moving Parts', group: 'Mechanical', description: 'Rotating and translating parts in the drive area.' }],
  ['HAZ-002', 'HAZ', { title: 'Stored Energy', group: 'Mechanical', description: 'Energy held in the drive after the supply is removed.' }],
  ['HAZ-003', 'HAZ', { title: 'Unexpected Start-up', group: 'Mechanical', description: 'The machine starts while someone is inside the guarding.' }],
  ['HAZ-004', 'HAZ', { title: 'Live Parts', group: 'Electrical', description: 'Terminals that stay live when the main switch is off.' }],
  ['HAZ-005', 'HAZ', { title: 'Short Circuit', group: 'Electrical', description: 'A fault current in the electrical equipment.' }],
  ['HAZ-006', 'HAZ', { title: 'Hot Surface', group: 'Thermal', description: 'Surfaces of the drive that stay hot after a run.' }],

  ['SCN-001', 'SCN', {
    title: 'Contact with Moving Parts',
    hazardZone: 'Drive Unit',
    hazardousSituation: 'Operator reaches into the drive area to clear a jam.',
    hazardousEvent: 'Drive starts while the hand is in the hazard zone.',
    consequence: 'Crushing of the hand',
    riskBefore: 'S3/P4',
    riskAfter: 'S3/P1',
  }],
  ['SCN-002', 'SCN', {
    title: 'Electric Shock',
    hazardZone: 'Electrical Cabinet',
    hazardousSituation: 'Technician works in the cabinet with the supply connected.',
    hazardousEvent: 'Contact with a live part.',
    consequence: 'Electric shock',
    riskBefore: 'S4/P3',
    riskAfter: 'S4/P1',
  }],
  ['SCN-003', 'SCN', {
    title: 'Start-up During Maintenance',
    hazardZone: 'Guarded Area',
    hazardousSituation: 'Technician inside the guarding with the machine not isolated.',
    hazardousEvent: 'Machine restarts.',
    consequence: 'Crushing',
    riskBefore: 'S4/P2',
    riskAfter: 'S2/P1',
  }],
  ['SCN-004', 'SCN', {
    title: 'Burn on Hot Surface',
    hazardZone: 'Drive Unit',
    hazardousSituation: 'Cleaner works close to the drive after a production run.',
    hazardousEvent: 'Contact with a hot surface.',
    consequence: 'Burn to the hand',
    riskBefore: 'S2/P4',
    riskAfter: 'S1/P2',
  }],

  ['RRM-001', 'RRM', { title: 'Fixed Guard', description: 'Panels that enclose the drive area.' }],
  ['RRM-002', 'RRM', { title: 'Interlocked Guard', description: 'Access door with a coded interlock and guard locking.' }],
  ['RRM-003', 'RRM', { title: 'Emergency Stop', description: 'Device that stops the machine on demand.' }],
  ['RRM-004', 'RRM', { title: 'Energy Isolation', description: 'Lockable device that removes the electrical supply.' }],
  ['RRM-005', 'RRM', { title: 'Warning Label', description: 'Marking at the hot surface of the drive.' }],
  ['RRM-006', 'RRM', { title: 'Instructions for Use', description: 'Procedure for clearing a jam with the machine stopped.' }],

  ['SAF-001', 'SAF', {
    title: 'Emergency Stop',
    performanceLevel: 'PL c',
    category: '1',
    briefDescription: 'Stops all drives when an emergency stop device is operated.',
    triggeringEvent: 'Emergency stop device operated',
    reaction: 'Power removed from all drives',
    safeState: 'Drives at standstill, restart inhibited',
  }],
  ['SAF-002', 'SAF', {
    title: 'Door Interlock',
    performanceLevel: 'PL d',
    category: '3',
    briefDescription: 'Stops the drives when the guard door is opened and prevents restart.',
    triggeringEvent: 'Guard door opened',
    reaction: 'Power removed from the drives',
    safeState: 'Drives at standstill, restart inhibited',
  }],
  ['SAF-003', 'SAF', {
    title: 'Position Detection',
    performanceLevel: 'PL d',
    category: '3',
    briefDescription: 'Detects the guard door position on two channels.',
    triggeringEvent: 'Guard door leaves the closed position',
    reaction: 'Both channels signal open',
    safeState: 'Guard reported open',
  }],
  ['SAF-004', 'SAF', {
    title: 'Safe Torque Off',
    performanceLevel: 'PL d',
    category: '3',
    briefDescription: 'Removes torque from the drives on two channels.',
    triggeringEvent: 'Stop demanded by the safety controller',
    reaction: 'Drive enable removed on both channels',
    safeState: 'No torque at the drives',
  }],

  // --- Requirements Definition -----------------------------------------
  ['ESR-001', 'ESR', { title: '1.2.4.3 Emergency Stop', description: 'Machinery shall be fitted with an emergency stop device.' }],
  ['ESR-002', 'ESR', { title: '1.3.7 Moving Parts', description: 'Moving parts shall prevent contact, or be guarded.' }],
  ['ESR-003', 'ESR', { title: '1.4.2 Guards', description: 'Guards shall be robust, held in place and hard to defeat.' }],
  ['ESR-004', 'ESR', { title: '1.5.1 Electricity', description: 'Electrically powered machinery shall prevent electrical hazards.' }],
  ['ESR-005', 'ESR', { title: '1.6.3 Isolation of Energy Sources', description: 'Machinery shall provide a means to isolate its energy sources.' }],
  ['ESR-006', 'ESR', { title: 'Annex I 1.1 Protection Requirements', description: 'Equipment shall not generate disturbance above the intended level.' }],
  ['ESR-007', 'ESR', { title: 'Annex I 1.2 Immunity', description: 'Equipment shall work as intended in the presence of disturbance.' }],

  ['STR-001', 'STR', { title: '5.4 Risk Estimation', description: 'How severity, exposure and avoidance combine into a risk.' }],
  ['STR-002', 'STR', { title: '6.2 Inherently Safe Design', description: 'Measures that remove a hazard by design rather than by guarding.' }],
  ['STR-003', 'STR', { title: '4.5 Required Performance Level', description: 'How the performance level required of a function is determined.' }],
  ['STR-004', 'STR', { title: '6.2 Category Requirements', description: 'What the designated architecture has to achieve.' }],
  ['STR-005', 'STR', { title: '5 Interlock Selection', description: 'How an interlocking device is chosen for a guard.' }],
  ['STR-006', 'STR', { title: '7 Prevention of Defeat', description: 'How defeat with a spare actuator is prevented.' }],
  ['STR-007', 'STR', { title: '9.2 Stop Categories', description: 'The stop categories, and when each one applies.' }],
  ['STR-008', 'STR', { title: '5.3 Supply Disconnecting Device', description: 'The device that isolates the electrical supply.' }],

  ['REQ-001', 'REQ', {
    title: 'Access Protection',
    requirement: 'The machine shall prevent access to the drive area while the drives can move.',
    rationale: 'Access to the drive area is the common cause of the recorded scenarios.',
    type: 'Function/Performance',
  }],
  ['REQ-002', 'REQ', {
    title: 'Guard Fastening',
    requirement: 'The machine shall retain fixed guards with fasteners that stay attached to the guard.',
    rationale: 'Loose fasteners are why a guard is left off after maintenance.',
    type: 'Form',
  }],
  ['REQ-003', 'REQ', {
    title: 'Guard Interlocking',
    requirement: 'While the drives can move, the machine shall keep the guard door locked closed.',
    rationale: 'The drives overrun after a stop command.',
    type: 'Function/Performance',
  }],
  ['REQ-004', 'REQ', {
    title: 'Emergency Stop Devices',
    requirement: 'The machine shall provide an emergency stop device at each operating position.',
    rationale: 'Required at every position occupied while the machine can move.',
    type: 'Compliance',
  }],
  ['REQ-005', 'REQ', {
    title: 'Supply Isolation',
    requirement: 'The machine shall provide a lockable device that isolates the electrical supply.',
    rationale: 'Maintenance is carried out inside the guarding.',
    type: 'Fit/Operational',
  }],

  ['VER-001', 'VER', {
    title: 'Emergency Stop Test',
    description: 'Operate each emergency stop device during a cycle.',
    method: 'Test',
    criteria: 'All drives stop and the machine does not restart on release.',
  }],
  ['VER-002', 'VER', {
    title: 'Interlock Test',
    description: 'Open the guard door during a cycle.',
    method: 'Test',
    criteria: 'The door stays locked until standstill is reached.',
  }],
  ['VER-003', 'VER', {
    title: 'Guard Inspection',
    description: 'Remove each fixed guard panel.',
    method: 'Inspection',
    criteria: 'No fastener separates from the guard without a tool.',
  }],
  ['VER-004', 'VER', {
    title: 'Circuit Analysis',
    description: 'Review the safety circuit against the claimed architecture and reliability data.',
    method: 'Analysis',
    criteria: 'The achieved performance level is not lower than the required one.',
  }],
];

/** @type {Array<[string, string, string]>} */
const RELATIONSHIPS = [
  // System Context
  ['ELM-001', 'elm-decomposes-into-elm', 'ELM-002'],
  ['ELM-001', 'elm-decomposes-into-elm', 'ELM-005'],
  ['ELM-001', 'elm-decomposes-into-elm', 'ELM-006'],
  ['ELM-001', 'elm-decomposes-into-elm', 'ELM-008'],
  ['ELM-002', 'elm-decomposes-into-elm', 'ELM-003'],
  ['ELM-002', 'elm-decomposes-into-elm', 'ELM-004'],
  ['ELM-006', 'elm-decomposes-into-elm', 'ELM-007'],

  ['ELM-001', 'elm-has-act', 'ACT-001'],
  ['ELM-001', 'elm-has-act', 'ACT-002'],
  ['ELM-001', 'elm-has-act', 'ACT-003'],
  ['ELM-001', 'elm-has-phs', 'PHS-001'],
  ['ELM-001', 'elm-has-phs', 'PHS-002'],
  ['ELM-001', 'elm-has-phs', 'PHS-003'],
  ['ELM-001', 'elm-has-phs', 'PHS-004'],

  ['ACT-001', 'act-performs-tsk', 'TSK-001'],
  ['ACT-001', 'act-performs-tsk', 'TSK-002'],
  ['ACT-002', 'act-performs-tsk', 'TSK-003'],
  ['ACT-003', 'act-performs-tsk', 'TSK-004'],

  ['TSK-001', 'tsk-during-phs', 'PHS-002'],
  ['TSK-002', 'tsk-during-phs', 'PHS-002'],
  ['TSK-003', 'tsk-during-phs', 'PHS-003'],
  ['TSK-004', 'tsk-during-phs', 'PHS-003'],

  // Legislative Framework
  ['ELM-001', 'elm-subject-to-leg', 'LEG-001'],
  ['ELM-001', 'elm-subject-to-leg', 'LEG-002'],
  ['ELM-001', 'elm-subject-to-std', 'STD-001'],
  ['ELM-002', 'elm-subject-to-std', 'STD-002'],
  ['ELM-007', 'elm-subject-to-std', 'STD-003'],
  ['ELM-008', 'elm-subject-to-std', 'STD-004'],

  ['LEG-001', 'leg-defines-esr', 'ESR-001'],
  ['LEG-001', 'leg-defines-esr', 'ESR-002'],
  ['LEG-001', 'leg-defines-esr', 'ESR-003'],
  ['LEG-001', 'leg-defines-esr', 'ESR-004'],
  ['LEG-001', 'leg-defines-esr', 'ESR-005'],
  ['LEG-002', 'leg-defines-esr', 'ESR-006'],
  ['LEG-002', 'leg-defines-esr', 'ESR-007'],
  ['LEG-001', 'leg-defines-cas', 'CAS-001'],
  ['LEG-001', 'leg-defines-cas', 'CAS-002'],
  ['CAS-002', 'cas-involves-ntb', 'NTB-001'],

  ['STD-001', 'std-harmonised-to-leg', 'LEG-001'],
  ['STD-002', 'std-harmonised-to-leg', 'LEG-001'],
  ['STD-003', 'std-harmonised-to-leg', 'LEG-001'],
  ['STD-004', 'std-harmonised-to-leg', 'LEG-001'],

  ['STD-001', 'std-defines-str', 'STR-001'],
  ['STD-001', 'std-defines-str', 'STR-002'],
  ['STD-002', 'std-defines-str', 'STR-003'],
  ['STD-002', 'std-defines-str', 'STR-004'],
  ['STD-003', 'std-defines-str', 'STR-005'],
  ['STD-003', 'std-defines-str', 'STR-006'],
  ['STD-004', 'std-defines-str', 'STR-007'],
  ['STD-004', 'std-defines-str', 'STR-008'],

  // Risk Assessment
  ['ELM-005', 'elm-exhibits-haz', 'HAZ-001'],
  ['ELM-005', 'elm-exhibits-haz', 'HAZ-002'],
  ['ELM-005', 'elm-exhibits-haz', 'HAZ-006'],
  ['ELM-002', 'elm-exhibits-haz', 'HAZ-003'],
  ['ELM-008', 'elm-exhibits-haz', 'HAZ-004'],
  ['ELM-008', 'elm-exhibits-haz', 'HAZ-005'],

  ['HAZ-001', 'haz-contributes-to-scn', 'SCN-001'],
  ['HAZ-003', 'haz-contributes-to-scn', 'SCN-003'],
  ['HAZ-004', 'haz-contributes-to-scn', 'SCN-002'],
  ['HAZ-006', 'haz-contributes-to-scn', 'SCN-004'],

  ['HAZ-001', 'haz-triggers-esr', 'ESR-002'],
  ['HAZ-002', 'haz-triggers-esr', 'ESR-005'],
  ['HAZ-003', 'haz-triggers-esr', 'ESR-001'],
  ['HAZ-004', 'haz-triggers-esr', 'ESR-004'],
  ['HAZ-005', 'haz-triggers-esr', 'ESR-004'],
  ['HAZ-006', 'haz-triggers-esr', 'ESR-003'],

  ['TSK-002', 'tsk-leads-to-scn', 'SCN-001'],
  ['TSK-003', 'tsk-leads-to-scn', 'SCN-002'],
  ['TSK-003', 'tsk-leads-to-scn', 'SCN-003'],
  ['TSK-004', 'tsk-leads-to-scn', 'SCN-004'],

  ['ACT-001', 'act-exposed-in-scn', 'SCN-001'],
  ['ACT-002', 'act-exposed-in-scn', 'SCN-002'],
  ['ACT-002', 'act-exposed-in-scn', 'SCN-003'],
  ['ACT-003', 'act-exposed-in-scn', 'SCN-004'],

  ['RRM-001', 'rrm-mitigates-haz', 'HAZ-001'],
  ['RRM-002', 'rrm-mitigates-haz', 'HAZ-001'],
  ['RRM-003', 'rrm-mitigates-haz', 'HAZ-003'],
  ['RRM-004', 'rrm-mitigates-haz', 'HAZ-002'],
  ['RRM-004', 'rrm-mitigates-haz', 'HAZ-004'],
  ['RRM-005', 'rrm-mitigates-haz', 'HAZ-006'],

  ['RRM-002', 'rrm-mitigates-scn', 'SCN-001'],
  ['RRM-004', 'rrm-mitigates-scn', 'SCN-002'],
  ['RRM-004', 'rrm-mitigates-scn', 'SCN-003'],
  ['RRM-006', 'rrm-mitigates-scn', 'SCN-004'],

  ['RRM-002', 'rrm-implements-str', 'STR-005'],
  ['RRM-002', 'rrm-implements-str', 'STR-006'],
  ['RRM-003', 'rrm-implements-str', 'STR-007'],

  ['SAF-002', 'saf-decomposes-into-saf', 'SAF-003'],
  ['SAF-002', 'saf-decomposes-into-saf', 'SAF-004'],
  ['SAF-001', 'saf-realises-rrm', 'RRM-003'],
  ['SAF-002', 'saf-realises-rrm', 'RRM-002'],

  ['RRM-001', 'rrm-allocated-to-elm', 'ELM-006'],
  ['RRM-002', 'rrm-allocated-to-elm', 'ELM-007'],
  ['RRM-003', 'rrm-allocated-to-elm', 'ELM-004'],
  ['RRM-004', 'rrm-allocated-to-elm', 'ELM-008'],
  ['SAF-001', 'saf-allocated-to-elm', 'ELM-003'],
  ['SAF-002', 'saf-allocated-to-elm', 'ELM-003'],
  ['SAF-003', 'saf-allocated-to-elm', 'ELM-007'],
  ['SAF-004', 'saf-allocated-to-elm', 'ELM-005'],

  // Requirements Definition
  ['STR-002', 'str-satisfies-esr', 'ESR-002'],
  ['STR-003', 'str-satisfies-esr', 'ESR-002'],
  ['STR-005', 'str-satisfies-esr', 'ESR-003'],
  ['STR-006', 'str-satisfies-esr', 'ESR-003'],
  ['STR-007', 'str-satisfies-esr', 'ESR-001'],
  ['STR-008', 'str-satisfies-esr', 'ESR-005'],

  ['ESR-002', 'esr-allocated-to-elm', 'ELM-005'],
  ['ESR-003', 'esr-allocated-to-elm', 'ELM-006'],
  ['ESR-004', 'esr-allocated-to-elm', 'ELM-008'],
  ['ESR-006', 'esr-allocated-to-elm', 'ELM-002'],
  ['STR-005', 'str-allocated-to-elm', 'ELM-007'],
  ['STR-003', 'str-allocated-to-elm', 'ELM-003'],

  ['REQ-001', 'req-decomposes-into-req', 'REQ-002'],
  ['REQ-001', 'req-decomposes-into-req', 'REQ-003'],
  ['REQ-003', 'req-derives-from-str', 'STR-005'],
  ['REQ-003', 'req-derives-from-str', 'STR-006'],
  ['REQ-004', 'req-derives-from-str', 'STR-007'],
  ['REQ-002', 'req-derives-from-rrm', 'RRM-001'],
  ['REQ-004', 'req-derives-from-rrm', 'RRM-003'],
  ['REQ-005', 'req-derives-from-rrm', 'RRM-004'],
  ['REQ-003', 'req-derives-from-saf', 'SAF-002'],
  ['REQ-004', 'req-derives-from-saf', 'SAF-001'],

  ['REQ-001', 'req-allocated-to-elm', 'ELM-005'],
  ['REQ-002', 'req-allocated-to-elm', 'ELM-006'],
  ['REQ-003', 'req-allocated-to-elm', 'ELM-007'],
  ['REQ-004', 'req-allocated-to-elm', 'ELM-004'],
  ['REQ-005', 'req-allocated-to-elm', 'ELM-008'],

  ['VER-001', 'ver-verifies-req', 'REQ-004'],
  ['VER-002', 'ver-verifies-req', 'REQ-003'],
  ['VER-003', 'ver-verifies-req', 'REQ-002'],
  ['VER-003', 'ver-verifies-rrm', 'RRM-001'],
  ['VER-002', 'ver-verifies-rrm', 'RRM-002'],
  ['VER-004', 'ver-verifies-saf', 'SAF-002'],
  ['VER-001', 'ver-verifies-saf', 'SAF-001'],

  ['VER-001', 'ver-allocated-to-elm', 'ELM-004'],
  ['VER-002', 'ver-allocated-to-elm', 'ELM-007'],
  ['VER-003', 'ver-allocated-to-elm', 'ELM-006'],
  ['VER-004', 'ver-allocated-to-elm', 'ELM-003'],
];

/**
 * Build the example model. Relationships go through the same enforcement as
 * anything the user creates, so an example that broke the metamodel would fail
 * here rather than load.
 * @returns {import('./model.js').Model}
 */
export function buildExampleModel() {
  const model = createModel('Example machine');

  /** @type {Map<string, string>} */
  const folderId = new Map();
  for (const [name, within] of FOLDERS) {
    const holder = within === null ? null : folderId.get(within);
    if (within !== null && holder === undefined) {
      throw new Error(`Example model: "${name}" is filed in "${within}", which is not a folder above it.`);
    }
    folderId.set(name, addFolder(model, name, holder ?? null).id);
  }

  // Filing names a folder or an entity already in the model. An entity that
  // holds another is always created first, so a name that resolves to neither
  // is a mistake in the table rather than something to file at the top.
  for (const [id, code, attributes] of ENTITIES) {
    const where = FILING[id];
    const parent = folderId.get(where) ?? (model.entities.has(where) ? where : null);
    if (!parent) {
      throw new Error(`Example model: ${id} is filed under "${where}", which is neither a folder nor an entity above it.`);
    }
    addEntity(model, code, attributes, { id, parent });
    const number = Number.parseInt(id.split('-')[1], 10);
    model.counters[code] = Math.max(model.counters[code] ?? 0, number);
  }

  for (const [source, type, target] of RELATIONSHIPS) {
    const result = addRelationship(model, type, source, target);
    if (!result.ok) {
      throw new Error(`Example model: ${source} ${type} ${target} — ${result.reason}`);
    }
  }

  return model;
}
