/**
 * The library project the software ships, a copy of sources/library.json
 * in the project file's shape: each folder at its root is a catalogue the
 * picker offers as a tab. Regenerated from the source when it changes,
 * never edited here. The legislation's text is the Official Journal's,
 * and the single hazards are FMV's checklist, as the source records them.
 */

/** @type {Object} */
export const LIBRARY = {
  "format": "openconformity-project",
  "schemaVersion": 1,
  "name": "",
  "counters": {
    "LEG": 6,
    "HST": 1,
    "OSP": 1,
    "CAS": 1,
    "NTB": 1,
    "ESR": 289,
    "HSR": 1,
    "OSR": 1,
    "REQ": 1,
    "VER": 1,
    "HAZ": 217,
    "SCN": 1,
    "PRM": 1,
    "SAF": 1,
    "ELM": 1,
    "ACT": 1,
    "TSK": 1,
    "PHS": 16,
    "F": 21
  },
  "folders": [
    {
      "id": "F-1",
      "name": "Project structure",
      "parent": null,
      "order": 0
    },
    {
      "id": "F-2",
      "name": "Legislation and standards",
      "parent": "F-1",
      "order": 0
    },
    {
      "id": "F-3",
      "name": "European legislation",
      "parent": "F-2",
      "order": 0
    },
    {
      "id": "F-4",
      "name": "Conformity assessments",
      "parent": "F-2",
      "order": 1
    },
    {
      "id": "F-5",
      "name": "Harmonised standards",
      "parent": "F-2",
      "order": 2
    },
    {
      "id": "F-6",
      "name": "Other specifications",
      "parent": "F-2",
      "order": 3
    },
    {
      "id": "F-7",
      "name": "System and hazards",
      "parent": "F-1",
      "order": 1
    },
    {
      "id": "F-8",
      "name": "System elements",
      "parent": "F-7",
      "order": 0
    },
    {
      "id": "F-9",
      "name": "System actors",
      "parent": "F-7",
      "order": 1
    },
    {
      "id": "F-10",
      "name": "System phases",
      "parent": "F-7",
      "order": 2
    },
    {
      "id": "F-11",
      "name": "Risks and measures",
      "parent": "F-1",
      "order": 2
    },
    {
      "id": "F-12",
      "name": "Accident scenarios",
      "parent": "F-11",
      "order": 0
    },
    {
      "id": "F-13",
      "name": "Protective measures",
      "parent": "F-11",
      "order": 1
    },
    {
      "id": "F-14",
      "name": "Safety functions",
      "parent": "F-11",
      "order": 2
    },
    {
      "id": "F-15",
      "name": "Requirements definition",
      "parent": "F-1",
      "order": 3
    },
    {
      "id": "F-16",
      "name": "System requirements",
      "parent": "F-15",
      "order": 0
    },
    {
      "id": "F-17",
      "name": "System verifications",
      "parent": "F-15",
      "order": 1
    },
    {
      "id": "F-18",
      "name": "European legislation",
      "parent": null,
      "order": 1
    },
    {
      "id": "F-19",
      "name": "System phases",
      "parent": null,
      "order": 2
    },
    {
      "id": "F-20",
      "name": "Single hazards",
      "parent": null,
      "order": 3
    }
  ],
  "entities": [
    {
      "id": "LEG-001",
      "type": "LEG",
      "parent": "F-18",
      "order": 0,
      "attributes": {
        "reference": "Directive 2011/65/EU",
        "title": "Restriction of Hazardous Substances Directive (RoHS)",
        "link": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02011L0065-20260701",
        "notes": "Requirements copied from the consolidated text of 1 July 2026, checked 2026-10-03. Article 4 and Annex II as amended by Delegated Directive (EU) 2015/863."
      }
    },
    {
      "id": "ESR-001",
      "type": "ESR",
      "parent": "LEG-001",
      "order": 0,
      "attributes": {
        "reference": "Article 4",
        "title": "Prevention"
      }
    },
    {
      "id": "ESR-002",
      "type": "ESR",
      "parent": "ESR-001",
      "order": 0,
      "attributes": {
        "reference": "Article 4(1)",
        "title": "Prevention",
        "requirement": "1. Member States shall ensure that EEE placed on the market, including cables and spare parts for its repair, its reuse, updating of its functionalities or upgrading of its capacity, does not contain the substances listed in Annex II."
      }
    },
    {
      "id": "ESR-003",
      "type": "ESR",
      "parent": "ESR-001",
      "order": 1,
      "attributes": {
        "reference": "Article 4(2)",
        "title": "Prevention",
        "requirement": "2. For the purposes of this Directive, no more than the maximum concentration value by weight in homogeneous materials as specified in Annex II shall be tolerated. The Commission shall adopt, by means of delegated acts in accordance with Article 20 and subject to the conditions laid down in Articles 21 and 22, detailed rules for complying with these maximum concentration values taking into account, inter alia, surface coatings."
      }
    },
    {
      "id": "ESR-004",
      "type": "ESR",
      "parent": "LEG-001",
      "order": 1,
      "attributes": {
        "reference": "Annex II",
        "title": "Restricted substances referred to in Article 4(1) and maximum concentration values tolerated by weight in homogeneous materials",
        "requirement": "The restriction of DEHP, BBP, DBP and DIBP shall apply to medical devices, including in vitro medical devices, and monitoring and control instruments, including industrial monitoring and control instruments, from 22 July 2021.\n\nThe restriction of DEHP, BBP, DBP and DIBP shall not apply to cables or spare parts for the repair, the reuse, the updating of functionalities or upgrading of capacity of EEE placed on the market before 22 July 2019, and of medical devices, including in vitro medical devices, and monitoring and control instruments, including industrial monitoring and control instruments, placed on the market before 22 July 2021.\n\nThe restriction of DEHP, BBP and DBP shall not apply to toys which are already subject to the restriction of DEHP, BBP and DBP through entry 51 of Annex XVII to Regulation (EC) No 1907/2006."
      }
    },
    {
      "id": "ESR-005",
      "type": "ESR",
      "parent": "ESR-004",
      "order": 0,
      "attributes": {
        "reference": "Annex II, Lead",
        "requirement": "Lead (0,1 %)",
        "title": "Restricted substances referred to in Article 4(1) and maximum concentration values tolerated by weight in homogeneous materials"
      }
    },
    {
      "id": "ESR-006",
      "type": "ESR",
      "parent": "ESR-004",
      "order": 1,
      "attributes": {
        "reference": "Annex II, Mercury",
        "requirement": "Mercury (0,1 %)",
        "title": "Restricted substances referred to in Article 4(1) and maximum concentration values tolerated by weight in homogeneous materials"
      }
    },
    {
      "id": "ESR-007",
      "type": "ESR",
      "parent": "ESR-004",
      "order": 2,
      "attributes": {
        "reference": "Annex II, Cadmium",
        "requirement": "Cadmium (0,01 %)",
        "title": "Restricted substances referred to in Article 4(1) and maximum concentration values tolerated by weight in homogeneous materials"
      }
    },
    {
      "id": "ESR-008",
      "type": "ESR",
      "parent": "ESR-004",
      "order": 3,
      "attributes": {
        "reference": "Annex II, Hexavalent chromium",
        "requirement": "Hexavalent chromium (0,1 %)",
        "title": "Restricted substances referred to in Article 4(1) and maximum concentration values tolerated by weight in homogeneous materials"
      }
    },
    {
      "id": "ESR-009",
      "type": "ESR",
      "parent": "ESR-004",
      "order": 4,
      "attributes": {
        "reference": "Annex II, Polybrominated biphenyls (PBB)",
        "requirement": "Polybrominated biphenyls (PBB) (0,1 %)",
        "title": "Restricted substances referred to in Article 4(1) and maximum concentration values tolerated by weight in homogeneous materials"
      }
    },
    {
      "id": "ESR-010",
      "type": "ESR",
      "parent": "ESR-004",
      "order": 5,
      "attributes": {
        "reference": "Annex II, Polybrominated diphenyl ethers (PBDE)",
        "requirement": "Polybrominated diphenyl ethers (PBDE) (0,1 %)",
        "title": "Restricted substances referred to in Article 4(1) and maximum concentration values tolerated by weight in homogeneous materials"
      }
    },
    {
      "id": "ESR-011",
      "type": "ESR",
      "parent": "ESR-004",
      "order": 6,
      "attributes": {
        "reference": "Annex II, Bis(2-ethylhexyl) phthalate (DEHP)",
        "requirement": "Bis(2-ethylhexyl) phthalate (DEHP) (0,1 %)",
        "title": "Restricted substances referred to in Article 4(1) and maximum concentration values tolerated by weight in homogeneous materials"
      }
    },
    {
      "id": "ESR-012",
      "type": "ESR",
      "parent": "ESR-004",
      "order": 7,
      "attributes": {
        "reference": "Annex II, Butyl benzyl phthalate (BBP)",
        "requirement": "Butyl benzyl phthalate (BBP) (0,1 %)",
        "title": "Restricted substances referred to in Article 4(1) and maximum concentration values tolerated by weight in homogeneous materials"
      }
    },
    {
      "id": "ESR-013",
      "type": "ESR",
      "parent": "ESR-004",
      "order": 8,
      "attributes": {
        "reference": "Annex II, Dibutyl phthalate (DBP)",
        "requirement": "Dibutyl phthalate (DBP) (0,1 %)",
        "title": "Restricted substances referred to in Article 4(1) and maximum concentration values tolerated by weight in homogeneous materials"
      }
    },
    {
      "id": "ESR-014",
      "type": "ESR",
      "parent": "ESR-004",
      "order": 9,
      "attributes": {
        "reference": "Annex II, Diisobutyl phthalate (DIBP)",
        "requirement": "Diisobutyl phthalate (DIBP) (0,1 %)",
        "title": "Restricted substances referred to in Article 4(1) and maximum concentration values tolerated by weight in homogeneous materials"
      }
    },
    {
      "id": "LEG-002",
      "type": "LEG",
      "parent": "F-18",
      "order": 1,
      "attributes": {
        "reference": "Directive 2014/30/EU",
        "title": "Electromagnetic Compatibility Directive (EMCD)",
        "link": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02014L0030-20260530",
        "notes": "Requirements copied from the consolidated text of 30 May 2026, checked 2026-10-03. Annex I unchanged since adoption."
      }
    },
    {
      "id": "ESR-015",
      "type": "ESR",
      "parent": "LEG-002",
      "order": 0,
      "attributes": {
        "reference": "Annex I",
        "title": "Essential requirements"
      }
    },
    {
      "id": "ESR-016",
      "type": "ESR",
      "parent": "ESR-015",
      "order": 0,
      "attributes": {
        "reference": "Annex I, point 1",
        "title": "General requirements",
        "requirement": "Equipment shall be so designed and manufactured, having regard to the state of the art, as to ensure that:"
      }
    },
    {
      "id": "ESR-017",
      "type": "ESR",
      "parent": "ESR-016",
      "order": 0,
      "attributes": {
        "reference": "Annex I, point 1(a)",
        "title": "General requirements",
        "requirement": "(a) the electromagnetic disturbance generated does not exceed the level above which radio and telecommunications equipment or other equipment cannot operate as intended;"
      }
    },
    {
      "id": "ESR-018",
      "type": "ESR",
      "parent": "ESR-016",
      "order": 1,
      "attributes": {
        "reference": "Annex I, point 1(b)",
        "title": "General requirements",
        "requirement": "(b) it has a level of immunity to the electromagnetic disturbance to be expected in its intended use which allows it to operate without unacceptable degradation of its intended use."
      }
    },
    {
      "id": "ESR-019",
      "type": "ESR",
      "parent": "ESR-015",
      "order": 1,
      "attributes": {
        "reference": "Annex I, point 2",
        "title": "Specific requirements for fixed installations",
        "requirement": "Installation and intended use of components\n\nA fixed installation shall be installed applying good engineering practices and respecting the information on the intended use of its components, with a view to meeting the essential requirements set out in point 1."
      }
    },
    {
      "id": "LEG-003",
      "type": "LEG",
      "parent": "F-18",
      "order": 2,
      "attributes": {
        "reference": "Directive 2014/35/EU",
        "title": "Low Voltage Directive (LVD)",
        "link": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02014L0035-20260530",
        "notes": "Requirements copied from the consolidated text of 30 May 2026, checked 2026-10-03. Annex I unchanged since adoption."
      }
    },
    {
      "id": "ESR-020",
      "type": "ESR",
      "parent": "LEG-003",
      "order": 0,
      "attributes": {
        "reference": "Annex I",
        "title": "Principal elements of the safety objectives for electrical equipment designed for use within certain voltage limits"
      }
    },
    {
      "id": "ESR-021",
      "type": "ESR",
      "parent": "ESR-020",
      "order": 0,
      "attributes": {
        "reference": "Annex I, point 1",
        "title": "General conditions"
      }
    },
    {
      "id": "ESR-022",
      "type": "ESR",
      "parent": "ESR-021",
      "order": 0,
      "attributes": {
        "reference": "Annex I, point 1(a)",
        "title": "General conditions",
        "requirement": "(a) the essential characteristics, the recognition and observance of which will ensure that electrical equipment will be used safely and in applications for which it was made, shall be marked on the electrical equipment, or, if this is not possible, on an accompanying document;"
      }
    },
    {
      "id": "ESR-023",
      "type": "ESR",
      "parent": "ESR-021",
      "order": 1,
      "attributes": {
        "reference": "Annex I, point 1(b)",
        "title": "General conditions",
        "requirement": "(b) the electrical equipment, together with its component parts, shall be made in such a way as to ensure that it can be safely and properly assembled and connected;"
      }
    },
    {
      "id": "ESR-024",
      "type": "ESR",
      "parent": "ESR-021",
      "order": 2,
      "attributes": {
        "reference": "Annex I, point 1(c)",
        "title": "General conditions",
        "requirement": "(c) the electrical equipment shall be so designed and manufactured as to ensure that protection against the hazards set out in points 2 and 3 is assured, providing that the equipment is used in applications for which it was made and is adequately maintained."
      }
    },
    {
      "id": "ESR-025",
      "type": "ESR",
      "parent": "ESR-020",
      "order": 1,
      "attributes": {
        "reference": "Annex I, point 2",
        "title": "Protection against hazards arising from the electrical equipment",
        "requirement": "Measures of a technical nature shall be laid down in accordance with point 1, in order to ensure that:"
      }
    },
    {
      "id": "ESR-026",
      "type": "ESR",
      "parent": "ESR-025",
      "order": 0,
      "attributes": {
        "reference": "Annex I, point 2(a)",
        "title": "Protection against hazards arising from the electrical equipment",
        "requirement": "(a) persons and domestic animals are adequately protected against the danger of physical injury or other harm which might be caused by direct or indirect contact;"
      }
    },
    {
      "id": "ESR-027",
      "type": "ESR",
      "parent": "ESR-025",
      "order": 1,
      "attributes": {
        "reference": "Annex I, point 2(b)",
        "title": "Protection against hazards arising from the electrical equipment",
        "requirement": "(b) temperatures, arcs or radiation which would cause a danger, are not produced;"
      }
    },
    {
      "id": "ESR-028",
      "type": "ESR",
      "parent": "ESR-025",
      "order": 2,
      "attributes": {
        "reference": "Annex I, point 2(c)",
        "title": "Protection against hazards arising from the electrical equipment",
        "requirement": "(c) persons, domestic animals and property are adequately protected against non-electrical dangers caused by the electrical equipment which are revealed by experience;"
      }
    },
    {
      "id": "ESR-029",
      "type": "ESR",
      "parent": "ESR-025",
      "order": 3,
      "attributes": {
        "reference": "Annex I, point 2(d)",
        "title": "Protection against hazards arising from the electrical equipment",
        "requirement": "(d) the insulation is suitable for foreseeable conditions."
      }
    },
    {
      "id": "ESR-030",
      "type": "ESR",
      "parent": "ESR-020",
      "order": 2,
      "attributes": {
        "reference": "Annex I, point 3",
        "title": "Protection against hazards which may be caused by external influences on the electrical equipment",
        "requirement": "Technical measures shall be laid down in accordance with point 1, in order to ensure that the electrical equipment:"
      }
    },
    {
      "id": "ESR-031",
      "type": "ESR",
      "parent": "ESR-030",
      "order": 0,
      "attributes": {
        "reference": "Annex I, point 3(a)",
        "title": "Protection against hazards which may be caused by external influences on the electrical equipment",
        "requirement": "(a) meets the expected mechanical requirements in such a way that persons, domestic animals and property are not endangered;"
      }
    },
    {
      "id": "ESR-032",
      "type": "ESR",
      "parent": "ESR-030",
      "order": 1,
      "attributes": {
        "reference": "Annex I, point 3(b)",
        "title": "Protection against hazards which may be caused by external influences on the electrical equipment",
        "requirement": "(b) is resistant to non-mechanical influences in expected environmental conditions, in such a way that persons, domestic animals and property are not endangered;"
      }
    },
    {
      "id": "ESR-033",
      "type": "ESR",
      "parent": "ESR-030",
      "order": 2,
      "attributes": {
        "reference": "Annex I, point 3(c)",
        "title": "Protection against hazards which may be caused by external influences on the electrical equipment",
        "requirement": "(c) does not endanger persons, domestic animals and property in foreseeable conditions of overload."
      }
    },
    {
      "id": "LEG-004",
      "type": "LEG",
      "parent": "F-18",
      "order": 3,
      "attributes": {
        "reference": "Regulation (EU) 2023/1230",
        "title": "Machinery Regulation (MR)",
        "link": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02023R1230-20260727",
        "notes": "Requirements copied from the consolidated text of 27 July 2026, checked 2026-10-03. Annex III unchanged since adoption. Regulation (EU) 2026/1744 empowers delegated acts adding AI requirements to Annex III, applying by 2 August 2028."
      }
    },
    {
      "id": "ESR-034",
      "type": "ESR",
      "parent": "LEG-004",
      "order": 0,
      "attributes": {
        "reference": "Annex III",
        "title": "Essential health and safety requirements relating to the design and construction of machinery or related products"
      }
    },
    {
      "id": "ESR-035",
      "type": "ESR",
      "parent": "ESR-034",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part A",
        "title": "Definitions",
        "requirement": "For the purposes of this Annex, the following definitions apply:\n\n(a) ‘hazard’ means a potential source of injury or damage to health;\n\n(b) ‘danger zone’ means any zone within and/or around machinery or a related product in which a person is subject to a risk to his or her health or safety;\n\n(c) ‘exposed person’ means any person wholly or partially in a danger zone;\n\n(d) ‘operator’ means the person or persons installing, operating, adjusting, maintaining, cleaning, repairing or moving machinery or a related product;\n\n(e) ‘risk’ means a combination of the probability and the degree of an injury or damage to health that can arise in a hazardous situation;\n\n(f) ‘guard’ means a part of machinery or a related product used specifically to provide protection by means of a physical barrier;\n\n(g) ‘protective device’ means a device (other than a guard) which reduces the risk, either alone or in conjunction with a guard;\n\n(h) ‘intended use’ means the use of machinery or a related product in accordance with the information provided in the instructions for use;\n\n(i) ‘reasonably foreseeable misuse’ means the use of machinery or a related product in a way not intended in the instructions for use, but which may result from readily predictable human behaviour."
      }
    },
    {
      "id": "ESR-036",
      "type": "ESR",
      "parent": "ESR-034",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B",
        "title": "General principles",
        "requirement": "1. The manufacturer of machinery or a related product shall ensure that a risk assessment is carried out in order to determine the essential health and safety requirements which apply to the machinery or related product. The machinery or related product shall then be designed and constructed to eliminate hazards or, if that is not possible, to minimise all relevant risks, taking into account the results of the risk assessment.\n\nBy the iterative process of risk assessment and risk reduction referred to in the first subparagraph, the manufacturer shall:\n\n(a) determine the limits of the machinery or related product, which include the intended use and any reasonably foreseeable misuse thereof;\n\n(b) identify the hazards that may be generated by the machinery or related product and the associated hazardous situations;\n\n(c) estimate the risks, taking into account the severity of the possible injury or damage to health and the probability of its occurrence;\n\n(d) evaluate the risks, with a view to determining whether risk reduction is required, in accordance with the objective of this Regulation;\n\n(e) eliminate the hazards or reduce the risks associated with these hazards by application of protective measures, in the order of priority established in section 1.1.2(b).\n\nThe risk assessment and risk reduction shall include hazards that might arise during the lifecycle of the machinery or related product that are foreseeable at the time of placing the machinery or related product on the market as an intended evolution of its fully or partially self-evolving behaviour or logic as a result of the machinery or related product designed to operate with varying levels of autonomy. The risk assessment and risk reduction shall include risks resulting from interactions between machinery in order to achieve the same end that are arranged and controlled so that they function as an integral whole, thus forming machinery as defined in Article 3, point 1, point (d).\n\n2. The obligations laid down by the essential health and safety requirements only apply when the corresponding hazard exists for the machinery or related product in question when it is used under the conditions foreseen by the manufacturer or in foreseeable abnormal situations. However, the principles of safety integration established in section 1.1.2 and the obligations concerning marking of machinery or related products referred to in section 1.7.3, and instructions for use referred to in section 1.7.4 apply in all cases.\n\n3. The essential health and safety requirements laid down in this Annex are mandatory; however, taking into account the state of the art, it may not be possible to meet the objectives set by them. In that event, the machinery or related product shall, as far as possible, be designed and constructed with the purpose of approaching those objectives.\n\n4. This Annex is organised into six chapters. The first chapter is of general scope and applicable to all machinery or related products. The other chapters refer to certain sorts of more specific hazards. Nevertheless, it is essential to examine the whole of this Annex in order to be sure of meeting all the relevant essential health and safety requirements. When machinery or a related product is being designed, the requirements of the first chapter and the requirements of one or more of the other chapters shall be taken into account, depending on the results of the risk assessment carried out in accordance with point 1 of these General Principles. Essential health and safety requirements for the protection of the environment are applicable only to the machinery or related products referred to in section 2.4.\n\n5. These general principles shall apply to the risk assessment carried out by the manufacturer of partly completed machinery."
      }
    },
    {
      "id": "ESR-037",
      "type": "ESR",
      "parent": "ESR-036",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1",
        "title": "Essential health and safety requirements"
      }
    },
    {
      "id": "ESR-038",
      "type": "ESR",
      "parent": "ESR-037",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.1",
        "title": "General remarks"
      }
    },
    {
      "id": "ESR-039",
      "type": "ESR",
      "parent": "ESR-038",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.1.1",
        "title": "Applicability",
        "requirement": "The obligations laid down by the essential health and safety requirements are applicable to partly completed machinery insofar as those requirements are relevant.\n\nThe relevant requirements in relation to partly completed machinery do not cover the requirements that can only be fulfilled at the time of the incorporation of the partly completed machinery. However, the principles of safety integration established in section 1.1.2 are applicable in all cases."
      }
    },
    {
      "id": "ESR-040",
      "type": "ESR",
      "parent": "ESR-038",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.1.2",
        "title": "Principles of safety integration",
        "requirement": "(a) Machinery or related products shall be designed and constructed so that they are fit for their function, and can be operated, adjusted and maintained without putting persons at risk when these operations are carried out under the conditions foreseen but also taking into account any reasonably foreseeable misuse thereof. The aim of protective measures shall be to eliminate any risk throughout the foreseeable lifetime of the machinery or related product including the phases of transport, assembly, dismantling, disabling and scrapping.\n\n(b) In selecting the most appropriate methods, the manufacturer shall apply the following principles, in the order given:\n\n(i) eliminate hazards or, if that is not possible, minimise risks (inherently safe machinery or related product design and construction);\n\n(ii) take the necessary protective measures in relation to risks that cannot be eliminated;\n\n(iii) inform users of the residual risks due to any shortcomings of the protective measures adopted, indicate whether any particular training is required and specify any need to provide personal protective equipment.\n\n(c) When designing and constructing machinery or a related product and when drafting the instructions for use, the manufacturer shall envisage not only the intended use of the machinery or related product but also any reasonably foreseeable misuse thereof. The machinery or related product shall be designed and constructed in such a way as to prevent abnormal use if such use would engender a risk. Where appropriate, the instructions for use shall draw the user’s attention to ways – which experience has shown might occur – in which the machinery or related product should not be used.\n\n(d) Machinery or related products shall be designed and constructed to take account of the constraints to which the operator is subject as a result of the necessary or foreseeable use of personal protective equipment.\n\n(e) Machinery or related products shall be designed and constructed in such a way that it is possible for the user, where applicable, to test the safety functions. The machinery or related product shall be supplied with all the special equipment and accessories, and where appropriate, with the description of specific functional test procedures, essential to enable it to be tested, adjusted, maintained and used safely."
      }
    },
    {
      "id": "ESR-041",
      "type": "ESR",
      "parent": "ESR-038",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 1.1.3",
        "title": "Materials and products",
        "requirement": "The materials used to construct machinery or related products, or products used or created during its use, shall not endanger the health and safety of persons. In particular, where fluids are used, machinery or related products shall be designed and constructed to prevent risks due to filling, use, recovery or draining."
      }
    },
    {
      "id": "ESR-042",
      "type": "ESR",
      "parent": "ESR-038",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 1.1.4",
        "title": "Lighting",
        "requirement": "Machinery or related products shall be supplied with integral lighting suitable for the operations concerned, where the absence thereof is likely to cause a risk despite ambient lighting of normal intensity.\n\nMachinery or related products shall be designed and constructed so that there is no area of shadow likely to cause nuisance, that there is no irritating dazzle and that there are no dangerous stroboscopic effects on moving parts due to the lighting.\n\nInternal parts requiring frequent inspection and adjustment, and maintenance areas shall be provided with appropriate lighting."
      }
    },
    {
      "id": "ESR-043",
      "type": "ESR",
      "parent": "ESR-038",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 1.1.5",
        "title": "Design of machinery or a related product to facilitate its handling",
        "requirement": "Machinery or a related product or each component part thereof, shall:\n\n(a) be capable of being handled and transported safely;\n\n(b) be packaged or designed so that it can be stored safely and without damage.\n\nDuring the transportation of the machinery or related product or its component parts, there shall be no possibility of sudden movements or of hazards due to instability as long as the machinery or related product or its component parts are handled in accordance with the instructions.\n\nWhere the weight, size or shape of machinery or a related product or its various component parts prevents it or them from being moved by hand, the machinery or related product or each component part shall:\n\n(a) either be fitted with attachments for lifting gear; or\n\n(b) be designed so that it can be fitted with such attachments; or\n\n(c) be shaped in such a way that standard lifting gear can easily be attached.\n\nWhere machinery or a related product or one of its component parts is to be moved by hand, it shall either:\n\n(a) be easily moveable; or\n\n(b) be equipped for picking up and moving safely.\n\nSpecial arrangements shall be made for the handling of tools and/or machinery or related product parts, which, even if lightweight, could be hazardous."
      }
    },
    {
      "id": "ESR-044",
      "type": "ESR",
      "parent": "ESR-038",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 1.1.6",
        "title": "Ergonomics",
        "requirement": "Under the intended conditions of use, the discomfort, fatigue and physical and psychological stress faced by the operator shall be eliminated or reduced to the minimum possible, taking into account at least, the following ergonomic principles:\n\n(a) allowing for the variability of the operator’s physical dimensions, strength and stamina;\n\n(b) avoiding the need for demanding work postures or movements and manual force exertions that exceed the operator’s capacity;\n\n(c) providing enough space for movements of the parts of the operator’s body;\n\n(d) avoiding a machine-determined work rate;\n\n(e) avoiding monitoring that requires lengthy concentration;\n\n(f) adapting the human-machine interface to the foreseeable characteristics of the operators, including with respect to machinery or a related product with intended fully or partially self-evolving behaviour or logic that is designed to operate with varying levels of autonomy;\n\n(g) where relevant, adapting machinery or a related product with intended fully or partially self-evolving behaviour or logic that is designed to operate with varying levels of autonomy to respond to people adequately and appropriately (such as verbally through words and non-verbally through gestures, facial expressions or body movement) and to communicate its planned actions (such as what it is going to do and why) to operators in a comprehensible manner."
      }
    },
    {
      "id": "ESR-045",
      "type": "ESR",
      "parent": "ESR-038",
      "order": 6,
      "attributes": {
        "reference": "Annex III, Part B, point 1.1.7",
        "title": "Operating positions",
        "requirement": "The operating position shall be designed and constructed in such a way as to avoid any risk due to exhaust gases or lack of oxygen.\n\nIf the machinery or related product is intended to be used in a hazardous environment presenting risks to the health and safety of the operator or if the machinery or related product itself gives rise to a hazardous environment, adequate means shall be provided to ensure that the operator has good working conditions and is protected against any foreseeable hazards.\n\nWhere appropriate, the operating position shall be fitted with an adequate cabin designed, constructed or equipped to fulfil the above requirements. The exit shall allow rapid evacuation. Moreover, when applicable, an emergency exit shall be provided in a direction which is different from the usual exit."
      }
    },
    {
      "id": "ESR-046",
      "type": "ESR",
      "parent": "ESR-038",
      "order": 7,
      "attributes": {
        "reference": "Annex III, Part B, point 1.1.8",
        "title": "Seating",
        "requirement": "Where appropriate and where the working conditions so permit, work stations constituting an integral part of the machinery or related product shall be designed for the installation of seats.\n\nIf the operator is intended to sit during operation and the operating position is an integral part of the machinery or related product, the seat shall be provided with the machinery or related product.\n\nThe operator’s seat shall enable him or her to maintain a stable position. Furthermore, the seat and its distance from the control devices shall be capable of being adapted to the operator.\n\nIf the machinery or related product is subject to vibrations, the seat shall be designed and constructed in such a way as to reduce the vibrations transmitted to the operator to the lowest level that is reasonably possible. The seat mountings shall withstand all stresses to which they can be subjected. Where there is no floor beneath the feet of the operator, footrests covered with a slip-resistant material shall be provided."
      }
    },
    {
      "id": "ESR-047",
      "type": "ESR",
      "parent": "ESR-038",
      "order": 8,
      "attributes": {
        "reference": "Annex III, Part B, point 1.1.9",
        "title": "Protection against corruption",
        "requirement": "The machinery or related product shall be designed and constructed so that the connection to it of another device, via any feature of the connected device itself or via any remote device that communicates with the machinery or related product does not lead to a hazardous situation.\n\nA hardware component transmitting signal or data, relevant for connection or access to software that is critical for the compliance of the machinery or related product with the relevant essential health and safety requirements shall be designed so that it is adequately protected against accidental or intentional corruption. The machinery or related product shall collect evidence of a legitimate or illegitimate intervention in that hardware component, when relevant for connection or access to software that is critical for the compliance of the machinery or related product.\n\nSoftware and data that are critical for the compliance of the machinery or related product with the relevant essential health and safety requirements shall be identified as such and shall be adequately protected against accidental or intentional corruption.\n\nThe machinery or related product shall identify the software installed on it that is necessary for it to operate safely, and shall be able to provide that information at all times in an easily accessible form.\n\nThe machinery or related product shall collect evidence of a legitimate or illegitimate intervention in the software or a modification of the software installed on the machinery or related product or its configuration."
      }
    },
    {
      "id": "ESR-048",
      "type": "ESR",
      "parent": "ESR-037",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.2",
        "title": "Control systems"
      }
    },
    {
      "id": "ESR-049",
      "type": "ESR",
      "parent": "ESR-048",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.2.1",
        "title": "Safety and reliability of control systems",
        "requirement": "Control systems shall be designed and constructed in such a way as to prevent hazardous situations from arising.\n\nControl systems shall be designed and constructed in such a way that:\n\n(a) they can withstand, where appropriate to the circumstances and the risks, the intended operating stresses and intended and unintended external influences, including reasonably foreseeable malicious attempts from third parties leading to a hazardous situation;\n\n(b) a fault in the hardware or the logic of the control system shall not lead to hazardous situations;\n\n(c) errors in the control system logic shall not lead to hazardous situations;\n\n(d) the limits of the safety functions are to be established as part of the risk assessment performed by the manufacturer and no modifications are allowed to the settings or rules generated by the machinery or related product or by operators, including during the machinery or related product learning phase, where such modifications could lead to hazardous situations;\n\n(e) reasonably foreseeable human errors during operation shall not lead to hazardous situations;\n\n(f) the tracing log of the data generated in relation to an intervention and of the versions of safety software uploaded after the machinery or related product has been placed on the market or put into service is enabled for five years after such upload, exclusively to demonstrate the conformity of the machinery or related product with this Annex further to a reasoned request from a competent national authority.\n\nControl systems of machinery or related products with fully or partially self-evolving behaviour or logic that are designed to operate with varying levels of autonomy shall be designed and constructed in such a way that:\n\n(a) they shall not cause the machinery or related product to perform actions beyond its defined task and movement space;\n\n(b) recording of data on the safety related decision-making process for software based safety systems ensuring safety function including safety components, after the machinery or related product has been placed on the market or put into service, is enabled and that such data is retained for one year after its collection, exclusively to demonstrate the conformity of the machinery or related product with this Annex further to a reasoned request from a competent national authority;\n\n(c) it shall be possible at all times to correct the machinery or related product in order to maintain its inherent safety.\n\nParticular attention shall be given to the following points:\n\n(a) the machinery or related product shall not start unexpectedly;\n\n(b) the parameters of the machinery or related product shall not change in an uncontrolled way, where such change could lead to hazardous situations;\n\n(c) modifications to the settings or rules, generated by the machinery or related product or by operators, including during the machinery or related product learning phase, shall be prevented, where such modifications could lead to hazardous situations;\n\n(d) the machinery or related product shall not be prevented from stopping if the stop command has already been given;\n\n(e) no moving part of the machinery or related product or piece held by the machinery or related product shall fall or be ejected;\n\n(f) automatic or manual stopping of the moving parts, whatever they may be, shall be unimpeded;\n\n(g) the protective devices shall remain fully effective or give a stop command;\n\n(h) the safety-related parts of the control system shall apply in a coherent way to the whole of an assembly of machinery or related products or partly completed machinery, or a combination thereof.\n\nFor wireless control, a failure of the communication or connection or a faulty connection shall not lead to a hazardous situation."
      }
    },
    {
      "id": "ESR-050",
      "type": "ESR",
      "parent": "ESR-048",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.2.2",
        "title": "Control devices",
        "requirement": "Control devices shall be:\n\n(a) clearly visible and identifiable, using pictograms where appropriate;\n\n(b) positioned in such a way as to be safely operated without hesitation or loss of time and without ambiguity;\n\n(c) designed in such a way that the movement of the control device is consistent with its effect;\n\n(d) located outside the danger zones, except where necessary for certain control devices such as an emergency stop or a teach pendant;\n\n(e) positioned in such a way that their operation cannot cause additional risk;\n\n(f) designed or protected in such a way that the desired effect, where a hazard is involved, can only be achieved by a deliberate action;\n\n(g) made in such a way as to withstand foreseeable forces, paying particular attention to emergency stop devices liable to be subjected to considerable forces.\n\nWhere a control device is designed and constructed to perform several different actions, namely, where there is no one-to-one correspondence, the action to be performed shall be clearly displayed and subject to confirmation, where necessary.\n\nControl devices shall be so arranged that their layout, travel and resistance to operation are compatible with the action to be performed, taking account of ergonomic principles.\n\nMachinery or related products shall be fitted with indicators as required for safe operation. The operator shall be able to read them from the control position.\n\nFrom each control position, the operator shall be able to ensure that no one is in the danger zones, or the control system shall be designed and constructed in such a way that starting is prevented while someone is in the danger zone.\n\nIf neither of these possibilities is applicable, before the machinery or related product starts, an acoustic and/or visual warning signal shall be given. The exposed persons shall have time to leave the danger zone or prevent the machinery starting up.\n\nIf necessary, means shall be provided to ensure that the machinery or related product can be controlled only from control positions located in one or more predetermined zones or locations.\n\nWhere there is more than one control position, the control system shall be designed in such a way that the use of one of them precludes the use of the others, except for stop controls and emergency stops.\n\nWhen the machinery or related product has two or more operating positions, each position shall be provided with all the required control devices without the operators hindering or putting each other into a hazardous situation."
      }
    },
    {
      "id": "ESR-051",
      "type": "ESR",
      "parent": "ESR-048",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 1.2.3",
        "title": "Starting",
        "requirement": "It shall be possible to start the machinery or related product only by voluntary actuation of a control device provided for the purpose.\n\nThe same requirement applies:\n\n(a) when restarting the machinery or related product after a stoppage, whatever the cause;\n\n(b) when effecting a significant change in the operating conditions.\n\nHowever, the restarting of the machinery or related product or a change in operating conditions may be effected by voluntary actuation of a device other than the control device provided for the purpose, on condition that this does not lead to a hazardous situation.\n\nFor the machinery or related product functioning in automatic mode, the starting of the machinery or related product, restarting after a stoppage, or a change in operating conditions may be possible without intervention, provided this does not lead to a hazardous situation.\n\nWhere the machinery or related product has several starting control devices and the operators can therefore put each other in danger, additional devices shall be fitted to rule out such risks. If safety requires that starting and/or stopping shall be performed in a specific sequence, there shall be devices that ensure that these operations are performed in the correct order."
      }
    },
    {
      "id": "ESR-052",
      "type": "ESR",
      "parent": "ESR-048",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 1.2.4",
        "title": "Stopping"
      }
    },
    {
      "id": "ESR-053",
      "type": "ESR",
      "parent": "ESR-052",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.2.4.1",
        "title": "Normal stop",
        "requirement": "The machinery or related product shall be fitted with a control device whereby the machinery can be brought safely to a complete stop.\n\nEach workstation shall be fitted with a control device to stop some or all of the functions of the machinery or related product, depending on the existing hazards, so that the machinery or related product is rendered safe.\n\nThe machinery or related product’s stop control shall have priority over the start controls.\n\nOnce the machinery or related product or its hazardous functions have stopped, the energy supply to the actuators concerned shall be cut off."
      }
    },
    {
      "id": "ESR-054",
      "type": "ESR",
      "parent": "ESR-052",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.2.4.2",
        "title": "Operational stop",
        "requirement": "Where, for operational reasons, a stop control that does not cut off the energy supply to the actuators is required, the stop condition shall be monitored and maintained."
      }
    },
    {
      "id": "ESR-055",
      "type": "ESR",
      "parent": "ESR-052",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 1.2.4.3",
        "title": "Emergency stop",
        "requirement": "The machinery or related product shall be fitted with one or more emergency stop devices to enable actual or impending danger to be averted.\n\nThe following exceptions apply:\n\n(a) the machinery or related product in which an emergency stop device would not lessen the risk, either because it would not reduce the stopping time or because it would not enable the special measures required to deal with the risk to be taken;\n\n(b) portable hand-held or hand-guided machinery or related products.\n\nThe device shall:\n\n(a) have clearly identifiable, clearly visible and quickly accessible control devices;\n\n(b) stop the hazardous process as quickly as possible, without creating additional risks;\n\n(c) where necessary, trigger or permit the triggering of certain safeguard movements.\n\nOnce active operation of the emergency stop device has ceased following a stop command, that command shall be sustained by engagement of the emergency stop device until that engagement is specifically overridden; it shall not be possible to engage the device without triggering a stop command; it shall be possible to disengage the device only by an appropriate operation, and disengaging the device shall not restart the machinery or related product but only permit restarting.\n\nThe emergency stop function shall be available and operational at all times, regardless of the operating mode.\n\nEmergency stop devices shall be a backup to other safeguarding measures and not a substitute for them."
      }
    },
    {
      "id": "ESR-056",
      "type": "ESR",
      "parent": "ESR-052",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 1.2.4.4",
        "title": "Assembly of machinery or related products",
        "requirement": "In the case of machinery or a related product or parts of machinery or a related product designed to work together, the machinery or a related product shall be designed and constructed in such a way that the stop controls, including the emergency stop devices, can stop not only the machinery or related product itself but also all related equipment, if its continued operation may be dangerous."
      }
    },
    {
      "id": "ESR-057",
      "type": "ESR",
      "parent": "ESR-048",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 1.2.5",
        "title": "Selection of control or operating modes",
        "requirement": "The control or operating mode selected shall override all other control or operating modes, with the exception of the emergency stop.\n\nIf the machinery or related product has been designed and constructed to allow its use in several control or operating modes requiring different protective measures and/or work procedures, it shall be fitted with a mode selector, which can be locked in each position. Each position of the selector shall be clearly identifiable and shall correspond to a single operating or control mode.\n\nThe selector may be replaced by another selection method, which restricts the use of certain functions of the machinery or related product to certain categories of operator.\n\nIf, for certain operations, the machinery or related product shall be able to operate with a guard displaced or removed and/or a protective device disabled, the control or operating mode selector shall simultaneously:\n\n(a) disable all other control or operating modes;\n\n(b) permit operation of hazardous functions only by control devices requiring sustained action;\n\n(c) permit the operation of hazardous functions only in reduced risk conditions while preventing hazards from linked sequences;\n\n(d) prevent any operation of hazardous functions by voluntary or involuntary action on the machinery’s or related product’s sensors.\n\nIf these four conditions cannot be fulfilled simultaneously, the control or operating mode selector shall activate other protective measures designed and constructed to ensure a safe intervention zone.\n\nIn addition, the operator shall be able to control the operation of the parts he or she is working on from the adjustment point."
      }
    },
    {
      "id": "ESR-058",
      "type": "ESR",
      "parent": "ESR-048",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 1.2.6",
        "title": "Failure of the power supply or communication network connection",
        "requirement": "The interruption, the re-establishment after an interruption or the fluctuation in whatever manner of the power supply or communication network connection to the machinery or related product shall not lead to hazardous situations.\n\nParticular attention shall be given to the following:\n\n(a) the machinery or related product shall not start unexpectedly;\n\n(b) the parameters of the machinery shall not change in an uncontrolled way when such change can lead to hazardous situations;\n\n(c) the machinery or related product shall not be prevented from stopping if the stop command has already been given;\n\n(d) no moving part of the machinery or related product or piece held by the machinery or related product shall fall or be ejected;\n\n(e) automatic or manual stopping of the moving parts, whatever they may be, shall be unimpeded;\n\n(f) the protective devices shall remain fully effective or give a stop command."
      }
    },
    {
      "id": "ESR-059",
      "type": "ESR",
      "parent": "ESR-037",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3",
        "title": "Protection against mechanical risks"
      }
    },
    {
      "id": "ESR-060",
      "type": "ESR",
      "parent": "ESR-059",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3.1",
        "title": "Risk of loss of stability",
        "requirement": "The machinery or related product and its components and fittings shall be stable enough to avoid overturning, falling or uncontrolled movements during transportation, assembly, dismantling and any other action involving the machinery or related product.\n\nIf the shape of the machinery or related product itself or its intended installation does not offer sufficient stability, appropriate means of anchorage shall be incorporated and indicated in the instructions for use."
      }
    },
    {
      "id": "ESR-061",
      "type": "ESR",
      "parent": "ESR-059",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3.2",
        "title": "Risk of break-up during operation",
        "requirement": "The various parts of machinery or related products and their linkages shall be able to withstand the stresses to which they are subject when used.\n\nThe durability of the materials used shall be adequate for the nature of the working environment foreseen by the manufacturer, in particular as regards the phenomena of fatigue, ageing, corrosion and abrasion.\n\nThe instructions for use shall indicate the type and frequency of inspections and maintenance required for safety reasons. They shall, where appropriate, indicate the parts subject to wear and the criteria for replacement.\n\nWhere a risk of rupture or disintegration remains despite the measures taken, the parts concerned shall be mounted, positioned or guarded in such a way that any fragments will be contained, preventing hazardous situations.\n\nBoth rigid and flexible pipes carrying fluids, particularly those under high pressure, shall be able to withstand the foreseen internal and external stresses and shall be firmly attached or protected to ensure that no risk is presented by a rupture.\n\nWhere the material to be processed is fed to the tool automatically, the following conditions shall be fulfilled to avoid risks to persons:\n\n(a) when the work piece comes into contact with the tool, the latter shall have attained its normal working condition;\n\n(b) when the tool starts and/or stops (intentionally or accidentally), the feed movement and the tool movement shall be coordinated."
      }
    },
    {
      "id": "ESR-062",
      "type": "ESR",
      "parent": "ESR-059",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3.3",
        "title": "Risks due to falling or ejected objects",
        "requirement": "Precautions shall be taken to prevent risks from falling or ejected objects."
      }
    },
    {
      "id": "ESR-063",
      "type": "ESR",
      "parent": "ESR-059",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3.4",
        "title": "Risks due to surfaces, edges or angles",
        "requirement": "Insofar as their purpose allows, accessible parts of the machinery or a related product shall have no sharp edges, no sharp angles and no rough surfaces likely to cause injury."
      }
    },
    {
      "id": "ESR-064",
      "type": "ESR",
      "parent": "ESR-059",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3.5",
        "title": "Risks related to a combined machinery or related product",
        "requirement": "Where the machinery or related product is intended to carry out several different operations with manual removal of the piece between each operation (combined machinery or related product), it shall be designed and constructed in such a way as to enable each element to be used separately without the other elements constituting a risk for exposed persons.\n\nFor this purpose, it shall be possible to start and stop separately any elements that are not protected."
      }
    },
    {
      "id": "ESR-065",
      "type": "ESR",
      "parent": "ESR-059",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3.6",
        "title": "Risks related to variations in operating conditions",
        "requirement": "Where the machinery or related product performs operations under different conditions of use, it shall be designed and constructed in such a way that selection and adjustment of these conditions can be carried out safely and reliably."
      }
    },
    {
      "id": "ESR-066",
      "type": "ESR",
      "parent": "ESR-059",
      "order": 6,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3.7",
        "title": "Risks related to moving parts",
        "requirement": "The moving parts of the machinery or related product shall be designed and constructed in such a way as to prevent risks of contact which could lead to accidents or shall, where risks persist, be fitted with guards or protective devices.\n\nAll necessary steps shall be taken to prevent accidental blockage of moving parts. In cases where, despite the precautions taken, a blockage is likely to occur, the necessary specific protective devices and tools shall, when appropriate, be provided to enable the equipment to be safely unblocked.\n\nThe instructions for use and, where possible, a sign on the machinery or related product shall identify these specific protective devices and how they are to be used.\n\nThe prevention of risks of contact leading to hazardous situations and the psychological stress that may be caused by the interaction with the machinery shall be adapted to:\n\n(a) human-machine coexistence in a shared space without direct collaboration;\n\n(b) human-machine interaction."
      }
    },
    {
      "id": "ESR-067",
      "type": "ESR",
      "parent": "ESR-059",
      "order": 7,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3.8",
        "title": "Choice of protection against risks arising from moving parts",
        "requirement": "Guards or protective devices designed to protect against risks arising from moving parts shall be selected on the basis of the type of risk. The following guidelines shall be used to help to make the choice."
      }
    },
    {
      "id": "ESR-068",
      "type": "ESR",
      "parent": "ESR-067",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3.8.1",
        "title": "Moving transmission parts",
        "requirement": "Guards designed to protect persons against the hazards generated by moving transmission parts shall be:\n\n(a) either fixed guards as referred to in section 1.4.2.1; or\n\n(b) interlocking movable guards as referred to in section 1.4.2.2.\n\nInterlocking movable guards shall be used where frequent access is envisaged."
      }
    },
    {
      "id": "ESR-069",
      "type": "ESR",
      "parent": "ESR-067",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3.8.2",
        "title": "Moving parts involved in the process",
        "requirement": "Guards or protective devices designed to protect persons against the hazards generated by moving parts involved in the process shall be:\n\n(a) either fixed guards as referred to in section 1.4.2.1; or\n\n(b) interlocking movable guards as referred to in section 1.4.2.2; or\n\n(c) protective devices as referred to in section 1.4.3; or\n\n(d) a combination of the above.\n\nHowever, when certain moving parts directly involved in the process cannot be made completely inaccessible during operation owing to operations requiring operator intervention, such parts shall be fitted with:\n\n(a) fixed guards or interlocking movable guards preventing access to those sections of the parts that are not used in the work; and\n\n(b) adjustable guards as referred to in section 1.4.2.3 restricting access to those sections of the moving parts where access is necessary."
      }
    },
    {
      "id": "ESR-070",
      "type": "ESR",
      "parent": "ESR-059",
      "order": 8,
      "attributes": {
        "reference": "Annex III, Part B, point 1.3.9",
        "title": "Risks of uncontrolled movements",
        "requirement": "When a part of the machinery or related product has been stopped, any drift away from the stopping position, for whatever reason other than action on the control devices, shall be prevented or shall be such that it does not present a risk."
      }
    },
    {
      "id": "ESR-071",
      "type": "ESR",
      "parent": "ESR-037",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 1.4",
        "title": "Required characteristics of guards and protective devices"
      }
    },
    {
      "id": "ESR-072",
      "type": "ESR",
      "parent": "ESR-071",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.4.1",
        "title": "General requirements",
        "requirement": "Guards and protective devices shall:\n\n(a) be of robust construction;\n\n(b) be securely held in place;\n\n(c) not give rise to any additional hazard;\n\n(d) not be easy to by-pass or render non-operational;\n\n(e) be located at an adequate distance from the danger zone;\n\n(f) cause minimum obstruction to the view of the production process, and;\n\n(g) enable essential work to be carried out on the installation and/or replacement of tools and for maintenance purposes by restricting access exclusively to the area where the work has to be done, if possible without the guard having to be removed or the protective device having to be disabled.\n\nIn addition, guards shall, where possible, protect against the ejection or falling of materials or objects and against emissions generated by the machinery or related product."
      }
    },
    {
      "id": "ESR-073",
      "type": "ESR",
      "parent": "ESR-071",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.4.2",
        "title": "Special requirements for guards"
      }
    },
    {
      "id": "ESR-074",
      "type": "ESR",
      "parent": "ESR-073",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.4.2.1",
        "title": "Fixed guards",
        "requirement": "Fixed guards shall be fixed by systems that can be opened or removed only with tools.\n\nTheir fixing systems shall remain attached to the guards or to the machinery or related product when the guards are removed.\n\nWhere possible, guards shall be incapable of remaining in place without their fixings."
      }
    },
    {
      "id": "ESR-075",
      "type": "ESR",
      "parent": "ESR-073",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.4.2.2",
        "title": "Interlocking movable guards",
        "requirement": "Interlocking movable guards shall:\n\n(a) as far as possible remain attached to the machinery or related product when open;\n\n(b) be designed and constructed in such a way that they can be adjusted only by means of an intentional action.\n\nInterlocking movable guards shall be associated with an interlocking device that:\n\n(a) prevents the start of hazardous machinery or related product functions until those guards are closed; and\n\n(b) gives a stop command whenever those guards are no longer closed.\n\nWhere it is possible for an operator to reach the danger zone before the risk due to the hazardous machinery or related product functions has ceased, movable guards shall be associated with a guard locking device in addition to an interlocking device that:\n\n(a) prevents the start of hazardous machinery or related product functions until the guard is closed and locked; and\n\n(b) keeps the guard closed and locked until the risk of injury from the hazardous machinery or related product functions has ceased.\n\nInterlocking movable guards shall be designed in such a way that the absence or failure of one of their components prevents starting or stops the hazardous machinery or related product functions."
      }
    },
    {
      "id": "ESR-076",
      "type": "ESR",
      "parent": "ESR-073",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 1.4.2.3",
        "title": "Adjustable guards restricting access",
        "requirement": "Adjustable guards restricting access to those areas of the moving parts strictly necessary for the work shall be:\n\n(a) adjustable manually or automatically, depending on the type of work involved; and\n\n(b) readily adjustable without the use of tools."
      }
    },
    {
      "id": "ESR-077",
      "type": "ESR",
      "parent": "ESR-071",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 1.4.3",
        "title": "Special requirements for protective devices",
        "requirement": "Protective devices shall be designed and incorporated into the control system in such a way that:\n\n(a) moving parts cannot start up while they are within the operator’s reach;\n\n(b) persons cannot reach moving parts while the parts are moving, and\n\n(c) the absence or failure of one of their components prevents starting or stops the moving parts.\n\nProtective devices shall be adjustable only by means of an intentional action."
      }
    },
    {
      "id": "ESR-078",
      "type": "ESR",
      "parent": "ESR-037",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5",
        "title": "Risks due to other causes"
      }
    },
    {
      "id": "ESR-079",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.1",
        "title": "Electricity supply",
        "requirement": "Where machinery or related products have an electricity supply, they shall be designed, constructed and equipped in such a way that all hazards of an electrical nature are or can be prevented.\n\nThe safety objectives set out in Directive 2014/35/EU shall apply to machinery or related products. However, the obligations concerning conformity assessment and the placing on the market or putting into service of machinery or related products with regard to electrical risks are governed solely by this Regulation."
      }
    },
    {
      "id": "ESR-080",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.2",
        "title": "Static electricity",
        "requirement": "Machinery or related products shall be designed and constructed to prevent or limit the build-up of potentially dangerous electrostatic charges and/or be fitted with a discharging system."
      }
    },
    {
      "id": "ESR-081",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.3",
        "title": "Energy supply other than electricity",
        "requirement": "Where machinery or related products are powered by source of energy other than electricity, they shall be so designed, constructed and equipped as to avoid all potential risks associated with such sources of energy."
      }
    },
    {
      "id": "ESR-082",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.4",
        "title": "Errors of fitting",
        "requirement": "Errors likely to be made when fitting or refitting certain parts, which could be a source of risk, shall be made impossible by the design and construction of such parts or, failing this, by information given on the parts themselves or their housings. The same information shall be given on moving parts or their housings where the direction of movement needs to be known in order to avoid a risk.\n\nWhere necessary, the instructions for use shall give further information on these risks.\n\nWhere a faulty connection can be the source of risk, incorrect connections shall be made impossible by design or, failing this, by information given on the elements to be connected and, where appropriate, on the means of connection."
      }
    },
    {
      "id": "ESR-083",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.5",
        "title": "Extreme temperatures",
        "requirement": "Steps shall be taken to eliminate any risk of injury arising from contact with or proximity to machinery or related product parts or materials at high or very low temperatures.\n\nThe necessary steps shall also be taken to avoid or protect against the risk of hot or very cold material being ejected."
      }
    },
    {
      "id": "ESR-084",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.6",
        "title": "Fire",
        "requirement": "Machinery or related products shall be designed and constructed in such a way as to avoid any risk of fire or overheating presented by the machinery or related product itself or by gases, liquids, dust, vapours or other substances produced or used by the machinery or related product."
      }
    },
    {
      "id": "ESR-085",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 6,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.7",
        "title": "Explosion",
        "requirement": "Machinery or related products shall be designed and constructed in such a way as to avoid any risk of explosion presented by the machinery or related product itself or by gases, liquids, dust, vapours or other substances produced or used by the machinery or related product.\n\nMachinery or related products shall comply, as far as the risk of explosion due to its use in a potentially explosive atmosphere is concerned, with the provisions of the specific Union harmonisation legislation."
      }
    },
    {
      "id": "ESR-086",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 7,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.8",
        "title": "Noise",
        "requirement": "Machinery or related products shall be designed and constructed in such a way that risks resulting from the emission of airborne noise are reduced to the lowest level, taking account of technical progress and the availability of means of reducing noise, in particular at source.\n\nThe level of noise emission may be assessed with reference to comparative emission data for similar machinery or related products."
      }
    },
    {
      "id": "ESR-087",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 8,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.9",
        "title": "Vibrations",
        "requirement": "Machinery or related products shall be designed and constructed in such a way that risks resulting from vibrations produced by the machinery or related product are reduced to the lowest level, taking account of technical progress and the availability of means of reducing vibration, in particular at source.\n\nThe level of vibration emission may be assessed with reference to comparative emission data for similar machinery or related products."
      }
    },
    {
      "id": "ESR-088",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 9,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.10",
        "title": "Radiation",
        "requirement": "Undesirable radiation emissions from machinery or related products shall be eliminated or be reduced to levels that do not have adverse effects on persons.\n\nAny functional ionising radiation emissions shall be limited to the lowest level, which is sufficient for the proper functioning of the machinery or related product during setting, operation and cleaning. Where a risk exists, the necessary protective measures shall be taken.\n\nAny functional non-ionising radiation emissions during setting, operation and cleaning shall be limited to levels that do not have adverse effects on persons."
      }
    },
    {
      "id": "ESR-089",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 10,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.11",
        "title": "External radiation",
        "requirement": "Machinery or related products shall be designed and constructed in such a way that external radiation does not interfere with its operation."
      }
    },
    {
      "id": "ESR-090",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 11,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.12",
        "title": "Laser radiation",
        "requirement": "Where laser equipment is used, the following shall be taken into account:\n\n(a) laser equipment on machinery or related products shall be designed and constructed in such a way as to prevent any accidental radiation;\n\n(b) laser equipment on machinery or related products shall be protected in such a way that effective radiation, radiation produced by reflection or diffusion and secondary radiation do not damage health;\n\n(c) optical equipment for the observation or adjustment of laser equipment on machinery or related products shall be such that no health risk is created by laser radiation."
      }
    },
    {
      "id": "ESR-091",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 12,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.13",
        "title": "Emissions of hazardous materials and substances",
        "requirement": "Machinery or related products shall be designed and constructed in such a way that risks of inhalation, ingestion, contact with the skin, eyes and mucous membranes and penetration through the skin of hazardous materials and substances which it produces can be avoided.\n\nWhere a hazard cannot be eliminated, the machinery or related product shall be so equipped that hazardous materials and substances can be contained, captured, evacuated, precipitated by water spraying, filtered or treated by another equally effective method.\n\nWhere the process is not totally enclosed during normal operation of the machinery or related product, the devices for containment or capture, filtration or separation and evacuation shall be situated in such a way as to have the maximum effect."
      }
    },
    {
      "id": "ESR-092",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 13,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.14",
        "title": "Risk of being trapped in a machine",
        "requirement": "Machinery or related products shall be designed, constructed or fitted with a means of preventing a person from being enclosed within it or, if that is impossible, with a means of summoning help."
      }
    },
    {
      "id": "ESR-093",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 14,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.15",
        "title": "Risk of slipping, tripping or falling",
        "requirement": "Parts of the machinery or related product where persons are liable to move about or stand shall be designed and constructed in such a way as to prevent persons slipping, tripping or falling on or off these parts.\n\nWhere appropriate, these parts shall be fitted with handholds that are fixed relative to the user and that enable them to maintain their stability."
      }
    },
    {
      "id": "ESR-094",
      "type": "ESR",
      "parent": "ESR-078",
      "order": 15,
      "attributes": {
        "reference": "Annex III, Part B, point 1.5.16",
        "title": "Lightning",
        "requirement": "Machinery or related products in need of protection against the effects of lightning while being used shall be fitted with a system for conducting the resultant electrical charge to earth."
      }
    },
    {
      "id": "ESR-095",
      "type": "ESR",
      "parent": "ESR-037",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 1.6",
        "title": "Maintenance"
      }
    },
    {
      "id": "ESR-096",
      "type": "ESR",
      "parent": "ESR-095",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.6.1",
        "title": "Machinery or related product maintenance",
        "requirement": "Adjustment and maintenance points shall be located outside danger zones. It shall be possible to carry out adjustment, maintenance, repair, cleaning and servicing operations while the machinery or related product is at a standstill.\n\nIf one or more of the above conditions cannot be satisfied for technical reasons, measures shall be taken to ensure that these operations can be carried out safely (see section 1.2.5).\n\nIn the case of automated machinery and, where necessary, other machinery or related products, a connecting device for mounting diagnostic fault-finding equipment shall be provided.\n\nAutomated machinery or related product components, which have to be changed frequently, shall be capable of being removed and replaced easily and safely. Access to the components shall enable these tasks to be carried out with the necessary technical means in accordance with a specified operating method."
      }
    },
    {
      "id": "ESR-097",
      "type": "ESR",
      "parent": "ESR-095",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.6.2",
        "title": "Access to operating positions and servicing points",
        "requirement": "Machinery or related products shall be designed and constructed in such a way as to allow access in safety to all areas where intervention is necessary during operation, adjustment, maintenance and cleaning of the machinery or related product.\n\nIn the case of machinery or related products into which persons shall enter for operation, adjustment, maintenance or cleaning, the machinery accesses shall be dimensioned and adapted for the use of rescue equipment in such a way that an emergency rescue of the persons is possible."
      }
    },
    {
      "id": "ESR-098",
      "type": "ESR",
      "parent": "ESR-095",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 1.6.3",
        "title": "Isolation of energy sources",
        "requirement": "Machinery or related products shall be fitted with means to isolate it from all energy sources. Such isolators shall be clearly identified. They shall be capable of being locked if reconnection could endanger persons. Isolators shall also be capable of being locked where an operator is unable, from any of the points to which he or she has access, to check that the energy is still cut off.\n\nIn the case of machinery or related products capable of being plugged into an electricity supply, removal of the plug is sufficient, if the operator can check from any of the points to which he or she has access that the plug remains removed.\n\nAfter the energy is cut off, it shall be possible to dissipate normally any energy remaining or stored in the circuits of the machinery or related product without risk to persons.\n\nAs an exception to the requirement laid down in the previous paragraphs, certain circuits may remain connected to their energy sources in order, for example, to hold parts, to protect information, to light interiors, etc. In this case, special steps shall be taken to ensure operator safety."
      }
    },
    {
      "id": "ESR-099",
      "type": "ESR",
      "parent": "ESR-095",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 1.6.4",
        "title": "Operator intervention",
        "requirement": "The machinery or related product shall be so designed, constructed and equipped that the need for operator intervention is limited. If operator intervention cannot be avoided, it shall be possible to carry it out easily and safely."
      }
    },
    {
      "id": "ESR-100",
      "type": "ESR",
      "parent": "ESR-095",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 1.6.5",
        "title": "Cleaning of internal parts",
        "requirement": "The machinery or related product shall be designed and constructed in such a way that it is possible to clean internal parts, which have contained dangerous substances or mixtures without entering them; any necessary unblocking shall also be possible from the outside. If it is impossible to avoid entering the machinery or related product, it shall be designed and constructed in such a way as to allow cleaning to take place safely."
      }
    },
    {
      "id": "ESR-101",
      "type": "ESR",
      "parent": "ESR-037",
      "order": 6,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7",
        "title": "Information"
      }
    },
    {
      "id": "ESR-102",
      "type": "ESR",
      "parent": "ESR-101",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.1",
        "title": "Information and warnings on the machinery or related product",
        "requirement": "Information and warnings on the machinery or related product shall preferably be provided in the form of readily understandable symbols or pictograms.\n\nAny written or verbal information and warnings must be expressed in a language which can be easily understood by users, as determined by the Member State concerned."
      }
    },
    {
      "id": "ESR-103",
      "type": "ESR",
      "parent": "ESR-102",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.1.1",
        "title": "Information and information devices",
        "requirement": "The information needed to control machinery or a related product shall be provided in a form that is unambiguous and easily understood. It shall not be excessive to the extent of overloading the operator.\n\nVisual display units or any other interactive means of communication between the operator and the machinery or related product shall be easily understood and easy to use."
      }
    },
    {
      "id": "ESR-104",
      "type": "ESR",
      "parent": "ESR-102",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.1.2",
        "title": "Warning devices",
        "requirement": "Where the health and safety of persons may be endangered by a fault in the operation of unsupervised machinery or a related product, the machinery or related product shall be equipped in such a way as to give an appropriate acoustic or light signal as a warning.\n\nWhere machinery or a related product is equipped with warning devices, these shall be unambiguous and easily perceived. The operator shall have facilities to check the operation of such warning devices at all times.\n\nThe requirements of the specific Union legal acts concerning colours and safety signals shall be complied with."
      }
    },
    {
      "id": "ESR-105",
      "type": "ESR",
      "parent": "ESR-101",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.2",
        "title": "Warning of residual risks",
        "requirement": "Where risks remain despite the inherent safe design measures, safeguarding and complementary protective measures adopted, the necessary warnings, including warning devices, shall be provided."
      }
    },
    {
      "id": "ESR-106",
      "type": "ESR",
      "parent": "ESR-101",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.3",
        "title": "Marking of machinery or related products",
        "requirement": "In addition to the marking requirements in Article 10 and 24, machinery or related products shall be marked visibly, legibly and indelibly.\n\nMachinery or related products covered by chapters 2 to 6 of this Annex shall also be marked according to the additional requirements set out in those chapters.\n\nFurthermore, machinery, or a related product, designed and constructed for use in a potentially explosive atmosphere shall be marked accordingly.\n\nMachinery or related products shall also bear full information relevant to their type and essential for safe use. Such information is subject to the requirements set out in section 1.7.1.\n\nWhere machinery or a related product part is handled during use with lifting equipment, its mass shall be indicated legibly, indelibly and unambiguously."
      }
    },
    {
      "id": "ESR-107",
      "type": "ESR",
      "parent": "ESR-101",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4",
        "title": "Instructions for use",
        "requirement": "In addition to the obligations set out in Article 10(7), instructions for use shall be drawn up as set out below.\n\nBy way of exception to Article 10(7), the maintenance instructions intended for use by specialised personnel mandated by the manufacturer or its authorised representative may be supplied in only one official language of the Union which the specialised personnel understand."
      }
    },
    {
      "id": "ESR-108",
      "type": "ESR",
      "parent": "ESR-107",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.1",
        "title": "General principles for the drafting of instructions for use",
        "requirement": "(a) The contents of the instructions for use shall cover not only the intended use of the machinery or related product but also take into account any reasonably foreseeable misuse thereof;\n\n(b) In the case of machinery or related products intended for use by non-professional operators, the wording and layout of the instructions for use shall take into account the level of general education and acumen that can reasonably be expected from such operators."
      }
    },
    {
      "id": "ESR-109",
      "type": "ESR",
      "parent": "ESR-107",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2",
        "title": "Contents of the instructions for use",
        "requirement": "1. Instructions for use shall contain, where applicable, at least the following information:"
      }
    },
    {
      "id": "ESR-110",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(a)",
        "title": "Contents of the instructions for use",
        "requirement": "(a) the business name and full address of the manufacturer and, where applicable, of its authorised representative;"
      }
    },
    {
      "id": "ESR-111",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(b)",
        "title": "Contents of the instructions for use",
        "requirement": "(b) the designation of the machinery or related product as marked on the machinery or related product itself, except for the serial number (see section 1.7.3);"
      }
    },
    {
      "id": "ESR-112",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(c)",
        "title": "Contents of the instructions for use",
        "requirement": "(c) the EU declaration of conformity, or the internet address or machine readable code, where the EU declaration of conformity can be accessed, in accordance with Article 10(8);"
      }
    },
    {
      "id": "ESR-113",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(d)",
        "title": "Contents of the instructions for use",
        "requirement": "(d) a general description of the machinery or related product;"
      }
    },
    {
      "id": "ESR-114",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(e)",
        "title": "Contents of the instructions for use",
        "requirement": "(e) the drawings, diagrams, descriptions and explanations necessary for the use, maintenance and repair of the machinery or related product and for checking its correct functioning;"
      }
    },
    {
      "id": "ESR-115",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(f)",
        "title": "Contents of the instructions for use",
        "requirement": "(f) a description of the workstation(s) likely to be occupied by operators;"
      }
    },
    {
      "id": "ESR-116",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 6,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(g)",
        "title": "Contents of the instructions for use",
        "requirement": "(g) a description of the intended use of the machinery or related product;"
      }
    },
    {
      "id": "ESR-117",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 7,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(h)",
        "title": "Contents of the instructions for use",
        "requirement": "(h) warnings concerning the ways in which the machinery or related product must not be used that experience has shown might occur;"
      }
    },
    {
      "id": "ESR-118",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 8,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(i)",
        "title": "Contents of the instructions for use",
        "requirement": "(i) assembly, installation and connection instructions, including drawings, diagrams and the means of attachment and the designation of the chassis or installation on which the machinery or related product is to be mounted;"
      }
    },
    {
      "id": "ESR-119",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 9,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(j)",
        "title": "Contents of the instructions for use",
        "requirement": "(j) instructions relating to installation and assembly for reducing noise or vibration;"
      }
    },
    {
      "id": "ESR-120",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 10,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(k)",
        "title": "Contents of the instructions for use",
        "requirement": "(k) instructions for the putting into service and use of the machinery or related product and, if necessary, instructions for the training of operators;"
      }
    },
    {
      "id": "ESR-121",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 11,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(l)",
        "title": "Contents of the instructions for use",
        "requirement": "(l) information about the residual risks that remain despite the inherent safe design measures, safeguarding and complementary protective measures adopted;"
      }
    },
    {
      "id": "ESR-122",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 12,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(m)",
        "title": "Contents of the instructions for use",
        "requirement": "(m) instructions on the protective measures to be taken by the user, including, where appropriate, the personal protective equipment to be provided;"
      }
    },
    {
      "id": "ESR-123",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 13,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(n)",
        "title": "Contents of the instructions for use",
        "requirement": "(n) the essential characteristics of tools, which may be fitted to the machinery or related product;"
      }
    },
    {
      "id": "ESR-124",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 14,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(o)",
        "title": "Contents of the instructions for use",
        "requirement": "(o) the conditions in which the machinery or related product meets the requirement of stability during use, transportation, assembly, dismantling when out of service, testing or foreseeable breakdowns;"
      }
    },
    {
      "id": "ESR-125",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 15,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(p)",
        "title": "Contents of the instructions for use",
        "requirement": "(p) instructions with a view to ensuring that transport, handling and storage operations can be made safely, giving the mass of the machinery or related product and of its various parts where these are regularly to be transported separately;"
      }
    },
    {
      "id": "ESR-126",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 16,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(q)",
        "title": "Contents of the instructions for use",
        "requirement": "(q) the operating method to be followed in the event of accident or breakdown; if a blockage is likely to occur, the operating method to be followed so as to enable the equipment to be safely unblocked;"
      }
    },
    {
      "id": "ESR-127",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 17,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(r)",
        "requirement": "(r) the description of the adjustment and maintenance operations that should be carried out by the user and the preventive maintenance measures that should be observed taking account of the design and the use of the machinery or related product;",
        "title": "Contents of the instructions for use"
      }
    },
    {
      "id": "ESR-128",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 18,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(s)",
        "title": "Contents of the instructions for use",
        "requirement": "(s) instructions designed to enable adjustment and maintenance to be carried out safely, including the protective measures that should be taken during these operations;"
      }
    },
    {
      "id": "ESR-129",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 19,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(t)",
        "title": "Contents of the instructions for use",
        "requirement": "(t) the specifications of the spare parts to be used, when these affect the health and safety of operators;"
      }
    },
    {
      "id": "ESR-130",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 20,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(u)",
        "requirement": "(u) the following information on airborne noise emissions:\n\n(i) the A-weighted emission sound pressure level at workstations, where this exceeds 70 dB (A); where this level does not exceed 70 dB (A), this fact shall be indicated;\n\n(ii) the peak C-weighted instantaneous sound pressure value at workstations, where this exceeds 63 Pa (130 dB in relation to 20 μPa);\n\n(iii) the A-weighted sound power level emitted by the machinery or related product, where the A-weighted emission sound pressure level at workstations exceeds 80 dB (A).\n\nThese values shall be either those actually measured for the machinery or related product in question or those established on the basis of measurements taken for technically comparable machinery or for a technically comparable related product, which is representative of the machinery or related product to be produced.\n\nIn the case of very large machinery or a related product, instead of the A-weighted sound power level, the A-weighted emission sound pressure levels at specified positions around the machinery or related product may be indicated.\n\nWhere the harmonised standards or common specifications adopted by the Commission in accordance with Article 20(3) cannot be applied, sound levels shall be measured using the most appropriate method for the machinery or related product.\n\nWhenever sound emission values are indicated, the uncertainties surrounding these values shall be specified. The operating conditions of the machinery or related product during measurement and the measuring methods used shall be described.\n\nWhere the workstation(s) are undefined or cannot be defined, A-weighted sound pressure levels shall be measured at a distance of 1 m from the surface of the machinery or related product and at a height of 1,6 m from the floor or access platform. The position and value of the maximum sound pressure shall be indicated.\n\nWith respect to noise reduction machinery or related products, the instructions for use shall specify, where appropriate, how to correctly assemble and install that equipment (see also section 1.7.4.2(1), point (j)).\n\nWhere specific Union legal acts lay down other requirements for the measurement of sound pressure levels or sound power levels, those legal acts shall be applied and the corresponding provisions of this section shall not apply;",
        "title": "Contents of the instructions for use"
      }
    },
    {
      "id": "ESR-131",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 21,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(v)",
        "title": "Contents of the instructions for use",
        "requirement": "(v) information on the necessary precautions, devices and means for the immediate and gentle rescue of persons;"
      }
    },
    {
      "id": "ESR-132",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 22,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(w)",
        "title": "Contents of the instructions for use",
        "requirement": "(w) where machinery or related products are likely to emit non-ionising radiation, which may cause harm to persons, in particular persons with active or non-active implantable medical devices, information concerning the radiation emitted for the operator and exposed persons;"
      }
    },
    {
      "id": "ESR-133",
      "type": "ESR",
      "parent": "ESR-109",
      "order": 23,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.4.2(x)",
        "title": "Contents of the instructions for use",
        "requirement": "(x) where the design of machinery or related products allows emissions of hazardous substances from the machinery or related product, the characteristics of the capturing, filtration or discharge device if such device is not provided with the machinery or related product, and any of the following:\n\n(i) the flow rate for the emission of hazardous materials and substances from the machinery or related product;\n\n(ii) the concentration of hazardous materials or substances around the machinery or related product coming from the machinery or related product or from materials or substances used with the machinery or related product;\n\n(iii) the effectiveness of the capturing or filtration device and the conditions to be observed to maintain its effectiveness over time.\n\nThe values referred to in the first subparagraph shall either be actually measured for the machinery or related product in question or established based on measurements in respect of technically comparable machinery or a technically comparable related product, which is representative of the state of the art."
      }
    },
    {
      "id": "ESR-134",
      "type": "ESR",
      "parent": "ESR-101",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 1.7.5",
        "title": "Sales literature",
        "requirement": "Sales literature describing the machinery or related product shall not contradict the instructions for use as regards health and safety aspects. Sales literature describing the performance characteristics of the machinery or related product shall contain the same information on emissions as is contained in the instructions for use."
      }
    },
    {
      "id": "ESR-135",
      "type": "ESR",
      "parent": "ESR-036",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 2",
        "title": "Supplementary essential health and safety requirements for certain categories of machinery and related products",
        "requirement": "Machinery and related products for foodstuffs, machinery and related products for cosmetics or pharmaceutical products, portable hand-held or hand-guided machinery and related products, portable fixing and other impact machinery and related products, machinery and related products for working wood and material with similar physical characteristics and machinery and related products for plant protection products application shall meet all the essential health and safety requirements set out in this chapter (see General Principles, point 4)."
      }
    },
    {
      "id": "ESR-136",
      "type": "ESR",
      "parent": "ESR-135",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 2.1",
        "title": "Machinery and related products for foodstuffs and machinery and related products for cosmetics or pharmaceutical products"
      }
    },
    {
      "id": "ESR-137",
      "type": "ESR",
      "parent": "ESR-136",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 2.1.1",
        "title": "General",
        "requirement": "Machinery or related products intended for use with foodstuffs or with cosmetics or pharmaceutical products shall be designed and constructed in such a way as to avoid any risk of infection, sickness or contagion.\n\nThe following requirements shall be observed:\n\n(a) materials in contact with, or intended to come into contact with, foodstuffs or water intended for human consumption or cosmetics or pharmaceutical products shall satisfy the conditions laid down in the relevant Union legal acts; the machinery or related product shall be designed and constructed in such a way that these materials can be cleaned before each use and where this is not possible, disposable parts shall be used;\n\n(b) all surfaces in contact with foodstuffs or water intended for human consumption or cosmetics or pharmaceutical products, other than surfaces of disposable parts, shall:\n\n(i) be smooth and have neither ridges nor crevices, which could harbour organic materials, and the same applies to their joinings;\n\n(ii) be designed and constructed in such a way as to reduce the projections, edges and recesses of assemblies to a minimum;\n\n(iii) be easily cleaned and disinfected, where necessary after removing easily dismantled parts; the inside surfaces shall have curves with a radius sufficient to allow thorough cleaning;\n\n(c) it shall be possible for liquids, gases and aerosols deriving from foodstuffs, cosmetics or pharmaceutical products as well as from cleaning, disinfecting and rinsing fluids to be completely discharged from the machinery or related product (if possible, in a ‘cleaning’ position);\n\n(d) machinery or related products shall be designed and constructed in such a way as to prevent any substances or living creatures, in particular insects, from entering, or any organic matter from accumulating in, areas that cannot be cleaned;\n\n(e) machinery or related products shall be designed and constructed in such a way that no ancillary substances hazardous to health, including the lubricants used, can come into contact with foodstuffs or water intended for human consumption, cosmetics or pharmaceutical products; where necessary, machinery or related products shall be designed and constructed in such a way that continuing compliance with this requirement can be checked."
      }
    },
    {
      "id": "ESR-138",
      "type": "ESR",
      "parent": "ESR-136",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 2.1.2",
        "title": "Instructions for use",
        "requirement": "The instructions for use for machinery or related products for foodstuffs and machinery or related products for cosmetics or pharmaceutical products shall indicate recommended products and methods for cleaning, disinfecting and rinsing, not only for easily accessible areas but also for areas to which access is impossible or inadvisable."
      }
    },
    {
      "id": "ESR-139",
      "type": "ESR",
      "parent": "ESR-135",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 2.2",
        "title": "Portable hand-held or hand-guided machinery or related products"
      }
    },
    {
      "id": "ESR-140",
      "type": "ESR",
      "parent": "ESR-139",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 2.2.1",
        "title": "General",
        "requirement": "Portable hand-held or hand-guided machinery or related products shall:\n\n(a) depending on the type of machinery or related product, have a supporting surface of sufficient size and have a sufficient number of handles and supports of an appropriate size, arranged in such a way as to ensure the stability of the machinery or related product under the intended operating conditions;\n\n(b) except where technically impossible, or where there is an independent control device, in the case of handles which cannot be released in complete safety, be fitted with manual start and stop control devices arranged in such a way that the operator can operate them without releasing the handles;\n\n(c) present no risks of accidental starting or continued operation after the operator has released the handles; equivalent steps shall be taken if this requirement is not technically feasible;\n\n(d) permit, where necessary, visual observation of the danger zone and of the action of the tool with the material being processed;\n\n(e) have a device or a connected exhaust system, with an extraction connection outlet or equivalent system to capture or reduce emissions of hazardous substances; this requirement does not apply if it leads to a new hazard or where the main function of the machinery or related product is the application of hazardous substances and to emissions of internal combustion engines;\n\n(f) be designed and constructed in such a way that the handles of portable machinery or related products make starting and stopping straightforward."
      }
    },
    {
      "id": "ESR-141",
      "type": "ESR",
      "parent": "ESR-140",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 2.2.1.1",
        "title": "Instructions for use",
        "requirement": "The instructions for use shall give the following information concerning vibrations, expressed as acceleration (m/s2), and transmitted by portable handheld or hand-guided machinery or related products:\n\n(a) the vibration total value from continuous vibrations to which the hand-arm system is subjected;\n\n(b) the mean value of the peak amplitude of the acceleration from repeated shock vibrations, to which the hand-arm system is subjected;\n\n(c) the uncertainty of both measurements.\n\nThe values referred to in the first subparagraph shall either be those actually measured for the machinery or related product in question or those established on the basis of measurements in respect of a technically comparable machinery or related product, which is representative of the state of the art.\n\nIf harmonised standards or common specifications adopted by the Commission in accordance with Article 20(3) cannot be applied, the vibration data shall be measured using the most appropriate measurement code for the machinery or related product.\n\nThe operating conditions during measurement and the methods used for measurement, or the reference of the harmonised standard applied, shall be specified."
      }
    },
    {
      "id": "ESR-142",
      "type": "ESR",
      "parent": "ESR-139",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 2.2.2",
        "title": "Portable fixing and other impact machinery or related products"
      }
    },
    {
      "id": "ESR-143",
      "type": "ESR",
      "parent": "ESR-142",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 2.2.2.1",
        "title": "General",
        "requirement": "Portable fixing and other impact machinery or related products shall be designed and constructed in such a way that:\n\n(a) energy is transmitted to the impacted element by the intermediary component that does not leave the device;\n\n(b) an enabling device prevents impact unless the machinery or related product is positioned correctly with adequate pressure on the base material;\n\n(c) involuntary triggering is prevented; where necessary, an appropriate sequence of actions on the enabling device and the control device shall be required to trigger an impact;\n\n(d) accidental triggering is prevented during handling or in case of shock;\n\n(e) loading and unloading operations can be carried out easily and safely.\n\nWhere necessary, it shall be possible to fit the device with splinter guard(s) and the appropriate guard(s) shall be provided by the manufacturer of the machinery or related product."
      }
    },
    {
      "id": "ESR-144",
      "type": "ESR",
      "parent": "ESR-142",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 2.2.2.2",
        "title": "Instructions for use",
        "requirement": "The instructions for use shall give the necessary information regarding:\n\n(a) the accessories and interchangeable equipment that can be used with the machinery or related product;\n\n(b) the suitable fixing or other impacted elements to be used with the machinery or related product;\n\n(c) where appropriate, the suitable cartridges to be used."
      }
    },
    {
      "id": "ESR-145",
      "type": "ESR",
      "parent": "ESR-135",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 2.3",
        "title": "Machinery or related products for working wood and material with similar physical characteristics",
        "requirement": "Machinery or related products for working wood and materials with similar physical characteristics shall comply with the following requirements:\n\n(a) the machinery or related product shall be designed, constructed or equipped in such a way that the piece being machined can be placed and guided in safety; where the piece is hand-held on a work-bench, the latter shall be sufficiently stable during the work and shall not impede the movement of the piece;\n\n(b) where the machinery or related product is likely to be used in conditions involving the risk of ejection of work pieces or parts of them, it shall be designed, constructed, or equipped in such a way as to prevent such ejection, or, if this is not possible, so that the ejection does not engender risks for the operator and/or exposed persons;\n\n(c) the machinery or related product shall be equipped with an automatic brake that stops the tool in a sufficiently short time if there is a risk of contact with the tool whilst it runs down;\n\n(d) where the tool is incorporated into non-fully automated machinery or a related product, that machinery or related product shall be designed and constructed in such a way as to eliminate or reduce the risk of accidental injury."
      }
    },
    {
      "id": "ESR-146",
      "type": "ESR",
      "parent": "ESR-135",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4",
        "title": "Machinery or related products for plant protection products application"
      }
    },
    {
      "id": "ESR-147",
      "type": "ESR",
      "parent": "ESR-146",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.1",
        "title": "For the purposes of section 2.4., the following definition applies:",
        "requirement": "‘Machinery or related products for plant protection products application’ means machinery or related products specifically intended for the application of plant protection products within the meaning of Article 2(1), of Regulation (EC) No 1107/2009 of the European Parliament and of the Council (1)."
      }
    },
    {
      "id": "ESR-148",
      "type": "ESR",
      "parent": "ESR-146",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.2",
        "title": "General",
        "requirement": "The manufacturer of machinery or related products for plant protection products application shall ensure that an assessment is carried out of the risks of unintended exposure of the environment to plant protection products, in accordance with the process of risk assessment and risk reduction referred to in the General Principles, point 1.\n\nMachinery or related products for plant protection products application shall be designed and constructed taking into account the results of the risk assessment referred to in the first subparagraph so that the machinery or related products can be operated, adjusted and maintained without unintended exposure of the environment to plant protection products.\n\nLeakage shall be prevented at all times."
      }
    },
    {
      "id": "ESR-149",
      "type": "ESR",
      "parent": "ESR-146",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.3",
        "title": "Controls and monitoring",
        "requirement": "It shall be possible to easily and accurately control, monitor and immediately stop the plant protection products application from the operating positions."
      }
    },
    {
      "id": "ESR-150",
      "type": "ESR",
      "parent": "ESR-146",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.4",
        "title": "Filling and emptying",
        "requirement": "The machinery or related product shall be designed and constructed to facilitate precise filling with the necessary quantity of plant protection products and to ensure easy and complete emptying, while preventing spillage of plant protection products and avoiding the contamination of the water source during such operations."
      }
    },
    {
      "id": "ESR-151",
      "type": "ESR",
      "parent": "ESR-146",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.5",
        "title": "Application of plant protection products"
      }
    },
    {
      "id": "ESR-152",
      "type": "ESR",
      "parent": "ESR-151",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.5.1",
        "title": "Application rate",
        "requirement": "The machinery or related product shall be fitted with means of adjusting the application rate easily, accurately and reliably."
      }
    },
    {
      "id": "ESR-153",
      "type": "ESR",
      "parent": "ESR-151",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.5.2",
        "title": "Distribution, deposition and drift of plant protection products",
        "requirement": "The machinery or related product shall be designed and constructed to ensure that the plant protection product is deposited on target areas, to minimise losses to other areas and to prevent drift of plant protection products to the environment. Where appropriate, an even distribution and homogeneous deposition shall be ensured."
      }
    },
    {
      "id": "ESR-154",
      "type": "ESR",
      "parent": "ESR-151",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.5.3",
        "title": "Tests",
        "requirement": "In order to verify that the relevant parts of the machinery or related product comply with the requirements set out in sections 2.4.5.1 and 2.4.5.2, the manufacturer shall, for each type of machinery or related product concerned, perform appropriate tests, or have such tests performed."
      }
    },
    {
      "id": "ESR-155",
      "type": "ESR",
      "parent": "ESR-151",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.5.4",
        "title": "Losses during stoppage",
        "requirement": "The machinery or related product shall be designed and constructed to prevent losses while the plant protection products application function is stopped."
      }
    },
    {
      "id": "ESR-156",
      "type": "ESR",
      "parent": "ESR-146",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.6",
        "title": "Maintenance"
      }
    },
    {
      "id": "ESR-157",
      "type": "ESR",
      "parent": "ESR-156",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.6.1",
        "title": "Cleaning",
        "requirement": "The machinery or related product shall be designed and constructed to allow its easy and thorough cleaning without contamination of the environment."
      }
    },
    {
      "id": "ESR-158",
      "type": "ESR",
      "parent": "ESR-156",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.6.2",
        "title": "Servicing",
        "requirement": "The machinery or related product shall be designed and constructed to facilitate the changing of worn parts without contamination of the environment."
      }
    },
    {
      "id": "ESR-159",
      "type": "ESR",
      "parent": "ESR-146",
      "order": 6,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.7",
        "title": "Inspections",
        "requirement": "It shall be possible to easily connect the necessary measuring instruments to the machinery or related product to check the correct functioning of the machinery or related product."
      }
    },
    {
      "id": "ESR-160",
      "type": "ESR",
      "parent": "ESR-146",
      "order": 7,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.8",
        "title": "Marking of nozzles, strainers and filters",
        "requirement": "Nozzles, strainers and filters shall be marked so that their type and size can be clearly identified."
      }
    },
    {
      "id": "ESR-161",
      "type": "ESR",
      "parent": "ESR-146",
      "order": 8,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.9",
        "title": "Indication of the plant protection product in use",
        "requirement": "Where appropriate, the machinery or related product shall be fitted with a specific mounting on which the operator can place the name of the plant protection product in use."
      }
    },
    {
      "id": "ESR-162",
      "type": "ESR",
      "parent": "ESR-146",
      "order": 9,
      "attributes": {
        "reference": "Annex III, Part B, point 2.4.10",
        "title": "Instructions for use",
        "requirement": "The instructions for use shall provide the following information:\n\n(a) precautions to be taken during mixing, loading, application, emptying, cleaning, servicing and transport operations in order to avoid contamination of the environment;\n\n(b) detailed conditions of use for the different operating environments envisaged, including the corresponding preparation and adjustments required to ensure the deposition of the plant protection product on target areas while minimising losses to other areas, to prevent drift to the environment and, where appropriate, to ensure an even distribution and homogeneous deposition of the plant protection product;\n\n(c) the range of types and sizes of nozzles, strainers and filters that can be used with the machinery or related product;\n\n(d) the frequency of checks and the criteria and method for the replacement of parts subject to wear that affect the correct functioning of the machinery or related product, such as nozzles, strainers and filters;\n\n(e) specification of calibration, daily maintenance, winter preparation and other checks necessary to ensure the correct functioning of the machinery or related product;\n\n(f) types of plant protection products that may cause incorrect functioning of the machinery or related product;\n\n(g) an indication that the operator should keep updated the name of the plant protection product in use on the specific mounting referred to in section 2.4.9;\n\n(h) the connexion and use of any special equipment or accessories, and the necessary precautions to be taken;\n\n(i) an indication that the machinery or related product may be subject to national requirements for regular inspection by designated bodies, as provided for in Directive 2009/128/EC of the European Parliament and of the Council (2);\n\n(j) the features of the machinery or related product, which shall be inspected to ensure its correct functioning;\n\n(k) instructions for connecting the necessary measuring instruments."
      }
    },
    {
      "id": "ESR-163",
      "type": "ESR",
      "parent": "ESR-036",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 3",
        "title": "Supplementary essential health and safety requirements to offset risks due to the mobility of machinery or related products",
        "requirement": "Machinery or related products presenting risks due to their mobility shall meet all the essential health and safety requirements set out in this chapter (see General Principles, point 4)."
      }
    },
    {
      "id": "ESR-164",
      "type": "ESR",
      "parent": "ESR-163",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 3.1",
        "title": "General"
      }
    },
    {
      "id": "ESR-165",
      "type": "ESR",
      "parent": "ESR-164",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 3.1.1",
        "title": "For the purposes of this section, the following definitions apply:",
        "requirement": "(a) ‘Machinery or related products presenting risks due to their mobility’ means:\n\n(i) machinery or related products, the operation of which requires either mobility while working, or continuous or semi continuous movement between a succession of fixed working locations; or\n\n(ii) machinery or related products which are operatedwithout being moved, but which may be equipped in such a way as to enable it to be moved more easily from one place to another;\n\n(b) ‘Driver’ means an operator responsible for the movement of machinery or a related product, who may be transported by the machinery or may be on foot, accompanying the machinery, or may guide the machinery by remote control;\n\n(c) ‘Autonomous mobile machinery’ means mobile machinery which has an autonomous mode, in which all the essential safety functions of the mobile machinery are ensured in its travel and working operations area without permanent interaction of an operator;\n\n(d) ‘Supervisor’ means a person responsible for the supervision of autonomous mobile machinery;\n\n(e) ‘Supervisory function’ means remote non permanent surveillance of autonomous mobile machinery by a device allowing to receive information or alerts and to give limited orders to this machinery."
      }
    },
    {
      "id": "ESR-166",
      "type": "ESR",
      "parent": "ESR-163",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 3.2",
        "title": "Work positions"
      }
    },
    {
      "id": "ESR-167",
      "type": "ESR",
      "parent": "ESR-166",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 3.2.1",
        "title": "Driving position",
        "requirement": "Visibility from the driving position shall be such that the driver can, in complete safety for himself or herself and the exposed persons operate the machinery or related product and its tools in their reasonably foreseeable conditions of use. Where necessary, appropriate devices shall be provided to remedy risks due to inadequate direct vision.\n\nMachinery or a related product on which the driver is transported shall be designed and constructed in such a way that, from the driving positions, there is no risk to the driver from inadvertent contact with the wheels and tracks.\n\nThe driving position of ride-on drivers shall be designed and constructed in such a way that a driver’s cab may be fitted, provided this does not increase the risk and there is room for it. The cab shall incorporate a place for the instructions for use needed for the driver."
      }
    },
    {
      "id": "ESR-168",
      "type": "ESR",
      "parent": "ESR-166",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 3.2.2",
        "title": "Seating",
        "requirement": "Where there is a risk that operators or other persons transported by the machinery may be crushed between parts of the machinery and the surroundings should the machinery roll or tip over, in particular for machinery equipped with a protective structure referred to in section 3.4.3 or 3.4.4:\n\n(a) the machinery shall be designed or equipped with a restraint system so as to keep the persons in their seats or in the protective structure, without restricting movements necessary for operations or movements relative to the structure caused by the suspension of the seats;\n\nwhere there is a significant risk of roll or tip over and its restraint system is not used it shall not be possible for the machinery to move;\n\nsuch restraint systems or provision shall take ergonomic principles into account and shall not be fitted if they increase the risk;\n\n(b) a visual and audible signal shall be provided at the driving position alerting the driver when the driver is in the driving position and not using the restraint system."
      }
    },
    {
      "id": "ESR-169",
      "type": "ESR",
      "parent": "ESR-166",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 3.2.3",
        "title": "Positions for other persons",
        "requirement": "If the conditions of use provide that persons other than the driver may occasionally or regularly be transported by the machinery or work on it, appropriate positions shall be provided which enable them to be transported or to work on it without risk.\n\nThe second and third subparagraphs of section 3.2.1 also apply to the places provided for persons other than the driver."
      }
    },
    {
      "id": "ESR-170",
      "type": "ESR",
      "parent": "ESR-166",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 3.2.4",
        "title": "Supervisory function",
        "requirement": "Where relevant, autonomous mobile machinery or related products shall have a supervisory function specific to the autonomous mode. This function shall allow the supervisor to remotely receive information from the machinery. The supervisory function shall only allow actions to stop and to start remotely the machinery or related product or move it to a safe position and a safe state to avoid causing other risks. It shall be designed and constructed to allow those actions only when the supervisor can see directly or indirectly the machine’s movement and working area and the protective devices are operational.\n\nThe information the supervisor receives from the machinery when the supervisory function is active shall enable the supervisor to have a complete and accurate view of the operation, movement and safe positioning of the machinery in its travel and working area.\n\nThis information shall alert the supervisor of the occurrence of unforeseen or dangerous situations present or impending, which require the intervention of the supervisor.\n\nIf the supervisory function is not active, the machinery shall not be able to operate."
      }
    },
    {
      "id": "ESR-171",
      "type": "ESR",
      "parent": "ESR-163",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 3.3",
        "title": "Control systems",
        "requirement": "If necessary, steps shall be taken to prevent unauthorised use of controls.\n\nIn the case of remote controls, each control unit shall clearly identify the machinery or related product to be controlled from that unit.\n\nThe remote control system shall be designed and constructed in such a way as to affect only:\n\n(a) the machinery or related product in question;\n\n(b) the functions in question.\n\nRemote-controlled machinery or related products shall be designed and constructed in such a way that it will respond only to signals from the intended control units.\n\nFor autonomous mobile machinery or related product, the control system shall be designed to perform the safety functions by itself as set out in this section, even when actions are ordered by using a remote supervisory function."
      }
    },
    {
      "id": "ESR-172",
      "type": "ESR",
      "parent": "ESR-171",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 3.3.1",
        "title": "Control devices",
        "requirement": "The driver shall be able to actuate all control devices required to operate the machinery or related product from the driving position, except for functions, which can be safely actuated only by using control devices located elsewhere. These functions include, in particular, those for which operators other than the driver are responsible or for which the driver has to leave the driving position in order to control them safely.\n\nWhere there are pedals, they shall be so designed, constructed and fitted as to allow safe operation by the driver with the minimum risk of incorrect operation. They shall have a slip-resistant surface and be easy to clean.\n\nWhere their operation can lead to hazards, notably dangerous movements, the control devices, except for those with pre-set positions, shall return to the neutral position as soon as they are released by the operator.\n\nIn the case of wheeled machinery, the steering system shall be designed and constructed in such a way as to reduce the force of sudden movements of the steering wheel or the steering lever caused by shocks to the guide wheels.\n\nAny control that locks the differential shall be so designed and arranged that it allows the differential to be unlocked when the machinery is moving.\n\nThe sixth paragraph of section 1.2.2, concerning acoustic and/or visual warning signals, applies only in the case of reversing."
      }
    },
    {
      "id": "ESR-173",
      "type": "ESR",
      "parent": "ESR-171",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 3.3.2",
        "title": "Starting/moving",
        "requirement": "All travel movements of self-propelled machinery with a ride-on driver shall be possible only if the driver is at the controls.\n\nWhere, for operating purposes, machinery is fitted with devices which exceed its normal clearance zone (e.g. stabilisers, jib, etc.), the driver shall be provided with the means of checking easily, before moving the machinery, that such devices are in a particular position which allows safe movement.\n\nThis also applies to all other parts which; to allow safe movement, have to be in particular positions, locked if necessary.\n\nWhere it does not give rise to other risks, movement of the machinery shall depend on safe positioning of the aforementioned parts.\n\nIt shall not be possible for unintentional movement of the machinery to occur while the engine is being started.\n\nThe movement of autonomous mobile machinery shall take into account the risks related to the area where it is intended to move and work."
      }
    },
    {
      "id": "ESR-174",
      "type": "ESR",
      "parent": "ESR-171",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 3.3.3",
        "title": "Travelling function",
        "requirement": "Without prejudice to road traffic regulations, self-propelled machinery and its trailers shall meet the requirements for slowing down, stopping, braking and immobilisation so as to ensure safety under all the operating, load, speed, ground and gradient conditions allowed for.\n\nThe driver shall be able to slow down and stop self-propelled machinery by means of a main device. Where safety so requires, in the event of a failure of the main device, or in the absence of the energy supply needed to actuate the main device, an emergency device with a fully independent and easily accessible control device shall be provided for slowing down and stopping.\n\nWhere safety so requires, a parking device shall be provided to render stationary machinery immobile. This device may be combined with one of the devices referred to in the second paragraph, if it is purely mechanical.\n\nRemote-controlled machinery shall be equipped with devices for stopping operation automatically and immediately and for preventing potentially dangerous operation in the following situations:\n\n(a) if the driver loses control;\n\n(b) if it receives a stop signal;\n\n(c) if a fault is detected in a safety-related part of the system;\n\n(d) if no validation signal is detected within a specified time.\n\nSection 1.2.4 does not apply to the travelling function.\n\nAutonomous mobile machinery or related products shall comply, with one or both where necessary according to the risk assessment, of the following conditions:\n\n(i) it shall move and operate in an enclosed zone fitted with a peripheral protection system comprising guards or protective devices;\n\n(ii) it shall be equipped with devices intended to detect any human, domestic animal or any other obstacle in its vicinity, where those obstacles could give rise to a risk to the health and safety of persons or domestic animals or to the safe operation of the machinery or related product.\n\nThe movements of mobile machinery or a related product connected with one or more trailers or towed equipment, including autonomous mobile machinery or a related product connected with one or more trailers or towed equipment, shall not give rise to risks for persons, domestic animals or to any other obstacle in the danger zone of such machinery or related product and trailers or towed equipment."
      }
    },
    {
      "id": "ESR-175",
      "type": "ESR",
      "parent": "ESR-171",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 3.3.4",
        "title": "Movement of pedestrian-controlled machinery",
        "requirement": "Movement of pedestrian-controlled self-propelled machinery shall be possible only through sustained action on the relevant control device by the driver. In particular, it shall not be possible for movement to occur while the engine is being started. The control systems for pedestrian-controlled machinery shall be designed in such a way as to minimise the risks arising from inadvertent movement of the machinery towards the driver, in particular:\n\n(a) crushing;\n\n(b) injury from rotating tools.\n\nThe speed of travel of the machinery shall be compatible with the pace of a driver on foot.\n\nIn the case of machinery on which a rotary tool may be fitted, it shall not be possible to actuate the tool when the reverse control is engaged, except where the movement of the machinery results from movement of the tool. In the latter case, the reversing speed shall be such that it does not endanger the driver."
      }
    },
    {
      "id": "ESR-176",
      "type": "ESR",
      "parent": "ESR-171",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 3.3.5",
        "title": "Control circuit failure",
        "requirement": "A failure in the power supply to the power-assisted steering, where fitted, shall not prevent machinery from being steered during the time required to stop it.\n\nFor autonomous mobile machinery, a failure in the steering system shall not have an impact on the safety of the machinery."
      }
    },
    {
      "id": "ESR-177",
      "type": "ESR",
      "parent": "ESR-163",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 3.4",
        "title": "Protection against mechanical risks"
      }
    },
    {
      "id": "ESR-178",
      "type": "ESR",
      "parent": "ESR-177",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 3.4.1",
        "title": "Uncontrolled movements",
        "requirement": "Machinery or related products shall be designed, constructed, and where appropriate placed on a mobile support, in such a way as to ensure that, when moved, uncontrolled oscillations of its centre of gravity do not affect its stability or exert excessive strain on its structure."
      }
    },
    {
      "id": "ESR-179",
      "type": "ESR",
      "parent": "ESR-177",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 3.4.2",
        "title": "Moving transmission parts",
        "requirement": "By way of exception to section 1.3.8.1, in the case of engines, moveable guards preventing access to the moving parts in the engine compartment do not need to have interlocking devices if they have to be opened either by the use of a tool or key or by a control located in the driving position, providing the latter is in a fully enclosed cab with a lock to prevent unauthorised access."
      }
    },
    {
      "id": "ESR-180",
      "type": "ESR",
      "parent": "ESR-177",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 3.4.3",
        "title": "Roll-over and tip-over",
        "requirement": "Where, in the case of self-propelled machinery with a ride-on driver, operator(s) or other person(s), there is a risk of rolling or tipping over, the machinery shall be fitted with an appropriate protective structure, unless this increases the risk.\n\nThis structure shall be such that in the event of rolling or tipping over it affords the ride-on person(s) an adequate deflection-limiting volume.\n\nIn order to verify that the structure complies with the requirement laid down in the second paragraph, the manufacturer shall, for each type of structure concerned, perform appropriate tests or have such tests performed."
      }
    },
    {
      "id": "ESR-181",
      "type": "ESR",
      "parent": "ESR-177",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 3.4.4",
        "title": "Falling objects",
        "requirement": "Where, in the case of self-propelled machinery with a ride-on driver, operator(s) or other person(s), there is a risk due to falling objects or material, the machinery shall be designed and constructed in such a way as to take account of this risk and fitted, if its size allows, with an appropriate protective structure.\n\nThis structure shall be such that, in the event of falling objects or material, it guarantees the ride-on person(s) an adequate deflection-limiting volume.\n\nIn order to verify that the structure complies with the requirement laid down in the second paragraph, the manufacturer shall, for each type of structure concerned, perform appropriate tests or have such tests performed."
      }
    },
    {
      "id": "ESR-182",
      "type": "ESR",
      "parent": "ESR-177",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 3.4.5",
        "title": "Means of access",
        "requirement": "Handholds and steps shall be designed, constructed and arranged in such a way that the operators use them instinctively and do not use the control devices to assist access."
      }
    },
    {
      "id": "ESR-183",
      "type": "ESR",
      "parent": "ESR-177",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 3.4.6",
        "title": "Towing devices",
        "requirement": "All machinery used to tow or to be towed shall be fitted with towing or coupling devices designed, constructed and arranged in such a way as to ensure easy and secure connection and disconnection and to prevent accidental disconnection during use.\n\nInsofar as the tow bar load so requires, such machinery shall be equipped with a support with a bearing surface suited to the load and the ground."
      }
    },
    {
      "id": "ESR-184",
      "type": "ESR",
      "parent": "ESR-177",
      "order": 6,
      "attributes": {
        "reference": "Annex III, Part B, point 3.4.7",
        "title": "Transmission of power between self-propelled machinery (or a tractor) and recipient machinery",
        "requirement": "Removable mechanical transmission devices linking self-propelled machinery (or a tractor) to the first fixed bearing of recipient machinery shall be designed and constructed in such a way that any part that moves during operation is protected over its whole length.\n\nOn the side of the self-propelled machinery (or the tractor), the power take-off to which the removable mechanical transmission device is attached shall be protected either by a guard fixed and linked to the self-propelled machinery (or the tractor) or by any other device offering equivalent protection.\n\nIt shall be possible to open this guard for access to the removable transmission device. Once it is in place, there shall be enough room to prevent the drive shaft damaging the guard when the machinery (or the tractor) is moving.\n\nOn the recipient machinery side, the input shaft shall be enclosed in a protective casing fixed to the machinery.\n\nTorque limiters or freewheels may be fitted to universal joint transmissions only on the side adjoining the driven machinery. The removable mechanical transmission device shall be marked accordingly.\n\nAll recipient machinery the operation of which requires a removable mechanical transmission device to connect it to self-propelled machinery (or a tractor) shall have a system for attaching the removable mechanical transmission device so that, when the machinery is uncoupled, the removable mechanical transmission device and its guard are not damaged by contact with the ground or part of the machinery.\n\nThe outside parts of the guard shall be so designed, constructed and arranged that they cannot turn with the removable mechanical transmission device. The guard shall cover the transmission to the ends of the inner jaws in the case of simple universal joints and at least to the centre of the outer joint or joints in the case of wide-angle universal joints.\n\nIf means of access to working positions are provided near to the removable mechanical transmission device, they shall be designed and constructed in such a way that the shaft guards cannot be used as steps, unless designed and constructed for that purpose."
      }
    },
    {
      "id": "ESR-185",
      "type": "ESR",
      "parent": "ESR-163",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 3.5",
        "title": "Protection against other risks"
      }
    },
    {
      "id": "ESR-186",
      "type": "ESR",
      "parent": "ESR-185",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 3.5.1",
        "title": "Batteries",
        "requirement": "The battery housing shall be designed and constructed in such a way as to prevent the electrolyte being ejected on to the operator in the event of rollover or tip over and to avoid the accumulation of vapours in places occupied by operators.\n\nMachinery or related products shall be designed and constructed in such a way that the battery can be disconnected with the aid of an easily accessible device provided for that purpose.\n\nThe batteries with automatic charging for mobile machinery or related products, including autonomous mobile machinery or related products, shall be designed to prevent hazards referred to in sections 1.3.8.2 and 1.5.1, including the risks of contact or collision of the machinery or related product with a person or other machinery or related products when the machinery or related product moves autonomously to the charging station."
      }
    },
    {
      "id": "ESR-187",
      "type": "ESR",
      "parent": "ESR-185",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 3.5.2",
        "title": "Fire",
        "requirement": "Depending on the hazards anticipated by the manufacturer, machinery shall, where its size permits:\n\n(a) either allow easily accessible fire extinguishers to be fitted; or\n\n(b) be provided with built-in extinguisher systems."
      }
    },
    {
      "id": "ESR-188",
      "type": "ESR",
      "parent": "ESR-185",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 3.5.3",
        "title": "Emissions of hazardous substances",
        "requirement": "The second and third paragraphs of section 1.5.13 do not apply where the main function of the machinery is the application of hazardous substances. However, the operator shall be protected against the risk of exposure to such hazardous emissions.\n\nRide-on mobile machinery having application of hazardous substances as the main function shall be equipped with filtration cabs or equivalent safety measures."
      }
    },
    {
      "id": "ESR-189",
      "type": "ESR",
      "parent": "ESR-185",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 3.5.4",
        "title": "Risk of contact with live overhead power lines",
        "requirement": "Depending on their height, mobile machinery or related products shall, where relevant, be designed, constructed and equipped, so as to prevent the risk of contact with an energised overhead power line or the risk of creating an electric arc between any part of the machinery or an operator driving the machinery and an energised overhead power line.\n\nWhen the risk to the persons operating machinery incurred by the contact with an energised overhead power line cannot be fully avoided, mobile machinery or related products shall be designed, constructed and equipped so as to prevent any electrical hazards."
      }
    },
    {
      "id": "ESR-190",
      "type": "ESR",
      "parent": "ESR-163",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 3.6",
        "title": "Information and indications"
      }
    },
    {
      "id": "ESR-191",
      "type": "ESR",
      "parent": "ESR-190",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 3.6.1",
        "title": "Signs, signals and warnings",
        "requirement": "All machinery or related products shall have signs and/or instruction plates concerning use, adjustment and maintenance, wherever necessary, so as to ensure the health and safety of persons. They shall be chosen, designed and constructed in such a way as to be clearly visible and indelible.\n\nWithout prejudice to the provisions of road traffic regulations, machinery or related products with a ride-on driver shall have the following equipment:\n\n(a) an acoustic warning device to alert persons;\n\n(b) a system of light signals relevant to the intended conditions of use; the latter requirement does not apply to machinery or related products intended solely for underground working and having no electrical power;\n\n(c) where necessary, there shall be an appropriate connection between a trailer and the machinery or a related product for the operation of signals.\n\nRemote-controlled machinery or related products which, under normal conditions of use, exposes persons to the risk of impact or crushing shall be fitted with appropriate means to signal its movements or with means to protect persons against such risks. The same shall apply to machinery or related products, which involves, when in use, the constant repetition of a forward and backward movement on a single axis where the area to the rear of the machinery is not directly visible to the driver.\n\nMachinery or related products shall be constructed in such a way that the warning and signalling devices cannot be disabled unintentionally. Where it is essential for safety, such devices shall be provided with the means to check that they are in good working order and their failure shall be made apparent to the operator.\n\nWhere the movement of machinery or its tools is particularly hazardous, signs on the machinery shall be provided to warn against approaching the machinery while it is working; the signs shall be legible at a sufficient distance to ensure the safety of persons who have to be in the vicinity."
      }
    },
    {
      "id": "ESR-192",
      "type": "ESR",
      "parent": "ESR-190",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 3.6.2",
        "title": "Marking",
        "requirement": "(1) The following shall be shown legibly and indelibly on all machinery or related products:\n\n(a) nominal power expressed in kilowatts (kW);\n\n(b) mass of the most usual configuration, in kilograms (kg).\n\n(2) In addition, where appropriate, the following shall be shown legibly and indelibly on all machinery or related products:\n\n(a) maximum drawbar pull provided for at the coupling hook, in Newtons (N);\n\n(b) maximum vertical load provided for on the coupling hook, in Newtons (N)."
      }
    },
    {
      "id": "ESR-193",
      "type": "ESR",
      "parent": "ESR-190",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 3.6.3",
        "title": "Instructions for use"
      }
    },
    {
      "id": "ESR-194",
      "type": "ESR",
      "parent": "ESR-193",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 3.6.3.1",
        "title": "Vibrations",
        "requirement": "The instructions for use shall give the following information concerning vibrations, expressed as acceleration (m/s2), transmitted by the machinery or related products to the hand-arm system or to the whole body:\n\n(a) the vibration total value from continuous vibrations to which the hand-arm system is subjected;\n\n(b) the mean value of the peak amplitude of the acceleration from repeated shock vibrations, to which the hand-arm system is subjected;\n\n(c) the highest root mean square value of weighted acceleration to which the whole body is subjected, if it exceeds 0,5 m/s2; where this value does not exceed 0,5 m/s2, this shall be mentioned;\n\n(d) the uncertainty of measurements.\n\nThese values shall be either those actually measured for the machinery or related product in question or those established on the basis of measurements taken in respect of technically comparable machinery or related products which are representative of the machinery or related products to be produced.\n\nWhere harmonised standards or common specifications adopted by the Commission in accordance with Article 20(3) cannot be applied, the vibration shall be measured using the most appropriate measurement code for the machinery or related products concerned.\n\nThe operating conditions during measurement and the measurement codes used shall be described."
      }
    },
    {
      "id": "ESR-195",
      "type": "ESR",
      "parent": "ESR-193",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 3.6.3.2",
        "title": "Multiple uses",
        "requirement": "The instructions for use for machinery or a related product allowing several uses depending on the equipment used and the instructions for use for the interchangeable equipment shall contain the information necessary for safe assembly and use of the basic machinery or related product and the interchangeable equipment that can be fitted."
      }
    },
    {
      "id": "ESR-196",
      "type": "ESR",
      "parent": "ESR-193",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 3.6.3.3",
        "title": "Autonomous mobile machinery or related products",
        "requirement": "The instructions for use of autonomous mobile machinery or related products shall specify the characteristics of its intended travel, working areas and danger zones."
      }
    },
    {
      "id": "ESR-197",
      "type": "ESR",
      "parent": "ESR-036",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 4",
        "title": "Supplementary essential health and safety requirements to offset risks due to lifting operations",
        "requirement": "Machinery or related products presenting risks due to lifting operations shall meet all the relevant essential health and safety requirements set out in this chapter (see General Principles, point 4)."
      }
    },
    {
      "id": "ESR-198",
      "type": "ESR",
      "parent": "ESR-197",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1",
        "title": "General"
      }
    },
    {
      "id": "ESR-199",
      "type": "ESR",
      "parent": "ESR-198",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.1",
        "title": "For the purposes of section 4.1., the following definitions apply:",
        "requirement": "(a) ‘Lifting operation’ means a movement of unit loads consisting of goods and/or persons necessitating, at a given moment, a change of level;\n\n(b) ‘Guided load’ means a load where the total movement is made along rigid or flexible guides whose position is determined by fixed points;\n\n(c) ‘Working coefficient’ means the arithmetic ratio between the load guaranteed by the manufacturer up to which a component is able to hold it and the maximum working load marked on the component;\n\n(d) ‘Test coefficient’ means the arithmetic ratio between the load used to carry out the static or dynamic tests on the machinery or related product or lifting accessory and the maximum working load marked on the machinery or related product or lifting accessory;\n\n(e) ‘Static test’ means the test during which the machinery or related product or lifting accessory is first inspected and subjected to a force corresponding to the maximum working load multiplied by the appropriate static test coefficient and then re-inspected once the said load has been released to ensure that no damage has occurred;\n\n(f) ‘Dynamic test’ means the test during which the machinery or related product is operated in all its possible configurations at the maximum working load multiplied by the appropriate dynamic test coefficient with account being taken of the dynamic behaviour of the lifting machinery in order to check that it functions properly;\n\n(g) ‘Carrier’ means a part of the machinery or related product on or in which persons and/or goods are supported in order to be lifted."
      }
    },
    {
      "id": "ESR-200",
      "type": "ESR",
      "parent": "ESR-198",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2",
        "title": "Protection against mechanical risks"
      }
    },
    {
      "id": "ESR-201",
      "type": "ESR",
      "parent": "ESR-200",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.1",
        "title": "Risks due to lack of stability",
        "requirement": "Machinery or related products shall be designed and constructed in such a way that the stability required by section 1.3.1 is maintained both in service and out of service, including all stages of transportation, assembly and dismantling, during foreseeable component failures and also during the tests carried out in accordance with the instructions for use. To that end, the manufacturer shall use the appropriate verification methods."
      }
    },
    {
      "id": "ESR-202",
      "type": "ESR",
      "parent": "ESR-200",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.2",
        "title": "Machinery or related products running on guide rails and rail tracks",
        "requirement": "Machinery or related products shall be provided with devices, which act on the guide rails or tracks to prevent derailment.\n\nIf, despite such devices, there remains a risk of derailment or of failure of a rail or of a running component, devices shall be provided which prevent the equipment, component or load from falling or the machinery from overturning."
      }
    },
    {
      "id": "ESR-203",
      "type": "ESR",
      "parent": "ESR-200",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.3",
        "title": "Mechanical strength",
        "requirement": "Machinery or related products, including lifting accessories and their components, shall be capable of withstanding the stresses to which they are subjected during their lifetime, both in and, where applicable, out of use, under the installation and operating conditions provided for and in all relevant configurations, with due regard, where appropriate, to the effects of atmospheric factors and forces exerted by persons. This requirement shall also be satisfied during transport, assembly and dismantling.\n\nMachinery or related products, including lifting accessories, shall be designed and constructed in such a way as to prevent failure from fatigue and wear, taking due account of their intended use and any reasonably foreseeable misuse.\n\nThe materials used shall be chosen on the basis of the intended working environments, with particular regard to corrosion, abrasion, impacts, extreme temperatures, fatigue, brittleness, radiation and ageing.\n\nMachinery or related products, including lifting accessories, shall be designed and constructed in such a way as to withstand the overload in the static tests without permanent deformation or patent defect. Strength calculations shall take account of the value of the static test coefficient chosen to guarantee an adequate level of safety. That coefficient has, as a general rule, the following values:\n\n(a) manually-operated machinery or related products, including lifting accessories: 1,5;\n\n(b) other machinery or related products: 1,25.\n\nMachinery or related products shall be designed and constructed in such a way as to undergo, without failure, the dynamic tests carried out using the maximum working load multiplied by the dynamic test coefficient. This dynamic test coefficient is chosen so as to guarantee an adequate level of safety: the coefficient is, as a general rule, equal to 1,1. As a general rule, the tests will be performed at the nominal speeds provided for. Should the control circuit of the machinery or related product allow for a number of simultaneous movements, the tests shall be carried out under the least favourable conditions, as a general rule by combining the movements concerned."
      }
    },
    {
      "id": "ESR-204",
      "type": "ESR",
      "parent": "ESR-200",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.4",
        "title": "Pulleys, drums, wheels, ropes and chains",
        "requirement": "Pulleys, drums and wheels shall have a diameter commensurate with the size of the ropes or chains with which they can be fitted.\n\nDrums and wheels shall be designed, constructed and installed in such a way that the ropes or chains with which they are equipped can be wound without coming off.\n\nRopes used directly for lifting or supporting the load shall not include any splicing other than at their ends. Splicings are, however, tolerated in installations, which are intended by design to be modified regularly according to needs of use.\n\nComplete ropes and their endings shall have a working coefficient chosen in such a way as to guarantee an adequate level of safety. As a general rule, this coefficient is equal to 5.\n\nLifting chains shall have a working coefficient chosen in such a way as to guarantee an adequate level of safety. As a general rule, this coefficient is equal to 4.\n\nIn order to verify that an adequate working coefficient has been attained, the manufacturer shall, for each type of chain and rope used directly for lifting the load and for the rope ends, perform the appropriate tests or have such tests performed."
      }
    },
    {
      "id": "ESR-205",
      "type": "ESR",
      "parent": "ESR-200",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.5",
        "title": "Lifting accessories and their components",
        "requirement": "Lifting accessories and their components shall be sized with due regard to fatigue and ageing processes for a number of operating cycles consistent with their expected life-span as specified in the operating conditions for a given application.\n\nMoreover:\n\n(a) the working coefficient of wire-rope/rope-end combinations shall be chosen in such a way as to guarantee an adequate level of safety; this coefficient is, as a general rule, equal to 5. Ropes shall not comprise any splices or loops other than at their ends;\n\n(b) where chains with welded links are used, they shall be of the short-link type. The working coefficient of chains shall be chosen in such a way as to guarantee an adequate level of safety; this coefficient is, as a general rule, equal to 4;\n\n(c) the working coefficient for textile ropes, slings or webbing is dependent on the material, method of manufacture, dimensions and use. This coefficient shall be chosen in such a way as to guarantee an adequate level of safety; it is, as a general rule, equal to 7, provided the materials used are shown to be of very good quality and the method of manufacture is appropriate to the intended use. Should this not be the case, the coefficient is, as a general rule, set at a higher level in order to secure an equivalent level of safety. Textile ropes, slings or webbings shall not include any knots, connections or splicing other than at the ends of the sling, except in the case of an endless sling;\n\n(d) all metallic components making up, or used with, a sling shall have a working coefficient chosen in such a way as to guarantee an adequate level of safety; this coefficient is, as a general rule, equal to 4;\n\n(e) the maximum working load of a multilegged sling is determined on the basis of the working coefficient of the weakest leg, the number of legs and a reduction factor which depends on the slinging configuration;\n\n(f) in order to verify that an adequate working coefficient has been attained, the manufacturer shall, for each type of component referred to in points (a) to (d), perform the appropriate tests or have such tests performed."
      }
    },
    {
      "id": "ESR-206",
      "type": "ESR",
      "parent": "ESR-200",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.6",
        "title": "Control of movements",
        "requirement": "Devices for controlling movements shall act in such a way that the machinery or related product on which they are installed is kept safe.\n\n(a) Machinery or related products shall be designed and constructed or fitted with devices in such a way that the amplitude of movement of its components is kept within the specified limits. The operation of such devices shall, where appropriate, be preceded by a warning;\n\n(b) Where several fixed or rail-mounted machinery or related products can be manoeuvred simultaneously in the same place, with risks of collision, such machinery shall be designed and constructed in such a way as to make it possible to fit systems enabling these risks to be avoided;\n\n(c) Machinery or related products shall be designed and constructed in such a way that the loads cannot creep dangerously or fall freely and unexpectedly, even in the event of partial or total failure of the power supply or when the operator stops operating the machinery;\n\n(d) It shall not be possible, under normal operating conditions, to lower the load solely by friction brake, except in the case of machinery or related products whose function requires it to operate in that way;\n\n(e) Holding devices shall be designed and constructed in such a way that inadvertent dropping of the loads is avoided."
      }
    },
    {
      "id": "ESR-207",
      "type": "ESR",
      "parent": "ESR-200",
      "order": 6,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.7",
        "title": "Movements of loads during handling",
        "requirement": "The operating position of machinery shall be located in such a way as to ensure the widest possible view of trajectories of the moving parts, in order to avoid possible collisions with persons, equipment or other machinery, which might be manoeuvring at the same time and liable to constitute a hazard.\n\nMachinery with guided loads shall be designed and constructed in such a way as to prevent persons from being injured by movement of the load, the carrier or the counterweights, if any."
      }
    },
    {
      "id": "ESR-208",
      "type": "ESR",
      "parent": "ESR-200",
      "order": 7,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.8",
        "title": "Machinery serving fixed landings"
      }
    },
    {
      "id": "ESR-209",
      "type": "ESR",
      "parent": "ESR-208",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.8.1",
        "title": "Movements of the carrier",
        "requirement": "The movement of the carrier of machinery serving fixed landings shall be rigidly guided to and at the landings. Scissor systems are also regarded as rigid guidance."
      }
    },
    {
      "id": "ESR-210",
      "type": "ESR",
      "parent": "ESR-208",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.8.2",
        "title": "Access to the carrier",
        "requirement": "Where persons have access to the carrier, the machinery shall be designed and constructed in such a way as to ensure that the carrier remains stationary during access, in particular while it is being loaded or unloaded.\n\nThe machinery shall be designed and constructed in such a way as to ensure that the difference in level between the carrier and the landing being served does not create a risk of tripping."
      }
    },
    {
      "id": "ESR-211",
      "type": "ESR",
      "parent": "ESR-208",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.8.3",
        "title": "Risks due to contact with the moving carrier",
        "requirement": "Where necessary in order to fulfil the requirement expressed in the second paragraph of section 4.1.2.7, the travel zone shall be rendered inaccessible during normal operation.\n\nWhen, during inspection or maintenance, there is a risk that persons situated under or above the carrier may be crushed between the carrier and any fixed parts, sufficient free space shall be provided either by means of physical refuges or by means of mechanical devices blocking the movement of the carrier."
      }
    },
    {
      "id": "ESR-212",
      "type": "ESR",
      "parent": "ESR-208",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.8.4",
        "title": "Risk due to the load falling off the carrier",
        "requirement": "Where there is a risk due to the load falling off the carrier, the machinery shall be designed and constructed in such a way as to prevent this risk."
      }
    },
    {
      "id": "ESR-213",
      "type": "ESR",
      "parent": "ESR-208",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.2.8.5",
        "title": "Landings",
        "requirement": "Risks due to contact of persons at landings with the moving carrier or other moving parts shall be prevented.\n\nWhere there is a risk due to persons falling into the travel zone when the carrier is not present at the landings, guards shall be fitted in order to prevent this risk. Such guards shall not open in the direction of the travel zone. They shall be fitted with an interlocking device with guard locking controlled by the position of the carrier that prevents:\n\n(a) hazardous movements of the carrier until the guards are closed and locked;\n\n(b) hazardous opening of a guard until the carrier has stopped at the corresponding landing."
      }
    },
    {
      "id": "ESR-214",
      "type": "ESR",
      "parent": "ESR-198",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 4.1.3",
        "title": "Fitness for purpose",
        "requirement": "When lifting machinery or related products, including lifting accessories, are placed on the market or are first put into service, the manufacturer shall ensure, by taking appropriate measures or having them taken, that the machinery or related products, including lifting accessories, which are ready for use – whether manually or power-operated – can fulfil their specified functions safely.\n\nThe static and dynamic tests referred to in section 4.1.2.3 shall be performed on all lifting machinery or related products ready to be put into service.\n\nWhere the machinery or related products cannot be assembled in the manufacturer’s premises, the appropriate measures shall be taken at the place of use by the manufacturer. Otherwise, the measures may be taken either in the manufacturer’s premises or at the place of use."
      }
    },
    {
      "id": "ESR-215",
      "type": "ESR",
      "parent": "ESR-197",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 4.2",
        "title": "Requirements for machinery or related products whose power source is other than manual effort"
      }
    },
    {
      "id": "ESR-216",
      "type": "ESR",
      "parent": "ESR-215",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 4.2.1",
        "title": "Control of movements",
        "requirement": "Hold-to-run control devices shall be used to control the movements of the machinery or related products or their equipment. However, for partial or complete movements in which there is no risk of the load or the machinery or related product colliding, the said devices may be replaced by control devices authorising automatic stops at pre-selected positions without the operator holding a hold-to-run control device."
      }
    },
    {
      "id": "ESR-217",
      "type": "ESR",
      "parent": "ESR-215",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 4.2.2",
        "title": "Loading control",
        "requirement": "Machinery or related products with a maximum working load of not less than 1 000 kg or an overturning moment of not less than 40 000 Nm shall be fitted with devices to warn the driver and prevent dangerous movements in the event:\n\n(a) of overloading, either as a result of the maximum working load or the maximum working moment due to the load being exceeded; or\n\n(b) of the overturning moment being exceeded."
      }
    },
    {
      "id": "ESR-218",
      "type": "ESR",
      "parent": "ESR-215",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 4.2.3",
        "title": "Installations guided by ropes",
        "requirement": "Rope carriers, tractors or tractor carriers shall be held by counterweights or by a device allowing permanent control of the tension."
      }
    },
    {
      "id": "ESR-219",
      "type": "ESR",
      "parent": "ESR-197",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 4.3",
        "title": "Information and markings"
      }
    },
    {
      "id": "ESR-220",
      "type": "ESR",
      "parent": "ESR-219",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 4.3.1",
        "title": "Chains, ropes and webbing",
        "requirement": "Each length of lifting chain, rope or webbing not forming part of an assembly shall bear a mark or, where this is not possible, a plate or irremovable ring bearing the name and address of the manufacturer and the identifying reference of the relevant certificate.\n\nThe certificate mentioned above shall show at least the following information:\n\n(a) the name and address of the manufacturer;\n\n(b) a description of the chain or rope, which includes:\n\n(i) its nominal size;\n\n(ii) its construction;\n\n(iii) the material from which it is made; and\n\n(iv) any special metallurgical treatment applied to the material;\n\n(c) the test method used;\n\n(d) the maximum load to which the chain or rope should be subjected in service. A range of values may be given on the basis of the intended applications."
      }
    },
    {
      "id": "ESR-221",
      "type": "ESR",
      "parent": "ESR-219",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 4.3.2",
        "title": "Lifting accessories",
        "requirement": "Lifting accessories shall show the following particulars:\n\n(a) identification of the material where this information is needed for safe use;\n\n(b) the maximum working load.\n\nIn the case of lifting accessories on which marking is physically impossible, the particulars referred to in the first paragraph shall be displayed on a plate or other equivalent means and securely affixed to the accessory.\n\nThe particulars shall be legible and located in a place where they are not liable to disappear as a result of wear or jeopardise the strength of the accessory."
      }
    },
    {
      "id": "ESR-222",
      "type": "ESR",
      "parent": "ESR-219",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 4.3.3",
        "title": "Lifting machinery or related products",
        "requirement": "The maximum working load shall be prominently marked on the lifting machinery or related product. This marking shall be legible, indelible and in an un-coded form.\n\nWhere the maximum working load depends on the configuration of the lifting machinery or related product, each operating position shall be provided with a load plate indicating, preferably in diagrammatic form or by means of tables, the working load permitted for each configuration.\n\nMachinery or related products intended for lifting goods only, equipped with a carrier, which allows access to persons, shall bear a clear and indelible warning prohibiting the lifting of persons. This warning shall be visible at each place where access is possible."
      }
    },
    {
      "id": "ESR-223",
      "type": "ESR",
      "parent": "ESR-197",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 4.4",
        "title": "Instructions for use"
      }
    },
    {
      "id": "ESR-224",
      "type": "ESR",
      "parent": "ESR-223",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 4.4.1",
        "title": "Lifting accessories",
        "requirement": "Each lifting accessory or each commercially indivisible batch of lifting accessories shall be accompanied by instructions setting out at least the following particulars:\n\n(a) the intended use;\n\n(b) the limits of use (particularly for lifting accessories such as magnetic or vacuum pads which do not fully comply with section 4.1.2.6(e));\n\n(c) instructions for assembly, use and maintenance;\n\n(d) the static test coefficient used."
      }
    },
    {
      "id": "ESR-225",
      "type": "ESR",
      "parent": "ESR-223",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 4.4.2",
        "title": "Lifting machinery or related products",
        "requirement": "Lifting machinery or related products shall be accompanied by instructions for use containing information on:\n\n(a) the technical characteristics of the lifting machinery or related product, and in particular:\n\n(i) the maximum working load and, where appropriate, a copy of the load plate or load table described in the second paragraph of section 4.3.3;\n\n(ii) the reactions at the supports or anchors and, where appropriate, characteristics of the tracks;\n\n(iii) where appropriate, the definition and the means of installation of the ballast;\n\n(b) the contents of the logbook, if the latter is not supplied with the lifting machinery;\n\n(c) advice for use, particularly to offset the lack of direct vision of the load by the operator;\n\n(d) where appropriate, a test report detailing the static and dynamic tests carried out by or for the manufacturer;\n\n(e) for lifting machinery or related products, which are not assembled on the premises of the manufacturer in the form in which they are to be used, the necessary instructions for performing the measures referred to in section 4.1.3 before they are first put into service."
      }
    },
    {
      "id": "ESR-226",
      "type": "ESR",
      "parent": "ESR-036",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 5",
        "title": "Supplementary essential health and safety requirements for machinery or related products intended for underground work",
        "requirement": "Machinery or related products intended for underground work shall meet all the essential health and safety requirements set out in this chapter (see General Principles, point 4)."
      }
    },
    {
      "id": "ESR-227",
      "type": "ESR",
      "parent": "ESR-226",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 5.1",
        "title": "Risks due to lack of stability",
        "requirement": "Powered roof supports shall be designed and constructed in such a way as to maintain a given direction when moving and not slip before and while they come under load and after the load has been removed. They shall be equipped with anchorages for the top plates of the individual hydraulic props."
      }
    },
    {
      "id": "ESR-228",
      "type": "ESR",
      "parent": "ESR-226",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 5.2",
        "title": "Movement",
        "requirement": "Powered roof supports shall allow for unhindered movement of persons."
      }
    },
    {
      "id": "ESR-229",
      "type": "ESR",
      "parent": "ESR-226",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 5.3",
        "title": "Control devices",
        "requirement": "The accelerator and brake controls for movement of machinery running on rails shall be hand-operated. However, enabling devices may be foot-operated.\n\nThe control devices of powered roof supports shall be designed and positioned in such a way that, during displacement operations, operators are sheltered by a support in place. The control devices shall be protected against any accidental release."
      }
    },
    {
      "id": "ESR-230",
      "type": "ESR",
      "parent": "ESR-226",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 5.4",
        "title": "Stopping",
        "requirement": "Self-propelled machinery running on rails for use in underground work shall be equipped with an enabling device acting on the circuit controlling the movement of the machinery such that movement is stopped if the driver is no longer in control of the movement."
      }
    },
    {
      "id": "ESR-231",
      "type": "ESR",
      "parent": "ESR-226",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 5.5",
        "title": "Fire",
        "requirement": "Section 3.5.2 (b) is mandatory in respect of machinery or related products, which comprises highly flammable parts.\n\nThe braking system of machinery or related products intended for use in underground workings shall be designed and constructed in such a way that it does not produce sparks or cause fires.\n\nMachinery or related products with internal combustion engines for use in underground workings shall be fitted only with engines using fuel with a low vaporising pressure and which exclude any spark of electrical origin."
      }
    },
    {
      "id": "ESR-232",
      "type": "ESR",
      "parent": "ESR-226",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 5.6",
        "title": "Exhaust emissions",
        "requirement": "Exhaust emissions from internal combustion engines shall not be discharged upwards."
      }
    },
    {
      "id": "ESR-233",
      "type": "ESR",
      "parent": "ESR-036",
      "order": 5,
      "attributes": {
        "reference": "Annex III, Part B, point 6",
        "title": "Supplementary essential health and safety requirements for machinery or related products presenting particular risks due to the lifting of persons",
        "requirement": "Machinery or related products presenting particular risks due to the lifting of persons shall meet all the relevant essential health and safety requirements set out in this chapter (see General Principles, point 4)."
      }
    },
    {
      "id": "ESR-234",
      "type": "ESR",
      "parent": "ESR-233",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 6.1",
        "title": "General"
      }
    },
    {
      "id": "ESR-235",
      "type": "ESR",
      "parent": "ESR-234",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 6.1.1",
        "title": "Mechanical strength",
        "requirement": "The carrier, including any trapdoors, shall be designed and constructed in such a way as to offer the space and strength corresponding to the maximum number of persons permitted on the carrier and the maximum working load.\n\nThe working coefficients for components set out in sections 4.1.2.4 and 4.1.2.5 are inadequate for machinery or related products intended for the lifting of persons and shall, as a general rule, be doubled. Machinery or related products intended for lifting persons or persons and goods shall be fitted with a suspension or supporting system for the carrier designed and constructed in such a way as to ensure an adequate overall level of safety and to prevent the risk of the carrier falling.\n\nIf ropes or chains are used to suspend the carrier, as a general rule, at least two independent ropes or chains are required, each with its own anchorage."
      }
    },
    {
      "id": "ESR-236",
      "type": "ESR",
      "parent": "ESR-234",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 6.1.2",
        "title": "Loading control for machinery or related products moved by power other than human strength",
        "requirement": "The requirements of section 4.2.2 apply regardless of the maximum working load and overturning moment, unless the manufacturer can demonstrate that there is no risk of overloading or overturning."
      }
    },
    {
      "id": "ESR-237",
      "type": "ESR",
      "parent": "ESR-233",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 6.2",
        "title": "Control devices",
        "requirement": "Where safety requirements do not impose other solutions, the carrier shall, as a general rule, be designed and constructed in such a way that persons in the carrier have means of controlling upward and downward movements and, if appropriate, other movements of the carrier.\n\nIn operation, those control devices shall override any other devices controlling the same movement with the exception of emergency stop devices.\n\nThe control devices for the movements referred to in the first paragraph shall be of the hold-to-run type except where the carrier is completely enclosed. If there is no risk of persons or objects on the carrier colliding or falling and no other risks due to the upward and downward movements of the carrier, control devices authorising automatic stops at preselected positions may be used instead of hold-to-run type control devices."
      }
    },
    {
      "id": "ESR-238",
      "type": "ESR",
      "parent": "ESR-233",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 6.3",
        "title": "Risks to persons in or on the carrier"
      }
    },
    {
      "id": "ESR-239",
      "type": "ESR",
      "parent": "ESR-238",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 6.3.1",
        "title": "Risks due to movements of the carrier",
        "requirement": "Machinery or related products for lifting persons shall be designed, constructed or equipped in such a way that the acceleration or deceleration of the carrier does not engender risks for persons."
      }
    },
    {
      "id": "ESR-240",
      "type": "ESR",
      "parent": "ESR-238",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 6.3.2",
        "title": "Risk of persons falling from the carrier",
        "requirement": "The carrier shall not tilt to an extent, which creates a risk of the occupants falling, including when the machinery or related product and carrier are moving.\n\nWhere the carrier is designed as a workstation, provision shall be made to ensure stability and to prevent hazardous movements.\n\nIf the measures referred to in section 1.5.15 are not adequate, carriers shall be fitted with a sufficient number of suitable anchorage points for the number of persons permitted on the carrier. The anchorage points shall be strong enough for the use of personal protective equipment against falls from a height.\n\nAny trapdoor in floors or ceilings or side doors shall be designed and constructed in such a way as to prevent inadvertent opening and shall open in a direction that obviates any risk of falling, should they open unexpectedly."
      }
    },
    {
      "id": "ESR-241",
      "type": "ESR",
      "parent": "ESR-238",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 6.3.3",
        "title": "Risk due to objects falling on the carrier",
        "requirement": "Where there is a risk of objects falling on the carrier and endangering persons, the carrier shall be equipped with a protective roof."
      }
    },
    {
      "id": "ESR-242",
      "type": "ESR",
      "parent": "ESR-233",
      "order": 3,
      "attributes": {
        "reference": "Annex III, Part B, point 6.4",
        "title": "Machinery or related products serving fixed landings"
      }
    },
    {
      "id": "ESR-243",
      "type": "ESR",
      "parent": "ESR-242",
      "order": 0,
      "attributes": {
        "reference": "Annex III, Part B, point 6.4.1",
        "title": "Risks to persons in or on the carrier",
        "requirement": "The carrier shall be designed and constructed in such a way as to prevent risks due to contact between persons and/or objects in or on the carrier with any fixed or moving elements. Where necessary in order to fulfil this requirement, the carrier itself shall be completely enclosed with doors fitted with an interlocking device that prevents hazardous movements of the carrier unless the doors are closed. The doors shall remain closed if the carrier stops between landings where there is a risk of falling from the carrier.\n\nMachinery or related products shall be designed, constructed and, where necessary, equipped with devices in such a way as to prevent uncontrolled upward or downward movement of the carrier. These devices shall be able to stop the carrier at its maximum working load and at the foreseeable maximum speed.\n\nThe stopping action shall not cause deceleration harmful to the occupants, whatever the load conditions."
      }
    },
    {
      "id": "ESR-244",
      "type": "ESR",
      "parent": "ESR-242",
      "order": 1,
      "attributes": {
        "reference": "Annex III, Part B, point 6.4.2",
        "title": "Controls at landings",
        "requirement": "Controls, other than those for emergency use, at landings shall not initiate movements of the carrier when:\n\n(a) the control devices in the carrier are being operated;\n\n(b) the carrier is not at a landing."
      }
    },
    {
      "id": "ESR-245",
      "type": "ESR",
      "parent": "ESR-242",
      "order": 2,
      "attributes": {
        "reference": "Annex III, Part B, point 6.4.3",
        "title": "Access to the carrier",
        "requirement": "The guards at the landings and on the carrier shall be designed and constructed in such a way as to ensure safe transfer to and from the carrier, taking into consideration the foreseeable range of goods and persons to be lifted."
      }
    },
    {
      "id": "ESR-246",
      "type": "ESR",
      "parent": "ESR-233",
      "order": 4,
      "attributes": {
        "reference": "Annex III, Part B, point 6.5",
        "title": "Markings",
        "requirement": "The carrier shall bear the information necessary to ensure safety including:\n\n(a) the number of persons permitted on the carrier;\n\n(b) the maximum working load."
      }
    },
    {
      "id": "LEG-005",
      "type": "LEG",
      "parent": "F-18",
      "order": 4,
      "attributes": {
        "reference": "Regulation (EU) 2024/2847",
        "title": "Cyber Resilience Act (CRA)",
        "link": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02024R2847-20241120",
        "notes": "Requirements copied from the consolidated text of 20 November 2024, checked 2026-10-03. Annexes I and II unchanged since adoption."
      }
    },
    {
      "id": "ESR-247",
      "type": "ESR",
      "parent": "LEG-005",
      "order": 0,
      "attributes": {
        "reference": "Annex I",
        "title": "Essential cybersecurity requirements"
      }
    },
    {
      "id": "ESR-248",
      "type": "ESR",
      "parent": "ESR-247",
      "order": 0,
      "attributes": {
        "reference": "Annex I, Part I",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements"
      }
    },
    {
      "id": "ESR-249",
      "type": "ESR",
      "parent": "ESR-248",
      "order": 0,
      "attributes": {
        "reference": "Annex I, Part I, point (1)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(1) Products with digital elements shall be designed, developed and produced in such a way that they ensure an appropriate level of cybersecurity based on the risks."
      }
    },
    {
      "id": "ESR-250",
      "type": "ESR",
      "parent": "ESR-248",
      "order": 1,
      "attributes": {
        "reference": "Annex I, Part I, point (2)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(2) On the basis of the cybersecurity risk assessment referred to in Article 13(2) and where applicable, products with digital elements shall:"
      }
    },
    {
      "id": "ESR-251",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 0,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(a)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(a) be made available on the market without known exploitable vulnerabilities;"
      }
    },
    {
      "id": "ESR-252",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 1,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(b)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(b) be made available on the market with a secure by default configuration, unless otherwise agreed between manufacturer and business user in relation to a tailor-made product with digital elements, including the possibility to reset the product to its original state;"
      }
    },
    {
      "id": "ESR-253",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 2,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(c)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(c) ensure that vulnerabilities can be addressed through security updates, including, where applicable, through automatic security updates that are installed within an appropriate timeframe enabled as a default setting, with a clear and easy-to-use opt-out mechanism, through the notification of available updates to users, and the option to temporarily postpone them;"
      }
    },
    {
      "id": "ESR-254",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 3,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(d)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(d) ensure protection from unauthorised access by appropriate control mechanisms, including but not limited to authentication, identity or access management systems, and report on possible unauthorised access;"
      }
    },
    {
      "id": "ESR-255",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 4,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(e)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(e) protect the confidentiality of stored, transmitted or otherwise processed data, personal or other, such as by encrypting relevant data at rest or in transit by state of the art mechanisms, and by using other technical means;"
      }
    },
    {
      "id": "ESR-256",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 5,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(f)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(f) protect the integrity of stored, transmitted or otherwise processed data, personal or other, commands, programs and configuration against any manipulation or modification not authorised by the user, and report on corruptions;"
      }
    },
    {
      "id": "ESR-257",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 6,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(g)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(g) process only data, personal or other, that are adequate, relevant and limited to what is necessary in relation to the intended purpose of the product with digital elements (data minimisation);"
      }
    },
    {
      "id": "ESR-258",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 7,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(h)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(h) protect the availability of essential and basic functions, also after an incident, including through resilience and mitigation measures against denial-of-service attacks;"
      }
    },
    {
      "id": "ESR-259",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 8,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(i)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(i) minimise the negative impact by the products themselves or connected devices on the availability of services provided by other devices or networks;"
      }
    },
    {
      "id": "ESR-260",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 9,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(j)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(j) be designed, developed and produced to limit attack surfaces, including external interfaces;"
      }
    },
    {
      "id": "ESR-261",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 10,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(k)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(k) be designed, developed and produced to reduce the impact of an incident using appropriate exploitation mitigation mechanisms and techniques;"
      }
    },
    {
      "id": "ESR-262",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 11,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(l)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(l) provide security related information by recording and monitoring relevant internal activity, including the access to or modification of data, services or functions, with an opt-out mechanism for the user;"
      }
    },
    {
      "id": "ESR-263",
      "type": "ESR",
      "parent": "ESR-250",
      "order": 12,
      "attributes": {
        "reference": "Annex I, Part I, point (2)(m)",
        "title": "Cybersecurity requirements relating to the properties of products with digital elements",
        "requirement": "(m) provide the possibility for users to securely and easily remove on a permanent basis all data and settings and, where such data can be transferred to other products or systems, ensure that this is done in a secure manner."
      }
    },
    {
      "id": "ESR-264",
      "type": "ESR",
      "parent": "ESR-247",
      "order": 1,
      "attributes": {
        "reference": "Annex I, Part II",
        "title": "Vulnerability handling requirements",
        "requirement": "Manufacturers of products with digital elements shall:"
      }
    },
    {
      "id": "ESR-265",
      "type": "ESR",
      "parent": "ESR-264",
      "order": 0,
      "attributes": {
        "reference": "Annex I, Part II, point (1)",
        "title": "Vulnerability handling requirements",
        "requirement": "(1) identify and document vulnerabilities and components contained in products with digital elements, including by drawing up a software bill of materials in a commonly used and machine-readable format covering at the very least the top-level dependencies of the products;"
      }
    },
    {
      "id": "ESR-266",
      "type": "ESR",
      "parent": "ESR-264",
      "order": 1,
      "attributes": {
        "reference": "Annex I, Part II, point (2)",
        "title": "Vulnerability handling requirements",
        "requirement": "(2) in relation to the risks posed to products with digital elements, address and remediate vulnerabilities without delay, including by providing security updates; where technically feasible, new security updates shall be provided separately from functionality updates;"
      }
    },
    {
      "id": "ESR-267",
      "type": "ESR",
      "parent": "ESR-264",
      "order": 2,
      "attributes": {
        "reference": "Annex I, Part II, point (3)",
        "title": "Vulnerability handling requirements",
        "requirement": "(3) apply effective and regular tests and reviews of the security of the product with digital elements;"
      }
    },
    {
      "id": "ESR-268",
      "type": "ESR",
      "parent": "ESR-264",
      "order": 3,
      "attributes": {
        "reference": "Annex I, Part II, point (4)",
        "title": "Vulnerability handling requirements",
        "requirement": "(4) once a security update has been made available, share and publicly disclose information about fixed vulnerabilities, including a description of the vulnerabilities, information allowing users to identify the product with digital elements affected, the impacts of the vulnerabilities, their severity and clear and accessible information helping users to remediate the vulnerabilities; in duly justified cases, where manufacturers consider the security risks of publication to outweigh the security benefits, they may delay making public information regarding a fixed vulnerability until after users have been given the possibility to apply the relevant patch;"
      }
    },
    {
      "id": "ESR-269",
      "type": "ESR",
      "parent": "ESR-264",
      "order": 4,
      "attributes": {
        "reference": "Annex I, Part II, point (5)",
        "title": "Vulnerability handling requirements",
        "requirement": "(5) put in place and enforce a policy on coordinated vulnerability disclosure;"
      }
    },
    {
      "id": "ESR-270",
      "type": "ESR",
      "parent": "ESR-264",
      "order": 5,
      "attributes": {
        "reference": "Annex I, Part II, point (6)",
        "title": "Vulnerability handling requirements",
        "requirement": "(6) take measures to facilitate the sharing of information about potential vulnerabilities in their product with digital elements as well as in third-party components contained in that product, including by providing a contact address for the reporting of the vulnerabilities discovered in the product with digital elements;"
      }
    },
    {
      "id": "ESR-271",
      "type": "ESR",
      "parent": "ESR-264",
      "order": 6,
      "attributes": {
        "reference": "Annex I, Part II, point (7)",
        "title": "Vulnerability handling requirements",
        "requirement": "(7) provide for mechanisms to securely distribute updates for products with digital elements to ensure that vulnerabilities are fixed or mitigated in a timely manner and, where applicable for security updates, in an automatic manner;"
      }
    },
    {
      "id": "ESR-272",
      "type": "ESR",
      "parent": "ESR-264",
      "order": 7,
      "attributes": {
        "reference": "Annex I, Part II, point (8)",
        "title": "Vulnerability handling requirements",
        "requirement": "(8) ensure that, where security updates are available to address identified security issues, they are disseminated without delay and, unless otherwise agreed between a manufacturer and a business user in relation to a tailor-made product with digital elements, free of charge, accompanied by advisory messages providing users with the relevant information, including on potential action to be taken."
      }
    },
    {
      "id": "ESR-273",
      "type": "ESR",
      "parent": "LEG-005",
      "order": 1,
      "attributes": {
        "reference": "Annex II",
        "title": "Information and instructions to the user",
        "requirement": "At minimum, the product with digital elements shall be accompanied by:"
      }
    },
    {
      "id": "ESR-274",
      "type": "ESR",
      "parent": "ESR-273",
      "order": 0,
      "attributes": {
        "reference": "Annex II, point 1",
        "title": "Information and instructions to the user",
        "requirement": "1. the name, registered trade name or registered trademark of the manufacturer, and the postal address, the email address or other digital contact as well as, where available, the website at which the manufacturer can be contacted;"
      }
    },
    {
      "id": "ESR-275",
      "type": "ESR",
      "parent": "ESR-273",
      "order": 1,
      "attributes": {
        "reference": "Annex II, point 2",
        "title": "Information and instructions to the user",
        "requirement": "2. the single point of contact where information about vulnerabilities of the product with digital elements can be reported and received, and where the manufacturer's policy on coordinated vulnerability disclosure can be found;"
      }
    },
    {
      "id": "ESR-276",
      "type": "ESR",
      "parent": "ESR-273",
      "order": 2,
      "attributes": {
        "reference": "Annex II, point 3",
        "title": "Information and instructions to the user",
        "requirement": "3. name and type and any additional information enabling the unique identification of the product with digital elements;"
      }
    },
    {
      "id": "ESR-277",
      "type": "ESR",
      "parent": "ESR-273",
      "order": 3,
      "attributes": {
        "reference": "Annex II, point 4",
        "title": "Information and instructions to the user",
        "requirement": "4. the intended purpose of the product with digital elements, including the security environment provided by the manufacturer, as well as the product's essential functionalities and information about the security properties;"
      }
    },
    {
      "id": "ESR-278",
      "type": "ESR",
      "parent": "ESR-273",
      "order": 4,
      "attributes": {
        "reference": "Annex II, point 5",
        "title": "Information and instructions to the user",
        "requirement": "5. any known or foreseeable circumstance, related to the use of the product with digital elements in accordance with its intended purpose or under conditions of reasonably foreseeable misuse, which may lead to significant cybersecurity risks;"
      }
    },
    {
      "id": "ESR-279",
      "type": "ESR",
      "parent": "ESR-273",
      "order": 5,
      "attributes": {
        "reference": "Annex II, point 6",
        "title": "Information and instructions to the user",
        "requirement": "6. where applicable, the internet address at which the EU declaration of conformity can be accessed;"
      }
    },
    {
      "id": "ESR-280",
      "type": "ESR",
      "parent": "ESR-273",
      "order": 6,
      "attributes": {
        "reference": "Annex II, point 7",
        "title": "Information and instructions to the user",
        "requirement": "7. the type of technical security support offered by the manufacturer and the end-date of the support period during which users can expect vulnerabilities to be handled and to receive security updates;"
      }
    },
    {
      "id": "ESR-281",
      "type": "ESR",
      "parent": "ESR-273",
      "order": 7,
      "attributes": {
        "reference": "Annex II, point 8",
        "title": "Information and instructions to the user",
        "requirement": "8. detailed instructions or an internet address referring to such detailed instructions and information on:"
      }
    },
    {
      "id": "ESR-282",
      "type": "ESR",
      "parent": "ESR-281",
      "order": 0,
      "attributes": {
        "reference": "Annex II, point 8(a)",
        "title": "Information and instructions to the user",
        "requirement": "(a) the necessary measures during initial commissioning and throughout the lifetime of the product with digital elements to ensure its secure use;"
      }
    },
    {
      "id": "ESR-283",
      "type": "ESR",
      "parent": "ESR-281",
      "order": 1,
      "attributes": {
        "reference": "Annex II, point 8(b)",
        "title": "Information and instructions to the user",
        "requirement": "(b) how changes to the product with digital elements can affect the security of data;"
      }
    },
    {
      "id": "ESR-284",
      "type": "ESR",
      "parent": "ESR-281",
      "order": 2,
      "attributes": {
        "reference": "Annex II, point 8(c)",
        "title": "Information and instructions to the user",
        "requirement": "(c) how security-relevant updates can be installed;"
      }
    },
    {
      "id": "ESR-285",
      "type": "ESR",
      "parent": "ESR-281",
      "order": 3,
      "attributes": {
        "reference": "Annex II, point 8(d)",
        "title": "Information and instructions to the user",
        "requirement": "(d) the secure decommissioning of the product with digital elements, including information on how user data can be securely removed;"
      }
    },
    {
      "id": "ESR-286",
      "type": "ESR",
      "parent": "ESR-281",
      "order": 4,
      "attributes": {
        "reference": "Annex II, point 8(e)",
        "title": "Information and instructions to the user",
        "requirement": "(e) how the default setting enabling the automatic installation of security updates, as required by Part I, point (2)(c), of Annex I, can be turned off;"
      }
    },
    {
      "id": "ESR-287",
      "type": "ESR",
      "parent": "ESR-281",
      "order": 5,
      "attributes": {
        "reference": "Annex II, point 8(f)",
        "title": "Information and instructions to the user",
        "requirement": "(f) where the product with digital elements is intended for integration into other products with digital elements, the information necessary for the integrator to comply with the essential cybersecurity requirements set out in Annex I and the documentation requirements set out in Annex VII."
      }
    },
    {
      "id": "ESR-288",
      "type": "ESR",
      "parent": "ESR-273",
      "order": 8,
      "attributes": {
        "reference": "Annex II, point 9",
        "title": "Information and instructions to the user",
        "requirement": "9. If the manufacturer decides to make available the software bill of materials to the user, information on where the software bill of materials can be accessed."
      }
    },
    {
      "id": "PHS-001",
      "type": "PHS",
      "parent": "F-19",
      "order": 0,
      "attributes": {
        "title": "Transport"
      }
    },
    {
      "id": "PHS-002",
      "type": "PHS",
      "parent": "F-19",
      "order": 1,
      "attributes": {
        "title": "Storage"
      }
    },
    {
      "id": "PHS-003",
      "type": "PHS",
      "parent": "F-19",
      "order": 2,
      "attributes": {
        "title": "Assembly"
      }
    },
    {
      "id": "PHS-004",
      "type": "PHS",
      "parent": "F-19",
      "order": 3,
      "attributes": {
        "title": "Installation"
      }
    },
    {
      "id": "PHS-005",
      "type": "PHS",
      "parent": "F-19",
      "order": 4,
      "attributes": {
        "title": "Setting"
      }
    },
    {
      "id": "PHS-006",
      "type": "PHS",
      "parent": "F-19",
      "order": 5,
      "attributes": {
        "title": "Testing"
      }
    },
    {
      "id": "PHS-007",
      "type": "PHS",
      "parent": "F-19",
      "order": 6,
      "attributes": {
        "title": "Operation"
      }
    },
    {
      "id": "PHS-008",
      "type": "PHS",
      "parent": "F-19",
      "order": 7,
      "attributes": {
        "title": "Moving"
      }
    },
    {
      "id": "PHS-009",
      "type": "PHS",
      "parent": "F-19",
      "order": 8,
      "attributes": {
        "title": "Cleaning"
      }
    },
    {
      "id": "PHS-010",
      "type": "PHS",
      "parent": "F-19",
      "order": 9,
      "attributes": {
        "title": "Maintenance"
      }
    },
    {
      "id": "PHS-011",
      "type": "PHS",
      "parent": "F-19",
      "order": 10,
      "attributes": {
        "title": "Repair"
      }
    },
    {
      "id": "PHS-012",
      "type": "PHS",
      "parent": "F-19",
      "order": 11,
      "attributes": {
        "title": "Breakdown"
      }
    },
    {
      "id": "PHS-013",
      "type": "PHS",
      "parent": "F-19",
      "order": 12,
      "attributes": {
        "title": "Dismantling"
      }
    },
    {
      "id": "PHS-014",
      "type": "PHS",
      "parent": "F-19",
      "order": 13,
      "attributes": {
        "title": "Disabling"
      }
    },
    {
      "id": "PHS-015",
      "type": "PHS",
      "parent": "F-19",
      "order": 14,
      "attributes": {
        "title": "Scrapping"
      }
    },
    {
      "id": "HAZ-001",
      "type": "HAZ",
      "parent": "F-20",
      "order": 0,
      "attributes": {
        "reference": "1",
        "title": "Kinetic energy"
      }
    },
    {
      "id": "HAZ-017",
      "type": "HAZ",
      "parent": "HAZ-001",
      "order": 0,
      "attributes": {
        "reference": "1.1",
        "title": "Moving objects / parts"
      }
    },
    {
      "id": "HAZ-018",
      "type": "HAZ",
      "parent": "HAZ-001",
      "order": 1,
      "attributes": {
        "reference": "1.2",
        "title": "Rotating objects / parts"
      }
    },
    {
      "id": "HAZ-019",
      "type": "HAZ",
      "parent": "HAZ-001",
      "order": 2,
      "attributes": {
        "reference": "1.3",
        "title": "Fracturing of rotating equipment"
      }
    },
    {
      "id": "HAZ-020",
      "type": "HAZ",
      "parent": "HAZ-001",
      "order": 3,
      "attributes": {
        "reference": "1.4",
        "title": "Ejected parts / fragments"
      }
    },
    {
      "id": "HAZ-021",
      "type": "HAZ",
      "parent": "HAZ-001",
      "order": 4,
      "attributes": {
        "reference": "1.5",
        "title": "Falling objects"
      }
    },
    {
      "id": "HAZ-022",
      "type": "HAZ",
      "parent": "HAZ-001",
      "order": 5,
      "attributes": {
        "reference": "1.6",
        "title": "Linear impact"
      }
    },
    {
      "id": "HAZ-023",
      "type": "HAZ",
      "parent": "HAZ-001",
      "order": 6,
      "attributes": {
        "reference": "1.7",
        "title": "Explosive atmosphere"
      }
    },
    {
      "id": "HAZ-024",
      "type": "HAZ",
      "parent": "HAZ-001",
      "order": 7,
      "attributes": {
        "reference": "1.8",
        "title": "Explosives"
      }
    },
    {
      "id": "HAZ-025",
      "type": "HAZ",
      "parent": "HAZ-001",
      "order": 8,
      "attributes": {
        "reference": "1.9",
        "title": "Displacement"
      }
    },
    {
      "id": "HAZ-026",
      "type": "HAZ",
      "parent": "HAZ-001",
      "order": 9,
      "attributes": {
        "reference": "1.10",
        "title": "Friction beteween moving parts"
      }
    },
    {
      "id": "HAZ-002",
      "type": "HAZ",
      "parent": "F-20",
      "order": 1,
      "attributes": {
        "reference": "2",
        "title": "Mechanical energy"
      }
    },
    {
      "id": "HAZ-027",
      "type": "HAZ",
      "parent": "HAZ-002",
      "order": 0,
      "attributes": {
        "reference": "2.1",
        "title": "Tensioned springs"
      }
    },
    {
      "id": "HAZ-028",
      "type": "HAZ",
      "parent": "HAZ-002",
      "order": 1,
      "attributes": {
        "reference": "2.2",
        "title": "Compressed spring release"
      }
    },
    {
      "id": "HAZ-029",
      "type": "HAZ",
      "parent": "HAZ-002",
      "order": 2,
      "attributes": {
        "reference": "2.3",
        "title": "Stored energy release"
      }
    },
    {
      "id": "HAZ-030",
      "type": "HAZ",
      "parent": "HAZ-002",
      "order": 3,
      "attributes": {
        "reference": "2.4",
        "title": "Hot objects"
      }
    },
    {
      "id": "HAZ-031",
      "type": "HAZ",
      "parent": "HAZ-002",
      "order": 4,
      "attributes": {
        "reference": "2.5",
        "title": "Cold objects"
      }
    },
    {
      "id": "HAZ-032",
      "type": "HAZ",
      "parent": "HAZ-002",
      "order": 5,
      "attributes": {
        "reference": "2.6",
        "title": "Sharp corners and edges"
      }
    },
    {
      "id": "HAZ-033",
      "type": "HAZ",
      "parent": "HAZ-002",
      "order": 6,
      "attributes": {
        "reference": "2.7",
        "title": "Pinch points"
      }
    },
    {
      "id": "HAZ-003",
      "type": "HAZ",
      "parent": "F-20",
      "order": 2,
      "attributes": {
        "reference": "3",
        "title": "Pressure"
      }
    },
    {
      "id": "HAZ-034",
      "type": "HAZ",
      "parent": "HAZ-003",
      "order": 0,
      "attributes": {
        "reference": "3.1",
        "title": "Systems under pressure, (pressure containers)"
      }
    },
    {
      "id": "HAZ-035",
      "type": "HAZ",
      "parent": "HAZ-003",
      "order": 1,
      "attributes": {
        "reference": "3.2",
        "title": "Overpressure"
      }
    },
    {
      "id": "HAZ-036",
      "type": "HAZ",
      "parent": "HAZ-003",
      "order": 2,
      "attributes": {
        "reference": "3.3",
        "title": "Underpressure"
      }
    },
    {
      "id": "HAZ-037",
      "type": "HAZ",
      "parent": "HAZ-003",
      "order": 3,
      "attributes": {
        "reference": "3.4",
        "title": "No pressure"
      }
    },
    {
      "id": "HAZ-216",
      "type": "HAZ",
      "parent": "HAZ-003",
      "order": 4,
      "attributes": {
        "reference": "3.5",
        "title": "System leakage"
      }
    },
    {
      "id": "HAZ-038",
      "type": "HAZ",
      "parent": "HAZ-003",
      "order": 5,
      "attributes": {
        "reference": "3.6",
        "title": "Heating / cooling by pressure change"
      }
    },
    {
      "id": "HAZ-039",
      "type": "HAZ",
      "parent": "HAZ-003",
      "order": 6,
      "attributes": {
        "reference": "3.7",
        "title": "Aero bends / choking / shock"
      }
    },
    {
      "id": "HAZ-040",
      "type": "HAZ",
      "parent": "HAZ-003",
      "order": 7,
      "attributes": {
        "reference": "3.8",
        "title": "Compressed gas"
      }
    },
    {
      "id": "HAZ-041",
      "type": "HAZ",
      "parent": "HAZ-003",
      "order": 8,
      "attributes": {
        "reference": "3.9",
        "title": "Accidental release"
      }
    },
    {
      "id": "HAZ-004",
      "type": "HAZ",
      "parent": "F-20",
      "order": 3,
      "attributes": {
        "reference": "4",
        "title": "Acceleration"
      }
    },
    {
      "id": "HAZ-042",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 0,
      "attributes": {
        "reference": "4.1",
        "title": "Structural deformation"
      }
    },
    {
      "id": "HAZ-043",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 1,
      "attributes": {
        "reference": "4.2",
        "title": "Impact"
      }
    },
    {
      "id": "HAZ-044",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 2,
      "attributes": {
        "reference": "4.3",
        "title": "Displacement of parts/pipes/fluids"
      }
    },
    {
      "id": "HAZ-045",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 3,
      "attributes": {
        "reference": "4.4",
        "title": "Valve / electrical contact seating"
      }
    },
    {
      "id": "HAZ-046",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 4,
      "attributes": {
        "reference": "4.5",
        "title": "Fluid pressure loss"
      }
    },
    {
      "id": "HAZ-047",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 5,
      "attributes": {
        "reference": "4.6",
        "title": "Fluid pressure surge"
      }
    },
    {
      "id": "HAZ-048",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 6,
      "attributes": {
        "reference": "4.7",
        "title": "Detonation - chock sensitive explosive"
      }
    },
    {
      "id": "HAZ-049",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 7,
      "attributes": {
        "reference": "4.8",
        "title": "Falling objekts"
      }
    },
    {
      "id": "HAZ-050",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 8,
      "attributes": {
        "reference": "4.9",
        "title": "Change in velocity"
      }
    },
    {
      "id": "HAZ-051",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 9,
      "attributes": {
        "reference": "4.10",
        "title": "Uncotrolled loss of altitude"
      }
    },
    {
      "id": "HAZ-052",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 10,
      "attributes": {
        "reference": "4.11",
        "title": "Turbulence"
      }
    },
    {
      "id": "HAZ-053",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 11,
      "attributes": {
        "reference": "4.12",
        "title": "Loss of motive power"
      }
    },
    {
      "id": "HAZ-054",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 12,
      "attributes": {
        "reference": "4.13",
        "title": "Failure of restraining mechanism"
      }
    },
    {
      "id": "HAZ-055",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 13,
      "attributes": {
        "reference": "4.14",
        "title": "Loss of braking"
      }
    },
    {
      "id": "HAZ-056",
      "type": "HAZ",
      "parent": "HAZ-004",
      "order": 14,
      "attributes": {
        "title": "Deflection / bottoming of shock isolated parts",
        "reference": "4.15"
      }
    },
    {
      "id": "HAZ-005",
      "type": "HAZ",
      "parent": "F-20",
      "order": 4,
      "attributes": {
        "reference": "5",
        "title": "Vibration / sound"
      }
    },
    {
      "id": "HAZ-057",
      "type": "HAZ",
      "parent": "HAZ-005",
      "order": 0,
      "attributes": {
        "reference": "5.1",
        "title": "Material fatigue"
      }
    },
    {
      "id": "HAZ-058",
      "type": "HAZ",
      "parent": "HAZ-005",
      "order": 1,
      "attributes": {
        "reference": "5.2",
        "title": "Pressure / shock wave effects"
      }
    },
    {
      "id": "HAZ-059",
      "type": "HAZ",
      "parent": "HAZ-005",
      "order": 2,
      "attributes": {
        "reference": "5.3",
        "title": "Loosening of parts"
      }
    },
    {
      "id": "HAZ-060",
      "type": "HAZ",
      "parent": "HAZ-005",
      "order": 3,
      "attributes": {
        "reference": "5.4",
        "title": "Communication interferens"
      }
    },
    {
      "id": "HAZ-061",
      "type": "HAZ",
      "parent": "HAZ-005",
      "order": 4,
      "attributes": {
        "reference": "5.5",
        "title": "Sound pressure,excessive noise"
      }
    },
    {
      "id": "HAZ-062",
      "type": "HAZ",
      "parent": "HAZ-005",
      "order": 5,
      "attributes": {
        "reference": "5.6",
        "title": "Excessive vibration"
      }
    },
    {
      "id": "HAZ-063",
      "type": "HAZ",
      "parent": "HAZ-005",
      "order": 6,
      "attributes": {
        "reference": "5.7",
        "title": "Supersonics"
      }
    },
    {
      "id": "HAZ-006",
      "type": "HAZ",
      "parent": "F-20",
      "order": 5,
      "attributes": {
        "reference": "6",
        "title": "Material deformation"
      }
    },
    {
      "id": "HAZ-064",
      "type": "HAZ",
      "parent": "HAZ-006",
      "order": 0,
      "attributes": {
        "reference": "6.1",
        "title": "Material aging"
      }
    },
    {
      "id": "HAZ-065",
      "type": "HAZ",
      "parent": "HAZ-006",
      "order": 1,
      "attributes": {
        "reference": "6.2",
        "title": "Material embrittelment"
      }
    },
    {
      "id": "HAZ-066",
      "type": "HAZ",
      "parent": "HAZ-006",
      "order": 2,
      "attributes": {
        "reference": "6.3",
        "title": "Change in physical / chemical properties"
      }
    },
    {
      "id": "HAZ-067",
      "type": "HAZ",
      "parent": "HAZ-006",
      "order": 3,
      "attributes": {
        "reference": "6.4",
        "title": "Structural damage / failure"
      }
    },
    {
      "id": "HAZ-068",
      "type": "HAZ",
      "parent": "HAZ-006",
      "order": 4,
      "attributes": {
        "reference": "6.5",
        "title": "Delamination"
      }
    },
    {
      "id": "HAZ-069",
      "type": "HAZ",
      "parent": "HAZ-006",
      "order": 5,
      "attributes": {
        "reference": "6.6",
        "title": "Dimension change from heat / sun"
      }
    },
    {
      "id": "HAZ-070",
      "type": "HAZ",
      "parent": "HAZ-006",
      "order": 6,
      "attributes": {
        "reference": "6.7",
        "title": "Improper welds"
      }
    },
    {
      "id": "HAZ-071",
      "type": "HAZ",
      "parent": "HAZ-006",
      "order": 7,
      "attributes": {
        "reference": "6.8",
        "title": "High aerodynamic loads"
      }
    },
    {
      "id": "HAZ-007",
      "type": "HAZ",
      "parent": "F-20",
      "order": 6,
      "attributes": {
        "reference": "7",
        "title": "Hazardous substances / Chemical energy"
      }
    },
    {
      "id": "HAZ-072",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 0,
      "attributes": {
        "reference": "7.1",
        "title": "Flammable substances"
      }
    },
    {
      "id": "HAZ-073",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 1,
      "attributes": {
        "reference": "7.2",
        "title": "Substances subject to spontaneous combustion"
      }
    },
    {
      "id": "HAZ-074",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 2,
      "attributes": {
        "reference": "7.3",
        "title": "Substances producing gas"
      }
    },
    {
      "id": "HAZ-075",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 3,
      "attributes": {
        "reference": "7.4",
        "title": "Oxidising substances"
      }
    },
    {
      "id": "HAZ-076",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 4,
      "attributes": {
        "reference": "7.5",
        "title": "Corrosive substances"
      }
    },
    {
      "id": "HAZ-077",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 5,
      "attributes": {
        "reference": "7.6",
        "title": "Toxic substances"
      }
    },
    {
      "id": "HAZ-078",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 6,
      "attributes": {
        "reference": "7.7",
        "title": "Radioactive substances"
      }
    },
    {
      "id": "HAZ-079",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 7,
      "attributes": {
        "reference": "7.8",
        "title": "Fire"
      }
    },
    {
      "id": "HAZ-080",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 8,
      "attributes": {
        "reference": "7.9",
        "title": "Non-explosive reaktion"
      }
    },
    {
      "id": "HAZ-081",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 9,
      "attributes": {
        "reference": "7.10",
        "title": "Material degradetion"
      }
    },
    {
      "id": "HAZ-082",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 10,
      "attributes": {
        "reference": "7.11",
        "title": "Toxic gas production"
      }
    },
    {
      "id": "HAZ-083",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 11,
      "attributes": {
        "reference": "7.12",
        "title": "Corrosion"
      }
    },
    {
      "id": "HAZ-084",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 12,
      "attributes": {
        "reference": "7.13",
        "title": "Organic material swelling"
      }
    },
    {
      "id": "HAZ-085",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 13,
      "attributes": {
        "reference": "7.14",
        "title": "Disassociation hazardous substances"
      }
    },
    {
      "id": "HAZ-086",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 14,
      "attributes": {
        "reference": "7.15",
        "title": "Incompatible materials / chemicals"
      }
    },
    {
      "id": "HAZ-087",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 15,
      "attributes": {
        "reference": "7.16",
        "title": "Incompatible material reaction"
      }
    },
    {
      "id": "HAZ-088",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 16,
      "attributes": {
        "reference": "7.17",
        "title": "Combination hazardous substances"
      }
    },
    {
      "id": "HAZ-089",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 17,
      "attributes": {
        "reference": "7.18",
        "title": "Presence of fuel"
      }
    },
    {
      "id": "HAZ-090",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 18,
      "attributes": {
        "reference": "7.19",
        "title": "Presence of strong oxidizer"
      }
    },
    {
      "id": "HAZ-091",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 19,
      "attributes": {
        "reference": "7.20",
        "title": "Presence of ignition source"
      }
    },
    {
      "id": "HAZ-092",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 20,
      "attributes": {
        "reference": "7.21",
        "title": "Explosive gas, liquid, solid"
      }
    },
    {
      "id": "HAZ-093",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 21,
      "attributes": {
        "reference": "7.22",
        "title": "Formation of explosive gels between fuels / oxidizers"
      }
    },
    {
      "id": "HAZ-094",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 22,
      "attributes": {
        "reference": "7.23",
        "title": "Cryogenics"
      }
    },
    {
      "id": "HAZ-095",
      "type": "HAZ",
      "parent": "HAZ-007",
      "order": 23,
      "attributes": {
        "reference": "7.24",
        "title": "Fuel exhaustion"
      }
    },
    {
      "id": "HAZ-008",
      "type": "HAZ",
      "parent": "F-20",
      "order": 7,
      "attributes": {
        "reference": "8",
        "title": "Toxicants"
      }
    },
    {
      "id": "HAZ-096",
      "type": "HAZ",
      "parent": "HAZ-008",
      "order": 0,
      "attributes": {
        "reference": "8.1",
        "title": "Respiratory system damage"
      }
    },
    {
      "id": "HAZ-097",
      "type": "HAZ",
      "parent": "HAZ-008",
      "order": 1,
      "attributes": {
        "reference": "8.2",
        "title": "Blood system damage"
      }
    },
    {
      "id": "HAZ-098",
      "type": "HAZ",
      "parent": "HAZ-008",
      "order": 2,
      "attributes": {
        "reference": "8.3",
        "title": "Body organ damage"
      }
    },
    {
      "id": "HAZ-099",
      "type": "HAZ",
      "parent": "HAZ-008",
      "order": 3,
      "attributes": {
        "reference": "8.4",
        "title": "Skin irritation / damage"
      }
    },
    {
      "id": "HAZ-100",
      "type": "HAZ",
      "parent": "HAZ-008",
      "order": 4,
      "attributes": {
        "reference": "8.5",
        "title": "Nervous system effects"
      }
    },
    {
      "id": "HAZ-101",
      "type": "HAZ",
      "parent": "HAZ-008",
      "order": 5,
      "attributes": {
        "reference": "8.6",
        "title": "Foul odor"
      }
    },
    {
      "id": "HAZ-102",
      "type": "HAZ",
      "parent": "HAZ-008",
      "order": 6,
      "attributes": {
        "reference": "8.7",
        "title": "Asphyxiant"
      }
    },
    {
      "id": "HAZ-103",
      "type": "HAZ",
      "parent": "HAZ-008",
      "order": 7,
      "attributes": {
        "reference": "8.8",
        "title": "Carcinogen"
      }
    },
    {
      "id": "HAZ-009",
      "type": "HAZ",
      "parent": "F-20",
      "order": 8,
      "attributes": {
        "reference": "9",
        "title": "Radiation"
      }
    },
    {
      "id": "HAZ-104",
      "type": "HAZ",
      "parent": "HAZ-009",
      "order": 0,
      "attributes": {
        "reference": "9.1",
        "title": "Electromagnetic (radar, communications)"
      }
    },
    {
      "id": "HAZ-105",
      "type": "HAZ",
      "parent": "HAZ-009",
      "order": 1,
      "attributes": {
        "reference": "9.2",
        "title": "Jonizing (radioactive, x-ray, radar, nuclear)"
      }
    },
    {
      "id": "HAZ-106",
      "type": "HAZ",
      "parent": "HAZ-009",
      "order": 2,
      "attributes": {
        "reference": "9.3",
        "title": "Therminal infrared"
      }
    },
    {
      "id": "HAZ-107",
      "type": "HAZ",
      "parent": "HAZ-009",
      "order": 3,
      "attributes": {
        "reference": "9.4",
        "title": "UV (solar, electric weld arc)"
      }
    },
    {
      "id": "HAZ-108",
      "type": "HAZ",
      "parent": "HAZ-009",
      "order": 4,
      "attributes": {
        "reference": "9.5",
        "title": "Microwave"
      }
    },
    {
      "id": "HAZ-109",
      "type": "HAZ",
      "parent": "HAZ-009",
      "order": 5,
      "attributes": {
        "reference": "9.6",
        "title": "Laser"
      }
    },
    {
      "id": "HAZ-110",
      "type": "HAZ",
      "parent": "HAZ-009",
      "order": 6,
      "attributes": {
        "reference": "9.7",
        "title": "Electronic equipment interference"
      }
    },
    {
      "id": "HAZ-010",
      "type": "HAZ",
      "parent": "F-20",
      "order": 9,
      "attributes": {
        "reference": "10",
        "title": "Contamination"
      }
    },
    {
      "id": "HAZ-111",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 0,
      "attributes": {
        "reference": "10.1",
        "title": "Clogging/blocking of components"
      }
    },
    {
      "id": "HAZ-112",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 1,
      "attributes": {
        "reference": "10.2",
        "title": "Fluid deterioration"
      }
    },
    {
      "id": "HAZ-113",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 2,
      "attributes": {
        "reference": "10.3",
        "title": "Performance sensors / operating components degradation"
      }
    },
    {
      "id": "HAZ-114",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 3,
      "attributes": {
        "reference": "10.4",
        "title": "Line / component erosion"
      }
    },
    {
      "id": "HAZ-115",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 4,
      "attributes": {
        "reference": "10.5",
        "title": "Line / component fracture / degradation due to high speed particles"
      }
    },
    {
      "id": "HAZ-116",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 5,
      "attributes": {
        "reference": "10.6",
        "title": "Electrical insulation breakdown"
      }
    },
    {
      "id": "HAZ-117",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 6,
      "attributes": {
        "reference": "10.7",
        "title": "Emulsion in water"
      }
    },
    {
      "id": "HAZ-118",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 7,
      "attributes": {
        "reference": "10.8",
        "title": "Reduction in lubrication"
      }
    },
    {
      "id": "HAZ-119",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 8,
      "attributes": {
        "reference": "10.9",
        "title": "Leakage of petrolium / injurios products"
      }
    },
    {
      "id": "HAZ-120",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 9,
      "attributes": {
        "reference": "10.10",
        "title": "Filter owerload"
      }
    },
    {
      "id": "HAZ-121",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 10,
      "attributes": {
        "reference": "10.11",
        "title": "Metal particles"
      }
    },
    {
      "id": "HAZ-122",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 11,
      "attributes": {
        "reference": "10.12",
        "title": "Airborne dirt / contamination"
      }
    },
    {
      "id": "HAZ-123",
      "type": "HAZ",
      "parent": "HAZ-010",
      "order": 12,
      "attributes": {
        "reference": "10.13",
        "title": "Wrong seal / gasket"
      }
    },
    {
      "id": "HAZ-011",
      "type": "HAZ",
      "parent": "F-20",
      "order": 10,
      "attributes": {
        "reference": "11",
        "title": "Electrical energy"
      }
    },
    {
      "id": "HAZ-124",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 0,
      "attributes": {
        "reference": "11.1",
        "title": "Electrocution / shock"
      }
    },
    {
      "id": "HAZ-125",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 1,
      "attributes": {
        "reference": "11.2",
        "title": "Burns"
      }
    },
    {
      "id": "HAZ-126",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 2,
      "attributes": {
        "reference": "11.3",
        "title": "Ignition of combustibles"
      }
    },
    {
      "id": "HAZ-127",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 3,
      "attributes": {
        "reference": "11.4",
        "title": "Equipment burnout"
      }
    },
    {
      "id": "HAZ-128",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 4,
      "attributes": {
        "reference": "11.5",
        "title": "Necessary equipment/warning of cation equipment unavailable"
      }
    },
    {
      "id": "HAZ-129",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 5,
      "attributes": {
        "reference": "11.6",
        "title": "Failure of emergency of rescue system"
      }
    },
    {
      "id": "HAZ-130",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 6,
      "attributes": {
        "reference": "11.7",
        "title": "Restraining device release"
      }
    },
    {
      "id": "HAZ-131",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 7,
      "attributes": {
        "reference": "11.8",
        "title": "Communication interuption"
      }
    },
    {
      "id": "HAZ-132",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 8,
      "attributes": {
        "reference": "11.9",
        "title": "Power failure"
      }
    },
    {
      "id": "HAZ-133",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 9,
      "attributes": {
        "reference": "11.10",
        "title": "Static electricity"
      }
    },
    {
      "id": "HAZ-134",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 10,
      "attributes": {
        "reference": "11.11",
        "title": "Proper ground / bond"
      }
    },
    {
      "id": "HAZ-135",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 11,
      "attributes": {
        "reference": "11.12",
        "title": "Adequate insulation"
      }
    },
    {
      "id": "HAZ-136",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 12,
      "attributes": {
        "reference": "11.13",
        "title": "Circuit power surge protection"
      }
    },
    {
      "id": "HAZ-137",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 13,
      "attributes": {
        "reference": "11.14",
        "title": "Positive power lockout"
      }
    },
    {
      "id": "HAZ-138",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 14,
      "attributes": {
        "reference": "11.15",
        "title": "Ground failure"
      }
    },
    {
      "id": "HAZ-139",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 15,
      "attributes": {
        "reference": "11.16",
        "title": "EMI Electromagnetic interference"
      }
    },
    {
      "id": "HAZ-140",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 16,
      "attributes": {
        "reference": "11.17",
        "title": "Overheating"
      }
    },
    {
      "id": "HAZ-141",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 17,
      "attributes": {
        "reference": "11.18",
        "title": "Owerloading"
      }
    },
    {
      "id": "HAZ-142",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 18,
      "attributes": {
        "reference": "11.19",
        "title": "Magnetic field"
      }
    },
    {
      "id": "HAZ-143",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 19,
      "attributes": {
        "reference": "11.20",
        "title": "Current-carrying parts"
      }
    },
    {
      "id": "HAZ-144",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 20,
      "attributes": {
        "reference": "11.21",
        "title": "Electromagnetic radiation"
      }
    },
    {
      "id": "HAZ-145",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 21,
      "attributes": {
        "reference": "11.22",
        "title": "Charged condensers"
      }
    },
    {
      "id": "HAZ-146",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 22,
      "attributes": {
        "reference": "11.23",
        "title": "Electrostatic energy"
      }
    },
    {
      "id": "HAZ-147",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 23,
      "attributes": {
        "reference": "11.24",
        "title": "Accumulators / fuel cell / battery"
      }
    },
    {
      "id": "HAZ-148",
      "type": "HAZ",
      "parent": "HAZ-011",
      "order": 24,
      "attributes": {
        "reference": "11.25",
        "title": "Lasers"
      }
    },
    {
      "id": "HAZ-012",
      "type": "HAZ",
      "parent": "F-20",
      "order": 11,
      "attributes": {
        "reference": "12",
        "title": "Thermal energy"
      }
    },
    {
      "id": "HAZ-149",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 0,
      "attributes": {
        "reference": "12.1",
        "title": "High temperature"
      }
    },
    {
      "id": "HAZ-150",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 1,
      "attributes": {
        "reference": "12.2",
        "title": "Low temperature"
      }
    },
    {
      "id": "HAZ-151",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 2,
      "attributes": {
        "reference": "12.3",
        "title": "Combustible ignition"
      }
    },
    {
      "id": "HAZ-152",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 3,
      "attributes": {
        "reference": "12.4",
        "title": "Reaction ignition"
      }
    },
    {
      "id": "HAZ-153",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 4,
      "attributes": {
        "reference": "12.5",
        "title": "Distortion of parts"
      }
    },
    {
      "id": "HAZ-154",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 5,
      "attributes": {
        "reference": "12.6",
        "title": "Fluid expansion/constraction"
      }
    },
    {
      "id": "HAZ-155",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 6,
      "attributes": {
        "reference": "12.7",
        "title": "Inadequate heat dissipation"
      }
    },
    {
      "id": "HAZ-156",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 7,
      "attributes": {
        "reference": "12.8",
        "title": "Thermal source insulation"
      }
    },
    {
      "id": "HAZ-157",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 8,
      "attributes": {
        "reference": "12.9",
        "title": "Freezing of liquids"
      }
    },
    {
      "id": "HAZ-158",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 9,
      "attributes": {
        "reference": "12.10",
        "title": "Icing"
      }
    },
    {
      "id": "HAZ-159",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 10,
      "attributes": {
        "reference": "12.11",
        "title": "Thermal expansion/contraction"
      }
    },
    {
      "id": "HAZ-160",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 11,
      "attributes": {
        "reference": "12.12",
        "title": "Temperature interlocks"
      }
    },
    {
      "id": "HAZ-161",
      "type": "HAZ",
      "parent": "HAZ-012",
      "order": 12,
      "attributes": {
        "reference": "12.13",
        "title": "Thermal stress"
      }
    },
    {
      "id": "HAZ-013",
      "type": "HAZ",
      "parent": "F-20",
      "order": 12,
      "attributes": {
        "reference": "13",
        "title": "Natural environment"
      }
    },
    {
      "id": "HAZ-162",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 0,
      "attributes": {
        "reference": "13.1",
        "title": "Dew"
      }
    },
    {
      "id": "HAZ-163",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 1,
      "attributes": {
        "reference": "13.2",
        "title": "Fog"
      }
    },
    {
      "id": "HAZ-164",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 2,
      "attributes": {
        "reference": "13.3",
        "title": "Humidity"
      }
    },
    {
      "id": "HAZ-165",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 3,
      "attributes": {
        "reference": "13.4",
        "title": "Gravity"
      }
    },
    {
      "id": "HAZ-166",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 4,
      "attributes": {
        "reference": "13.5",
        "title": "Hail"
      }
    },
    {
      "id": "HAZ-167",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 5,
      "attributes": {
        "reference": "13.6",
        "title": "Icing"
      }
    },
    {
      "id": "HAZ-168",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 6,
      "attributes": {
        "reference": "13.7",
        "title": "Cold"
      }
    },
    {
      "id": "HAZ-169",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 7,
      "attributes": {
        "reference": "13.8",
        "title": "Rain"
      }
    },
    {
      "id": "HAZ-170",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 8,
      "attributes": {
        "reference": "13.9",
        "title": "Snow"
      }
    },
    {
      "id": "HAZ-171",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 9,
      "attributes": {
        "reference": "13.10",
        "title": "Solar"
      }
    },
    {
      "id": "HAZ-172",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 10,
      "attributes": {
        "reference": "13.11",
        "title": "Wind"
      }
    },
    {
      "id": "HAZ-173",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 11,
      "attributes": {
        "reference": "13.12",
        "title": "Thermal"
      }
    },
    {
      "id": "HAZ-174",
      "type": "HAZ",
      "parent": "HAZ-013",
      "order": 12,
      "attributes": {
        "reference": "13.13",
        "title": "Lightning"
      }
    },
    {
      "id": "HAZ-014",
      "type": "HAZ",
      "parent": "F-20",
      "order": 13,
      "attributes": {
        "reference": "14",
        "title": "Abnormal environments"
      }
    },
    {
      "id": "HAZ-175",
      "type": "HAZ",
      "parent": "HAZ-014",
      "order": 0,
      "attributes": {
        "reference": "14.1",
        "title": "Fire"
      }
    },
    {
      "id": "HAZ-176",
      "type": "HAZ",
      "parent": "HAZ-014",
      "order": 1,
      "attributes": {
        "reference": "14.2",
        "title": "Water pressure"
      }
    },
    {
      "id": "HAZ-177",
      "type": "HAZ",
      "parent": "HAZ-014",
      "order": 2,
      "attributes": {
        "reference": "14.3",
        "title": "Energized power lines"
      }
    },
    {
      "id": "HAZ-178",
      "type": "HAZ",
      "parent": "HAZ-014",
      "order": 3,
      "attributes": {
        "reference": "14.4",
        "title": "Microbiological organism"
      }
    },
    {
      "id": "HAZ-179",
      "type": "HAZ",
      "parent": "HAZ-014",
      "order": 4,
      "attributes": {
        "reference": "14.5",
        "title": "Macrobiological organism"
      }
    },
    {
      "id": "HAZ-180",
      "type": "HAZ",
      "parent": "HAZ-014",
      "order": 5,
      "attributes": {
        "reference": "14.6",
        "title": "Nuclear contaminated environment"
      }
    },
    {
      "id": "HAZ-181",
      "type": "HAZ",
      "parent": "HAZ-014",
      "order": 6,
      "attributes": {
        "reference": "14.7",
        "title": "Biologic contaminated environment"
      }
    },
    {
      "id": "HAZ-182",
      "type": "HAZ",
      "parent": "HAZ-014",
      "order": 7,
      "attributes": {
        "reference": "14.8",
        "title": "Chemical contaminated environment"
      }
    },
    {
      "id": "HAZ-183",
      "type": "HAZ",
      "parent": "HAZ-014",
      "order": 8,
      "attributes": {
        "reference": "14.9",
        "title": "Projectiles"
      }
    },
    {
      "id": "HAZ-015",
      "type": "HAZ",
      "parent": "F-20",
      "order": 14,
      "attributes": {
        "reference": "15",
        "title": "Human Factors"
      }
    },
    {
      "id": "HAZ-184",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 0,
      "attributes": {
        "reference": "15.1",
        "title": "Important information hidden/ placed under sub functions"
      }
    },
    {
      "id": "HAZ-185",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 1,
      "attributes": {
        "reference": "15.2",
        "title": "The system expresses wrong information"
      }
    },
    {
      "id": "HAZ-186",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 2,
      "attributes": {
        "reference": "15.3",
        "title": "The system gives delayed feedback after a user’s action"
      }
    },
    {
      "id": "HAZ-187",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 3,
      "attributes": {
        "reference": "15.4",
        "title": "The system gives incomprehensive feedback after a user’s action"
      }
    },
    {
      "id": "HAZ-188",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 4,
      "attributes": {
        "reference": "15.5",
        "title": "The system doesn’t give any feedback after a user´s action"
      }
    },
    {
      "id": "HAZ-189",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 5,
      "attributes": {
        "reference": "15.6",
        "title": "The system doesn’t give any information about the current mode"
      }
    },
    {
      "id": "HAZ-190",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 6,
      "attributes": {
        "reference": "15.7",
        "title": "The system doesn’t invite the user to make an action or invites the user to make a wrong action"
      }
    },
    {
      "id": "HAZ-191",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 7,
      "attributes": {
        "reference": "15.8",
        "title": "The system doesn’t have a specific design to prevent a user from doing wrong (ex. a plug that only fits in one jack)"
      }
    },
    {
      "id": "HAZ-192",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 8,
      "attributes": {
        "reference": "15.9",
        "title": "The system has wrong or bad mapping (ex. a car that turns right when you turn the steering-wheel to the left)"
      }
    },
    {
      "id": "HAZ-193",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 9,
      "attributes": {
        "reference": "15.10",
        "title": "The system expresses too much information at the same time (heavy load on the short-time memory)"
      }
    },
    {
      "id": "HAZ-194",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 10,
      "attributes": {
        "reference": "15.11",
        "title": "The system expresses unnecessary information (relevant information could get lost)"
      }
    },
    {
      "id": "HAZ-195",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 11,
      "attributes": {
        "reference": "15.12",
        "title": "The system express contradictive information"
      }
    },
    {
      "id": "HAZ-196",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 12,
      "attributes": {
        "reference": "15.13",
        "title": "Instruments which functionally belong together are physically separated"
      }
    },
    {
      "id": "HAZ-197",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 13,
      "attributes": {
        "reference": "15.14",
        "title": "Instruments which functionally belong together have different design or layout"
      }
    },
    {
      "id": "HAZ-198",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 14,
      "attributes": {
        "reference": "15.15",
        "title": "The system is lacking redundant information (same information expressed with different impression ex. lights, sounds, colors, shape, placement)"
      }
    },
    {
      "id": "HAZ-199",
      "type": "HAZ",
      "parent": "HAZ-015",
      "order": 15,
      "attributes": {
        "reference": "15.16",
        "title": "Information expressed in foreign language or in unfamiliar terms"
      }
    },
    {
      "id": "HAZ-016",
      "type": "HAZ",
      "parent": "F-20",
      "order": 15,
      "attributes": {
        "reference": "16",
        "title": "Other hazards"
      }
    },
    {
      "id": "HAZ-200",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 0,
      "attributes": {
        "reference": "16.1",
        "title": "Altitude differences"
      }
    },
    {
      "id": "HAZ-201",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 1,
      "attributes": {
        "reference": "16.2",
        "title": "Dangerous heights"
      }
    },
    {
      "id": "HAZ-202",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 2,
      "attributes": {
        "reference": "16.3",
        "title": "Slippery surfaces"
      }
    },
    {
      "id": "HAZ-203",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 3,
      "attributes": {
        "reference": "16.4",
        "title": "Improper floor surface"
      }
    },
    {
      "id": "HAZ-204",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 4,
      "attributes": {
        "reference": "16.5",
        "title": "Unquarded floor / wall openings"
      }
    },
    {
      "id": "HAZ-205",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 5,
      "attributes": {
        "reference": "16.6",
        "title": "Pressure differences"
      }
    },
    {
      "id": "HAZ-206",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 6,
      "attributes": {
        "reference": "16.7",
        "title": "Lack of oxygen"
      }
    },
    {
      "id": "HAZ-207",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 7,
      "attributes": {
        "reference": "16.8",
        "title": "Risk of suffocation"
      }
    },
    {
      "id": "HAZ-208",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 8,
      "attributes": {
        "reference": "16.9",
        "title": "Cold"
      }
    },
    {
      "id": "HAZ-209",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 9,
      "attributes": {
        "reference": "16.10",
        "title": "Heat"
      }
    },
    {
      "id": "HAZ-210",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 10,
      "attributes": {
        "reference": "16.11",
        "title": "Ergonomic strain (repetitive strain injury)"
      }
    },
    {
      "id": "HAZ-211",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 11,
      "attributes": {
        "reference": "16.12",
        "title": "Constrained work area"
      }
    },
    {
      "id": "HAZ-212",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 12,
      "attributes": {
        "reference": "16.13",
        "title": "Weights to be lifted"
      }
    },
    {
      "id": "HAZ-213",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 13,
      "attributes": {
        "reference": "16.14",
        "title": "Vibration"
      }
    },
    {
      "id": "HAZ-214",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 14,
      "attributes": {
        "reference": "16.15",
        "title": "Noise"
      }
    },
    {
      "id": "HAZ-215",
      "type": "HAZ",
      "parent": "HAZ-016",
      "order": 15,
      "attributes": {
        "reference": "16.16",
        "title": "Dazzle"
      }
    }
  ],
  "relationships": [
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-034"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-035"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-036"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-037"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-038"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-039"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-040"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-041"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-042"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-043"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-044"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-045"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-046"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-047"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-048"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-049"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-050"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-051"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-052"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-053"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-054"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-055"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-056"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-057"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-058"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-059"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-060"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-061"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-062"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-063"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-064"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-065"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-066"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-067"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-068"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-069"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-070"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-071"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-072"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-073"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-074"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-075"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-076"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-077"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-078"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-079"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-080"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-081"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-082"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-083"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-084"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-085"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-086"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-087"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-088"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-089"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-090"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-091"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-092"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-093"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-094"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-095"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-096"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-097"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-098"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-099"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-100"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-101"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-102"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-103"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-104"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-105"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-106"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-107"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-108"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-109"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-110"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-111"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-112"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-113"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-114"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-115"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-116"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-117"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-118"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-119"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-120"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-121"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-122"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-123"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-124"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-125"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-126"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-127"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-128"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-129"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-130"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-131"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-132"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-133"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-134"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-135"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-136"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-137"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-138"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-139"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-140"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-141"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-142"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-143"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-144"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-145"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-146"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-147"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-148"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-149"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-150"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-151"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-152"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-153"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-154"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-155"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-156"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-157"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-158"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-159"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-160"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-161"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-162"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-163"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-164"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-165"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-166"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-167"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-168"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-169"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-170"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-171"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-172"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-173"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-174"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-175"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-176"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-177"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-178"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-179"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-180"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-181"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-182"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-183"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-184"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-185"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-186"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-187"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-188"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-189"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-190"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-191"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-192"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-193"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-194"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-195"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-196"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-197"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-198"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-199"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-200"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-201"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-202"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-203"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-204"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-205"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-206"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-207"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-208"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-209"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-210"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-211"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-212"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-213"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-214"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-215"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-216"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-217"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-218"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-219"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-220"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-221"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-222"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-223"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-224"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-225"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-226"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-227"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-228"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-229"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-230"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-231"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-232"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-233"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-234"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-235"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-236"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-237"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-238"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-239"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-240"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-241"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-242"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-243"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-244"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-245"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-004",
      "target": "ESR-246"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-020"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-021"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-022"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-023"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-024"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-025"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-026"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-027"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-028"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-029"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-030"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-031"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-032"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-003",
      "target": "ESR-033"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-002",
      "target": "ESR-015"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-002",
      "target": "ESR-016"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-002",
      "target": "ESR-017"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-002",
      "target": "ESR-018"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-002",
      "target": "ESR-019"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-001"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-002"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-003"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-004"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-005"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-006"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-007"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-008"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-009"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-010"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-011"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-012"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-013"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-001",
      "target": "ESR-014"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-247"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-248"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-249"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-250"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-251"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-252"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-253"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-254"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-255"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-256"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-257"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-258"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-259"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-260"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-261"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-262"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-263"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-264"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-265"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-266"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-267"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-268"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-269"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-270"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-271"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-272"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-273"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-274"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-275"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-276"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-277"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-278"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-279"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-280"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-281"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-282"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-283"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-284"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-285"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-286"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-287"
    },
    {
      "type": "leg-contains-esr",
      "source": "LEG-005",
      "target": "ESR-288"
    }
  ]
};
