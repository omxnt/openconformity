# User Interface

This document describes the environment the user works in and how the model is built within it. The user environment covers how the software is reached and how the workspace is laid out, and the interaction model covers how entities and relationships are created, selected, and edited.

## 1. User Environment

The user accesses the software by visiting [openconformity.org](https://openconformity.org) in their browser. Using it requires no installation and no account. Entering the website lands the user directly in the software, with no homepage, wizard, or project setup prompt. A first visit opens an empty project, ready for the first entity, and a returning visit restores the user's previous working state. Information about the project is available from within the software, rather than in front of it.

The user interface is based on a classic layout, with a menu bar on top, a navigator pane to the left, an editor pane to the right, and a relationship pane on the bottom.

```
┌─────────────────────────────────────────────────────────┐
│  Menu bar                                               │
├───────────────────┬─────────────────────────────────────┤
│                   │                                     │
│  Navigator pane   │  Editor pane                        │
│                   │                                     │
│  Tree of          │  Attributes of the                  │
│  the model        │  selected entity                    │
│                   │                                     │
├───────────────────┴─────────────────────────────────────┤
│                                                         │
│  Relationship pane               [ List | Graph ]       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

The navigator pane presents the model as a tree hierarchy, in which the user navigates and selects entities. The editor pane presents the selected entity and its attributes for viewing and editing. The relationship pane presents the relationships of the selected entity, either as a list or as a graph of the closest related entities. The menu bar holds project actions, such as creating, opening, and saving projects, and exporting artefacts.

## 2. Interaction Model

The user works in a loop of creating, selecting, editing, and connecting. Selecting an entity in the navigator presents its attributes in the editor and its relationships in the relationship pane. The user edits the attributes directly in the editor, and changes are applied to the model immediately.

New entities are created from the navigator, where the user chooses the entity type. The metamodel determines which entity types are available. Deleting an entity removes it from the model together with its relationships. Where the metamodel defines a composition, deleting an owning entity also deletes the entities it owns, and the software warns the user and lists the affected entities before performing such a deletion.

Relationships are created from the relationship pane of the selected entity. The user chooses among the relationships that the metamodel allows for the selected entity type, and then chooses the target entity. Relationships that the metamodel does not define cannot be created. Deleting a relationship never deletes the related entities, with the exception of compositions as described above.

In the relationship pane, the list view presents each relationship as a row, showing the relationship type, the direction, and the related entity. The graph view presents the selected entity and its closest related entities as boxes connected by labelled arrows. Selecting an entity in the graph makes it the new selection, allowing the user to walk through the model relationship by relationship.

## 3. References

| No. | Reference | Link |
|---|---|---|
| *[1]* | *Reference*| *Link* |
