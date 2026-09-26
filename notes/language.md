# Language walkthrough

A proposal for the words the software says to the user in dialogs, toasts, notices, empty states and notes. The attribute help texts are a second pass with the same rules.

## The rules

1. A dialog that asks has a question as its title, naming the action and the thing. Delete HAZ-001? Replace the project? A dialog that informs has a plain title. The file could not be opened.
2. The message says what happens, then what does not, then what to do, in that order and only what is needed. One or two sentences, present tense.
3. One verb for one action, everywhere. Delete an entity or a folder. Remove a relationship or a copy. Discard unsaved changes. Clear browser data. Save, open, import, move, rename, create.
4. Consequences are counted. 3 entities, 1 relationship. Never everything, never through composition. What composition means to the user is part of. The 3 entities that are part of LEG-001.
5. The primary button repeats the title's verb. Delete, Remove, Discard, Clear, Save, Import, Create, Rename, Move. The way out is Cancel, or Keep editing when it returns to an open edit.
6. A toast's title is the outcome in two words. Project saved. Imported. Its body is one sentence with the count or the place. A refusal's title is Could not and the verb. Could not import. Its body is the reason.
7. An empty state's title says what is missing. No project. Nothing selected. Its body is one sentence on how to get something there.
8. A notice's title states the situation in one sentence. Its detail says what to do.
9. The model is the project when speaking to the user. In the model becomes in the project.
10. No colons, semicolons or dashes as joints. A colon only introduces a real list.

## Deleting

| Where | Now | Proposed |
|---|---|---|
| Entity, no relationships | HAZ-001 takes part in no relationship. | HAZ-001 has no relationships. |
| Entity, relationships | Deleting HAZ-001 severs 3 relationships. | Its 3 relationships are removed with it. |
| Entity with parts, title | Delete 4 entities? | Delete 4 entities? |
| Entity with parts, message | Deleting LEG-001 also deletes everything it contains through composition and severs 6 relationships: | The 3 entities that are part of LEG-001 are deleted with it, and 6 relationships are removed: |
| Folder, empty | Zone holds no entity. | The folder holds no entities. |
| Folder | Deleting Zone also deletes the 12 entities filed in it and severs 30 relationships: | The 12 entities in the folder are deleted with it, and 30 relationships are removed: |
| Folder, parts elsewhere | Deleting Zone also deletes the 2 entities filed in it and 1 entity they own elsewhere, and severs 1 relationship: | The 2 entities in the folder and 1 entity that is part of them are deleted with it, and 1 relationship is removed: |
| Relationship | HAZ-001 contributes to SCN-001. Both entities stay. | HAZ-001 contributes to SCN-001. Both entities are kept. |

## Editing

| Where | Now | Proposed |
|---|---|---|
| Discard, new entity | The new entity has never been saved. Discarding removes it. | The new entity was never saved and is removed with the changes. |
| Discard, existing | The edited attributes have not been saved. | The changes to the attributes are lost. |
| Sweep, title | Remove what is no longer chosen? | Clear values that no longer apply? |
| Sweep, message | Saving removes Rationale under High; Frequency under Low. | Saving clears Rationale under High, and Frequency under Low. |
| Diagram, consent | The diagram being edited is handed to the editor. Nothing else of the project is. | Only the diagram being edited is sent to draw.io. Nothing else in the project leaves the browser. |
| Diagram, discard | What was drawn in the editor has not been applied. | The changes to the diagram are lost. |
| Diagram, refused | This diagram cannot be shown. It holds an event handler. | The diagram cannot be shown because it holds an event handler. |

## Project files

| Where | Now | Proposed |
|---|---|---|
| Replace, title | Unsaved changes | Replace the project? |
| Replace, message | This project has changes that are not saved to a file. Replacing it loses them. | The open project has changes that are not saved to a file. They are lost when it is replaced. |
| Save, preview and toast | Saved to your downloads as x.json. | The file is saved to your downloads as x.json. |
| Save copy, title | Save copy to file | Save the copy |
| Cannot open, title | Not a valid project file, or Written by a newer version | The file could not be opened |
| Cannot open, not ours | The file is not an openconformity project file, and was not opened. | The file is not an openconformity project file. |
| Cannot open, no version | The file does not record a schema version, and was not opened. | The file does not say which version wrote it. |
| Cannot open, newer | The file was written by a newer version of this software, and was not opened. | The file was written by a newer version of this software. |
| Cannot open, no migration | No migration from schema version 3 exists. | The file's version, 3, cannot be brought up to date. |
| Migrated, title | The file was migrated | The file was updated |
| Migrated, message | Opening this file changed its form. What follows was preserved as written and needs your attention: | The file came from an earlier version and was brought up to date. Check the following, which was kept as written: |
| Clear browser data | Everything the software keeps in this browser is cleared: the project it holds between sessions, the theme, and the draw.io choice. A saved file is not affected. | This clears everything openconformity keeps in this browser, the project held between sessions, the theme and the draw.io choice. Files you saved are not affected. |
| Clear, unsaved | The open project has changes that are not saved to a file, and they are lost too. | The open project has unsaved changes, and they are lost too. |
| No copy | Nothing is set aside in browser storage. | Nothing is set aside in browser storage. |
| Discard copy, title | Discard the copy | Discard the copy? |
| Discard copy, message | The copy set aside in browser storage is removed. Nothing else changes. | The copy set aside in browser storage is removed. Nothing else changes. |

