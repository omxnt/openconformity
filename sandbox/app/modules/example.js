/**
 * A hardcoded example model: the CE marking work for a form, fill and seal
 * packaging machine. It exercises every entity type in metamodel 2.3 and every
 * relationship in 2.4, so the demo shows what the metamodel can express.
 *
 * The content is illustrative. No text from any standard is reproduced: where
 * a Standard Requirement appears, its description is the engineering
 * requirement as a user would write it for their own machine.
 */

import { addEntity, addFolder, addRelationship, createModel } from './model.js';

/** @type {Array<[string, string, string|null]>}  id, name, parent */
const FOLDERS = [
  ['F-1', 'Guarding', null],
  ['F-2', 'Distances', 'F-1'],
  ['F-3', 'Control system', null],
];

/** Every folder in the example files Standard Requirements. */
const FOLDER_TYPE = 'STR';

/** @type {Array<[string, string, {designation?: string, name: string, description?: string}, string?]>} */
const ENTITIES = [
  // --- System Context ---------------------------------------------------
  ['ELM-001', 'ELM', {
    designation: 'FFS-2200',
    name: 'Packaging machine',
    description: 'Form, fill and seal machine for consumer goods, fed from a product line and discharging onto a palletising conveyor.',
  }],
  ['ELM-002', 'ELM', {
    designation: 'FFS-2200-10',
    name: 'Infeed conveyor',
    description: 'Belt conveyor delivering product to the wrapping station, with a fixed side guide forming a nip at the transfer.',
  }],
  ['ELM-003', 'ELM', {
    designation: 'FFS-2200-20',
    name: 'Film wrapping unit',
    description: 'Rotating carriage that draws film from the reel and wraps it around the product.',
  }],
  ['ELM-004', 'ELM', {
    designation: 'FFS-2200-30',
    name: 'Sealing unit',
    description: 'Heated jaws that close on the film and seal it. Working temperature 180 °C.',
  }],
  ['ELM-005', 'ELM', {
    designation: 'FFS-2200-40',
    name: 'Outfeed conveyor',
    description: 'Discharge conveyor passing the wrapped product through the perimeter guarding.',
  }],
  ['ELM-006', 'ELM', {
    designation: 'FFS-2200-50',
    name: 'Control system',
    description: 'Machine control, comprising the process controller, the safety-related parts, and the operator station.',
  }],
  ['ELM-007', 'ELM', {
    designation: 'FFS-2200-51',
    name: 'Safety controller',
    description: 'Safety-related part of the control system, evaluating the guard and emergency stop inputs and commanding the drives.',
  }],
  ['ELM-008', 'ELM', {
    designation: 'FFS-2200-52',
    name: 'Guard door interlock',
    description: 'Interlocking device with guard locking on the access door to the wrapping station.',
  }],
  ['ELM-009', 'ELM', {
    designation: 'FFS-2200-60',
    name: 'Perimeter guarding',
    description: 'Fixed panels enclosing the wrapping and sealing stations, with one interlocked access door.',
  }],

  ['ACT-001', 'ACT', {
    name: 'Machine operator',
    description: 'Instructed in the operating instructions and in jam clearance. No electrical or mechanical qualification. Wears safety shoes and work gloves.',
  }],
  ['ACT-002', 'ACT', {
    name: 'Maintenance technician',
    description: 'Trained on the machine, authorised to work with the guards removed and to operate the machine in service mode.',
  }],
  ['ACT-003', 'ACT', {
    name: 'Cleaning staff',
    description: 'Instructed in the cleaning procedure only. Not trained on the machine functions. Wears heat-resistant gloves and eye protection.',
  }],

  ['TSK-001', 'TSK', {
    name: 'Loading a film reel',
    description: 'The spent core is removed and a new reel is fitted onto the mandrel, and the film is threaded through the carriage. Several times per shift, about five minutes.',
  }],
  ['TSK-002', 'TSK', {
    name: 'Clearing a product jam',
    description: 'A product stuck at the infeed or in the wrapping station is freed by hand. Daily, two to ten minutes.',
  }],
  ['TSK-003', 'TSK', {
    name: 'Cleaning the sealing bar',
    description: 'Film residue is scraped from the sealing jaws at the end of a production run. Daily, about fifteen minutes.',
  }],
  ['TSK-004', 'TSK', {
    name: 'Replacing the sealing bar',
    description: 'The sealing bar is unbolted and exchanged, which requires the perimeter guarding to be opened. Monthly, about forty-five minutes.',
  }],
  ['TSK-005', 'TSK', {
    name: 'Monitoring production',
    description: 'The operator watches the machine from the operator station and intervenes on a fault indication. Continuous through the shift.',
  }],

  ['PHS-001', 'PHS', {
    name: 'Normal operation',
    description: 'The machine runs the production programme with all guards closed.',
  }],
  ['PHS-002', 'PHS', {
    name: 'Setting and changeover',
    description: 'Format parts and consumables are changed between production runs.',
  }],
  ['PHS-003', 'PHS', {
    name: 'Cleaning',
    description: 'End-of-run cleaning of the product path and the sealing station.',
  }],
  ['PHS-004', 'PHS', {
    name: 'Maintenance',
    description: 'Planned maintenance and part replacement, carried out with the machine isolated.',
  }],

  // --- Legislative Framework -------------------------------------------
  ['LEG-001', 'LEG', {
    designation: '(EU) 2023/1230',
    name: 'Machinery Regulation',
    description: 'Regulation (EU) 2023/1230 on machinery. Applies from 20 January 2027. The product is machinery with a drive system other than directly applied human effort, placed on the Union market as a complete machine.',
  }],
  ['LEG-002', 'LEG', {
    designation: '2014/30/EU',
    name: 'EMC Directive',
    description: 'Directive 2014/30/EU on electromagnetic compatibility. The machine contains drives and control electronics that can generate and are susceptible to electromagnetic disturbance.',
  }],

  ['STD-001', 'STD', {
    designation: 'EN ISO 12100:2010',
    name: 'Safety of machinery — General principles for design — Risk assessment and risk reduction',
    description: 'Type A standard. Applied as the framework for the risk assessment.',
  }],
  ['STD-002', 'STD', {
    designation: 'EN ISO 13857:2019',
    name: 'Safety of machinery — Safety distances to prevent hazard zones being reached by upper and lower limbs',
    description: 'Type B standard. Applied to the infeed and outfeed openings in the perimeter guarding.',
  }],
  ['STD-003', 'STD', {
    designation: 'EN ISO 13849-1:2023',
    name: 'Safety of machinery — Safety-related parts of control systems — Part 1: General principles for design',
    description: 'Type B standard. Applied to the safety functions realised by the control system.',
  }],
  ['STD-004', 'STD', {
    designation: 'EN ISO 14119:2013',
    name: 'Safety of machinery — Interlocking devices associated with guards — Principles for design and selection',
    description: 'Type B standard. Applied to the access door interlock.',
  }],
  ['STD-005', 'STD', {
    designation: 'EN 415-3:2021',
    name: 'Safety of packaging machines — Part 3: Form, fill and seal machines',
    description: 'Type C standard. Applied except for the clauses covering aseptic filling, which the machine does not perform.',
  }],

  ['CAS-001', 'CAS', {
    name: 'Internal control',
    description: 'The machine is not in a category requiring the involvement of a notified body, so conformity is assessed under the manufacturer’s own control.',
  }],
  ['CAS-002', 'CAS', {
    name: 'EU type-examination of the safety controller',
    description: 'Carried out for the safety component supplied with the machine, by the notified body involved in this assessment.',
  }],
  ['CAS-003', 'CAS', {
    name: 'Internal production control for electromagnetic compatibility',
    description: 'Assessed by the manufacturer, supported by emission and immunity testing.',
  }],

  ['NTB-001', 'NTB', {
    designation: '0000',
    name: 'Example Notified Body',
    description: 'A placeholder standing in for the notified body that would carry out the assessment. No real body is named in this example.',
  }],

  // --- Requirements Definition -----------------------------------------
  ['ESR-001', 'ESR', {
    designation: '1.3.7',
    name: 'Risks related to moving parts',
    description: 'Moving parts of the machinery must be designed and constructed so as to prevent risks of contact which could lead to accidents, or, where risks persist, must be fitted with guards or protective devices.',
  }],
  ['ESR-002', 'ESR', {
    designation: '1.4.2',
    name: 'Required characteristics of guards and protective devices',
    description: 'Guards and protective devices must be of robust construction, be firmly held in place, not give rise to additional risk, and not be easy to bypass or render non-operational.',
  }],
  ['ESR-003', 'ESR', {
    designation: '1.2.4.3',
    name: 'Emergency stop',
    description: 'Machinery must be fitted with one or more emergency stop devices to enable actual or impending danger to be averted.',
  }],
  ['ESR-004', 'ESR', {
    designation: '1.6.3',
    name: 'Isolation of energy sources',
    description: 'Machinery must be fitted with means to isolate it from all energy sources, and the isolators must be clearly identified and lockable where reconnection could cause a hazard.',
  }],
  ['ESR-005', 'ESR', {
    designation: '1.5.5',
    name: 'Risks due to extreme temperatures',
    description: 'Steps must be taken to eliminate the risk of injury from contact with, or proximity to, machinery parts or materials at a high or very low temperature.',
  }],

  ['STR-001', 'STR', {
    designation: '4.2.2',
    name: 'Safety distance for reaching over the infeed guard',
    description: 'The hazard zone at the infeed transfer shall be placed far enough beyond the guard edge that it cannot be reached over the guard by an upper limb.',
  }, 'F-2'],
  ['STR-002', 'STR', {
    designation: '4.2.4',
    name: 'Opening size at the infeed aperture',
    description: 'The aperture through which product enters shall be small enough that the hazard zone behind it cannot be reached through the opening.',
  }, 'F-2'],
  ['STR-003', 'STR', {
    designation: '5.2',
    name: 'Determination of the required performance level',
    description: 'The performance level required of each safety function shall be determined from the severity of injury, the frequency and duration of exposure, and the possibility of avoiding the harm.',
  }, 'F-3'],
  ['STR-004', 'STR', {
    designation: '6.2',
    name: 'Architecture of the safety-related parts',
    description: 'The safety-related parts realising the safe stop shall use an architecture whose single-fault behaviour matches the performance level determined for the function.',
  }, 'F-3'],
  ['STR-005', 'STR', {
    designation: '5',
    name: 'Selection of the interlocking device',
    description: 'The interlocking device on the access door shall be selected for the stopping time of the machine and for the risk arising if the guard is opened while the machine runs.',
  }, 'F-3'],
  ['STR-006', 'STR', {
    designation: '7',
    name: 'Prevention of defeat in a reasonably foreseeable manner',
    description: 'The interlocking arrangement shall be designed so that it cannot be defeated with a spare actuator or with a readily available object.',
  }, 'F-3'],
  ['STR-007', 'STR', {
    designation: '6',
    name: 'Three-step method for risk reduction',
    description: 'Risk shall be reduced first by design, then by safeguarding and complementary protective measures, and only then by information for use.',
  }],
  ['STR-008', 'STR', {
    designation: '5.3',
    name: 'Guarding of the wrapping and sealing stations',
    description: 'The wrapping and sealing stations shall be enclosed so that no part of the body can reach the moving or heated parts while the machine is running.',
  }, 'F-1'],

  ['REQ-001', 'REQ', {
    name: 'Access protection at the wrapping station',
    description: 'The packaging machine shall prevent access to the wrapping station while the wrapping carriage is moving.\n\nRationale: the station carries the crushing and entanglement hazards that dominate the risk assessment, and access to it is the common cause of the scenarios recorded.',
  }],
  ['REQ-002', 'REQ', {
    name: 'Fixed guard fastening',
    description: 'The packaging machine shall retain its fixed guards with fasteners that remain attached to the guard or to the machine when the guard is removed.\n\nRationale: loose fasteners are the usual reason a fixed guard is left off after maintenance.',
  }],
  ['REQ-003', 'REQ', {
    name: 'Interlocked access door',
    description: 'While the wrapping carriage is moving, the packaging machine shall keep the access door locked closed.\n\nRationale: the carriage overruns for about four seconds after a stop command, which is longer than the time needed to reach the hazard zone through an open door.',
  }],
  ['REQ-004', 'REQ', {
    name: 'Safe stop on guard opening',
    description: 'When the access door interlock signals an open guard, the packaging machine shall bring the wrapping and sealing drives to a standstill and prevent restart.\n\nRationale: derived from the safe stop safety function, whose required performance level is set by the severity and the poor avoidability of the crushing scenario.',
  }],
  ['REQ-005', 'REQ', {
    name: 'Emergency stop devices',
    description: 'The packaging machine shall provide an emergency stop device at the operator station and at the maintenance access position.\n\nRationale: both positions are occupied while the machine can move, and neither is within reach of the other.',
  }],
  ['REQ-006', 'REQ', {
    name: 'Sealing unit surface temperature',
    description: 'The packaging machine shall keep the touchable surfaces surrounding the sealing jaws below the burn threshold for the material concerned, and shall mark the jaws themselves as hot.\n\nRationale: the jaws cannot be cooled without making cleaning impractical, so the surrounding surfaces are insulated and the residual hot part is marked.',
  }],
  ['REQ-007', 'REQ', {
    name: 'Energy isolation and lockout',
    description: 'The packaging machine shall provide a lockable main switch that isolates the electrical supply and dissipates the stored pneumatic energy.\n\nRationale: maintenance is carried out inside the guarding, where an unexpected start-up would be unavoidable.',
  }],
  ['REQ-008', 'REQ', {
    name: 'Safety distance at the infeed opening',
    description: 'The packaging machine shall place the infeed nip beyond reach through the infeed opening.\n\nRationale: the infeed opening must stay open for product to pass, so the distance is the only available measure.',
  }],

  ['VER-001', 'VER', {
    name: 'Measurement of the infeed safety distance',
    description: 'Inspection. Measure the distance from the infeed opening to the nip, and the dimensions of the opening, on the assembled machine. Accepted when the measured distance is not less than the distance recorded in the risk assessment for the opening size.',
  }],
  ['VER-002', 'VER', {
    name: 'Functional test of the guard door interlock',
    description: 'Test. Attempt to open the access door during a production cycle, then command a stop and open the door after the guard unlocks. Accepted when the door cannot be opened while the carriage moves, and unlocks only after standstill is reached.',
  }],
  ['VER-003', 'VER', {
    name: 'Emergency stop function test',
    description: 'Test. Operate each emergency stop device during a production cycle and observe the machine response and the restart behaviour. Accepted when all drives come to a standstill and the machine does not restart on release of the device.',
  }],
  ['VER-004', 'VER', {
    name: 'Validation of the safe stop function',
    description: 'Analysis. Review the circuit against the architecture, diagnostic coverage, and component reliability data claimed for the function, and fault-inject at the interlock inputs. Accepted when the achieved performance level is not lower than the required performance level and no single fault leads to loss of the safety function.',
  }],
  ['VER-005', 'VER', {
    name: 'Inspection of the fixed guard fasteners',
    description: 'Inspection. Remove each fixed guard panel and check that the fasteners stay attached to the panel or to the machine. Accepted when no fastener can be fully separated without a tool.',
  }],
  ['VER-006', 'VER', {
    name: 'Surface temperature measurement at the sealing unit',
    description: 'Test. Run the machine to thermal equilibrium and measure the touchable surfaces around the sealing jaws with a contact thermometer. Accepted when the measured temperatures are below the burn threshold for the surface material and contact duration assumed.',
  }],

  // --- Hazard Analysis --------------------------------------------------
  ['HAZ-001', 'HAZ', {
    name: 'Drawing-in at the infeed nip',
    description: 'Mechanical. At the transfer between the infeed belt and the fixed side guide, the two form a converging gap that can draw in a hand.',
  }],
  ['HAZ-002', 'HAZ', {
    name: 'Crushing between the wrapping arm and the frame',
    description: 'Mechanical. At the end of the carriage travel, the carriage closes on the machine frame with no clearance for a limb.',
  }],
  ['HAZ-003', 'HAZ', {
    name: 'Entanglement with the rotating film carriage',
    description: 'Mechanical. The rotating carriage and the film can catch loose clothing, gloves, or a sleeve.',
  }],
  ['HAZ-004', 'HAZ', {
    name: 'Burn from the hot sealing bar',
    description: 'Thermal. The jaw faces stay near working temperature for around twenty minutes after the machine stops.',
  }],
  ['HAZ-005', 'HAZ', {
    name: 'Shearing at the sealing jaws',
    description: 'Mechanical. The jaws close pneumatically with enough force to shear a finger.',
  }],
  ['HAZ-006', 'HAZ', {
    name: 'Crushing at the outfeed transfer',
    description: 'Mechanical. A hand following the product through the discharge aperture can be crushed against the fixed structure.',
  }],
  ['HAZ-007', 'HAZ', {
    name: 'Unexpected start-up',
    description: 'Mechanical. A control fault, a restored supply, or a remote command starts the machine while someone is inside the guarding.',
  }],
  ['HAZ-008', 'HAZ', {
    name: 'Electric shock at the supply connection',
    description: 'Electrical. The supply terminals in the main control cabinet remain live when the main switch is off.',
  }],

  ['SCN-001', 'SCN', {
    name: 'Hand drawn into the infeed nip while clearing a jam',
    description: 'A product jams at the transfer. The operator reaches through the infeed opening to free it without stopping the machine. The belt restarts as the jam clears and draws the hand into the nip. Harm: crushing and abrasion of the hand and forearm.',
  }],
  ['SCN-002', 'SCN', {
    name: 'Technician struck by the wrapping arm on restart',
    description: 'A technician is inside the guarding replacing the sealing bar. The machine is not isolated. A colleague acknowledges a fault at the operator station and the carriage completes its interrupted cycle. Harm: crushing of the torso between the carriage and the frame.',
  }],
  ['SCN-003', 'SCN', {
    name: 'Cleaner burned on the sealing bar',
    description: 'Cleaning starts immediately after the production run ends. The jaws are still near working temperature. The cleaner reaches between them to scrape off film residue. Harm: contact burn to the hand and forearm.',
  }],
  ['SCN-004', 'SCN', {
    name: 'Sleeve caught in the film carriage while loading a reel',
    description: 'The operator threads film through the carriage with the machine in setting mode. The carriage indexes and catches the sleeve, drawing the arm in. Harm: entanglement and fracture of the arm.',
  }],
  ['SCN-005', 'SCN', {
    name: 'Hand sheared at the sealing jaws during jam clearance',
    description: 'Film bunches at the sealing station. The operator reaches in to pull it clear while the cycle is paused rather than stopped, and the jaws close on the next cycle step. Harm: amputation of a finger.',
  }],

  ['RRM-001', 'RRM', {
    name: 'Fixed guarding around the wrapping station',
    description: 'Safeguarding. Fixed panels enclose the wrapping and sealing stations on all sides that are not access points.',
  }],
  ['RRM-002', 'RRM', {
    name: 'Interlocked access door with guard locking',
    description: 'Safeguarding. The single access point is a door with a coded interlocking device that keeps the door locked until standstill is reached.',
  }],
  ['RRM-003', 'RRM', {
    name: 'Safe stop on guard opening',
    description: 'Safeguarding. Opening the guard removes power from the wrapping and sealing drives and prevents restart until the guard is closed and the machine is reset.',
  }],
  ['RRM-004', 'RRM', {
    name: 'Emergency stop devices',
    description: 'Complementary protective measure. Emergency stop devices at the operator station and at the maintenance access position.',
  }],
  ['RRM-005', 'RRM', {
    name: 'Safety distance at the infeed opening',
    description: 'Inherently safe design. The nip is moved far enough beyond the infeed opening that it cannot be reached, removing the need to guard the opening itself.',
  }],
  ['RRM-006', 'RRM', {
    name: 'Insulation and marking of the sealing unit',
    description: 'Safeguarding. The surfaces around the jaws are insulated, and the jaws themselves carry a hot surface marking.',
  }],
  ['RRM-007', 'RRM', {
    name: 'Lockable main switch for energy isolation',
    description: 'Complementary protective measure. A lockable main switch isolates the electrical supply, and an exhaust valve dissipates the stored pneumatic energy.',
  }],
  ['RRM-008', 'RRM', {
    name: 'Jam clearance procedure in the instructions',
    description: 'Information for use, the last resort in the three-step method. The instructions require the machine to be stopped and the guard opened before any jam is cleared by hand.',
  }],

  ['SAF-001', 'SAF', {
    designation: 'SF1',
    name: 'Safe stop on guard door opening',
    description: 'On the guard door being opened, the wrapping and sealing drives are brought to a standstill and restart is prevented. Required performance level PL d, category 3.',
  }],
  ['SAF-002', 'SAF', {
    designation: 'SF1.1',
    name: 'Guard position detection',
    description: 'The position of the access door is detected by two channels and evaluated for plausibility. Required performance level PL d, category 3.',
  }],
  ['SAF-003', 'SAF', {
    designation: 'SF1.2',
    name: 'Safe torque off of the drives',
    description: 'Torque is removed from the wrapping and sealing drives through two independent channels. Required performance level PL d, category 3.',
  }],
  ['SAF-004', 'SAF', {
    designation: 'SF2',
    name: 'Emergency stop function',
    description: 'On any emergency stop device being operated, all drives are stopped and the pneumatic supply is exhausted. Required performance level PL c, category 1.',
  }],
];

