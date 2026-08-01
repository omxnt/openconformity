# Metamodel

The metamodel defines what a model may contain, the entity types, their attributes, and the allowed semantic relationships between them. It encodes the domain knowledge of CE marking of machinery and is the core of the software. This document transcribes the diagram maintained in [metamodel.drawio](../sources/metamodel.drawio), which is the editable original.

The metamodel is hardcoded in the software and versioned with it. A user-extensible metamodel is out of scope, since the value lies in a metamodel that is correct for the domain, not in generic modelling capability.

## 1. Entity Types

The metamodel defines the following entity types, organised in four pillars.

| Pillar | Entity types |
|---|---|
| Legislative | European Legislation, European Standard, Conformity Assessment, Notified Body |
| Requirements | Essential Requirement, Standard Requirement, System Requirement, Verification Activity |
| Hazard Analysis | Single Hazard, Accident Scenario, Risk Reduction Measure, Safety Function |
| Structure | System Element, System Actor, System Task, System Phase |

## 2. Semantic Relationships

Relationships are typed and directed, from a source entity type to a target entity type. Two kinds of relationships exist.

- **Association:** the entities are related. Both entities exist independently, and deleting one only removes the relationship.

- **Composition:** the source entity owns the target entity as a part. The part cannot exist without its owner, and deleting the owner also deletes its parts.

The metamodel defines the following relationships.

| Relationship | Source | Target | Kind |
|---|---|---|---|
| defines | European Legislation | Essential Requirement | Composition |
| defines | European Legislation | Conformity Assessment | Composition |
| defines | European Standard | Standard Requirement | Composition |
| involves | Conformity Assessment | Notified Body | Composition |
| harmonised to | European Standard | European Legislation | Association |
| subject to | System Element | European Legislation | Association |
| subject to | System Element | European Standard | Association |
| satisfies | Standard Requirement | Essential Requirement | Association |
| derives from | System Requirement | Standard Requirement | Association |
| derives from | System Requirement | Risk Reduction Measure | Association |
| derives from | System Requirement | Safety Function | Association |
| decomposes into | System Requirement | System Requirement | Composition |
| decomposes into | Safety Function | Safety Function | Composition |
| decomposes into | System Element | System Element | Composition |
| allocated to | Essential Requirement | System Element | Association |
| allocated to | Standard Requirement | System Element | Association |
| allocated to | System Requirement | System Element | Association |
| allocated to | Verification Activity | System Element | Association |
| allocated to | Risk Reduction Measure | System Element | Association |
| allocated to | Safety Function | System Element | Association |
| verifies | Verification Activity | System Requirement | Association |
| verifies | Verification Activity | Risk Reduction Measure | Association |
| verifies | Verification Activity | Safety Function | Association |
| implements | Risk Reduction Measure | Standard Requirement | Association |
| realises | Safety Function | Risk Reduction Measure | Association |
| mitigates | Risk Reduction Measure | Single Hazard | Association |
| mitigates | Risk Reduction Measure | Accident Scenario | Association |
| exhibits | System Element | Single Hazard | Composition |
| triggers | Single Hazard | Essential Requirement | Association |
| contributes to | Single Hazard | Accident Scenario | Association |
| leads to | System Task | Accident Scenario | Association |
| exposed in | System Actor | Accident Scenario | Association |
| has | System Element | System Phase | Association |
| has | System Element | System Actor | Association |
| performs | System Actor | System Task | Association |
| during | System Task | System Phase | Association |

The software enforces the metamodel. The user can only create relationships that the metamodel defines, and a relationship not present in the table above cannot exist in a model.

The composition relationships have consequences for deletion. A Single Hazard belongs to exactly one System Element and is deleted with it, and the requirements of a legislation or standard are deleted together with the legislation or standard that defines them. The software warns the user before performing a deletion that cascades to owned entities.

## 3. References

| No. | Reference | Link |
|---|---|---|
| *[1]* | *Reference*| *Link* |