## Importing and relating

| Where | Now | Proposed |
|---|---|---|
| Relationship refused | Relationship refused. The model no longer allows that relationship. | Could not add the relationship. The metamodel does not allow it. |
| Relationships refused | Relationships refused. 2 of the picked relationships could no longer be made. | Could not add 2 relationships. The metamodel no longer allows them. |
| Import refused | Import refused | Could not import |
| Move refused | Move refused | Could not move |
| Reasons | It is not in the model. The destination is not in the model. One of the entities is not in the model. The parent is not in the model. | in the project, throughout |
| Reason | It is already part of another entity. | It is already part of another entity. |
| Reason | That would make an entity part of itself. | That would make it part of itself. |
| Reason | Nothing can be filed inside itself. | Nothing can be moved into itself. |
| Fallback | That is not allowed. | That is not allowed. |

## Notices and status

| Where | Now | Proposed |
|---|---|---|
| Restoration | The previous session could not be restored. What this browser had stored could not be read back. A copy has been set aside in browser storage. | The previous session could not be restored. The stored project could not be read back, and a copy was set aside in browser storage. |
| Storage nearly full | Browser storage is nearly full. The room this browser gives the software is nearly used up. Save the project to a file, so nothing is lost if storing stops. | Browser storage is nearly full. Save the project to a file so nothing is lost if storing stops. |
| Storing fails | Changes are not being stored in this browser. The last attempt to store the session failed. Save the project to a file so nothing is lost. | Changes are not being stored in this browser. Save the project to a file so nothing is lost. |
| Storing again | Autosave working again. The project is being kept in this browser once more. | Storing works again. The project is stored in this browser again. |
| Small screen | A desktop-sized screen is required. The workspace puts a navigator, an editor and a relationship view side by side, which needs a desktop or laptop window at least 1000 pixels wide and 356 pixels tall. | A desktop-sized screen is required. The workspace needs a window at least 1000 pixels wide and 356 pixels tall. The title stays as the requirement names it. |

## Empty states and notes

| Where | Now | Proposed |
|---|---|---|
| Landing | Create a project, open one saved as a file, or look around the example. Everything stays in this browser until you save it to a file. | Create a project, open one saved as a file, or look around the example. Everything stays in this browser until you save it to a file. |
| Folder | A folder groups things in the navigator and carries no attributes of its own. | A folder groups entities in the navigator and has no attributes. |
| No relationships | HAZ-001 is not related to anything yet. | HAZ-001 is not related to anything yet. |
| Nothing to revisit | Every record matches what is related. | Every record still matches its relationships. |
| Graph, picking | Picked relationships land as dashed edges; click one to let go. The rest recede until Done. | Picked relationships show as dashed edges. Click one to let it go. |
| Graph, ambiguous | 1 pick offers more than one relationship — choose it in the List view. | 1 pick can be more than one relationship. Choose which in the List view. |
| Library, nothing highlighted | Select a row to see what it holds. | Select a row to see its attributes. |
| Library, folder | Check the folder to pick everything filed in it. | Check the folder to pick everything in it. |
| Library, empty entity | Its attributes hold nothing. | No attributes are filled in. |
| Table, no rows | No runs. | No runs. |

## Help texts

The 86 help texts follow one form already, a sentence saying what the field holds, so most stay. The ones below break the one sentence rule or carry a list that the choices already show.

| Key | Now | Proposed |
|---|---|---|
| step | Which of the three risk reduction steps the measure is, a design that removes the hazard, protection against a risk that remains, or information to the user about what is left. | Which of the three risk reduction steps the measure belongs to. |
| type | The kind of requirement, whether what the system does and how well, how it fits and operates with its surroundings, its physical form, its qualities, or what it must comply with. | The kind of requirement, from what the system does to what it must comply with. |
| standard | The standard the safety function is designed to, which sets the levels offered, or none to type the level freely. | The standard the safety function is designed to, which sets the levels offered. |
| eliminated record | The protective measures related as eliminating the hazard when Eliminated was last set, recorded by the software. | The protective measures related to the hazard when Eliminated was last set, recorded by the software. |
| runs | Each time the system verification was carried out, as a row: when and by whom, whether it met its acceptance criteria, and remarks, among them the record the result rests on. | Each time the verification was carried out, with when, by whom, whether it passed, and remarks. |
| faultHandling | What the safety function does once a fault is found and the state it brings the machinery to, for any fault or fault by fault. | What the safety function does once a fault is found and the state it brings the machinery to. |
| muting | Whether and how the safety function can be suspended, muted or overridden, and under what conditions. | Whether, how and when the safety function can be suspended, muted or overridden. |
| faultRecovery | Whether a fault latches or clears itself, when and how it may be reset, and how the safety function returns to service. | Whether a fault latches or clears itself, and how the safety function is reset and returns to service. |

## Tooltips, labels and the rest

The tooltips, the accessible labels, the menu entries, the field names, the About text, the landing text, the record words unlinked since, deleted since and related since, the messages' sentences and the status bar's counts read one way already and stay.