/** @type {Array<[string, string, string]>} */
const RELATIONSHIPS = [
  // ELM decomposes into ELM
  ['ELM-001', 'elm-decomposes-into-elm', 'ELM-002'],
  ['ELM-001', 'elm-decomposes-into-elm', 'ELM-003'],
  ['ELM-001', 'elm-decomposes-into-elm', 'ELM-004'],
  ['ELM-001', 'elm-decomposes-into-elm', 'ELM-005'],
  ['ELM-001', 'elm-decomposes-into-elm', 'ELM-006'],
  ['ELM-001', 'elm-decomposes-into-elm', 'ELM-009'],
  ['ELM-006', 'elm-decomposes-into-elm', 'ELM-007'],
  ['ELM-009', 'elm-decomposes-into-elm', 'ELM-008'],

  // ELM has ACT / PHS
  ['ELM-001', 'elm-has-act', 'ACT-001'],
  ['ELM-001', 'elm-has-act', 'ACT-002'],
  ['ELM-001', 'elm-has-act', 'ACT-003'],
  ['ELM-001', 'elm-has-phs', 'PHS-001'],
  ['ELM-001', 'elm-has-phs', 'PHS-002'],
  ['ELM-001', 'elm-has-phs', 'PHS-003'],
  ['ELM-001', 'elm-has-phs', 'PHS-004'],

  // ACT performs TSK
  ['ACT-001', 'act-performs-tsk', 'TSK-001'],
  ['ACT-001', 'act-performs-tsk', 'TSK-002'],
  ['ACT-001', 'act-performs-tsk', 'TSK-005'],
  ['ACT-002', 'act-performs-tsk', 'TSK-004'],
  ['ACT-003', 'act-performs-tsk', 'TSK-003'],

  // TSK during PHS
  ['TSK-001', 'tsk-during-phs', 'PHS-002'],
  ['TSK-002', 'tsk-during-phs', 'PHS-001'],
  ['TSK-003', 'tsk-during-phs', 'PHS-003'],
  ['TSK-004', 'tsk-during-phs', 'PHS-004'],
  ['TSK-005', 'tsk-during-phs', 'PHS-001'],

  // ELM subject to LEG / STD
  ['ELM-001', 'elm-subject-to-leg', 'LEG-001'],
  ['ELM-001', 'elm-subject-to-leg', 'LEG-002'],
  ['ELM-001', 'elm-subject-to-std', 'STD-001'],
  ['ELM-001', 'elm-subject-to-std', 'STD-005'],
  ['ELM-002', 'elm-subject-to-std', 'STD-002'],
  ['ELM-006', 'elm-subject-to-std', 'STD-003'],
  ['ELM-008', 'elm-subject-to-std', 'STD-004'],

  // LEG defines ESR / CAS
  ['LEG-001', 'leg-defines-esr', 'ESR-001'],
  ['LEG-001', 'leg-defines-esr', 'ESR-002'],
  ['LEG-001', 'leg-defines-esr', 'ESR-003'],
  ['LEG-001', 'leg-defines-esr', 'ESR-004'],
  ['LEG-001', 'leg-defines-esr', 'ESR-005'],
  ['LEG-001', 'leg-defines-cas', 'CAS-001'],
  ['LEG-001', 'leg-defines-cas', 'CAS-002'],
  ['LEG-002', 'leg-defines-cas', 'CAS-003'],

  // CAS involves NTB
  ['CAS-002', 'cas-involves-ntb', 'NTB-001'],

  // STD harmonised to LEG
  ['STD-001', 'std-harmonised-to-leg', 'LEG-001'],
  ['STD-002', 'std-harmonised-to-leg', 'LEG-001'],
  ['STD-003', 'std-harmonised-to-leg', 'LEG-001'],
  ['STD-004', 'std-harmonised-to-leg', 'LEG-001'],
  ['STD-005', 'std-harmonised-to-leg', 'LEG-001'],

  // STD defines STR
  ['STD-002', 'std-defines-str', 'STR-001'],
  ['STD-002', 'std-defines-str', 'STR-002'],
  ['STD-003', 'std-defines-str', 'STR-003'],
  ['STD-003', 'std-defines-str', 'STR-004'],
  ['STD-004', 'std-defines-str', 'STR-005'],
  ['STD-004', 'std-defines-str', 'STR-006'],
  ['STD-001', 'std-defines-str', 'STR-007'],
  ['STD-005', 'std-defines-str', 'STR-008'],

  // STR satisfies ESR
  ['STR-001', 'str-satisfies-esr', 'ESR-001'],
  ['STR-002', 'str-satisfies-esr', 'ESR-001'],
  ['STR-003', 'str-satisfies-esr', 'ESR-002'],
  ['STR-004', 'str-satisfies-esr', 'ESR-002'],
  ['STR-005', 'str-satisfies-esr', 'ESR-002'],
  ['STR-006', 'str-satisfies-esr', 'ESR-002'],
  ['STR-008', 'str-satisfies-esr', 'ESR-001'],

  // ESR / STR allocated to ELM
  ['ESR-001', 'esr-allocated-to-elm', 'ELM-001'],
  ['ESR-002', 'esr-allocated-to-elm', 'ELM-009'],
  ['ESR-005', 'esr-allocated-to-elm', 'ELM-004'],
  ['STR-001', 'str-allocated-to-elm', 'ELM-002'],
  ['STR-002', 'str-allocated-to-elm', 'ELM-002'],
  ['STR-005', 'str-allocated-to-elm', 'ELM-008'],
  ['STR-008', 'str-allocated-to-elm', 'ELM-009'],

  // ELM exhibits HAZ
  ['ELM-002', 'elm-exhibits-haz', 'HAZ-001'],
  ['ELM-003', 'elm-exhibits-haz', 'HAZ-002'],
  ['ELM-003', 'elm-exhibits-haz', 'HAZ-003'],
  ['ELM-004', 'elm-exhibits-haz', 'HAZ-004'],
  ['ELM-004', 'elm-exhibits-haz', 'HAZ-005'],
  ['ELM-005', 'elm-exhibits-haz', 'HAZ-006'],
  ['ELM-006', 'elm-exhibits-haz', 'HAZ-007'],
  ['ELM-001', 'elm-exhibits-haz', 'HAZ-008'],

  // HAZ triggers ESR
  ['HAZ-001', 'haz-triggers-esr', 'ESR-001'],
  ['HAZ-002', 'haz-triggers-esr', 'ESR-001'],
  ['HAZ-003', 'haz-triggers-esr', 'ESR-001'],
  ['HAZ-005', 'haz-triggers-esr', 'ESR-002'],
  ['HAZ-006', 'haz-triggers-esr', 'ESR-002'],
  ['HAZ-004', 'haz-triggers-esr', 'ESR-005'],
  ['HAZ-007', 'haz-triggers-esr', 'ESR-004'],
  ['HAZ-007', 'haz-triggers-esr', 'ESR-003'],

  // HAZ contributes to SCN
  ['HAZ-001', 'haz-contributes-to-scn', 'SCN-001'],
  ['HAZ-002', 'haz-contributes-to-scn', 'SCN-002'],
  ['HAZ-007', 'haz-contributes-to-scn', 'SCN-002'],
  ['HAZ-004', 'haz-contributes-to-scn', 'SCN-003'],
  ['HAZ-003', 'haz-contributes-to-scn', 'SCN-004'],
  ['HAZ-005', 'haz-contributes-to-scn', 'SCN-005'],

  // TSK leads to SCN
  ['TSK-002', 'tsk-leads-to-scn', 'SCN-001'],
  ['TSK-002', 'tsk-leads-to-scn', 'SCN-005'],
  ['TSK-003', 'tsk-leads-to-scn', 'SCN-003'],
  ['TSK-001', 'tsk-leads-to-scn', 'SCN-004'],
  ['TSK-004', 'tsk-leads-to-scn', 'SCN-002'],

  // ACT exposed in SCN
  ['ACT-001', 'act-exposed-in-scn', 'SCN-001'],
  ['ACT-001', 'act-exposed-in-scn', 'SCN-004'],
  ['ACT-001', 'act-exposed-in-scn', 'SCN-005'],
  ['ACT-002', 'act-exposed-in-scn', 'SCN-002'],
  ['ACT-003', 'act-exposed-in-scn', 'SCN-003'],

  // RRM mitigates HAZ / SCN
  ['RRM-005', 'rrm-mitigates-haz', 'HAZ-001'],
  ['RRM-001', 'rrm-mitigates-haz', 'HAZ-002'],
  ['RRM-002', 'rrm-mitigates-haz', 'HAZ-003'],
  ['RRM-006', 'rrm-mitigates-haz', 'HAZ-004'],
  ['RRM-001', 'rrm-mitigates-haz', 'HAZ-005'],
  ['RRM-001', 'rrm-mitigates-haz', 'HAZ-006'],
  ['RRM-007', 'rrm-mitigates-haz', 'HAZ-007'],
  ['RRM-007', 'rrm-mitigates-haz', 'HAZ-008'],
  ['RRM-005', 'rrm-mitigates-scn', 'SCN-001'],
  ['RRM-003', 'rrm-mitigates-scn', 'SCN-002'],
  ['RRM-007', 'rrm-mitigates-scn', 'SCN-002'],
  ['RRM-006', 'rrm-mitigates-scn', 'SCN-003'],
  ['RRM-002', 'rrm-mitigates-scn', 'SCN-004'],
  ['RRM-008', 'rrm-mitigates-scn', 'SCN-005'],

  // RRM implements STR
  ['RRM-005', 'rrm-implements-str', 'STR-001'],
  ['RRM-005', 'rrm-implements-str', 'STR-002'],
  ['RRM-002', 'rrm-implements-str', 'STR-005'],
  ['RRM-002', 'rrm-implements-str', 'STR-006'],
  ['RRM-001', 'rrm-implements-str', 'STR-008'],
  ['RRM-008', 'rrm-implements-str', 'STR-007'],

  // SAF realises RRM, SAF decomposes into SAF
  ['SAF-001', 'saf-realises-rrm', 'RRM-003'],
  ['SAF-004', 'saf-realises-rrm', 'RRM-004'],
  ['SAF-001', 'saf-decomposes-into-saf', 'SAF-002'],
  ['SAF-001', 'saf-decomposes-into-saf', 'SAF-003'],

  // RRM / SAF allocated to ELM
  ['RRM-001', 'rrm-allocated-to-elm', 'ELM-009'],
  ['RRM-002', 'rrm-allocated-to-elm', 'ELM-008'],
  ['RRM-005', 'rrm-allocated-to-elm', 'ELM-002'],
  ['RRM-006', 'rrm-allocated-to-elm', 'ELM-004'],
  ['RRM-007', 'rrm-allocated-to-elm', 'ELM-001'],
  ['SAF-001', 'saf-allocated-to-elm', 'ELM-006'],
  ['SAF-002', 'saf-allocated-to-elm', 'ELM-008'],
  ['SAF-003', 'saf-allocated-to-elm', 'ELM-007'],
  ['SAF-004', 'saf-allocated-to-elm', 'ELM-006'],

  // REQ derives from STR / RRM / SAF, decomposes into REQ
  ['REQ-001', 'req-decomposes-into-req', 'REQ-002'],
  ['REQ-001', 'req-decomposes-into-req', 'REQ-003'],
  ['REQ-008', 'req-derives-from-str', 'STR-001'],
  ['REQ-008', 'req-derives-from-str', 'STR-002'],
  ['REQ-003', 'req-derives-from-str', 'STR-005'],
  ['REQ-003', 'req-derives-from-str', 'STR-006'],
  ['REQ-004', 'req-derives-from-str', 'STR-003'],
  ['REQ-002', 'req-derives-from-rrm', 'RRM-001'],
  ['REQ-005', 'req-derives-from-rrm', 'RRM-004'],
  ['REQ-006', 'req-derives-from-rrm', 'RRM-006'],
  ['REQ-007', 'req-derives-from-rrm', 'RRM-007'],
  ['REQ-008', 'req-derives-from-rrm', 'RRM-005'],
  ['REQ-004', 'req-derives-from-saf', 'SAF-001'],
  ['REQ-005', 'req-derives-from-saf', 'SAF-004'],

  // REQ allocated to ELM
  ['REQ-001', 'req-allocated-to-elm', 'ELM-003'],
  ['REQ-002', 'req-allocated-to-elm', 'ELM-009'],
  ['REQ-003', 'req-allocated-to-elm', 'ELM-008'],
  ['REQ-004', 'req-allocated-to-elm', 'ELM-007'],
  ['REQ-005', 'req-allocated-to-elm', 'ELM-006'],
  ['REQ-006', 'req-allocated-to-elm', 'ELM-004'],
  ['REQ-007', 'req-allocated-to-elm', 'ELM-001'],
  ['REQ-008', 'req-allocated-to-elm', 'ELM-002'],

  // VER verifies REQ / RRM / SAF, allocated to ELM
  ['VER-001', 'ver-verifies-req', 'REQ-008'],
  ['VER-002', 'ver-verifies-req', 'REQ-003'],
  ['VER-003', 'ver-verifies-req', 'REQ-005'],
  ['VER-005', 'ver-verifies-req', 'REQ-002'],
  ['VER-006', 'ver-verifies-req', 'REQ-006'],
  ['VER-001', 'ver-verifies-rrm', 'RRM-005'],
  ['VER-005', 'ver-verifies-rrm', 'RRM-001'],
  ['VER-006', 'ver-verifies-rrm', 'RRM-006'],
  ['VER-004', 'ver-verifies-saf', 'SAF-001'],
  ['VER-003', 'ver-verifies-saf', 'SAF-004'],
  ['VER-001', 'ver-allocated-to-elm', 'ELM-002'],
  ['VER-002', 'ver-allocated-to-elm', 'ELM-008'],
  ['VER-004', 'ver-allocated-to-elm', 'ELM-007'],
  ['VER-006', 'ver-allocated-to-elm', 'ELM-004'],
];

/**
 * Build the example model. Relationships go through the same enforcement as
 * anything the user creates, so an example that broke the metamodel would fail
 * here rather than load.
 * @returns {import('./model.js').Model}
 */
export function buildExampleModel() {
  const model = createModel('Packaging machine FFS-2200');

  for (const [id, name, parent] of FOLDERS) {
    addFolder(model, FOLDER_TYPE, name, parent, id);
  }

  for (const [id, code, attributes, folder] of ENTITIES) {
    addEntity(model, code, attributes, { id, folder: folder ?? null });
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
