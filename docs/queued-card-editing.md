# Queued-card editing and selection-wide bleed

The print list's existing Edit action opens the source editor with `queueCard=<record id>`. Editor startup restores `record.data`, with compatibility for the `bbtc.data` profiles from earlier imports. Imported annexes and rule backs are reconstructed using their recorded rules and layout settings. Image-only legacy records cannot restore profile fields; their Edit action is disabled with an explanation.

Returning through the existing Send to print button updates that same queue record. Its ID, original position and paired back are retained. New captures store editable data and durable image data, avoiding stale blob URLs. In-progress editor drafts use a separate IndexedDB state per card and do not overwrite an unrelated saved editor profile.

For printing, the selected cards are regenerated through their native source editor when editable data exists. The global bleed option overrides a stored false border preference, including edited Star Player presets. The same option applies to individual rule backs and annexes. Source renders await the full image and frame work before capture. Fixed trim dimensions, quantities, mirror positions and existing print controls remain the application's responsibility.

Rule layout is shared in `assets/js/rule-layout.js`; the native special-card renderer can redraw a recorded layout without flattening its paragraphs or columns. A changed text field uses the normal special-card text renderer.

Validation: restore, edit, save and reopen a previous BBTC player and a champion with its portrait; preserve queue IDs, paired backs and print-state metadata; isolate drafts from other editor state; recover legacy annex layout; assert actual border pixels differ between native bordered and bleed renders; verify global bleed for edited presets and both sides of selected imported cards; run native queue, quantity, duplex and persistence regressions.
